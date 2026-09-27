import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Plus, Bell, User, AlertCircle, Package, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MobileNavigation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPostMenu, setShowPostMenu] = useState(false);

  useEffect(() => {
    if (!showPostMenu) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowPostMenu(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPostMenu]);

  const handlePostClick = (path) => {
    setShowPostMenu(false);
    navigate(path);
  };

  return (
    <>
      {/* Modal / Action sheet choosing post type - Matching Mockup Screen 3 */}
      {showPostMenu && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowPostMenu(false)}
          />

          {/* Bottom Sheet Card placed precisely above bottom bar */}
          <div
            className="relative w-full bg-white rounded-t-2xl p-5 shadow-landing-lg border-t border-x border-hairline space-y-4 animate-slideUp z-10"
            style={{ marginBottom: 'calc(3.75rem + env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-start justify-between border-b pb-3 border-hairline/80">
              <div>
                <h3 className="font-serif font-bold text-ink text-base">Đăng bài mới</h3>
                <p className="text-xs text-ink-muted mt-0.5">Bạn muốn đăng loại bài nào?</p>
              </div>
              <button
                onClick={() => setShowPostMenu(false)}
                className="p-1.5 rounded-full hover:bg-paper-panel text-ink-muted transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 pb-1">
              <button
                onClick={() => handlePostClick('/report-lost')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-50 text-accent transition-all group active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                  <AlertCircle className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="font-bold text-sm text-accent">Báo mất đồ</span>
                <span className="text-[11px] text-ink-muted text-center mt-1">Tạo bài đăng về vật phẩm bị mất</span>
              </button>
              <button
                onClick={() => handlePostClick('/report-found')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-50 text-amber-900 transition-all group active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                  <Package className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="font-bold text-sm text-amber-900">Báo nhặt được</span>
                <span className="text-[11px] text-ink-muted text-center mt-1">Thông báo vật phẩm bạn nhặt được</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-hairline shadow-lg px-2 flex items-center justify-around"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingTop: '0.375rem', height: 'calc(3.75rem + env(safe-area-inset-bottom))' }}
      >
        {/* Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-semibold transition-all ${
              isActive ? 'text-accent font-bold' : 'text-ink-muted hover:text-ink'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Trang chủ</span>
        </NavLink>

        {/* Search */}
        <NavLink
          to="/search"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-semibold transition-all ${
              isActive ? 'text-accent font-bold' : 'text-ink-muted hover:text-ink'
            }`
          }
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span>Tìm kiếm</span>
        </NavLink>

        {/* Plus / Đăng bài center button */}
        <button
          onClick={() => setShowPostMenu((prev) => !prev)}
          className="flex flex-col items-center justify-center -mt-6"
          aria-label="Đăng tin"
        >
          <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-md ring-4 ring-[#FAF8F2] hover:bg-burgundy-700 transition-transform active:scale-95">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-bold text-ink mt-0.5">Đăng tin</span>
        </button>

        {/* Notifications */}
        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-semibold transition-all ${
              isActive ? 'text-accent font-bold' : 'text-ink-muted hover:text-ink'
            }`
          }
        >
          <div className="relative">
            <Bell className="w-5 h-5 mb-0.5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full ring-2 ring-white" />
          </div>
          <span>Thông báo</span>
        </NavLink>

        {/* Profile */}
        <NavLink
          to={user ? '/profile' : '/login'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-semibold transition-all ${
              isActive ? 'text-accent font-bold' : 'text-ink-muted hover:text-ink'
            }`
          }
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>{user ? 'Cá nhân' : 'Đăng nhập'}</span>
        </NavLink>
      </nav>
    </>
  );
}
