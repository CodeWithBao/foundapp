import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Home, Search, Plus, Bell, User, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MobileNavigation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPostMenu, setShowPostMenu] = useState(false);

  const handlePostClick = (path) => {
    setShowPostMenu(false);
    navigate(path);
  };

  return (
    <>
      {/* Modal / Action sheet choosing post type */}
      {showPostMenu && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 md:hidden">
          <div
            className="fixed inset-0"
            onClick={() => setShowPostMenu(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-200 z-10">
            <div className="flex items-center justify-between border-b pb-3 border-cream-200">
              <h3 className="font-semibold text-text-dark text-base">Đăng bài mới</h3>
              <button
                onClick={() => setShowPostMenu(false)}
                className="p-1 rounded-full hover:bg-cream-100 text-warm-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handlePostClick('/report-lost')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-burgundy-200 bg-burgundy-50/50 hover:bg-burgundy-100/50 text-burgundy-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-burgundy-600 text-white flex items-center justify-center mb-2">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Báo mất đồ</span>
                <span className="text-[11px] text-warm-gray-500 text-center mt-1">Tôi đã làm mất đồ</span>
              </button>
              <button
                onClick={() => handlePostClick('/report-found')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 text-emerald-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Báo nhặt được</span>
                <span className="text-[11px] text-warm-gray-500 text-center mt-1">Tôi nhặt được đồ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-cream-300 shadow-lg px-2 py-1.5 flex items-center justify-around">
        {/* Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
              isActive ? 'text-burgundy-700' : 'text-warm-gray-500 hover:text-warm-gray-700'
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
            `flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
              isActive ? 'text-burgundy-700' : 'text-warm-gray-500 hover:text-warm-gray-700'
            }`
          }
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span>Tìm kiếm</span>
        </NavLink>

        {/* Plus / Đăng bài center button */}
        <button
          onClick={() => setShowPostMenu(true)}
          className="flex flex-col items-center justify-center -mt-5"
        >
          <div className="w-12 h-12 rounded-full bg-burgundy-600 text-white flex items-center justify-center shadow-md hover:bg-burgundy-700 transition-transform active:scale-95">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-medium text-warm-gray-700 mt-0.5">Đăng bài</span>
        </button>

        {/* Notifications */}
        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
              isActive ? 'text-[#A71927]' : 'text-warm-gray-500 hover:text-warm-gray-700'
            }`
          }
        >
          <div className="relative">
            <Bell className="w-5 h-5 mb-0.5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#A71927] rounded-full ring-2 ring-white" />
          </div>
          <span>Thông báo</span>
        </NavLink>

        {/* Profile */}
        <NavLink
          to={user ? '/profile' : '/login'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
              isActive ? 'text-[#A71927]' : 'text-warm-gray-500 hover:text-warm-gray-700'
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
