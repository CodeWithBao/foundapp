import { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare, Search, Filter, Clock, CheckCircle2, AlertCircle,
  Send, User, Tag, RotateCcw, Headphones, ArrowRight, ShieldCheck,
  Check, X
} from 'lucide-react';
import ticketService from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  OPEN: {
    label: 'Chờ tiếp nhận',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  IN_PROGRESS: {
    label: 'Đang xử lý',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  RESOLVED: {
    label: 'Đã giải quyết',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  CLOSED: {
    label: 'Đã đóng',
    bg: 'bg-stone-100 text-stone-600 border-stone-200',
    dot: 'bg-stone-400',
  },
};

export default function StaffTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [staffReply, setStaffReply] = useState('');
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const replyInputRef = useRef(null);

  // Load danh sách tickets
  const loadTickets = () => {
    try {
      const data = ticketService.getTickets({
        status: statusFilter,
        search,
      });
      setTickets(data);

      // Nếu đang chọn một ticket, cập nhật lại dữ liệu mới nhất của ticket đó
      if (selectedTicketId) {
        const stillExists = data.some((t) => t.id === selectedTicketId);
        if (!stillExists && data.length > 0) {
          setSelectedTicketId(data[0].id);
        }
      } else if (data.length > 0) {
        setSelectedTicketId(data[0].id);
      }
    } catch (err) {
      console.error('Lỗi tải tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, search]);

  // Đăng ký realtime lắng nghe tin nhắn mới từ User qua Chatbot
  useEffect(() => {
    const unsubscribe = ticketService.subscribe((detail) => {
      loadTickets();
      if (detail?.action === 'new_message' && detail?.ticketId === selectedTicketId) {
        ticketService.markAsRead(selectedTicketId, 'staff');
      }
    });

    return () => unsubscribe();
  }, [selectedTicketId]);

  // Lấy ticket đang được chọn
  const selectedTicket = useMemo(() => {
    return tickets.find((t) => t.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  // Khi chọn ticket, tự động đánh dấu đã đọc và scroll xuống cuối
  useEffect(() => {
    if (selectedTicketId) {
      ticketService.markAsRead(selectedTicketId, 'staff');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        replyInputRef.current?.focus();
      }, 100);
    }
  }, [selectedTicketId, selectedTicket?.messages?.length]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const all = ticketService.getTickets();
    return {
      total: all.length,
      open: all.filter((t) => t.status === 'OPEN').length,
      inProgress: all.filter((t) => t.status === 'IN_PROGRESS').length,
      resolved: all.filter((t) => t.status === 'RESOLVED').length,
      unread: all.filter((t) => t.unreadByStaff || t.unreadByAdmin).length,
    };
  }, [tickets]);

  // Gửi tin nhắn trả lời từ Nhân viên Staff
  const handleSendReply = (e) => {
    e?.preventDefault();
    if (!staffReply.trim() || !selectedTicket) return;

    const replyText = staffReply.trim();
    setStaffReply('');

    const updated = ticketService.addMessage(selectedTicket.id, {
      sender: 'staff',
      senderName: user?.name ? `${user.name} (Nhân viên DNTU)` : 'Nhân viên Tiếp nhận DNTU',
      text: replyText,
    });

    if (updated) {
      loadTickets();
      toast.success('Đã gửi phản hồi đến sinh viên!');
    }
  };

  // Thay đổi trạng thái Ticket
  const handleChangeStatus = (newStatus) => {
    if (!selectedTicket) return;
    ticketService.updateStatus(selectedTicket.id, newStatus);
    loadTickets();
    toast.success(`Đã cập nhật trạng thái ticket: ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#18181B] flex items-center gap-2">
            <Headphones className="w-7 h-7 text-[#981B1E]" />
            Hỗ trợ Trực tuyến & Ticket Sinh viên
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Bộ phận Nhân viên Lost & Found tiếp nhận và giải đáp trực tiếp cho sinh viên từ Chatbot Cú DNTU
          </p>
        </div>

        <button
          onClick={loadTickets}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors shadow-2xs self-start"
        >
          <RotateCcw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tổng ticket</div>
          <div className="text-2xl font-bold text-stone-900 mt-1">{stats.total}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs bg-amber-50/20">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center justify-between">
            <span>Chờ tiếp nhận</span>
            {stats.unread > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                {stats.unread} mới
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{stats.open}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-2xs bg-blue-50/20">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Đang xử lý</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{stats.inProgress}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs bg-emerald-50/20">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Đã giải quyết</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.resolved}</div>
        </div>
      </div>

      {/* Main Split Content: Left List + Right Chat Drawer */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-col lg:flex-row h-[720px]">
        {/* LEFT COLUMN: TICKET LIST */}
        <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-stone-200 flex flex-col h-full bg-stone-50/50">
          {/* Search & Filter */}
          <div className="p-3.5 border-b border-stone-200 space-y-2 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã ticket, tên, chủ đề..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-100 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#981B1E] focus:border-[#981B1E]"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 text-xs scrollbar-none">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'OPEN', label: 'Chờ tiếp nhận' },
                { id: 'IN_PROGRESS', label: 'Đang xử lý' },
                { id: 'RESOLVED', label: 'Đã giải quyết' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap text-xs transition-colors ${
                    statusFilter === tab.id
                      ? 'bg-[#981B1E] text-white font-semibold shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-stone-400">Đang tải danh sách ticket...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs">
                Không tìm thấy ticket nào phù hợp
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = t.id === selectedTicketId;
                const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN;
                const lastMsg = t.messages?.[t.messages.length - 1];

                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full text-left p-3.5 transition-all flex flex-col gap-1.5 relative ${
                      isSelected
                        ? 'bg-red-50/60 border-l-4 border-[#981B1E]'
                        : 'hover:bg-white bg-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[#981B1E]">
                        #{t.id}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusCfg.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-stone-900 font-semibold truncate">
                      <User size={13} className="text-stone-400 shrink-0" />
                      <span className="truncate">{t.userName}</span>
                      {(t.unreadByStaff || t.unreadByAdmin) && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 ml-auto" />
                      )}
                    </div>

                    <div className="text-xs text-stone-600 line-clamp-1 font-medium">
                      📌 {t.topic}
                    </div>

                    {lastMsg && (
                      <p className="text-[11px] text-stone-500 line-clamp-1 italic mt-0.5">
                        {lastMsg.sender === 'user' ? '👤 ' : lastMsg.sender === 'staff' ? '👨‍💼 ' : '🤖 '}
                        {lastMsg.text}
                      </p>
                    )}

                    <div className="text-[10px] text-stone-400 flex items-center justify-between mt-1">
                      <span>{new Date(t.updatedAt || t.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>{t.messages?.length || 0} tin nhắn</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: TICKET DETAIL & CHAT */}
        {selectedTicket ? (
          <div className="flex-1 flex flex-col h-full bg-white">
            {/* Ticket Header & Status Manager */}
            <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-[#981B1E]">
                    #{selectedTicket.id}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                      STATUS_CONFIG[selectedTicket.status]?.bg
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${STATUS_CONFIG[selectedTicket.status]?.dot}`}
                    />
                    {STATUS_CONFIG[selectedTicket.status]?.label}
                  </span>
                </div>

                <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <span>{selectedTicket.topic}</span>
                </h2>

                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span>Họ tên: <strong className="text-stone-700">{selectedTicket.userName}</strong></span>
                  {selectedTicket.userEmail && (
                    <span>Email: <span className="text-stone-600">{selectedTicket.userEmail}</span></span>
                  )}
                  <span>Tạo lúc: {new Date(selectedTicket.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Status control buttons */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {selectedTicket.status === 'OPEN' && (
                  <button
                    onClick={() => handleChangeStatus('IN_PROGRESS')}
                    className="text-xs px-3 py-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <Clock size={13} /> Tiếp nhận xử lý
                  </button>
                )}

                {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                  <button
                    onClick={() => handleChangeStatus('RESOLVED')}
                    className="text-xs px-3 py-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <Check size={13} /> Đã giải quyết
                  </button>
                )}

                {selectedTicket.status !== 'CLOSED' ? (
                  <button
                    onClick={() => handleChangeStatus('CLOSED')}
                    className="text-xs px-3 py-1.5 font-semibold bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <X size={13} /> Đóng ticket
                  </button>
                ) : (
                  <button
                    onClick={() => handleChangeStatus('IN_PROGRESS')}
                    className="text-xs px-3 py-1.5 font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors flex items-center gap-1"
                  >
                    <RotateCcw size={13} /> Mở lại ticket
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF8F5]/60">
              {selectedTicket.messages?.map((msg) => {
                const isUser = msg.sender === 'user';
                const isStaff = msg.sender === 'staff' || msg.sender === 'admin';
                const isSystem = msg.sender === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center my-2">
                      <span className="inline-block text-[11px] font-medium bg-stone-200/70 text-stone-600 px-3 py-1 rounded-full">
                        ℹ️ {msg.text} · <span className="text-stone-400">{new Date(msg.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[11px] font-bold text-stone-600">
                        {msg.senderName || (isStaff ? 'Nhân viên DNTU' : 'Sinh viên')}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(msg.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words whitespace-pre-wrap ${
                        isStaff
                          ? 'bg-[#981B1E] text-white rounded-tr-xs shadow-2xs'
                          : 'bg-white text-stone-800 border border-stone-200 rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Staff Reply Form */}
            <form
              onSubmit={handleSendReply}
              className="p-3 border-t border-stone-200 bg-white flex items-center gap-2"
            >
              <input
                ref={replyInputRef}
                type="text"
                value={staffReply}
                onChange={(e) => setStaffReply(e.target.value)}
                placeholder="Nhập nội dung phản hồi gửi đến sinh viên (Enter để gửi)..."
                disabled={selectedTicket.status === 'CLOSED'}
                className="flex-1 text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#981B1E] focus:border-[#981B1E] disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!staffReply.trim() || selectedTicket.status === 'CLOSED'}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#981B1E] hover:bg-[#801619] disabled:opacity-40 disabled:hover:bg-[#981B1E] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors shrink-0"
              >
                <Send size={13} />
                <span>Gửi phản hồi</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-stone-400">
            <MessageSquare className="w-12 h-12 stroke-[1.5] mb-2 text-stone-300" />
            <p className="text-sm font-medium">Chọn một ticket từ danh sách bên trái để xem nội dung</p>
          </div>
        )}
      </div>
    </div>
  );
}
