import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Send, Image as ImageIcon, ShieldAlert, Flag, Ban, Check, CheckCheck, 
  Lock, MapPin, AlertCircle, Info, ChevronRight, CornerDownLeft, ArrowDown, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import Avatar from '../common/Avatar';
import CategoryIcon from '../common/CategoryIcon';
import LoadingSkeleton from '../common/LoadingSkeleton';
import chatService from '../../services/chatService';
import apiClient from '../../services/apiClient';
import { formatDate, getItemOwnerId, isSameEntityId } from '../../utils';

const QUICK_CHIPS = [
  'Chào bạn, mình muốn hỏi thêm về món đồ này.',
  'Bạn đang ở khu vực nào trong trường DNTU vậy?',
  'Mình có thể hẹn gặp ở sảnh giảng đường để đối chiếu nhận lại không?',
  'Cảm ơn bạn rất nhiều vì đã nhặt được đồ!'
];

function createClientMessageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function mergeMessages(serverMessages = [], localMessages = []) {
  const serverIds = new Set(serverMessages.map(message => String(message.id)));
  const matchedServerIndexes = new Set();
  const transient = localMessages.filter(message => {
    if (!['sending', 'failed', 'uncertain'].includes(message.deliveryStatus)) return false;
    if (serverIds.has(String(message.id))) return false;
    if (message.deliveryStatus === 'failed') return true;

    const localTime = new Date(message.createdAt).getTime();
    const matchIndex = serverMessages.findIndex((serverMessage, index) => {
      if (matchedServerIndexes.has(index)) return false;
      const serverTime = new Date(serverMessage.createdAt).getTime();
      return String(serverMessage.senderId) === String(message.senderId)
        && String(serverMessage.text || '') === String(message.text || '')
        && String(serverMessage.image || '') === String(message.image || '')
        && Number.isFinite(localTime)
        && Number.isFinite(serverTime)
        && Math.abs(serverTime - localTime) <= 60000;
    });

    if (matchIndex >= 0) {
      matchedServerIndexes.add(matchIndex);
      return false;
    }
    return true;
  });

  return [...serverMessages, ...transient].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export default function ItemChatModal({ 
  isOpen, 
  onClose, 
  item, 
  currentUser, 
  recipientUser,
  targetUser,
  onOpenClaim = null 
}) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [connectionState, setConnectionState] = useState('connected');
  const [reloadKey, setReloadKey] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Lừa đảo / Đòi tiền chuộc trái phép');
  const [reportDesc, setReportDesc] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [showNewMessages, setShowNewMessages] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesViewportRef = useRef(null);
  const nearBottomRef = useRef(true);
  const previousMessageIdsRef = useRef(new Set());
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const chatRequestRunningRef = useRef(false);
  const loadedSessionRef = useRef('');

  const itemId = item?.id;
  const isReturned = item?.status === 'RETURNED' || conversation?.itemStatus === 'RETURNED';
  const isFound = item?.type === 'FOUND' || item?.status === 'FOUND';

  // Fallback target user if not explicitly provided
  const recipient = recipientUser || targetUser || {
    id: getItemOwnerId(item),
    name: item?.contactName || 'Người giữ đồ DNTU',
    role: isFound ? 'Người nhặt được' : 'Người đăng bài',
    avatar: item?.contactAvatar || null
  };
  const isSelfChat = isSameEntityId(currentUser?.id, recipient?.id);

  // Close menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showMenu]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const scrollToLatest = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    nearBottomRef.current = true;
    setShowNewMessages(false);
  }, []);

  const handleMessagesScroll = () => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    const distance = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    nearBottomRef.current = distance < 96;
    if (nearBottomRef.current) setShowNewMessages(false);
  };

  // Load or initialize conversation
  useEffect(() => {
    if (!isOpen || !itemId || !currentUser || !recipient?.id) return;
    if (isSelfChat) {
      toast.error('Bạn không thể tạo cuộc trò chuyện với chính mình.');
      onClose();
      return;
    }

    let isMounted = true;
    const sessionKey = `${itemId}:${currentUser.id}:${recipient.id}`;
    const isNewSession = loadedSessionRef.current !== sessionKey;
    if (isNewSession) {
      setInitialLoading(true);
      setLoadError('');
      setConversation(null);
      setMessages([]);
      previousMessageIdsRef.current = new Set();
      nearBottomRef.current = true;
      setShowNewMessages(false);
    }

    const loadChat = async ({ silent = false } = {}) => {
      if (chatRequestRunningRef.current) return;
      chatRequestRunningRef.current = true;
      try {
        const conv = await chatService.getConversation(
          itemId, 
          currentUser.id, 
          recipient.id, 
          item
        );
        if (isMounted) {
          setConversation(conv);
          const nextMessages = conv.messages || [];
          const incomingNewMessage = nextMessages.some(message =>
            !previousMessageIdsRef.current.has(String(message.id)) &&
            String(message.senderId) !== String(currentUser.id));
          setMessages(previous => mergeMessages(nextMessages, previous));
          loadedSessionRef.current = sessionKey;
          previousMessageIdsRef.current = new Set(nextMessages.map(message => String(message.id)));
          setIsBlocked(Boolean(conv.blocked));
          setIsBlockedByMe(Boolean(conv.blockedByMe));
          setInitialLoading(false);
          setLoadError('');
          setConnectionState('connected');

          if (document.visibilityState === 'visible' && nearBottomRef.current) {
            chatService.markAsRead(conv.id, currentUser.id).catch(() => {});
          } else if (incomingNewMessage) {
            setShowNewMessages(true);
          }
        }
      } catch (err) {
        if (isMounted) {
          if (!silent && loadedSessionRef.current !== sessionKey) {
            setInitialLoading(false);
            setLoadError(err.message || 'Không thể mở cuộc trò chuyện.');
          } else {
            setConnectionState('reconnecting');
          }
        }
      } finally {
        chatRequestRunningRef.current = false;
      }
    };

    loadChat();
    const timer = window.setInterval(() => loadChat({ silent: true }), 3000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadChat({ silent: true });
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isOpen, itemId, currentUser, recipient?.id, item, onClose, isSelfChat, reloadKey]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen && nearBottomRef.current) {
      scrollToLatest(messages.length <= 1 ? 'auto' : 'smooth');
    } else if (isOpen && messages.length > 0) {
      setShowNewMessages(true);
    }
  }, [messages, isOpen, scrollToLatest]);

  if (!isOpen || !item) return null;

  const deliverMessage = async pendingMessage => {
    if (!conversation?.id) return;
    try {
      const { message } = await chatService.sendMessage({
        conversationId: conversation.id,
        itemId,
        sender: currentUser,
        recipientId: recipient.id,
        text: pendingMessage.text,
        image: pendingMessage.image,
        itemData: item,
        clientMessageId: pendingMessage.clientId,
      });

      setMessages(previous => {
        const withoutPendingOrDuplicate = previous.filter(current =>
          current.clientId !== pendingMessage.clientId
          && String(current.id) !== String(message.id));
        return [...withoutPendingOrDuplicate, {
          ...message,
          clientId: pendingMessage.clientId,
          deliveryStatus: 'sent',
        }].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
      setConversation(previous => previous ? { ...previous, updatedAt: message.createdAt } : previous);
      setConnectionState('connected');
    } catch (err) {
      const deliveryStatus = err.isUncertain ? 'uncertain' : 'failed';
      setMessages(previous => previous.map(current =>
        current.clientId === pendingMessage.clientId
          ? { ...current, deliveryStatus, deliveryError: err.message || 'Không thể gửi tin nhắn.' }
          : current));
      if (err.isUncertain) setConnectionState('reconnecting');
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim() && !selectedImage) return;
    if (!currentUser?.id || !recipient?.id) {
      toast.error('Không xác định được người gửi hoặc người nhận. Vui lòng tải lại trang.');
      return;
    }
    if (isSelfChat) {
      toast.error('Bạn không thể gửi tin nhắn cho chính mình.');
      return;
    }
    if (isReturned) {
      toast.info('Vật phẩm này đã được bàn giao, cuộc trò chuyện ở chế độ chỉ đọc.');
      return;
    }
    if (isBlocked) {
      toast.error('Cuộc trò chuyện đang bị chặn, không thể gửi tin nhắn.');
      return;
    }

    if (!conversation?.id) return;
    const clientId = createClientMessageId();
    const pendingMessage = {
      id: `pending-${clientId}`,
      clientId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar || currentUser.avatar_url,
      text: inputText.trim(),
      image: selectedImage,
      read: false,
      createdAt: new Date().toISOString(),
      deliveryStatus: 'sending',
    };

    setMessages(previous => [...previous, pendingMessage]);
    setInputText('');
    setSelectedImage(null);
    deliverMessage(pendingMessage);
  };

  const retryMessage = message => {
    setMessages(previous => previous.map(current =>
      current.clientId === message.clientId
        ? { ...current, deliveryStatus: 'sending', deliveryError: '' }
        : current));
    deliverMessage({ ...message, deliveryStatus: 'sending', deliveryError: '' });
  };

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ tệp hình ảnh.');
      e.target.value = '';
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa 3MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleToggleBlock = async () => {
    setShowMenu(false);
    if (!conversation?.id) return;
    try {
      const nextBlocked = !isBlockedByMe;
      await chatService.setBlocked(conversation.id, nextBlocked);
      setIsBlockedByMe(nextBlocked);
      setIsBlocked(nextBlocked);
      toast.success(nextBlocked
        ? `Đã chặn ${recipient.name}. Bạn sẽ không nhận tin nhắn từ người này.`
        : `Đã bỏ chặn ${recipient.name}.`);
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật trạng thái chặn.');
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportDesc.trim()) {
      toast.error('Vui lòng nhập mô tả chi tiết lý do báo cáo.');
      return;
    }

    setSubmittingReport(true);
    try {
      await apiClient.post('/reports', {
        post_id: Number(itemId),
        reason: reportReason,
        description: reportDesc.trim(),
      });
      toast.success('Báo cáo đã được gửi tới Ban quản trị DNTU xem xét.');
      setShowReportModal(false);
      setReportDesc('');
    } catch (err) {
      toast.error(err.message || 'Gửi báo cáo thất bại.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const locationText = typeof item.location === 'object' && item.location !== null
    ? item.location.name
    : (item.locationName || (typeof item.location === 'string' ? item.location : 'Khuôn viên DNTU'));

  return createPortal(
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn motion-reduce:animate-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        role="dialog"
        aria-modal="true"
        aria-label={`Trò chuyện với ${recipient.name}`}
        onClick={onClose}
    >
      <div
        className="w-full max-w-2xl h-full max-h-[100dvh] sm:h-[min(92dvh,780px)] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#E8E2DD] animate-scaleIn motion-reduce:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <header className="px-3 py-2.5 sm:px-4 sm:py-3 bg-[#741216] text-white flex items-center justify-between gap-2 shadow-sm shrink-0" style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative shrink-0">
              <Avatar name={recipient.name} src={recipient.avatar} size="md" className="ring-2 ring-white/20" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#741216] rounded-full" />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <h3 className="font-bold text-sm sm:text-base leading-snug truncate">
                  {recipient.name}
                </h3>
                <span className="hidden min-[390px]:inline-flex shrink-0 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white/90">
                  {recipient.role || (isFound ? 'Người nhặt được' : 'Người đăng')}
                </span>
              </div>
              <p className="hidden min-[390px]:block text-xs text-white/75 truncate" aria-live="polite">
                {connectionState === 'reconnecting'
                  ? 'Mất kết nối • đang thử lại…'
                  : 'Đại học Công nghệ Đồng Nai • Trò chuyện bảo mật'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Options Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
                title="Tùy chọn an toàn"
                aria-label="Tùy chọn an toàn"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-[min(13rem,calc(100vw-1rem))] bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-20 text-gray-700 text-xs animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => { setShowMenu(false); setShowReportModal(true); }}
                    className="w-full px-3 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Báo cáo cuộc trò chuyện</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleBlock}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-medium"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{isBlockedByMe ? 'Bỏ chặn người này' : 'Chặn người dùng này'}</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
              aria-label="Đóng khung chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Item Context Banner (Fixed reference header) */}
        <div className="px-3 py-2 sm:px-4 sm:py-2.5 bg-[#FAF8F5] border-b border-[#E8E2DD] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
              {item.images?.[0] ? (
                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <CategoryIcon category={item.category} className="w-5 h-5 text-[#741216]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-bold text-xs text-gray-900 truncate">
                  {item.title}
                </span>
                <span className="shrink-0 text-[10px] font-mono text-gray-400">#{item.id}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500 truncate mt-0.5">
                <span className={`inline-flex items-center px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                  isReturned
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : isFound 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {isReturned ? 'Đã trao trả' : isFound ? 'Đã nhặt được' : 'Đang tìm'}
                </span>
                <span className="flex items-center gap-0.5 truncate">
                  <MapPin className="w-3 h-3 text-[#741216] shrink-0" />
                  <span className="truncate">{locationText}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick claim button link if user wants to claim properly */}
          {isFound && !isReturned && onOpenClaim && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenClaim();
              }}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#741216] text-white hover:bg-[#8b161b] transition shrink-0 shadow-2xs"
            >
              <span>Yêu cầu nhận lại</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Safety Note Alert */}
        <div className="px-3 py-2 sm:px-4 bg-amber-50/80 border-b border-amber-200/70 text-amber-900 text-[11px] flex items-start gap-2 shrink-0">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.2" />
          <div className="leading-tight">
            <span><strong>Bảo mật thông tin:</strong> Không chia sẻ mật khẩu, mã OTP, thông tin ngân hàng; không chuyển tiền chuộc hoặc hẹn gặp tại nơi vắng vẻ.</span>
          </div>
        </div>

        {/* Status Notification Banners */}
        {isReturned && (
          <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-200 text-blue-900 text-xs flex items-center gap-2 shrink-0 font-medium">
            <Lock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Vật phẩm này đã được trao trả cho chủ nhân. Phòng trò chuyện đã đóng và chuyển sang chế độ <strong>chỉ đọc</strong>.</span>
          </div>
        )}

        {isBlocked && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-800 text-xs flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-red-600 shrink-0" />
              <span>{isBlockedByMe ? 'Bạn đã chặn người dùng này.' : 'Cuộc trò chuyện này đang bị chặn.'}</span>
            </div>
            {isBlockedByMe && (
              <button
                type="button"
                onClick={handleToggleBlock}
                className="text-xs font-bold text-red-700 underline hover:text-red-900"
              >
                Bỏ chặn
              </button>
            )}
          </div>
        )}

        {/* Chat Messages Body */}
        <div
          ref={messagesViewportRef}
          onScroll={handleMessagesScroll}
          className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-3 bg-[#FAF9F6]"
        >
          {initialLoading ? (
            <LoadingSkeleton type="messages" count={5} className="h-full" />
          ) : loadError && messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6" role="alert">
              <AlertCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-gray-800">Không thể tải cuộc trò chuyện</p>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-500">{loadError}</p>
              <button
                type="button"
                onClick={() => {
                  setInitialLoading(true);
                  setLoadError('');
                  setReloadKey(value => value + 1);
                }}
                className="mt-4 rounded-xl bg-[#741216] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8b161b]"
              >
                Thử tải lại
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#741216] flex items-center justify-center mb-3">
                <CornerDownLeft className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-800 mb-1">
                Bắt đầu cuộc trò chuyện
              </h4>
              <p className="text-xs text-gray-500 max-w-sm leading-relaxed mb-4">
                Hãy trao đổi lịch sự về đặc điểm nhận dạng và hẹn gặp tại các khu vực đông người trong khuôn viên trường DNTU (Sảnh GĐ-A, Thư viện, Văn phòng sinh viên).
              </p>
              
              {/* Preset suggestion chips */}
              <div className="flex flex-wrap justify-center gap-1.5 max-w-md">
                {QUICK_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isReturned || isBlocked}
                    onClick={() => setInputText(chip)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-[#741216] hover:text-[#741216] transition shadow-2xs"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Security Header within thread */}
              <div className="text-center my-2">
                <span className="inline-block px-3 py-1 rounded-full bg-gray-200/70 text-gray-600 text-[10px] font-medium">
                  Cuộc trò chuyện được mã hóa lưu trữ an toàn trên UniFind DNTU
                </span>
              </div>

              {messages.map((msg, idx) => {
                const isMe = String(msg.senderId) === String(currentUser.id);

                return (
                  <div 
                    key={msg.clientId || msg.id || `${msg.senderId}-${msg.createdAt}-${idx}`}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <Avatar 
                        name={msg.senderName} 
                        src={msg.senderAvatar} 
                        size="sm" 
                        className="shrink-0 mb-1" 
                      />
                    )}

                    <div className={`min-w-0 max-w-[84%] sm:max-w-[70%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && (
                        <span className="text-[11px] font-semibold text-gray-500 px-1">
                          {msg.senderName}
                        </span>
                      )}

                      <div 
                        className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                          isMe 
                            ? 'bg-[#741216] text-white rounded-br-xs' 
                            : 'bg-white text-gray-800 border border-gray-200/80 rounded-bl-xs'
                        }`}
                      >
                        {msg.text && (
                          <p className="chat-user-content">{msg.text}</p>
                        )}

                        {/* Image attachment */}
                        {msg.image && (
                          <div className={`mt-2 max-w-full rounded-xl overflow-hidden sm:max-w-[260px] border ${isMe ? 'border-white/20' : 'border-gray-200'}`}>
                            <img 
                              src={msg.image} 
                              alt="Đính kèm" 
                              className="w-full h-auto object-cover max-h-56 cursor-pointer hover:opacity-95 transition"
                              onClick={() => window.open(msg.image, '_blank')}
                            />
                          </div>
                        )}

                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                          isMe ? 'text-white/70' : 'text-gray-400'
                        }`}>
                          <span>{formatDate(msg.createdAt)}</span>
                          {isMe && msg.deliveryStatus === 'sending' && (
                            <Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                          )}
                          {isMe && msg.deliveryStatus === 'failed' && (
                            <span className="font-semibold text-amber-200">Gửi lỗi</span>
                          )}
                          {isMe && msg.deliveryStatus === 'uncertain' && (
                            <span className="font-semibold text-amber-200">Đang xác minh</span>
                          )}
                          {isMe && (!msg.deliveryStatus || msg.deliveryStatus === 'sent') && (
                            msg.read ? (
                              <CheckCheck className="w-3 h-3 text-sky-300" title="Đã xem" />
                            ) : (
                              <Check className="w-3 h-3 text-white/60" title="Đã gửi" />
                            )
                          )}
                        </div>
                      </div>
                      {msg.deliveryStatus === 'failed' && (
                        <button
                          type="button"
                          onClick={() => retryMessage(msg)}
                          className="px-1 text-[11px] font-semibold text-[#741216] underline underline-offset-2"
                        >
                          Thử gửi lại
                        </button>
                      )}
                      {msg.deliveryStatus === 'uncertain' && (
                        <p className="px-1 text-[11px] text-amber-700" role="status">
                          Không tự gửi lại để tránh trùng tin.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
          {showNewMessages && (
            <button
              type="button"
              onClick={() => scrollToLatest('smooth')}
              className="sticky bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-[#741216] px-3.5 py-2 text-xs font-semibold text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#741216]/30 focus:ring-offset-2"
            >
              <ArrowDown className="h-4 w-4" />
              Tin nhắn mới
            </button>
          )}
        </div>

        {/* Selected image preview chip before sending */}
        {selectedImage && (
          <div className="px-4 py-2 bg-gray-100 border-t border-gray-200 flex items-center justify-between shrink-0 animate-fadeIn">
            <div className="flex items-center gap-2">
              <img src={selectedImage} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-gray-300" />
              <span className="text-xs text-gray-600">Hình ảnh đính kèm đã sẵn sàng</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="p-1 rounded-full text-gray-400 hover:text-red-600 transition"
              aria-label="Hủy ảnh"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick Suggestion Chips (when not typing) */}
        {!inputText && !selectedImage && !isReturned && !isBlocked && messages.length > 0 && (
          <div className="px-4 py-1.5 bg-[#FAF8F5] border-t border-[#E8E2DD] flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar shrink-0">
            {QUICK_CHIPS.slice(0, 3).map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputText(chip)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 hover:text-[#741216] hover:border-[#741216] transition text-[11px]"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Chat Input Bar */}
        <footer className="px-2.5 pt-2.5 sm:p-3 bg-white border-t border-[#E8E2DD] shrink-0" style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}>
          {isReturned ? (
            <div className="p-2.5 rounded-xl bg-gray-100 text-center text-xs text-gray-500 font-medium">
              Vật phẩm đã bàn giao thành công. Cuộc trò chuyện này ở trạng thái chỉ đọc.
            </div>
          ) : isBlocked ? (
            <div className="p-2.5 rounded-xl bg-gray-100 text-center text-xs text-gray-500 font-medium">
              Bạn không thể gửi tin nhắn trong cuộc trò chuyện bị chặn.
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImagePick}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 shrink-0 rounded-xl text-gray-500 hover:text-[#741216] hover:bg-red-50 transition flex items-center justify-center"
                title="Gửi ảnh đính kèm"
                aria-label="Gửi ảnh đính kèm"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập tin nhắn trao đổi về đồ vật..."
                className="min-w-0 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:px-3.5 sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#741216]/20 focus:border-[#741216] transition"
                disabled={initialLoading || !conversation?.id || !currentUser?.id || !recipient?.id}
              />

              <button
                type="submit"
                disabled={initialLoading || !conversation?.id || !currentUser?.id || !recipient?.id || (!inputText.trim() && !selectedImage)}
                className="w-11 h-11 shrink-0 rounded-xl bg-[#741216] text-white hover:bg-[#8b161b] disabled:opacity-40 disabled:hover:bg-[#741216] transition flex items-center justify-center shadow-xs"
                aria-label="Gửi tin nhắn"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </footer>
      </div>

      {/* Safety Report Modal */}
      {showReportModal && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          onClick={() => setShowReportModal(false)}
        >
          <div 
            className="w-full max-w-md max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain bg-white rounded-2xl p-4 sm:p-5 shadow-2xl border border-gray-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <Flag className="w-4 h-4" />
                <span>Báo cáo cuộc trò chuyện</span>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Lý do báo cáo *
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#741216]"
                >
                  <option value="Lừa đảo / Đòi tiền chuộc trái phép">Lừa đảo / Đòi tiền chuộc trái phép</option>
                  <option value="Thông tin sai sự thật / Mạo danh chủ nhân">Thông tin sai sự thật / Mạo danh chủ nhân</option>
                  <option value="Quấy rối / Ngôn từ đe dọa, xúc phạm">Quấy rối / Ngôn từ đe dọa, xúc phạm</option>
                  <option value="Hành vi đáng ngờ khác">Hành vi đáng ngờ khác</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Mô tả chi tiết vi phạm *
                </label>
                <textarea
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  rows={3}
                  placeholder="Vui lòng cung cấp nội dung vi phạm để ban quản trị DNTU xử lý kịp thời..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#741216] resize-none"
                  required
                />
              </div>

              <div className="p-3 bg-red-50 text-red-800 rounded-xl text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>Ban quản trị sẽ xem xét lịch sử tin nhắn của vật phẩm này để bảo vệ quyền lợi sinh viên và kỷ luật người vi phạm.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition"
                >
                  {submittingReport ? 'Đang gửi...' : 'Gửi báo cáo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
