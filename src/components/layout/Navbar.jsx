import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Menu, X, Search, User, Shield, FileText, CheckSquare, LogOut, CreditCard, Phone, Mail, Building2, ChevronDown } from 'lucide-react';
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
  const [navSearch, setNavSearch] = useState('');
  const [navCategory, setNavCategory] = useState('all');
  const dropdownRef = useRef(null);

  const handleNavSearch = (e) => {
    e.preventDefault();
    if (!navSearch.trim() && navCategory === 'all') return;
    const params = new URLSearchParams();
    if (navSearch.trim()) params.append('q', navSearch.trim());
    if (navCategory !== 'all') {
      if (navCategory === 'lost' || navCategory === 'found') {
        params.append('status', navCategory.toUpperCase());
      } else {
        params.append('category', navCategory);
      }
    }
    navigate(`/search?${params.toString()}`);
  };

  useEffect(() => {
    if (!userDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [userDropdownOpen]);

  const navLinks = [
    { to: '/', label: 'Trang chủ' },
    { to: '/search', label: 'Tìm kiếm vật phẩm' },
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-hairline shadow-navbar">
      {/* Top DNTU Branding Announcement Banner */}
      <div className="bg-[#8F1822] text-white py-1.5 px-4 text-[11px] font-medium border-b border-white/10">
        <div className="page-container flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-white/95 font-semibold">
              <Building2 className="h-3.5 w-3.5 text-champagne-300" /> Đại học Công nghệ Đồng Nai (DNTU)
            </span>
            <span className="hidden sm:inline text-white/40">|</span>
            <span className="hidden sm:inline text-white/80">Cổng tiếp nhận & hỗ trợ tìm kiếm đồ thất lạc</span>
          </div>
          <div className="ml-auto flex items-center gap-4 text-white/85">
            <span className="hidden md:inline-flex items-center gap-1"><Phone className="h-3 w-3 text-champagne-300" /> Hotline: 0251 3 999 888</span>
            <span className="hidden lg:inline-flex items-center gap-1"><Mail className="h-3 w-3 text-champagne-300" /> unifind@dntu.edu.vn</span>
            <span className="text-champagne-300 font-serif italic hidden sm:inline">Tri thức - Kiến tạo tương lai</span>
          </div>
        </div>
      </div>

      <div className="page-container h-[4.5rem] flex items-center justify-between gap-2 lg:gap-4">
        {/* LEFT: Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <DNTULogo size="md" />
        </Link>

        {/* CENTER: Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-2.5 xl:px-3.5 py-2 text-[13px] xl:text-[13.5px] font-semibold whitespace-nowrap transition-all duration-200 rounded-lg ${
                  isActive
                    ? 'text-accent bg-accent-tint ring-1 ring-accent-border/80 font-bold'
                    : 'text-ink-slate hover:text-accent hover:bg-paper-panel'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* RIGHT: Search + User / Auth actions */}
        <div className="hidden lg:flex items-center gap-2.5 xl:gap-3 shrink-0">
          {/* Interactive Search Input with Filter Dropdown */}
          <form
            onSubmit={handleNavSearch}
            className="hidden xl:flex items-center bg-[#F5F2EB] hover:bg-white focus-within:bg-white border border-[#E4DDD5] focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 rounded-full pl-3 pr-1 py-1 transition-all duration-200 shadow-2xs group"
          >
            <div className="relative flex items-center shrink-0">
              <select
                value={navCategory}
                onChange={(e) => setNavCategory(e.target.value)}
                className="appearance-none bg-transparent text-[11.5px] font-semibold text-ink-slate hover:text-ink focus:outline-none pl-1 pr-4.5 py-0.5 cursor-pointer"
                aria-label="Lọc danh mục"
              >
                <option value="all">Tất cả</option>
                <option value="lost">Đồ mất</option>
                <option value="found">Nhặt được</option>
                <option value="Thẻ sinh viên">Thẻ SV</option>
                <option value="Thiết bị điện tử">Điện tử</option>
                <option value="Chìa khóa">Chìa khóa</option>
                <option value="Ví / Bóp">Ví tiền</option>
              </select>
              <ChevronDown className="w-3 h-3 text-ink-muted pointer-events-none absolute right-0.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="h-3.5 w-px bg-[#E4DDD5] mx-1.5 shrink-0" />

            <div className="relative flex items-center">
              <input
                type="text"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Tìm đồ thất lạc..."
                className="bg-transparent text-xs text-ink placeholder:text-ink-muted/80 focus:outline-none w-28 xl:w-44 focus:w-36 xl:focus:w-56 transition-all duration-200 px-1"
              />
              {navSearch && (
                <button
                  type="button"
                  onClick={() => setNavSearch('')}
                  className="p-0.5 text-ink-muted hover:text-ink transition-colors mr-1"
                  aria-label="Xóa từ khóa"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="w-7 h-7 rounded-full bg-accent text-white hover:bg-burgundy-700 flex items-center justify-center transition-colors shrink-0 shadow-xs active:scale-95"
              aria-label="Tìm kiếm"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          {user ? (
            <>
              {/* Notification Bell */}
              <Link
                to="/notifications"
                className="relative p-2.5 text-ink-slate hover:text-accent hover:bg-paper-panel rounded-full transition-all"
                aria-label="Thông báo"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full ring-2 ring-white" />
              </Link>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-hairline bg-white hover:bg-paper-panel transition-all shadow-sm"
                >
                  <Avatar name={user.fullName || user.name} src={user.avatar} size="sm" />
                  <span className="text-[13.5px] font-semibold text-ink max-w-[120px] truncate">
                    {user.fullName || user.name}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-card shadow-landing-lg border border-hairline py-1.5 z-50 animate-scaleIn">
                    <div className="px-4 py-2 border-b border-hairline/60 bg-paper-soft">
                      <p className="text-[11px] font-semibold uppercase text-ink-muted tracking-wider">Tài khoản</p>
                      <p className="text-sm font-bold text-ink truncate">{user.fullName || user.name}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-slate hover:text-accent hover:bg-paper-panel transition-colors"
                    >
                      <User className="w-4 h-4 text-ink-muted" />
                      Hồ sơ cá nhân
                    </Link>
                    <Link
                      to="/student-card"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-slate hover:text-accent hover:bg-paper-panel transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-ink-muted" />
                      Thẻ sinh viên
                    </Link>
                    <Link
                      to="/my-posts"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-slate hover:text-accent hover:bg-paper-panel transition-colors"
                    >
                      <FileText className="w-4 h-4 text-ink-muted" />
                      Bài đăng của tôi
                    </Link>
                    <Link
                      to="/my-claims"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-slate hover:text-accent hover:bg-paper-panel transition-colors"
                    >
                      <CheckSquare className="w-4 h-4 text-ink-muted" />
                      Yêu cầu nhận lại
                    </Link>

                    {(user.role?.toUpperCase() === ROLES.STAFF || user.role?.toUpperCase() === ROLES.ADMIN) && (
                      <Link
                        to={user.role?.toUpperCase() === ROLES.ADMIN ? '/admin' : '/staff'}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-accent hover:bg-accent-tint border-t border-hairline/60 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-accent" />
                        {user.role?.toUpperCase() === ROLES.ADMIN ? 'Trang Quản trị' : 'Trang Quản lý Staff'}
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-accent hover:bg-red-50 border-t border-hairline/60 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full border border-hairline hover:border-accent hover:bg-accent-tint text-ink hover:text-accent transition-all duration-200 shadow-2xs bg-white group"
              >
                <div className="w-7 h-7 rounded-full bg-paper-soft border border-hairline flex items-center justify-center text-ink-muted group-hover:text-accent group-hover:bg-white transition-colors">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-[13px] font-semibold">Đăng nhập</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu hamburger toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-ink-slate hover:bg-paper-panel transition-colors"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-hairline px-4 pt-3 pb-5 space-y-2 animate-fadeIn shadow-lg">
          {/* Mobile Search Bar */}
          <form
            onSubmit={(e) => {
              handleNavSearch(e);
              setMobileMenuOpen(false);
            }}
            className="flex items-center bg-[#F5F2EB] rounded-xl px-3 py-2 border border-[#E4DDD5] focus-within:border-accent focus-within:bg-white transition-all shadow-2xs mb-2"
          >
            <Search className="w-4 h-4 text-ink-muted mr-2 shrink-0" />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Tìm kiếm đồ thất lạc..."
              className="bg-transparent text-sm text-ink placeholder:text-ink-muted/80 focus:outline-none flex-1"
            />
            {navSearch && (
              <button
                type="button"
                onClick={() => setNavSearch('')}
                className="p-1 text-ink-muted hover:text-ink mr-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center shrink-0 shadow-2xs active:scale-95"
              aria-label="Tìm kiếm"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive ? 'bg-accent-tint text-accent ring-1 ring-accent-border/80' : 'text-ink-slate hover:bg-paper-panel'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          {user ? (
            <div className="pt-3 border-t border-hairline space-y-1">
              <Link
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2 rounded-lg text-sm font-medium text-ink-slate hover:bg-paper-panel"
              >
                <span>Thông báo hệ thống</span>
                <span className="w-2 h-2 rounded-full bg-accent" />
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-lg text-sm font-medium text-ink-slate hover:bg-paper-panel"
              >
                Hồ sơ cá nhân
              </Link>
              <Link
                to="/student-card"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-lg text-sm font-medium text-ink-slate hover:bg-paper-panel"
              >
                Thẻ sinh viên
              </Link>
              <Link
                to="/my-posts"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-lg text-sm font-medium text-ink-slate hover:bg-paper-panel"
              >
                Bài đăng của tôi
              </Link>
              <Link
                to="/my-claims"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-lg text-sm font-medium text-ink-slate hover:bg-paper-panel"
              >
                Yêu cầu nhận lại
              </Link>

              {(user.role?.toUpperCase() === ROLES.STAFF || user.role?.toUpperCase() === ROLES.ADMIN) && (
                <Link
                  to={user.role?.toUpperCase() === ROLES.ADMIN ? '/admin' : '/staff'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3.5 py-2 rounded-lg text-sm font-semibold text-accent bg-accent-tint"
                >
                  {user.role?.toUpperCase() === ROLES.ADMIN ? 'Trang Quản trị' : 'Trang Quản lý Staff'}
                </Link>
              )}

              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="w-full text-left px-3.5 py-2 rounded-lg text-sm font-semibold text-accent hover:bg-red-50"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-hairline">
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
