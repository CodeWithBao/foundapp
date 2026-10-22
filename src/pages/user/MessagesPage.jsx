import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, Check, CheckCheck, Image as ImageIcon, Loader2, MessageCircle, Search, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import chatService from '../../services/chatService';
import Avatar from '../../components/common/Avatar';
import { useRealtime } from '../../context/RealtimeContext';

const POLL_INTERVAL = 5000;

function messageTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function conversationTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return messageTime(value);
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { conversations: realtimeConversations } = useRealtime();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [query, setQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesViewportRef = useRef(null);
  const nearBottomRef = useRef(true);
  const previousMessageIdsRef = useRef(new Set());
  const activeUserIdRef = useRef(user?.id);
  const selectedId = searchParams.get('conversation');

  const refreshList = useCallback(async ({ silent = false } = {}) => {
    if (!user?.id) return;
    const requestUserId = user.id;
    try {
      if (!silent) setLoading(true);
      const rows = await chatService.getConversationsForUser(requestUserId);
      if (String(activeUserIdRef.current) === String(requestUserId)) setConversations(rows);
    } catch (err) {
      if (!silent) toast.error(err.message || 'Không thể tải danh sách trò chuyện.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.id]);

  const refreshActive = useCallback(async ({ silent = false } = {}) => {
    if (!selectedId || !user?.id) {
      setActiveConversation(null);
      return;
    }
    const requestUserId = user.id;
    try {
      const conversation = await chatService.getConversationById(selectedId);
      if (String(activeUserIdRef.current) !== String(requestUserId)) return;
      const newIncoming = (conversation.messages || []).some(message =>
        !previousMessageIdsRef.current.has(String(message.id)) && String(message.senderId) !== String(user.id));
      setActiveConversation(conversation);
      previousMessageIdsRef.current = new Set((conversation.messages || []).map(message => String(message.id)));
      const canMarkRead = document.visibilityState === 'visible' && nearBottomRef.current;
      if (canMarkRead) await chatService.markAsRead(conversation.id, user.id);
      if (newIncoming && !nearBottomRef.current) setShowNewMessages(true);
      setConversations(prev => prev.map(row => String(row.id) === String(conversation.id)
        ? { ...row, ...conversation, messages: row.messages, unreadCount: canMarkRead ? 0 : conversation.unreadCount }
        : row));
    } catch (err) {
      if (!silent) toast.error(err.message || 'Không thể tải cuộc trò chuyện.');
    }
  }, [selectedId, user?.id]);

  useEffect(() => {
    activeUserIdRef.current = user?.id;
    setConversations([]);
    setActiveConversation(null);
    previousMessageIdsRef.current = new Set();
    nearBottomRef.current = true;
    setShowNewMessages(false);
    refreshList();
  }, [refreshList, user?.id]);

  useEffect(() => {
    if (realtimeConversations.length > 0) setConversations(realtimeConversations);
  }, [realtimeConversations]);

  useEffect(() => {
    refreshActive();
  }, [refreshActive]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      await refreshList({ silent: true });
      if (selectedId) await refreshActive({ silent: true });
    }, POLL_INTERVAL);
    return () => window.clearInterval(timer);
  }, [refreshActive, refreshList, selectedId]);

  useEffect(() => {
    if (nearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      setShowNewMessages(false);
    }
  }, [activeConversation?.messages?.length]);

  const handleMessagesScroll = () => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    const distance = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const wasNearBottom = nearBottomRef.current;
    nearBottomRef.current = distance < 96;
    if (!wasNearBottom && nearBottomRef.current && activeConversation?.id && document.visibilityState === 'visible') {
      chatService.markAsRead(activeConversation.id, user.id).then(() => {
        setConversations(prev => prev.map(row => String(row.id) === String(activeConversation.id)
          ? { ...row, unreadCount: 0 }
          : row));
      }).catch(() => {});
      setShowNewMessages(false);
    }
  };

  const scrollToLatest = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    nearBottomRef.current = true;
    setShowNewMessages(false);
  };

  const filteredConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return conversations;
    return conversations.filter(row => [
      row.recipient?.name,
      row.itemTitle,
      row.lastMessage?.text,
    ].some(value => String(value || '').toLowerCase().includes(normalized)));
  }, [conversations, query]);

  const openConversation = conversation => {
    previousMessageIdsRef.current = new Set();
    nearBottomRef.current = true;
    setShowNewMessages(false);
    setSearchParams({ conversation: String(conversation.id) });
  };

  const closeMobileConversation = () => {
    setSearchParams({});
  };

  const handleImagePick = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ tệp hình ảnh.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result);
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleSend = async event => {
    event.preventDefault();
    if (!activeConversation || (!inputText.trim() && !selectedImage)) return;
    setSending(true);
    try {
      const { message } = await chatService.sendMessage({
        conversationId: activeConversation.id,
        itemId: activeConversation.itemId,
        sender: user,
        recipientId: activeConversation.recipient.id,
        text: inputText,
        image: selectedImage,
      });
      setActiveConversation(prev => ({
        ...prev,
        messages: [...(prev.messages || []), message],
        lastMessage: message,
        lastMessageAt: message.createdAt,
      }));
      setInputText('');
      setSelectedImage(null);
      await refreshList({ silent: true });
    } catch (err) {
      toast.error(err.message || 'Không thể gửi tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  const isReadOnly = activeConversation?.itemStatus === 'RETURNED' || activeConversation?.itemStatus === 'CLOSED';

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-[#F8F6F3] py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-[#8F1822]" /> Tin nhắn
          </h1>
          <p className="mt-1 text-sm text-gray-500">Trao đổi trực tiếp và an toàn với người đăng bài về vật phẩm.</p>
        </div>

        <div className="h-[calc(100dvh-10.5rem)] min-h-[360px] sm:min-h-[460px] md:min-h-[560px] bg-white border border-[#E5DED8] rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
          <aside className={`${selectedId ? 'hidden md:flex' : 'flex'} min-w-0 flex-col border-r border-[#E5DED8] bg-white`}>
            <div className="p-4 border-b border-[#E5DED8]">
              <label className="flex items-center gap-2 rounded-xl border border-[#DED7D0] bg-[#FAF8F5] px-3 py-2.5 focus-within:border-[#8F1822] focus-within:ring-2 focus-within:ring-[#8F1822]/10">
                <Search className="w-4 h-4 text-gray-400" aria-hidden="true" />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  placeholder="Tìm người hoặc vật phẩm..."
                  aria-label="Tìm cuộc trò chuyện"
                />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  Chưa có cuộc trò chuyện. Mở một bài đăng và chọn nút chat để bắt đầu.
                </div>
              ) : filteredConversations.map(conversation => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => openConversation(conversation)}
                  className={`w-full p-4 flex gap-3 text-left border-b border-gray-100 transition-colors ${String(selectedId) === String(conversation.id) ? 'bg-red-50/80' : 'hover:bg-[#FAF8F5]'}`}
                >
                  <Avatar name={conversation.recipient?.name} src={conversation.recipient?.avatar} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-gray-900 truncate">{conversation.recipient?.name}</span>
                      <span className="text-[11px] text-gray-400 shrink-0">{conversationTime(conversation.lastMessageAt)}</span>
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-[#8F1822] truncate">{conversation.itemTitle}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-500 truncate">{conversation.lastMessage?.text || (conversation.lastMessage?.image ? '[Hình ảnh]' : 'Chưa có tin nhắn')}</p>
                      {conversation.unreadCount > 0 && (
                        <span className="min-w-5 h-5 px-1 rounded-full bg-[#8F1822] text-white text-[10px] font-bold flex items-center justify-center">{conversation.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className={`${selectedId ? 'fixed inset-0 z-[90] flex md:static md:z-auto' : 'hidden md:flex'} min-w-0 flex-col bg-[#FAF9F6] md:min-h-0`}>
            {!activeConversation ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <MessageCircle className="w-14 h-14 text-gray-300 mb-4" />
                <h2 className="font-bold text-gray-800">Chọn một cuộc trò chuyện</h2>
                <p className="mt-1 text-sm">Tin nhắn giữa hai người dùng sẽ được đồng bộ qua tài khoản UniFind.</p>
              </div>
            ) : (
              <>
                <header className="px-3 sm:px-5 py-2.5 sm:py-3 bg-white border-b border-[#E5DED8] flex items-center gap-2 sm:gap-3 shrink-0" style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}>
                  <button type="button" onClick={closeMobileConversation} className="md:hidden w-11 h-11 -ml-2 shrink-0 rounded-lg hover:bg-gray-100 flex items-center justify-center" aria-label="Về danh sách trò chuyện">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Avatar name={activeConversation.recipient?.name} src={activeConversation.recipient?.avatar} size="md" />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-sm sm:text-base text-gray-900 truncate">{activeConversation.recipient?.name}</h2>
                    <p className="text-xs text-gray-500 truncate">Về: {activeConversation.itemTitle}</p>
                  </div>
                  <Link to={`/items/${activeConversation.itemId}`} className="hidden min-[390px]:inline text-xs font-semibold text-[#8F1822] hover:underline shrink-0">Xem bài</Link>
                </header>

                <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-900 text-center">
                  Không chia sẻ mật khẩu, OTP hoặc chuyển tiền. Hãy hẹn gặp tại khu vực đông người trong campus.
                </div>

                <div ref={messagesViewportRef} onScroll={handleMessagesScroll} className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-3">
                  {(activeConversation.messages || []).length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400 text-center px-8">Chưa có tin nhắn trong cuộc trò chuyện này.</div>
                  ) : activeConversation.messages.map(message => {
                    const isMe = String(message.senderId) === String(user.id);
                    return (
                      <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`min-w-0 max-w-[86%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-sm ${isMe ? 'bg-[#8F1822] text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'}`}>
                          {message.text && <p className="chat-user-content text-sm">{message.text}</p>}
                          {message.image && <img src={message.image} alt="Ảnh đính kèm" className="mt-2 h-auto max-h-64 max-w-full rounded-xl object-contain" />}
                          <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                            <span>{messageTime(message.createdAt)}</span>
                            {isMe && (message.read ? <CheckCheck className="w-3 h-3 text-sky-300" /> : <Check className="w-3 h-3" />)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                  {showNewMessages && (
                    <button type="button" onClick={scrollToLatest} className="sticky bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-[#8F1822] px-3.5 py-2 text-xs font-semibold text-white shadow-lg">
                      <ArrowDown className="w-4 h-4" /> Tin nhắn mới
                    </button>
                  )}
                </div>

                {selectedImage && (
                  <div className="px-3 sm:px-4 py-2 bg-white border-t flex min-w-0 items-center gap-3 shrink-0">
                    <img src={selectedImage} alt="Ảnh chuẩn bị gửi" className="w-12 h-12 object-cover rounded-lg" />
                    <span className="min-w-0 text-xs text-gray-500 flex-1 break-words">Ảnh đã sẵn sàng gửi</span>
                    <button type="button" onClick={() => setSelectedImage(null)} className="p-2" aria-label="Bỏ ảnh"><X className="w-4 h-4" /></button>
                  </div>
                )}

                <footer className="px-2.5 pt-2.5 sm:p-4 bg-white border-t border-[#E5DED8] shrink-0" style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}>
                  {isReadOnly || activeConversation.blocked ? (
                    <div className="rounded-xl bg-gray-100 p-3 text-center text-xs font-medium text-gray-500">
                      {activeConversation.blocked ? 'Cuộc trò chuyện đang bị chặn.' : 'Vật phẩm đã đóng hoặc trao trả; cuộc trò chuyện ở chế độ chỉ đọc.'}
                    </div>
                  ) : (
                    <form onSubmit={handleSend} className="flex min-w-0 items-end gap-1.5 sm:gap-2">
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-500 hover:text-[#8F1822] hover:bg-red-50" aria-label="Đính kèm ảnh">
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <textarea
                        value={inputText}
                        onChange={event => setInputText(event.target.value)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            handleSend(event);
                          }
                        }}
                        rows={1}
                        maxLength={2000}
                        className="min-w-0 min-h-11 max-h-28 flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 sm:px-3.5 py-3 text-sm outline-none focus:border-[#8F1822] focus:ring-2 focus:ring-[#8F1822]/10"
                        placeholder="Nhập tin nhắn..."
                      />
                      <button type="submit" disabled={sending || (!inputText.trim() && !selectedImage)} className="w-11 h-11 rounded-xl bg-[#8F1822] text-white flex items-center justify-center disabled:opacity-40" aria-label="Gửi tin nhắn">
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </form>
                  )}
                </footer>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
