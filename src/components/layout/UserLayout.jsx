import { useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileNavigation from './MobileNavigation';
import DNTUOwlAssistant from '../chatbot/DNTUOwlAssistant';

export default function UserLayout() {
  const location = useLocation();
  const isMessagesPage = location.pathname === '/messages';
  const shellRef = useRef(null);

  useLayoutEffect(() => {
    if (!isMessagesPage || !shellRef.current) return undefined;
    const shell = shellRef.current;
    const syncViewportHeight = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      shell.style.setProperty('--messages-viewport-height', `${Math.round(viewportHeight)}px`);
    };

    syncViewportHeight();
    window.addEventListener('resize', syncViewportHeight);
    window.visualViewport?.addEventListener('resize', syncViewportHeight);
    return () => {
      window.removeEventListener('resize', syncViewportHeight);
      window.visualViewport?.removeEventListener('resize', syncViewportHeight);
      shell.style.removeProperty('--messages-viewport-height');
    };
  }, [isMessagesPage]);

  return (
    <div
      ref={shellRef}
      className={`dntu-app-shell min-w-0 max-w-full flex flex-col bg-cream-100 pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0 ${
        isMessagesPage ? 'min-h-0 overflow-hidden' : 'min-h-screen'
      }`}
      style={isMessagesPage ? { height: 'var(--messages-viewport-height, 100vh)' } : undefined}
    >
      <div className="dntu-campus-backdrop" aria-hidden="true" />
      <Navbar />
      <main className={`relative flex-1 min-w-0 max-w-full ${isMessagesPage ? 'min-h-0 overflow-hidden' : ''}`}>
        <Outlet />
      </main>
      {!isMessagesPage && <Footer />}
      <MobileNavigation />
      <DNTUOwlAssistant />
    </div>
  );
}
