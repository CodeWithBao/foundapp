import { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Image as ImageIcon, ShieldAlert, Flag, Ban, Check, CheckCheck, 
  Lock, MapPin, AlertCircle, Info, ChevronRight, CornerDownLeft
} from 'lucide-react';
import { toast } from 'sonner';
import Avatar from '../common/Avatar';
import CategoryIcon from '../common/CategoryIcon';
import chatService from '../../services/chatService';
import { formatDate } from '../../utils';

const QUICK_CHIPS = [
  'Chào bạn, mình muốn hỏi thêm về món đồ này.',
  'Bạn đang ở khu vực nào trong trường DNTU vậy?',
  'Mình có thể hẹn gặp ở sảnh giảng đường để đối chiếu nhận lại không?',
  'Cảm ơn bạn rất nhiều vì đã nhặt được đồ!'
];

export default function ItemChatModal({ 
  isOpen, 
  onClose, 
  item, 
  currentUser, 
  targetUser,
  onOpenClaim = null 
}) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Lừa đảo / Đòi tiền chuộc trái phép');
  const [reportDesc, setReportDesc] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  const itemId = item?.id;
  const isReturned = item?.status === 'RETURNED' || conversation?.itemStatus === 'RETURNED';
  const isFound = item?.type === 'FOUND' || item?.status === 'FOUND';

  // Fallback target user if not explicitly provided
  const recipient = targetUser || {
    id: item?.userId || 'U005',
    name: item?.contactName || 'Người giữ đồ DNTU',
    role: isFound ? 'Người nhặt được' : 'Người đăng bài',
    avatar: item?.contactAvatar || null
  };

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

  // Load or initialize conversation
  useEffect(() => {
    if (!isOpen || !itemId || !currentUser) return;

    let isMounted = true;
    const loadChat = async () => {
      try {
        const conv = await chatService.getConversation(
          itemId, 
          currentUser.id, 
          recipient.id, 
          item
        );
        if (isMounted) {
          setConversation(conv);
          setMessages(conv.messages || []);
          const blocked = chatService.isBlocked(currentUser.id, recipient.id);
          const blockedByMe = chatService.isBlockedByMe(currentUser.id, recipient.id);
          setIsBlocked(blocked);
          setIsBlockedByMe(blockedByMe);

          // Mark unread messages as read
          await chatService.markAsRead(conv.id, currentUser.id);
        }
      } catch (err) {
        console.error('Error loading chat:', err);
      }
    };

    loadChat();

    return () => {
      isMounted = false;
    };
  }, [isOpen, itemId, currentUser, recipient.id]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen || !item) return null;

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() && !selectedImage) return;
    if (isReturned) {
      toast.info('Vật phẩm này đã được bàn giao, cuộc trò chuyện ở chế độ chỉ đọc.');
      return;
    }
    if (isBlocked) {
      toast.error('Cuộc trò chuyện đang bị chặn, không thể gửi tin nhắn.');
      return;
    }

    setIsSending(true);
    try {
      const { message, conversation: updatedConv } = await chatService.sendMessage({
        itemId,
        sender: currentUser,
        recipientId: recipient.id,
        text: inputText,
        image: selectedImage,
        itemData: item,
      });

      setMessages(prev => [...prev, message]);
      setConversation(updatedConv);
      setInputText('');
      setSelectedImage(null);
    } catch (err) {
      toast.error(err.message || 'Không thể gửi tin nhắn.');
    } finally {
      setIsSending(false);
    }
  };

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleToggleBlock = () => {
    setShowMenu(false);
    if (isBlockedByMe) {
      chatService.unblockUser(currentUser.id, recipient.id);
      setIsBlockedByMe(false);
      setIsBlocked(false);
      toast.success(`Đã bỏ chặn ${recipient.name}.`);
    } else {
      chatService.blockUser(currentUser.id, recipient.id);
      setIsBlockedByMe(true);
      setIsBlocked(true);
      toast.success(`Đã chặn ${recipient.name}. Bạn sẽ không nhận tin nhắn từ người này.`);
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
      chatService.reportChat({
        reporterId: currentUser.id,
        reportedUserId: recipient.id,
        itemId,
        conversationId: conversation?.id,
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-full max-w-2xl h-[92vh] max-h-[780px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#E8E2DD] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <header className="px-4 py-3 bg-[#741216] text-white flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <Avatar name={recipient.name} src={recipient.avatar} size="md" className="ring-2 ring-white/20" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#741216] rounded-full" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base leading-snug truncate">
                  {recipient.name}
                </h3>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white/90">
                  {recipient.role || (isFound ? 'Người nhặt được' : 'Người đăng')}
                </span>
              </div>
              <p className="text-xs text-white/75 truncate">
                Đại học Công nghệ Đồng Nai • Trò chuyện bảo mật
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
                <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-20 text-gray-700 text-xs animate-fadeIn">
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
        <div className="px-4 py-2.5 bg-[#FAF8F5] border-b border-[#E8E2DD] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
              {item.images?.[0] ? (
                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <CategoryIcon category={item.category} className="w-5 h-5 text-[#741216]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-gray-900 truncate">
                  {item.title}
                </span>
                <span className="text-[10px] font-mono text-gray-400">#{item.id}</span>
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
        <div className="px-4 py-2 bg-amber-50/80 border-b border-amber-200/70 text-amber-900 text-[11px] flex items-start gap-2 shrink-0">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.2" />
          <div className="leading-tight">
            <span><strong>Bảo mật thông tin:</strong> Hệ thống tự động ẩn email và số điện thoại cá nhân. Tuyệt đối không cung cấp mật khẩu, mã OTP, chuyển tiền chuộc hoặc hẹn gặp tại nơi vắng vẻ.</span>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF9F6]">
          {messages.length === 0 ? (
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
                    key={msg.id || idx}
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

                    <div className={`max-w-[78%] sm:max-w-[70%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
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
                          <p className="whitespace-pre-line break-words">{msg.text}</p>
                        )}

                        {/* Image attachment */}
                        {msg.image && (
                          <div className={`mt-2 rounded-xl overflow-hidden max-w-[260px] border ${isMe ? 'border-white/20' : 'border-gray-200'}`}>
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
                          {isMe && (
                            msg.read ? (
                              <CheckCheck className="w-3 h-3 text-sky-300" title="Đã xem" />
                            ) : (
                              <Check className="w-3 h-3 text-white/60" title="Đã gửi" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
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
        <footer className="p-3 bg-white border-t border-[#E8E2DD] shrink-0">
          {isReturned ? (
            <div className="p-2.5 rounded-xl bg-gray-100 text-center text-xs text-gray-500 font-medium">
              Vật phẩm đã bàn giao thành công. Cuộc trò chuyện này ở trạng thái chỉ đọc.
            </div>
          ) : isBlocked ? (
            <div className="p-2.5 rounded-xl bg-gray-100 text-center text-xs text-gray-500 font-medium">
              Bạn không thể gửi tin nhắn trong cuộc trò chuyện bị chặn.
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex items-center gap-2">
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
                className="p-2.5 rounded-xl text-gray-500 hover:text-[#741216] hover:bg-red-50 transition"
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
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#741216]/20 focus:border-[#741216] transition"
                disabled={isSending}
              />

              <button
                type="submit"
                disabled={isSending || (!inputText.trim() && !selectedImage)}
                className="px-4 py-2.5 rounded-xl bg-[#741216] text-white hover:bg-[#8b161b] disabled:opacity-40 disabled:hover:bg-[#741216] transition flex items-center justify-center shadow-xs"
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
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowReportModal(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-gray-200 space-y-4"
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
    </div>
  );
}
