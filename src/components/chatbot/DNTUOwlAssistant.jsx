import { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  Send,
  LayoutGrid,
  Headphones,
  Search,
  PlusCircle,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Paperclip,
  CheckCircle2,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import itemService from '../../services/itemService';
import ticketService from '../../services/ticketService';

const POLL_INTERVAL = 30000;
const SLEEP_AFTER = 60000;

const CATEGORIES = [
  { id: 'phone', label: 'Điện thoại', icon: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/icons/categories/phone.svg', sample: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/items/sample/phone.webp' },
  { id: 'laptop', label: 'Laptop', icon: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/icons/categories/laptop.svg', sample: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/items/sample/laptop.webp' },
  { id: 'wallet', label: 'Ví tiền', icon: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/icons/categories/wallet.svg', sample: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/items/sample/wallet.webp' },
  { id: 'student-card', label: 'Thẻ sinh viên', icon: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/icons/categories/student-card.svg', sample: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/items/sample/student-card.webp' },
  { id: 'key', label: 'Chìa khóa', icon: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/icons/categories/key.svg', sample: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/items/sample/key.webp' },
  { id: 'headphones', label: 'Tai nghe', icon: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/icons/categories/headphones.svg', sample: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/items/sample/headphones.webp' },
  { id: 'watch', label: 'Đồng hồ', icon: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/icons/categories/watch.svg', sample: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/items/sample/watch.webp' },
  { id: 'books', label: 'Sách/vở', icon: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/icons/categories/books.svg', sample: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/items/sample/books.webp' },
  { id: 'bottle', label: 'Bình nước', icon: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/icons/categories/bottle.svg', sample: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/items/sample/bottle.webp' },
  { id: 'backpack', label: 'Balo/túi xách', icon: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/icons/categories/backpack.svg', sample: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/items/sample/backpack.webp' },
  { id: 'documents', label: 'Giấy tờ', icon: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/icons/categories/documents.svg', sample: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/items/sample/documents.webp' },
  { id: 'clothes', label: 'Quần áo', icon: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/icons/categories/clothes.svg', sample: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/items/sample/clothes.webp' },
  { id: 'other', label: 'Vật dụng khác', icon: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/icons/categories/other.svg', sample: '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/items/sample/other.webp' },
];

const SUPPORT_TOPICS = [
  { id: 'claim_verification', label: 'Xác minh nhận lại đồ', desc: 'Đối chiếu hồ sơ, mã xác nhận nhận lại đồ' },
  { id: 'case_complaint', label: 'Khiếu nại hồ sơ', desc: 'Báo cáo tranh chấp, nghi vấn hoặc thông tin sai lệch' },
  { id: 'account_permission', label: 'Tài khoản & phân quyền', desc: 'Hỗ trợ đăng nhập, liên kết tài khoản sinh viên' },
  { id: 'other', label: 'Yêu cầu khác', desc: 'Kết nối trực tiếp nhân viên phòng ban DNTU' },
];

const STATE_COPIES = {
  idle: 'Cú DNTU đang đứng chờ',
  welcome: 'Cú DNTU chào bạn!',
  thinking: 'Cú DNTU đang suy nghĩ...',
  typing: 'Cú DNTU đang trả lời...',
  searching: 'Cú DNTU đang tra cứu đồ...',
  found: 'Cú DNTU tìm thấy đồ vật!',
  success: 'Đã hoàn tất thao tác!',
  staff: 'Hỗ trợ trực tiếp DNTU',
  sleeping: 'Cú DNTU đang chợp mắt...',
};

const INITIAL_MESSAGES = [
  {
    id: 'm-welcome',
    sender: 'bot',
    text: 'Chào bạn! Mình là Cú DNTU. Bạn cần tìm đồ bị mất, báo đồ vừa nhặt được hay muốn tra cứu danh mục nào?',
    timestamp: 'Bây giờ',
    showActions: true,
  },
];

export default function DNTUOwlAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [sleeping, setSleeping] = useState(false);
  const [mascotState, setMascotState] = useState('welcome');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'categories' | 'support'
  const [feedback, setFeedback] = useState({});
  const [matches, setMatches] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [position, setPosition] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dntu_owl_position')) || null;
    } catch {
      return null;
    }
  });

  const drag = useRef(null);
  const inactivityTimer = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const playSound = (name) => {
    try {
      const audio = new Audio(`/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/sounds/${name}.ogg`);
      audio.volume = 0.45;
      audio.play().catch(() => {});
    } catch (_) {}
  };

  const resetSleepTimer = useCallback(() => {
    setSleeping(false);
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setSleeping(true);
      setMascotState('sleeping');
    }, SLEEP_AFTER);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, messages, isTyping, activeTab]);

  // Đồng bộ ticket đang mở của user
  useEffect(() => {
    const existing = ticketService.getUserActiveTicket(user?.id || 'guest');
    if (existing) {
      setActiveTicket(existing);
    }
  }, [user?.id]);

  // Lắng nghe realtime phản hồi từ Staff qua ticketService
  useEffect(() => {
    const unsubscribe = ticketService.subscribe((detail) => {
      if (!activeTicket) return;
      if (detail.ticketId === activeTicket.id) {
        const fresh = ticketService.getTicketById(activeTicket.id);
        if (fresh) {
          setActiveTicket(fresh);
          const lastMsg = fresh.messages?.[fresh.messages.length - 1];
          if (lastMsg && (lastMsg.sender === 'admin' || lastMsg.sender === 'staff')) {
            setMessages((prev) => {
              const alreadyHas = prev.some((m) => m.ticketMsgId === lastMsg.id);
              if (alreadyHas) return prev;
              playSound('message-in');
              setMascotState('staff');
              return [
                ...prev,
                {
                  id: `agent-reply-${lastMsg.id}`,
                  ticketMsgId: lastMsg.id,
                  sender: 'agent',
                  text: `${lastMsg.senderName}: ${lastMsg.text}`,
                  timestamp: new Date(lastMsg.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                },
              ];
            });
            ticketService.markAsRead(fresh.id, 'user');
          }
        }
      }
    });

    return () => unsubscribe();
  }, [activeTicket]);

  const handleEndTicketSession = () => {
    if (!activeTicket) return;
    ticketService.updateStatus(activeTicket.id, 'RESOLVED');
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `Phiên hỗ trợ Ticket #${activeTicket.id} đã kết thúc. Cú DNTU luôn ở đây đồng hành cùng bạn!`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setActiveTicket(null);
    setMascotState('welcome');
    playSound('success');
  };

  const loadMatches = useCallback(async () => {
    if (!user?.id) return setMatches([]);
    try {
      const notifications = await notificationService.getByUser(user.id);
      const incoming = notifications.filter((item) => item.type === 'ITEM_MATCHED' && !item.read);
      setMatches(incoming);
      if (incoming.length) {
        setSleeping(false);
        setMascotState('found');
        const latestId = String(incoming[0].id);
        if (localStorage.getItem('dntu_owl_last_match') !== latestId) {
          localStorage.setItem('dntu_owl_last_match', latestId);
          setOpen(true);
        }
      }
    } catch (error) {
      console.warn('Không thể tải thông báo cho Cú DNTU:', error.message);
    }
  }, [user?.id]);

  useEffect(() => {
    loadMatches();
    const interval = setInterval(loadMatches, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadMatches]);

  useEffect(() => {
    resetSleepTimer();
    window.addEventListener('pointerdown', resetSleepTimer, { passive: true });
    window.addEventListener('keydown', resetSleepTimer);
    return () => {
      clearTimeout(inactivityTimer.current);
      window.removeEventListener('pointerdown', resetSleepTimer);
      window.removeEventListener('keydown', resetSleepTimer);
    };
  }, [resetSleepTimer]);

  useEffect(() => {
    if (position) localStorage.setItem('dntu_owl_position', JSON.stringify(position));
  }, [position]);

  const onPointerDown = (event) => {
    const box = event.currentTarget.parentElement.getBoundingClientRect();
    drag.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - box.left,
      offsetY: event.clientY - box.top,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const widget = event.currentTarget.parentElement.getBoundingClientRect();
    const safeWidth = widget.width || 132;
    const safeHeight = widget.height || 132;
    const next = {
      left: Math.max(8, Math.min(window.innerWidth - safeWidth - 8, event.clientX - drag.current.offsetX)),
      top: Math.max(72, Math.min(window.innerHeight - safeHeight - 8, event.clientY - drag.current.offsetY)),
    };
    if (Math.abs(event.clientX - drag.current.startX) + Math.abs(event.clientY - drag.current.startY) > 5) {
      drag.current.moved = true;
    }
    setPosition(next);
  };

  const onPointerUp = (event) => {
    if (!drag.current) return;
    const wasMoved = drag.current.moved;
    drag.current = null;
    if (!wasMoved) {
      setOpen((prev) => !prev);
      if (!open) {
        setMascotState('welcome');
        playSound('message-in');
      }
    }
    resetSleepTimer();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  // Tra cứu theo danh mục
  const handleSelectCategory = async (category) => {
    setActiveTab('chat');
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      {
        id: `usr-${Date.now()}`,
        sender: 'user',
        text: `🔍 Tra cứu danh mục: ${category.label}`,
        timestamp: timeStr,
      },
    ]);

    playSound('message-out');
    setMascotState('searching');
    setIsTyping(true);

    try {
      const items = await itemService.getItems({ search: category.label, limit: 3 });
      setTimeout(() => {
        setIsTyping(false);
        setMascotState(items.length ? 'found' : 'welcome');
        playSound(items.length ? 'success' : 'message-in');

        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: items.length
              ? `Cú DNTU tìm thấy ${items.length} món đồ thuộc danh mục "${category.label}" trên UniFind:`
              : `Hiện chưa có món đồ nào mới đăng trong danh mục "${category.label}". Bạn có thể tạo tin báo mất hoặc xem toàn bộ danh sách nhé!`,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            items: items.slice(0, 3),
            categoryName: category.label,
            showActions: false,
          },
        ]);
      }, 900);
    } catch (_) {
      setIsTyping(false);
      setMascotState('welcome');
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `Bạn có thể bấm bên dưới để xem toàn bộ danh sách "${category.label}" nhé:`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          categoryName: category.label,
        },
      ]);
    }
  };

  // Chat với nhân viên - Tự động tạo Ticket cho Admin
  const handleSelectSupportTopic = (topic) => {
    setActiveTab('chat');
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const topicLabel = topic.label || topic.title || 'Hỗ trợ trực tiếp từ nhân viên';

    // Tạo ticket gửi Nhân viên (Staff)
    const newTicket = ticketService.createTicket({
      userId: user?.id || 'guest',
      userName: user?.name || (user?.id ? 'Sinh viên DNTU' : 'Khách vãng lai'),
      userEmail: user?.email || '',
      userRole: user?.role || 'user',
      topic: topicLabel,
      initialMessage: `Em cần hỗ trợ về chủ đề: "${topicLabel}"`,
    });

    setActiveTicket(newTicket);
    playSound('message-out');
    setMascotState('staff');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      playSound('success');
      setMessages((prev) => [
        ...prev,
        {
          id: `usr-${Date.now()}`,
          sender: 'user',
          text: `🎧 Yêu cầu hỗ trợ: ${topicLabel}`,
          timestamp: timeStr,
        },
        {
          id: `agent-${Date.now() + 1}`,
          sender: 'agent',
          text: `🎫 Đã tự động tạo Ticket hỗ trợ #${newTicket.id} gửi đến bộ phận Nhân viên trực Lost & Found DNTU!\n\nNhân viên phụ trách sẽ theo dõi trực tiếp nội dung cuộc trò chuyện này. Bạn vui lòng nhắn chi tiết câu hỏi hoặc vấn đề cần xử lý vào ô chat bên dưới nhé!`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 800);
  };

  // Gửi tin nhắn tự do
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;

    const text = inputMessage.trim();
    setInputMessage('');
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      {
        id: `usr-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: timeStr,
      },
    ]);

    playSound('message-out');

    // NẾU ĐANG TRONG PHIÊN TICKET CHAT VỚI NHÂN VIÊN:
    // Tự động đẩy tin nhắn vào Ticket của Admin để hiển thị realtime
    if (activeTicket) {
      setMascotState('staff');
      ticketService.addMessage(activeTicket.id, {
        sender: 'user',
        senderName: user?.name || 'Sinh viên',
        text,
      });

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
      }, 500);
      return;
    }

    setMascotState('thinking');
    setIsTyping(true);

    const lower = text.toLowerCase();

    setTimeout(async () => {
      setIsTyping(false);

      if (lower.includes('mất') || lower.includes('rơi') || lower.includes('quên')) {
        setMascotState('searching');
        playSound('message-in');
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: 'Bạn đừng quá lo lắng! Hãy cho Cú biết chi tiết đặc điểm món đồ, địa điểm trong trường (nhà A, B, thư viện...) và thời gian rơi. Hoặc bạn có thể đăng tin báo mất ngay để cả trường cùng hỗ trợ tìm lại nhé!',
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            actionButtons: [
              { label: 'Tạo tin báo mất đồ', path: '/report-lost' },
              { label: 'Chọn danh mục đồ', tab: 'categories' },
            ],
          },
        ]);
      } else if (lower.includes('nhặt') || lower.includes('lượm') || lower.includes('thấy đồ')) {
        setMascotState('success');
        playSound('success');
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: 'Tuyệt vời! Tinh thần trung thực của sinh viên DNTU rất đáng trân trọng. Bạn có thể chụp ảnh món đồ và tạo tin báo nhặt được để người đánh mất sớm nhận lại nhé!',
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            actionButtons: [{ label: 'Đăng tin nhặt được đồ', path: '/report-found' }],
          },
        ]);
      } else if (lower.includes('danh mục') || lower.includes('loại đồ')) {
        setMascotState('welcome');
        setActiveTab('categories');
        playSound('message-in');
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: 'Dưới đây là 13 danh mục đồ vật thất lạc tại DNTU. Bạn chọn danh mục tương ứng để tra cứu nhé:',
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else if (lower.includes('nhân viên') || lower.includes('hỗ trợ') || lower.includes('khiếu nại') || lower.includes('xác minh')) {
        setMascotState('staff');
        setActiveTab('support');
        playSound('message-in');
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: 'Mình đã mở danh sách các chủ đề hỗ trợ trực tiếp. Bạn chọn một mục để kết nối đúng bộ phận nhé:',
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        // Tra cứu thông thường trong database
        try {
          const results = await itemService.getItems({ search: text, limit: 3 });
          if (results.length > 0) {
            setMascotState('found');
            playSound('success');
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                sender: 'bot',
                text: `Cú DNTU tìm thấy ${results.length} món đồ có liên quan đến "${text}":`,
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                items: results.slice(0, 3),
              },
            ]);
          } else {
            setMascotState('welcome');
            playSound('message-in');
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                sender: 'bot',
                text: `Cú DNTU đã ghi nhận thông tin "${text}". Hiện chưa có món đồ nào trùng khớp hoàn toàn. Bạn có thể mở rộng từ khóa tìm kiếm hoặc chọn danh mục để tra cứu thêm nhé!`,
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                actionButtons: [
                  { label: 'Chọn danh mục đồ', tab: 'categories' },
                  { label: 'Xem trang tìm kiếm', path: `/search?search=${encodeURIComponent(text)}` },
                ],
              },
            ]);
          }
        } catch (_) {
          setMascotState('welcome');
          playSound('message-in');
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: 'bot',
              text: `Cú đã ghi nhận câu hỏi của bạn. Nếu cần tìm đồ, bạn có thể tra cứu theo danh mục bên dưới nhé!`,
              timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              actionButtons: [{ label: 'Mở danh mục', tab: 'categories' }],
            },
          ]);
        }
      }
    }, 900);
  };

  const handleResetConversation = () => {
    setMessages(INITIAL_MESSAGES);
    setActiveTab('chat');
    setMascotState('welcome');
    playSound('message-in');
  };

  const isSearching = ['/report-lost', '/report-found', '/search'].includes(location.pathname);
  const stateIcon = matches.length ? 'found' : sleeping ? 'sleeping' : isSearching ? 'searching' : mascotState;
  const style = position ? { left: position.left, top: position.top, right: 'auto', bottom: 'auto' } : undefined;
  const panelStyle = position && position.left < 360 ? { left: 0, right: 'auto' } : undefined;

  return (
    <aside className={`dntu-owl-widget dntu-owl-${stateIcon}`} style={style} aria-live="polite">
      {open && (
        <section className="dntu-owl-panel animate-scaleIn flex flex-col" style={panelStyle}>
          {/* HEADER */}
          <header className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#981B1E] via-[#851619] to-[#6d1114] text-white select-none shrink-0 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src="/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/icons/ui/avatar-owl.png"
                  alt="Cú DNTU"
                  className="w-8 h-8 rounded-full border border-white/30 bg-white/10 p-0.5 object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#981B1E] rounded-full animate-pulse" />
              </div>
              <div>
                <strong className="text-sm font-bold block leading-tight text-white flex items-center gap-1.5">
                  Trợ lý Cú DNTU
                  <Sparkles size={13} className="text-amber-300" />
                </strong>
                <small className="text-[11px] text-white/80 block">
                  {user ? 'Sinh viên DNTU · Trực tuyến' : 'Khách · Trực tuyến'}
                </small>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab((prev) => (prev === 'categories' ? 'chat' : 'categories'))}
                className={`p-1.5 rounded-lg transition-colors text-white/90 hover:bg-white/20 hover:text-white ${
                  activeTab === 'categories' ? 'bg-white/25 text-white ring-1 ring-white/40' : ''
                }`}
                title="13 Danh mục đồ vật"
                aria-label="13 Danh mục đồ vật"
              >
                <LayoutGrid size={16} />
              </button>

              <button
                type="button"
                onClick={handleResetConversation}
                className="p-1.5 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                title="Bắt đầu lại hội thoại"
                aria-label="Bắt đầu lại"
              >
                <RotateCcw size={15} />
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-colors ml-1"
                aria-label="Thu nhỏ trợ lý"
              >
                <X size={17} />
              </button>
            </div>
          </header>

          {/* MASCOT ANIMATED STAGE */}
          <div className="bg-[#FAF7F4] border-b border-[#EDE6DF] px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <img
                src={`/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/mascot/animated/${mascotState}.webp`}
                alt={STATE_COPIES[mascotState] || 'Cú DNTU'}
                className="w-12 h-12 object-contain filter drop-shadow-sm select-none pointer-events-none"
              />
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#981B1E]/10 text-[#981B1E]">
                  {mascotState.toUpperCase()}
                </span>
                <p className="text-xs font-semibold text-stone-700 mt-0.5">
                  {STATE_COPIES[mascotState] || 'Cú DNTU luôn sẵn sàng hỗ trợ!'}
                </p>
              </div>
            </div>

            {/* TAB SELECTOR CHAT / CATEGORIES */}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition-all ${
                  activeTab === 'chat'
                    ? 'bg-[#981B1E] text-white shadow-sm'
                    : 'bg-stone-200/70 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition-all ${
                  activeTab === 'categories'
                    ? 'bg-[#981B1E] text-white shadow-sm'
                    : 'bg-stone-200/70 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Danh mục
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('support')}
                className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition-all ${
                  activeTab === 'support'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-stone-200/70 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Hỗ trợ
              </button>
            </div>
          </div>

          {/* ACTIVE TICKET BANNER */}
          {activeTicket && (
            <div className="bg-gradient-to-r from-amber-500/15 via-red-500/10 to-transparent border-b border-amber-200/80 px-3.5 py-1.5 flex items-center justify-between text-xs shrink-0 animate-fadeIn">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="font-bold text-[#981B1E] truncate">Ticket #{activeTicket.id}:</span>
                <span className="text-stone-600 font-medium truncate">{activeTicket.topic}</span>
              </div>
              <button
                type="button"
                onClick={handleEndTicketSession}
                className="text-[11px] font-semibold text-stone-500 hover:text-red-700 hover:underline shrink-0 ml-2"
              >
                Kết thúc phiên
              </button>
            </div>
          )}

          {/* MAIN BODY AREA */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 dntu-chat-messages bg-white">
            {/* VIEW 1: CATEGORY GRID (13 DANH MỤC TỪ ASSET KIT) */}
            {activeTab === 'categories' && (
              <div className="animate-fadeIn space-y-2.5 pb-2">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                      13 Danh mục đồ thất lạc DNTU
                    </h4>
                    <p className="text-[11px] text-stone-500">Bấm chọn để Cú tự động tra cứu cho bạn</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    className="text-[11px] font-bold text-[#981B1E] hover:underline"
                  >
                    Về khung chat
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className="group flex flex-col items-center justify-center p-2.5 rounded-xl border border-stone-200 bg-stone-50/80 hover:bg-red-50/60 hover:border-[#981B1E]/40 hover:shadow-sm transition-all text-center"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white shadow-xs border border-stone-100 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                        <img src={cat.icon} alt="" className="w-5 h-5 object-contain" />
                      </div>
                      <span className="text-[11px] font-semibold text-stone-800 group-hover:text-[#981B1E] leading-tight line-clamp-1">
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 2: SUPPORT TOPICS DIRECT VIEW */}
            {activeTab === 'support' && (
              <div className="animate-fadeIn space-y-2 pb-2">
                <div className="border-b border-stone-200 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-blue-700">
                    <Headphones size={15} />
                    <h4 className="text-xs font-bold uppercase tracking-wide">Chủ đề hỗ trợ trực tiếp</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    className="text-[11px] font-bold text-stone-500 hover:text-stone-800"
                  >
                    Đóng
                  </button>
                </div>
                <div className="space-y-1.5">
                  {SUPPORT_TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleSelectSupportTopic(topic)}
                      className="w-full text-left p-2.5 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100/60 hover:border-blue-300 transition-all flex items-start gap-2.5 group"
                    >
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                        🎧
                      </span>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-stone-900 group-hover:text-blue-800">
                          {topic.label}
                        </div>
                        <div className="text-[11px] text-stone-500 leading-snug mt-0.5">{topic.desc}</div>
                      </div>
                      <ChevronRight size={14} className="text-stone-400 group-hover:text-blue-600 mt-1 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 3: CHAT STREAM */}
            {activeTab === 'chat' && (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-2 animate-fadeIn">
                    {/* MESSAGE BUBBLE */}
                    <div
                      className={`flex gap-2 ${
                        msg.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.sender !== 'user' && (
                        <img
                          src={
                            msg.sender === 'agent'
                              ? '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/icons/ui/avatar-owl.png'
                              : '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/icons/ui/avatar-owl.svg'
                          }
                          alt=""
                          className="w-6 h-6 rounded-full shrink-0 mt-1"
                        />
                      )}

                      <div
                        className={`max-w-[85%] px-3.5 py-2.5 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'dntu-bubble-user text-white shadow-sm'
                            : msg.sender === 'agent'
                            ? 'dntu-bubble-agent shadow-xs'
                            : 'dntu-bubble-bot shadow-xs'
                        }`}
                      >
                        {msg.sender === 'agent' && (
                          <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Headphones size={11} /> Nhân viên Hỗ trợ DNTU
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <div
                          className={`text-[9px] mt-1 text-right font-medium ${
                            msg.sender === 'user' ? 'text-white/70' : 'text-stone-400'
                          }`}
                        >
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>

                    {/* QUICK ACTION PILLS (Under welcome message) */}
                    {msg.showActions && (
                      <div className="pl-8 pt-1 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            navigate('/report-lost');
                          }}
                          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:border-[#981B1E] hover:text-[#981B1E] transition-all shadow-2xs flex items-center gap-1"
                        >
                          <Search size={12} className="text-[#981B1E]" /> Tôi bị mất đồ
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            navigate('/report-found');
                          }}
                          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:border-emerald-600 hover:text-emerald-700 transition-all shadow-2xs flex items-center gap-1"
                        >
                          <PlusCircle size={12} className="text-emerald-600" /> Tôi nhặt được đồ
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('categories')}
                          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:border-amber-600 hover:text-amber-700 transition-all shadow-2xs flex items-center gap-1"
                        >
                          <LayoutGrid size={12} className="text-amber-600" /> Chọn danh mục
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('support')}
                          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:border-blue-600 hover:text-blue-700 transition-all shadow-2xs flex items-center gap-1"
                        >
                          <Headphones size={12} className="text-blue-600" /> Chat nhân viên
                        </button>
                      </div>
                    )}

                    {/* ACTION BUTTONS (from custom replies) */}
                    {msg.actionButtons && (
                      <div className="pl-8 pt-1 flex flex-wrap gap-1.5">
                        {msg.actionButtons.map((btn, bidx) => (
                          <button
                            key={bidx}
                            type="button"
                            onClick={() => {
                              if (btn.path) {
                                setOpen(false);
                                navigate(btn.path);
                              } else if (btn.tab) {
                                setActiveTab(btn.tab);
                              }
                            }}
                            className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#981B1E] text-white hover:bg-[#7d1416] transition-all shadow-xs flex items-center gap-1"
                          >
                            {btn.label} <ChevronRight size={12} />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* ITEM PREVIEWS FOUND */}
                    {msg.items && msg.items.length > 0 && (
                      <div className="pl-8 pt-1 space-y-2">
                        {msg.items.map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-white hover:border-[#981B1E]/40 hover:shadow-sm transition-all flex items-center gap-2.5 group cursor-pointer"
                            onClick={() => {
                              setOpen(false);
                              navigate(`/items/${item.id}`);
                            }}
                          >
                            <img
                              src={
                                item.images?.[0] ||
                                '/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/items/sample/wallet.webp'
                              }
                              alt={item.title}
                              className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0 group-hover:scale-105 transition-transform"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h5 className="text-xs font-bold text-stone-900 truncate group-hover:text-[#981B1E]">
                                  {item.title}
                                </h5>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                    item.type === 'lost'
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {item.type === 'lost' ? 'Đang tìm' : 'Đã nhặt'}
                                </span>
                              </div>
                              <p className="text-[10px] text-stone-500 truncate mt-0.5">
                                📍 {item.location || 'Khuôn viên DNTU'}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-[#981B1E] font-semibold mt-1">
                                <span>Xem chi tiết</span>
                                <ExternalLink size={10} />
                              </div>
                            </div>
                          </div>
                        ))}

                        {msg.categoryName && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpen(false);
                              navigate(`/search?search=${encodeURIComponent(msg.categoryName)}`);
                            }}
                            className="w-full text-center py-1.5 rounded-lg border border-[#981B1E]/20 text-[#981B1E] hover:bg-[#981B1E]/5 text-[11px] font-bold transition-all"
                          >
                            Xem toàn bộ kết quả "{msg.categoryName}" →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* TYPING INDICATOR */}
                {isTyping && (
                  <div className="flex items-center gap-2 pl-1 animate-fadeIn">
                    <img
                      src="/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/icons/ui/avatar-owl.svg"
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                    <div className="dntu-bubble-bot px-3 py-2 flex items-center gap-1.5">
                      <span className="dntu-typing-dot" />
                      <span className="dntu-typing-dot" />
                      <span className="dntu-typing-dot" />
                      <span className="text-[11px] text-stone-500 font-medium ml-1">
                        Cú DNTU đang tìm kiếm...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* COMPOSER FORM */}
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 bg-[#FAF7F4] border-t border-[#EDE6DF] shrink-0"
          >
            <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-2 py-1.5 focus-within:border-[#981B1E] focus-within:ring-2 focus-within:ring-[#981B1E]/10 transition-all shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab((prev) => (prev === 'categories' ? 'chat' : 'categories'))}
                className="p-1 rounded-lg text-stone-500 hover:text-[#981B1E] hover:bg-stone-100 transition-colors"
                title="Mở danh mục đồ vật"
                aria-label="Danh mục"
              >
                <LayoutGrid size={17} />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Nhập tên đồ vật cần tìm hoặc câu hỏi..."
                className="flex-1 bg-transparent text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="w-8 h-8 rounded-lg bg-[#981B1E] hover:bg-[#7d1416] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shrink-0 shadow-xs"
                aria-label="Gửi tin nhắn"
              >
                <Send size={14} className="ml-0.5" />
              </button>
            </div>

            {/* FEEDBACK MINI BAR */}
            <div className="flex items-center justify-between text-[10px] text-stone-400 mt-2 px-1">
              <span>UniFind DNTU AI Assistant</span>
              <div className="flex items-center gap-2">
                <span>Hữu ích?</span>
                <button
                  type="button"
                  onClick={() => setFeedback((f) => ({ ...f, helpful: true }))}
                  className={`hover:text-emerald-600 transition-colors ${
                    feedback.helpful ? 'text-emerald-600 font-bold' : ''
                  }`}
                  aria-label="Hữu ích"
                >
                  <ThumbsUp size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => setFeedback((f) => ({ ...f, helpful: false }))}
                  className={`hover:text-rose-600 transition-colors ${
                    feedback.helpful === false ? 'text-rose-600 font-bold' : ''
                  }`}
                  aria-label="Không hữu ích"
                >
                  <ThumbsDown size={11} />
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* MATCH NOTIFICATION BADGE */}
      {matches.length > 0 && (
        <span className="dntu-owl-unread" title={`${matches.length} kết quả nghi vấn!`}>
          {Math.min(matches.length, 9)}
        </span>
      )}

      {/* DRAGGABLE / CLICKABLE LAUNCHER MASCOT */}
      <button
        type="button"
        className="dntu-owl-mascot"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        aria-label={open ? 'Thu nhỏ Trợ lý Cú DNTU' : 'Mở Trợ lý Cú DNTU'}
        title="Bấm để mở chat · Kéo để di chuyển"
      >
        <img
          src={`/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/mascot/animated/${
            matches.length ? 'found' : sleeping ? 'sleeping' : 'welcome'
          }.webp`}
          alt="Cú DNTU"
          draggable="false"
        />
      </button>
    </aside>
  );
}
