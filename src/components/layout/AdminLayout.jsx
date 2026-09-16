import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, ShieldCheck, FolderTree,
  MapPin, BarChart2, ScrollText, Settings, X, LogOut,
  ChevronDown, UserRound, Bell, CheckCheck, Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import { formatRelative } from '../../utils';
import { toast } from 'sonner';

const menuItems = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/admin/posts', label: 'Bài đăng', icon: FileText },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/claims', label: 'Xác minh', icon: ShieldCheck },
  { to: '/admin/categories', label: 'Danh mục', icon: FolderTree },
  { to: '/admin/locations', label: 'Địa điểm', icon: MapPin },
  { to: '/admin/statistics', label: 'Thống kê', icon: BarChart2 },
  { to: '/admin/audit-logs', label: 'Audit Log', icon: ScrollText },
  { to: '/admin/settings', label: 'Cài đặt', icon: Settings },
];

function SidebarContent({ onClose, user, handleLogout }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Top Sidebar Logo Header */}
      <div className="pt-[22px] pb-[16px] px-[18px] border-b border-white/10 flex items-center justify-between shrink-0">
        <img
          src="/DNTU_Web_Asset_Kit/branding/unifind-dntu-logo-white.svg"
          alt="UniFind DNTU"
          className="h-[58px] w-auto object-contain"
        />
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role Pill */}
      <div className="h-[46px] mx-[12px] my-[14px] px-[16px] rounded-[10px] bg-white/10 border border-white/10 text-white text-[13px] font-semibold flex items-center gap-2 shrink-0">
        <ShieldCheck className="w-[18px] h-[18px] text-white" />
        <span>Quản trị viên Hệ thống</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-[12px] py-2 space-y-1.5 overflow-y-auto z-10 relative pb-24">
        <p className="px-[12px] mb-[10px] text-[11px] font-bold text-white/50 uppercase tracking-widest">
          CHỨC NĂNG QUẢN TRỊ
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.end
            ? location.pathname === item.to || location.pathname === '/admin/dashboard'
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={`flex items-center gap-[14px] px-[18px] h-[48px] rounded-[10px] text-[14px] transition-all duration-200 ${
                isActive
                  ? 'bg-white/14 text-white font-semibold border-l-[4px] border-white shadow-xs'
                  : 'text-white/75 font-medium hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-[19px] h-[19px] shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Soft Fade Overlay above Campus */}
      <div className="pointer-events-none absolute left-0 right-0 bottom-[100px] h-[150px] bg-gradient-to-b from-transparent via-[#6B1116]/15 to-[#661015]/2 z-0" />

      {/* Campus Line Art Watermark */}
      <img
        src="/DNTU_Web_Asset_Kit/watermarks/dntu-campus-lineart-white.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[125px] left-1/2 w-[118%] max-w-none -translate-x-1/2 object-contain opacity-[0.22] select-none z-0"
      />

      {/* Slogan Watermark */}
      <img
        src="/DNTU_Web_Asset_Kit/watermarks/dntu-slogan-white.png"
        alt="Tri thức — Kiến tạo tương lai"
        className="pointer-events-none absolute bottom-[70px] left-1/2 w-[145px] -translate-x-1/2 object-contain opacity-80 select-none z-0"
      />

      {/* Sidebar Footer User Profile */}
      <div className="absolute inset-x-0 bottom-0 h-[72px] border-t border-white/10 bg-black/5 px-4 flex items-center justify-between shrink-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-[42px] h-[42px] rounded-full bg-white text-[#981B1E] flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            {user?.fullName
              ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              : user?.name
              ? user.name.charAt(0).toUpperCase()
              : 'AD'}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-white truncate leading-tight">
              {user?.fullName || user?.name || 'Administrator'}
            </p>
            <p className="text-[12px] text-white/70 truncate leading-tight mt-[3px]">
              {user?.email || 'admin@dntu.edu.vn'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors shrink-0 ml-auto"
        >
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Desktop sidebar state open by default
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('dntu_admin_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('dntu_admin_sidebar_open', sidebarOpen ? 'true' : 'false');
  }, [sidebarOpen]);

  useEffect(() => {
    if (user?.id) {
      notificationService.getByUser(user.id).then((data) => {
        setNotifications(data || []);
      });
    }
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setUserDropdownOpen(false);
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNotificationClick = async (notif) => {
    setNotifDropdownOpen(false);
    try {
      if (!notif.read) {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
      }
      if (notif.type?.includes('claim')) {
        navigate('/admin/claims');
      } else if (notif.type?.includes('user')) {
        navigate('/admin/users');
      } else {
        navigate('/admin/posts');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (err) {
      toast.error('Có lỗi xảy ra khi cập nhật thông báo');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8F6F3]">
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden lg:block fixed top-0 bottom-0 left-0 w-[252px] h-screen z-40 transition-transform duration-300 shadow-xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #6B1116 0%, #8C1B20 50%, #661015 100%)'
        }}
      >
        <SidebarContent user={user} handleLogout={handleLogout} />
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] w-[252px] flex flex-col transition-transform duration-300 lg:hidden shadow-2xl ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #6B1116 0%, #8C1B20 50%, #661015 100%)'
        }}
      >
        <SidebarContent
          onClose={() => setMobileDrawerOpen(false)}
          user={user}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Main Workspace Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-[252px]' : 'lg:ml-0'
        }`}
      >
        {/* Top Header Bar */}
        <header className="relative sticky top-0 z-40 h-[72px] border-b border-[#E8E2DD] bg-white/97 shadow-xs">
          {/* DNTU Campus Watermark Background Container */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <img
              src="/DNTU_Web_Asset_Kit/watermarks/dntu-campus-clean.png"
              alt=""
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 w-[600px] max-w-[65vw] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.32] select-none"
            />
          </div>

          <div className="relative z-10 flex h-full items-center justify-between px-4 sm:px-6">
            {/* Left: DNTU Logo Button Toggle & Admin Portal Breadcrumb */}
            <div className="relative z-10 flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label={sidebarOpen || mobileDrawerOpen ? "Đóng menu Admin" : "Mở menu Admin"}
                title="Đóng / Mở menu Admin"
                className="flex h-12 w-[44px] items-center justify-center rounded-[10px] bg-transparent transition-colors duration-150 hover:bg-[#F8EFED] active:bg-[#FBEDEE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#981B1E]/30"
              >
                <img
                  src="/DNTU_Web_Asset_Kit/branding/dntu-symbol-burgundy@4x.png"
                  alt="DNTU"
                  className="h-[38px] w-auto select-none object-contain"
                />
              </button>

              <div className="h-[28px] w-px bg-[#E8E2DD]" />

              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#981B1E]">
                  Admin Portal
                </span>
                <span className="hidden text-[#98A2B3] sm:inline">
                  /
                </span>
                <span className="hidden text-sm font-medium text-[#667085] sm:inline">
                  Quản trị Hệ thống DNTU UniFind
                </span>
              </div>
            </div>

            {/* Right: Bell & Profile Dropdown */}
            <div className="relative z-10 flex items-center gap-3">
              {/* Notification Popover */}
              <div ref={notifMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotifDropdownOpen((prev) => !prev)}
                  aria-label="Thông báo"
                  title="Xem thông báo"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#667085] hover:bg-[#F8F6F3] hover:text-[#981B1E] transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 flex h-2.5 w-2.5 rounded-full border-2 border-white bg-[#981B1E]" />
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-[100] w-[340px] overflow-hidden rounded-xl border border-[#E8E2DD] bg-white shadow-[0_10px_30px_rgba(40,25,20,0.16)] animate-scaleIn">
                    <div className="flex items-center justify-between border-b border-[#E8E2DD] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#18181B] text-sm">Thông báo</span>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-[#FBEDEE] px-2 py-0.5 text-[11px] font-bold text-[#981B1E]">
                            {unreadCount} mới
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-[12px] font-medium text-[#981B1E] hover:underline"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Đã đọc tất cả
                        </button>
                      )}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto divide-y divide-[#E8E2DD]/50">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 8).map((notif) => (
                          <button
                            key={notif.id}
                            type="button"
                            onClick={() => handleNotificationClick(notif)}
                            className={`flex w-full items-start gap-3 p-3.5 text-left transition-colors hover:bg-[#F8F6F3] ${
                              !notif.read ? 'bg-[#FDF9F8]' : ''
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                !notif.read
                                  ? 'bg-[#FBEDEE] text-[#981B1E]'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              <Bell className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-xs leading-tight ${
                                  !notif.read
                                    ? 'font-bold text-[#18181B]'
                                    : 'font-medium text-[#344054]'
                                }`}
                              >
                                {notif.title}
                              </p>
                              <p className="mt-1 line-clamp-2 text-[11px] text-[#667085] leading-normal">
                                {notif.message}
                              </p>
                              <p className="mt-1.5 text-[10px] text-[#98A2B3]">
                                {formatRelative(notif.createdAt)}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#981B1E]" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="py-8 text-center">
                          <Bell className="mx-auto h-7 w-7 text-[#98A2B3] opacity-30" />
                          <p className="mt-2 text-xs font-medium text-[#667085]">
                            Không có thông báo nào
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[#E8E2DD] bg-[#F8F6F3]/50 p-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setNotifDropdownOpen(false);
                          navigate('/notifications');
                        }}
                        className="text-xs font-semibold text-[#981B1E] hover:underline"
                      >
                        Xem tất cả thông báo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden h-6 w-px bg-[#E8E2DD] sm:block" />

              {/* Profile Dropdown */}
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 rounded-xl p-1.5 pr-2.5 hover:bg-[#F8F6F3] transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#981B1E]/15 bg-[#FBEDEE] text-sm font-bold text-[#981B1E] shrink-0">
                    {user?.fullName
                      ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                      : user?.name
                      ? user.name.charAt(0).toUpperCase()
                      : 'AD'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-bold leading-tight text-[#18181B]">
                      {user?.fullName || user?.name || 'Administrator'}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-tight text-[#667085]">
                      Quản trị viên
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-[#667085] transition-transform duration-200 ${
                      userDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-[100] w-[220px] overflow-hidden rounded-xl border border-[#E8E2DD] bg-white py-1 shadow-[0_10px_30px_rgba(40,25,20,0.16)] animate-scaleIn">
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate('/profile');
                      }}
                      className="flex h-11 w-full items-center gap-3 px-4 text-left text-sm text-[#344054] hover:bg-[#F8F6F3] transition-colors duration-150"
                    >
                      <UserRound className="w-[17px] h-[17px]" />
                      Hồ sơ cá nhân
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate('/');
                      }}
                      className="flex h-11 w-full items-center gap-3 px-4 text-left text-sm text-[#344054] hover:bg-[#F8F6F3] transition-colors duration-150"
                    >
                      <Home className="w-[17px] h-[17px]" />
                      Về trang User
                    </button>

                    <div className="border-t border-[#EEE8E3] my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex h-11 w-full items-center gap-3 px-4 text-left text-sm font-medium text-[#D92D20] hover:bg-[#FEF3F2] transition-colors duration-150"
                    >
                      <LogOut className="w-[17px] h-[17px]" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Workspace View Content */}
        <main className="flex-1 bg-[#F8F6F3] p-4 sm:p-6 lg:px-6 py-5 min-h-[calc(100vh-72px)] pb-[110px] max-w-[1440px] mx-auto w-full">
          <Outlet context={{ sidebarOpen }} />
        </main>
      </div>
    </div>
  );
}
