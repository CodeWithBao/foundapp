import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, ShieldCheck, FolderTree, MapPin, BarChart2, ScrollText, Settings, Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DNTULogo from '../common/DNTULogo';
import Avatar from '../common/Avatar';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-cream-100">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-burgundy-950 text-white shrink-0 sticky top-0 h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-burgundy-900 flex items-center gap-2">
          <div className="bg-white/10 p-1.5 rounded-lg">
            <DNTULogo size="sm" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-champagne-400 bg-burgundy-900 px-2 py-0.5 rounded">
            Admin
          </span>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
                }
              >
                <Icon className="w-5 h-5 shrink-0 text-champagne-400" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-burgundy-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={user?.fullName || user?.name} src={user?.avatar} size="sm" />
            <div className="truncate">
              <p className="text-sm font-medium text-white truncate">{user?.fullName || user?.name}</p>
              <p className="text-xs text-champagne-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-cream-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-burgundy-950 text-white flex flex-col transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-burgundy-900 flex items-center justify-between">
          <DNTULogo size="sm" />
          <button onClick={() => setSidebarOpen(false)} className="p-1 text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
                }
              >
                <Icon className="w-5 h-5 shrink-0 text-champagne-400" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-cream-300 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-navbar">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-warm-gray-500 hover:bg-cream-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-sm font-semibold text-burgundy-800">
              Hệ Thống Quản Trị DNTU UniFind (Admin Portal)
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-cream-100 transition-colors"
            >
              <Avatar name={user?.fullName || user?.name} src={user?.avatar} size="sm" />
              <span className="text-sm font-medium text-text-dark hidden sm:inline">
                {user?.fullName || user?.name}
              </span>
              <ChevronDown className="w-4 h-4 text-warm-gray-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-card shadow-card-hover border border-cream-300 py-1 z-50">
                <button
                  onClick={() => { setUserDropdownOpen(false); navigate('/'); }}
                  className="w-full text-left px-4 py-2 text-sm text-text-dark hover:bg-cream-100"
                >
                  Về trang User
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-dntu-danger hover:bg-red-50 border-t border-cream-200"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
