import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Mail,
  Star,
  Settings,
  Search,
  Megaphone,
  Package,
  Users,
  FileText,
  Calendar,
  ShieldCheck,
  Heart,
  Bell,
  ChevronRight,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'sonner';

// Dữ liệu thông báo hệ thống và cộng đồng chuẩn hóa theo thiết kế DNTU
const SYSTEM_COMMUNITY_NOTIFICATIONS = [
  {
    id: 'notif_sys_1',
    title: 'Thông báo bảo trì hệ thống',
    message: 'Hệ thống UniFind DNTU sẽ được bảo trì định kỳ vào ngày 15/12/2024 từ 00:00 - 04:00. Trong thời gian này, một số tính năng có thể tạm thời không truy cập được.',
    type: 'maintenance',
    badge: '★ Quan trọng',
    badgeType: 'important',
    isImportant: true,
    isSystem: true,
    timeText: '2 giờ trước',
    read: false,
    link: null,
  },
  {
    id: 'notif_sys_2',
    title: 'Có vật phẩm mới được nhặt',
    message: 'Một vật phẩm mới "Tai nghe AirPods" đã được đăng tải tại khu vực Căn tin khu B. Hãy xem chi tiết để kiểm tra xem có phải của bạn không.',
    type: 'item',
    badge: 'Xem chi tiết',
    badgeType: 'detail',
    isImportant: true,
    isSystem: false,
    timeText: '4 giờ trước',
    read: false,
    link: '/search?category=Điện thoại - Phụ kiện',
  },
  {
    id: 'notif_sys_3',
    title: 'Chào mừng thành viên mới',
    message: 'Chào mừng 50 sinh viên mới đã tham gia cộng đồng UniFind DNTU tuần này! Cùng nhau xây dựng một môi trường học tập an toàn và thân thiện hơn.',
    type: 'community',
    badge: 'Cộng đồng',
    badgeType: 'community',
    isImportant: false,
    isSystem: false,
    timeText: 'Hôm qua',
    read: true,
    link: null,
  },
  {
    id: 'notif_sys_4',
    title: 'Cập nhật hướng dẫn sử dụng',
    message: 'Chúng tôi đã cập nhật hướng dẫn chi tiết về cách báo mất đồ và xác minh thông tin. Hãy xem để có trải nghiệm tốt hơn trên UniFind DNTU.',
    type: 'guide',
    badge: 'Xem hướng dẫn',
    badgeType: 'guide',
    isImportant: false,
    isSystem: true,
    timeText: '2 ngày trước',
    read: false,
    link: '/guide',
  },
  {
    id: 'notif_sys_5',
    title: 'Sự kiện: Ngày hội Sinh viên DNTU 2024',
    message: 'UniFind DNTU sẽ có gian hàng tại Ngày hội Sinh viên vào ngày 20/12/2024. Hãy ghé thăm để tìm hiểu thêm về dự án và nhận những phần quà hấp dẫn!',
    type: 'event',
    badge: 'Sự kiện',
    badgeType: 'event',
    isImportant: false,
    isSystem: false,
    timeText: '3 ngày trước',
    read: true,
    link: null,
  },
  {
    id: 'notif_sys_6',
    title: 'Nhắc nhở bảo mật thông tin',
    message: 'Vui lòng không chia sẻ thông tin cá nhân (số điện thoại, địa chỉ, mã sinh viên) công khai trong phần mô tả bài đăng để đảm bảo an toàn.',
    type: 'security',
    badge: 'An toàn',
    badgeType: 'security',
    isImportant: false,
    isSystem: true,
    timeText: '5 ngày trước',
    read: true,
    link: null,
  },
  {
    id: 'notif_sys_7',
    title: 'Cảm ơn cộng đồng',
    message: 'Cảm ơn các bạn đã giúp đỡ tìm lại hơn 680 vật phẩm trong tháng qua! Sự tử tế của bạn đang tạo nên một cộng đồng DNTU tốt đẹp hơn mỗi ngày.',
    type: 'thanks',
    badge: 'Cộng đồng',
    badgeType: 'community',
    isImportant: false,
    isSystem: false,
    timeText: '1 tuần trước',
    read: true,
    link: null,
  },
  {
    id: 'notif_sys_8',
    title: 'Có tin nhắn mới từ người liên hệ',
    message: 'Bạn có 1 tin nhắn mới liên quan đến bài đăng "Ví da màu đen". Hãy kiểm tra và phản hồi sớm nhé!',
    type: 'message',
    badge: 'Xem tin nhắn',
    badgeType: 'message',
    isImportant: true,
    isSystem: false,
    timeText: '1 tuần trước',
    read: false,
    link: '/search',
  },
  {
    id: 'notif_sys_9',
    title: 'Xác thực tài khoản sinh viên thành công',
    message: 'Hệ thống đã tự động liên kết mã định danh sinh viên của bạn với cổng DNTU Portal an toàn.',
    type: 'security',
    badge: 'An toàn',
    badgeType: 'security',
    isImportant: false,
    isSystem: true,
    timeText: '1 tuần trước',
    read: true,
    link: '/student-card',
  },
  {
    id: 'notif_sys_10',
    title: 'Tính năng mới: Tìm kiếm bằng AI thông minh',
    message: 'Hệ thống hỗ trợ quét và so sánh đặc điểm nhận dạng ảnh tự động giữa vật phẩm nhặt được và đồ báo mất.',
    type: 'maintenance',
    badge: 'Hệ thống',
    badgeType: 'system',
    isImportant: false,
    isSystem: true,
    timeText: '2 tuần trước',
    read: true,
    link: '/search',
  },
  {
    id: 'notif_sys_11',
    title: 'Hoàn tất trao trả đồ thất lạc',
    message: 'Vật phẩm "Bình giữ nhiệt Lock&Lock" đã được bàn giao cho chủ sở hữu tại Văn phòng Đoàn - Hội DNTU.',
    type: 'thanks',
    badge: 'Cộng đồng',
    badgeType: 'community',
    isImportant: false,
    isSystem: false,
    timeText: '2 tuần trước',
    read: true,
    link: null,
  },
  {
    id: 'notif_sys_12',
    title: 'Khảo sát trải nghiệm người dùng UniFind',
    message: 'Đóng góp ý kiến của bạn để giúp chúng tôi hoàn thiện và nâng cao chất lượng dịch vụ hỗ trợ sinh viên DNTU.',
    type: 'guide',
    badge: 'Hệ thống',
    badgeType: 'system',
    isImportant: false,
    isSystem: true,
    timeText: '3 tuần trước',
    read: true,
    link: null,
  },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(SYSTEM_COMMUNITY_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserNotifications();
    }
  }, [user?.id]);

  const loadUserNotifications = async () => {
    try {
      setLoading(true);
      const userNotifs = await notificationService.getByUser(user.id);
      if (userNotifs && userNotifs.length > 0) {
        // Map user notifications to match UI presentation
        const mappedUserNotifs = userNotifs.map((n) => {
          let badge = 'Xem chi tiết';
          let badgeType = 'detail';
          let isImportant = false;
          let isSystem = false;
          let type = 'item';

          if (n.type?.includes('match')) {
            badge = '★ Trùng khớp';
            badgeType = 'important';
            isImportant = true;
            type = 'item';
          } else if (n.type?.includes('claim')) {
            badge = 'Xác minh';
            badgeType = 'detail';
            type = 'security';
          } else if (n.type?.includes('handover')) {
            badge = 'Bàn giao';
            badgeType = 'community';
            type = 'thanks';
          } else {
            badge = 'Hệ thống';
            badgeType = 'system';
            isSystem = true;
          }

          return {
            id: n.id,
            title: n.title,
            message: n.message,
            type,
            badge,
            badgeType,
            isImportant,
            isSystem,
            timeText: 'Gần đây',
            read: n.read,
            relatedId: n.relatedId,
            link: n.relatedId ? `/items/${n.relatedId}` : null,
          };
        });

        // Ghép thông báo cá nhân vào đầu danh sách, loại bỏ trùng lặp id
        setNotifications((prev) => {
          const ids = new Set(mappedUserNotifs.map((m) => m.id));
          const rest = prev.filter((p) => !ids.has(p.id));
          return [...mappedUserNotifs, ...rest];
        });
      }
    } catch (err) {
      console.warn('Lỗi khi tải thông báo cá nhân:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (item) => {
    try {
      if (!item.read) {
        if (user?.id && !item.id.startsWith('notif_sys_')) {
          await notificationService.markAsRead(item.id);
        }
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
        );
      }

      if (item.link) {
        navigate(item.link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      if (user?.id) {
        await notificationService.markAllAsRead(user.id);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  // Tính toán số lượng theo tab
  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const importantCount = notifications.filter((n) => n.isImportant).length;
  const systemCount = notifications.filter((n) => n.isSystem).length;

  // Lọc theo tab và tìm kiếm
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Tab filter
      if (activeTab === 'unread' && item.read) return false;
      if (activeTab === 'important' && !item.isImportant) return false;
      if (activeTab === 'system' && !item.isSystem) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesMsg = item.message?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg) return false;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  // Render icon theo loại thông báo
  const renderIcon = (type) => {
    switch (type) {
      case 'maintenance':
        return (
          <div className="w-12 h-12 rounded-full bg-[#FDF2F2] text-[#E02424] flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
        );
      case 'item':
        return (
          <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        );
      case 'community':
        return (
          <div className="w-12 h-12 rounded-full bg-[#DEF7EC] text-[#057A55] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        );
      case 'guide':
        return (
          <div className="w-12 h-12 rounded-full bg-[#FDF2F2] text-[#C81E1E] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        );
      case 'event':
        return (
          <div className="w-12 h-12 rounded-full bg-[#E1EFFE] text-[#1C64F2] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        );
      case 'security':
        return (
          <div className="w-12 h-12 rounded-full bg-[#EDFDF5] text-[#0D7A4D] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        );
      case 'thanks':
        return (
          <div className="w-12 h-12 rounded-full bg-[#FDF2F2] text-[#E02424] flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5" />
          </div>
        );
      case 'message':
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-[#EDEBFE] text-[#6C2BD9] flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
        );
    }
  };

  // Render badge phân loại
  const renderBadge = (badge, badgeType) => {
    switch (badgeType) {
      case 'important':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FDF2F2] text-[#9B1C1C] border border-[#FBD5D5]">
            {badge}
          </span>
        );
      case 'detail':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F7F0E6] text-[#723B13] border border-[#ECD9C4]">
            {badge}
          </span>
        );
      case 'community':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#DEF7EC] text-[#03543F] border border-[#BCF0DA]">
            {badge}
          </span>
        );
      case 'guide':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FDF2F2] text-[#9B1C1C] border border-[#FBD5D5]">
            {badge}
          </span>
        );
      case 'event':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#E1EFFE] text-[#1E429F] border border-[#C3DDFD]">
            {badge}
          </span>
        );
      case 'security':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#DEF7EC] text-[#03543F] border border-[#BCF0DA]">
            {badge}
          </span>
        );
      case 'message':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#EDEBFE] text-[#5521B5] border border-[#DCD7FE]">
            {badge}
          </span>
        );
      case 'system':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
            {badge}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* HERO BANNER SECTION */}
        <div className="relative rounded-2xl overflow-hidden shadow-sm border border-[#EAE4DC] min-h-[190px] sm:min-h-[210px] flex items-center">
          {/* Background image & gradient overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/DNTU_Web_Asset_Kit/asset/03_why_dntu_campus.jpg')",
            }}
          />
          {/* Dark Red Burgundy DNTU Gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(100, 16, 23, 0.96) 0%, rgba(125, 23, 31, 0.90) 45%, rgba(125, 23, 31, 0.40) 80%, rgba(125, 23, 31, 0.20) 100%)',
            }}
          />

          {/* Banner Content */}
          <div className="relative z-10 w-full px-6 sm:px-10 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs text-white/80 font-medium mb-3">
                <Link to="/" className="hover:text-white transition-colors">
                  Trang chủ
                </Link>
                <span>›</span>
                <span className="text-white">Thông báo</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Thông báo
              </h1>

              {/* Subtitle */}
              <p className="mt-2 text-sm sm:text-base text-white/90 leading-relaxed max-w-xl font-normal">
                Cập nhật những thông tin quan trọng, hoạt động mới và các tin tức từ cộng đồng UniFind DNTU.
              </p>
            </div>

            {/* Slogan & DNTU Identity (Right side) */}
            <div className="hidden lg:flex flex-col items-end text-right text-white select-none pr-2">
              <span className="font-serif italic text-lg xl:text-xl font-light text-white/95 drop-shadow-sm">
                Kết nối cộng đồng
              </span>
              <span className="font-serif italic text-lg xl:text-xl font-light text-white/90 drop-shadow-sm">
                Lan tỏa những điều tốt đẹp
              </span>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-white/80">
                  ĐẠI HỌC CÔNG NGHỆ ĐỒNG NAI
                </span>
                <img
                  src="/DNTU_Web_Asset_Kit/branding/dntu-symbol-white.png"
                  alt="DNTU Logo"
                  className="w-7 h-7 object-contain opacity-90"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS & FILTER BAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-[#7A1D24] text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-[#E2DDD5] hover:bg-stone-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Tất cả ({totalCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'unread'
                  ? 'bg-[#7A1D24] text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-[#E2DDD5] hover:bg-stone-50'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Chưa đọc ({unreadCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('important')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'important'
                  ? 'bg-[#7A1D24] text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-[#E2DDD5] hover:bg-stone-50'
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Quan trọng ({importantCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('system')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'system'
                  ? 'bg-[#7A1D24] text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-[#E2DDD5] hover:bg-stone-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Hệ thống</span>
            </button>
          </div>

          {/* Right Actions: Mark all read + Search */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#7A1D24] hover:bg-red-50 rounded-full transition-colors whitespace-nowrap"
              >
                <CheckCheck className="w-4 h-4" />
                Đánh dấu tất cả đã đọc
              </button>
            )}

            <div className="relative flex-1 sm:w-72 lg:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm thông báo..."
                className="w-full pl-9.5 pr-4 py-2 text-sm bg-white border border-[#E2DDD5] rounded-full focus:outline-none focus:border-[#7A1D24] transition-all placeholder:text-stone-400 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* NOTIFICATION LIST */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-[#ECE7E0] animate-pulse h-24" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#ECE7E0] p-12 text-center shadow-xs">
              <EmptyState
                icon={Bell}
                title="Không tìm thấy thông báo nào"
                description={
                  searchQuery
                    ? `Không có thông báo nào khớp với "${searchQuery}". Hãy thử từ khóa khác.`
                    : activeTab === 'unread'
                    ? 'Bạn không có thông báo chưa đọc nào.'
                    : 'Hiện tại chưa có thông báo mới trong danh mục này.'
                }
              />
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`bg-white rounded-2xl border border-[#ECE7E0] p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 transition-all duration-200 hover:shadow-card-hover hover:border-[#D9D2C7] cursor-pointer group ${
                  !n.read ? 'bg-red-50/15' : ''
                }`}
              >
                {/* Left: Icon */}
                {renderIcon(n.type)}

                {/* Center: Title & Description */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-[#C2222E] shrink-0" title="Chưa đọc" />
                    )}
                    <h3 className="text-sm sm:text-base font-bold text-[#1C2530] group-hover:text-[#7A1D24] transition-colors truncate">
                      {n.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                </div>

                {/* Right: Badge, Time & Arrow */}
                <div className="shrink-0 flex items-center gap-3 sm:gap-6 self-center">
                  <div className="hidden xs:block">
                    {renderBadge(n.badge, n.badgeType)}
                  </div>
                  <span className="text-xs text-stone-400 whitespace-nowrap min-w-[70px] text-right font-normal">
                    {n.timeText}
                  </span>
                  <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-[#7A1D24] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* BOTTOM STATS & MOTTO SECTION */}
        <div className="bg-white rounded-2xl border border-[#ECE7E0] p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Watermark subtle background */}
          <div
            className="absolute right-0 bottom-0 top-0 w-80 bg-no-repeat bg-right-bottom opacity-5 pointer-events-none"
            style={{
              backgroundImage: "url('/DNTU_Web_Asset_Kit/watermarks/dntu-campus-watermark-burgundy.png')",
              backgroundSize: 'contain',
            }}
          />

          {/* Left stats counter */}
          <div className="grid grid-cols-3 gap-6 sm:gap-10 w-full md:w-auto relative z-10">
            {/* Stat 1 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[#7A1D24]" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-[#1C2530] leading-none">
                  1.200+
                </div>
                <div className="text-[11px] sm:text-xs text-stone-500 mt-1 font-normal whitespace-nowrap">
                  Thành viên tham gia
                </div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-[#7A1D24]" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-[#1C2530] leading-none">
                  680+
                </div>
                <div className="text-[11px] sm:text-xs text-stone-500 mt-1 font-normal whitespace-nowrap">
                  Vật phẩm đã được trao trả
                </div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-[#7A1D24]" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-[#1C2530] leading-none">
                  100%
                </div>
                <div className="text-[11px] sm:text-xs text-stone-500 mt-1 font-normal whitespace-nowrap">
                  Vì một cộng đồng tử tế
                </div>
              </div>
            </div>
          </div>

          {/* Right quote */}
          <div className="w-full md:w-auto text-left md:text-right border-t md:border-t-0 md:border-l border-stone-200 pt-4 md:pt-0 md:pl-8 relative z-10">
            <p className="font-serif italic text-sm sm:text-base text-stone-800 font-medium">
              “Sự tử tế luôn tìm được đường về.”
            </p>
            <p className="text-xs text-stone-500 mt-0.5 tracking-wider font-medium">
              — DNTU
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
