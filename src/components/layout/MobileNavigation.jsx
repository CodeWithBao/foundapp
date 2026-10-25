import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Plus, Bell, User, AlertCircle, Package, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';

export default function MobileNavigation() {
  const { user } = useAuth();
  const { unreadNotifications, unreadNotificationsLabel } = useRealtime();
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
            className="relative z-10 max-h-[calc(100dvh-4.25rem-env(safe-area-inset-bottom))] w-full overflow-y-auto overscroll-contain rounded-t-2xl border-x border-t border-hairline bg-white p-4 shadow-landing-lg space-y-4 animate-slideUp sm:p-5"
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
        className="fixed inset-x-0 bottom-0 z-50 flex w-full max-w-full items-center border-t border-hairline bg-white/95 px-1 shadow-lg backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingTop: '0.375rem', minHeight: 'calc(3.75rem + env(safe-area-inset-bottom))' }}
      >
        {/* Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `min-h-11 min-w-0 flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-[10px] min-[390px]:text-xs font-semibold transition-all ${
              isActive ? 'text-accent font-bold' : 'text-ink-muted hover:text-ink'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="max-w-full truncate">Trang chủ</span>
        </NavLink>

        {/* Search */}
        <NavLink
          to="/search"
          className={({ isActive }) =>
            `min-h-11 min-w-0 flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-[10px] min-[390px]:text-xs font-semibold transition-all ${
              isActive ? 'text-accent font-bold' : 'text-ink-muted hover:text-ink'
            }`
          }
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span className="max-w-full truncate">Tìm kiếm</span>
        </NavLink>

        {/* Plus / Đăng bài center button */}
        <button
          onClick={() => setShowPostMenu((prev) => !prev)}
          className="min-h-11 min-w-0 flex-1 flex flex-col items-center justify-center -mt-6"
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
            `relative min-h-11 min-w-0 flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-[10px] min-[390px]:text-xs font-semibold transition-all ${
              isActive ? 'text-accent font-bold' : 'text-ink-muted hover:text-ink'
            }`
          }
        >
          <div className="relative">
            <Bell className="w-5 h-5 mb-0.5" />
            {unreadNotifications > 0 && (
              <span className="unifind-count-badge unifind-count-badge--mobile" aria-hidden="true">{unreadNotificationsLabel}</span>
            )}
          </div>
          <span className="max-w-full truncate">Thông báo</span>
        </NavLink>

        {/* Profile */}
        <NavLink
          to={user ? '/profile' : '/login'}
          className={({ isActive }) =>
            `min-h-11 min-w-0 flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-[10px] min-[390px]:text-xs font-semibold transition-all ${
              isActive ? 'text-accent font-bold' : 'text-ink-muted hover:text-ink'
            }`
          }
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="max-w-full truncate">{user ? 'Cá nhân' : 'Đăng nhập'}</span>
        </NavLink>
      </nav>
    </>
  );
}
