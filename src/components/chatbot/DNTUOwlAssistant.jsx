import { useCallback, useEffect, useRef, useState } from 'react';
import { BellRing, ChevronRight, LogIn, SearchCheck, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';

const POLL_INTERVAL = 30000;
const SLEEP_AFTER = 45000;

export default function DNTUOwlAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [sleeping, setSleeping] = useState(false);
  const [matches, setMatches] = useState([]);
  const [position, setPosition] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dntu_owl_position')) || null; } catch { return null; }
  });
  const drag = useRef(null);
  const inactivityTimer = useRef(null);

  const resetSleepTimer = useCallback(() => {
    setSleeping(false);
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => setSleeping(true), SLEEP_AFTER);
  }, []);

  const loadMatches = useCallback(async () => {
    if (!user?.id) return setMatches([]);
    try {
      const notifications = await notificationService.getByUser(user.id);
      const incoming = notifications.filter(item => item.type === 'ITEM_MATCHED' && !item.read);
      setMatches(incoming);
      if (incoming.length) {
        setSleeping(false);
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

  const onPointerDown = event => {
    const box = event.currentTarget.parentElement.getBoundingClientRect();
    drag.current = { pointerId: event.pointerId, offsetX: event.clientX - box.left, offsetY: event.clientY - box.top, startX: event.clientX, startY: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = event => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const next = {
      left: Math.max(8, Math.min(window.innerWidth - 92, event.clientX - drag.current.offsetX)),
      top: Math.max(72, Math.min(window.innerHeight - 100, event.clientY - drag.current.offsetY)),
    };
    if (Math.abs(event.clientX - drag.current.startX) + Math.abs(event.clientY - drag.current.startY) > 5) drag.current.moved = true;
    setPosition(next);
  };

  const onPointerUp = event => {
    if (!drag.current) return;
    const wasMoved = drag.current.moved;
    drag.current = null;
    if (!wasMoved) setOpen(value => !value);
    resetSleepTimer();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const showMatches = async () => {
    if (matches[0]) await notificationService.markAsRead(matches[0].id).catch(() => {});
    setOpen(false);
    navigate('/matches');
  };

  const isSearching = ['/report-lost', '/report-found', '/search'].includes(location.pathname);
  const state = matches.length ? 'found' : sleeping ? 'sleeping' : isSearching ? 'searching' : 'idle';
  const style = position ? { left: position.left, top: position.top, right: 'auto', bottom: 'auto' } : undefined;
  const panelStyle = position && position.left < 360 ? { left: 0, right: 'auto' } : undefined;

  return (
    <aside className={`dntu-owl-widget dntu-owl-${state}`} style={style} aria-live="polite">
      {open && (
        <section className="dntu-owl-panel animate-scaleIn" style={panelStyle}>
          <button className="dntu-owl-close" onClick={() => setOpen(false)} aria-label="Thu nhỏ trợ lý"><X size={16} /></button>
          <div className="flex items-center gap-2 pr-7">
            <span className="dntu-owl-status-dot" />
            <p className="text-xs font-bold uppercase tracking-wider text-burgundy-700">Trợ lý Cú DNTU</p>
          </div>
          {!user ? (
            <>
              <h3 className="mt-2 font-bold text-text-dark">Chào bạn, cần tìm đồ à?</h3>
              <p className="mt-1 text-sm text-warm-gray-500">Đăng nhập để Cú theo dõi bài báo mất và báo ngay khi có món tương tự.</p>
              <button className="dntu-owl-action" onClick={() => navigate('/login')}><LogIn size={16} /> Đăng nhập</button>
            </>
          ) : matches.length ? (
            <>
              <div className="mt-3 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <BellRing className="mt-0.5 shrink-0 text-emerald-700" size={20} />
                <div>
                  <h3 className="font-bold text-emerald-950">Có {matches.length} kết quả nghi vấn!</h3>
                  <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-emerald-800">{matches[0].message}</p>
                </div>
              </div>
              <button className="dntu-owl-action" onClick={showMatches}><SearchCheck size={16} /> Kiểm tra danh sách <ChevronRight size={16} /></button>
            </>
          ) : (
            <>
              <h3 className="mt-2 font-bold text-text-dark">Cú đang theo dõi giúp bạn</h3>
              <p className="mt-1 text-sm text-warm-gray-500">Khi có bài nhặt được giống đồ bạn báo mất, Cú sẽ bật dậy báo ngay.</p>
              <button className="dntu-owl-action" onClick={() => navigate('/matches')}><SearchCheck size={16} /> Xem đối chiếu</button>
            </>
          )}
        </section>
      )}
      {matches.length > 0 && <span className="dntu-owl-unread">{Math.min(matches.length, 9)}</span>}
      <button
        className="dntu-owl-mascot"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        aria-label={open ? 'Thu nhỏ Trợ lý Cú DNTU' : 'Mở Trợ lý Cú DNTU'}
      >
        <img src={`/mascot/${state}.png`} alt={`Cú DNTU ${state}`} draggable="false" />
      </button>
    </aside>
  );
}
