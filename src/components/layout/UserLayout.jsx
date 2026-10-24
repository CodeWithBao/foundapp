import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileNavigation from './MobileNavigation';
import DNTUOwlAssistant from '../chatbot/DNTUOwlAssistant';
import useVisualViewport from '../../hooks/useVisualViewport';

export default function UserLayout() {
  const location = useLocation();
  const isMessagesPage = location.pathname === '/messages';
  const viewport = useVisualViewport();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const mobileAssistantOpen = viewport.isMobile && assistantOpen;
  const hideMobileNavigation = mobileAssistantOpen
    || (viewport.isMobile && viewport.keyboardOpen && viewport.editableFocused);

  return (
    <div
      className={`dntu-app-shell ${isMessagesPage ? 'dntu-app-shell--messages' : ''} min-w-0 max-w-full flex flex-col bg-cream-100 pb-[var(--mobile-nav-space)] md:pb-0 ${
        isMessagesPage ? 'min-h-0 overflow-hidden' : 'min-h-screen'
      }`}
      style={{
        '--mobile-nav-space': hideMobileNavigation
          ? '0px'
          : 'calc(var(--mobile-nav-height) + env(safe-area-inset-bottom))',
        ...(isMessagesPage ? { height: 'var(--visual-viewport-height, 100dvh)' } : {}),
      }}
    >
      <div className="contents" inert={mobileAssistantOpen ? true : undefined} aria-hidden={mobileAssistantOpen || undefined}>
        <div className="dntu-campus-backdrop" aria-hidden="true" />
        <Navbar compactMobile={isMessagesPage} />
        <main className={`relative flex-1 min-w-0 max-w-full ${isMessagesPage ? 'min-h-0 overflow-hidden' : ''}`}>
          <Outlet context={{ assistantOpen, isMobile: viewport.isMobile }} />
        </main>
        {!isMessagesPage && <Footer />}
        {!hideMobileNavigation && <MobileNavigation />}
      </div>
      <DNTUOwlAssistant
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
        isMobile={viewport.isMobile}
      />
    </div>
  );
}
