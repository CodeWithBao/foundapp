import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Menu, X, Home, Search, PlusCircle, User, Shield, HelpCircle, FileText, CheckSquare, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DNTULogo from '../common/DNTULogo';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import { ROLES } from '../../constants';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Trang chủ' },
    { to: '/search', label: 'Tìm kiếm' },
    { to: '/report-lost', label: 'Báo mất đồ' },
    { to: '/report-found', label: 'Báo nhặt được' },
    { to: '/guide', label: 'Hướng dẫn' },
  ];

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-cream-300 shadow-navbar">
      {/* Top DNTU Branding Banner */}
      <div className="bg-gradient-to-r from-burgundy-700 via-burgundy-600 to-burgundy-700 text-white py-1.5 px-4 text-xs font-medium border-b border-champagne-400/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-1 text-center md:text-left">
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <span className="bg-champagne-500 text-burgundy-800 font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider shrink-0 shadow-sm">
              DNTU Official
            </span>
            <span className="text-cream-50 truncate">
              <strong className="text-champagne-300">UNIFIND DNTU</strong> - TÌM LẠI NHỮNG ĐIỀU QUAN TRỌNG - Vì một môi trường học đường an toàn, văn minh và nhân ái
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-[11px] text-cream-100/90 shrink-0">
            <span>TRUNG THỰC • CỘNG ĐỒNG • TRÁCH NHIỆM • PHÁT TRIỂN</span>
            <span className="text-champagne-300 font-serif italic">Tri thức Kiến tạo tương lai</span>
          </div>
        </div>
      </div>

      <div className="page-container h-16 flex items-center justify-between">
        {/* LEFT: Logo */}
        <Link to="/" className="flex items-center">
          <DNTULogo size="md" />
        </Link>

        {/* CENTER: Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 ${
                  isActive
                    ? 'text-burgundy-700 border-burgundy-700'
                    : 'text-warm-gray-600 border-transparent hover:text-burgundy-600'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* RIGHT: User / Auth actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {/* Notification Bell */}
              <Link
                to="/notifications"
                className="relative p-2 text-warm-gray-500 hover:text-burgundy-700 hover:bg-cream-100 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-burgundy-600 rounded-full" />
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-cream-100 transition-colors"
                >
                  <Avatar name={user.fullName || user.name} src={user.avatar} size="sm" />
                  <span className="text-sm font-medium text-text-dark max-w-[120px] truncate">
                    {user.fullName || user.name}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-card shadow-card-hover border border-cream-300 py-1 z-50 animate-scaleIn">
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-text-dark hover:bg-cream-100"
                    >
                      <User className="w-4 h-4 text-warm-gray-400" />
                      Hồ sơ cá nhân
                    </Link>
                    <Link
                      to="/my-posts"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-text-dark hover:bg-cream-100"
                    >
                      <FileText className="w-4 h-4 text-warm-gray-400" />
                      Bài đăng của tôi
                    </Link>
                    <Link
                      to="/my-claims"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-text-dark hover:bg-cream-100"
                    >
                      <CheckSquare className="w-4 h-4 text-warm-gray-400" />
                      Yêu cầu nhận lại
                    </Link>

                    {(user.role?.toUpperCase() === ROLES.STAFF || user.role?.toUpperCase() === ROLES.ADMIN) && (
                      <Link
                        to={user.role?.toUpperCase() === ROLES.ADMIN ? '/admin' : '/staff'}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-burgundy-700 hover:bg-burgundy-50 border-t border-cream-200"
                      >
                        <Shield className="w-4 h-4 text-burgundy-700" />
                        {user.role?.toUpperCase() === ROLES.ADMIN ? 'Trang Quản trị' : 'Trang Nhân viên (Staff)'}
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-dntu-danger hover:bg-red-50 border-t border-cream-200"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login">
              <Button variant="primary" size="sm">Đăng nhập</Button>
            </Link>
          )}
        </div>

        {/* Mobile menu hamburger toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-warm-gray-500 hover:bg-cream-100"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-cream-300 px-4 pt-2 pb-4 space-y-2 animate-fadeIn">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-base font-medium ${
                  isActive ? 'bg-burgundy-50 text-burgundy-700' : 'text-warm-gray-600 hover:bg-cream-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          {user ? (
            <div className="pt-2 border-t border-cream-200 space-y-1">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-warm-gray-600 hover:bg-cream-100"
              >
                Hồ sơ
              </Link>
              <Link
                to="/my-posts"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-warm-gray-600 hover:bg-cream-100"
              >
                Bài đăng của tôi
              </Link>
              <Link
                to="/my-claims"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-warm-gray-600 hover:bg-cream-100"
              >
                Yêu cầu của tôi
              </Link>

              {(user.role?.toUpperCase() === ROLES.STAFF || user.role?.toUpperCase() === ROLES.ADMIN) && (
                <Link
                  to={user.role?.toUpperCase() === ROLES.ADMIN ? '/admin' : '/staff'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-burgundy-700 bg-burgundy-50"
                >
                  {user.role?.toUpperCase() === ROLES.ADMIN ? 'Trang Quản trị' : 'Trang Nhân viên (Staff)'}
                </Link>
              )}

              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-dntu-danger hover:bg-red-50"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-cream-200">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">Đăng nhập</Button>
              </Link>
            </div>
          )}
        </div>
      )}

    </header>
  );
}
