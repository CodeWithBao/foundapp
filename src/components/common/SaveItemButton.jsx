import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bookmark, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useSavedItems } from '../../context/SavedItemsContext';

export default function SaveItemButton({ itemId, variant = 'cover', unavailable = false }) {
  const { user, loading } = useAuth();
  const { entries, ensure, toggle, setSaved, revision, identity, valid } = useSavedItems();
  const location = useLocation();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const state = entries[itemId];
  const saved = unavailable ? true : state?.saved === true;
  useEffect(() => { if (!unavailable) ensure(itemId); }, [itemId, ensure, unavailable, revision, state]);
  const Icon = variant === 'cover' ? Heart : Bookmark;
  const label = unavailable ? 'Bỏ lưu tin không còn khả dụng' : saved ? 'Bỏ lưu bài đăng' : 'Lưu bài đăng';
  const handleClick = async event => {
    event.stopPropagation();
    if (loading || lock.current || state?.pending) return;
    if (!user) {
      navigate('/login', { state: { from: { pathname: location.pathname, search: location.search, hash: location.hash } } });
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      await (unavailable ? setSaved(itemId, false) : toggle(itemId));
    } catch (error) {
      if (valid()) toast.error(error.message || 'Không thể cập nhật tin đã lưu. Vui lòng thử lại.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const disabled = loading || busy || state?.pending || state?.loading;
  return (
    <button
      key={identity}
      type="button"
      onClick={handleClick}
      onKeyDown={event => event.stopPropagation()}
      disabled={disabled}
      aria-label={label}
      aria-pressed={saved}
      aria-busy={busy || state?.pending || state?.loading || undefined}
      title={state?.error ? `${state.error} — Nhấn để thử lại` : label}
      className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-wait motion-reduce:transition-none transition-colors duration-150 ${variant === 'cover'
        ? `absolute top-2.5 right-2.5 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/75 flex items-center justify-center shadow-sm ${saved ? 'text-rose-400' : 'text-white'}`
        : `w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border ${saved ? 'bg-red-50 border-red-200 text-[#741216]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}`}
    >
      <Icon aria-hidden="true" className={`${variant === 'cover' ? 'w-5 h-5' : 'w-3.5 h-3.5'} ${saved ? 'fill-current' : ''} motion-safe:transition-colors motion-safe:duration-150`} />
      {variant !== 'cover' && <span>{unavailable ? 'Bỏ lưu' : saved ? 'Đã lưu bài đăng' : 'Lưu bài đăng'}</span>}
      {state?.error && <span className="sr-only">Không thể xác minh tin đã lưu: {state.error}. Nhấn để thử lại.</span>}
    </button>
  );
}
