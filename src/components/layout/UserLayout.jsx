import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileNavigation from './MobileNavigation';
import DNTUOwlAssistant from '../chatbot/DNTUOwlAssistant';

export default function UserLayout() {
  return (
    <div className="dntu-app-shell min-h-screen flex flex-col bg-cream-100">
      <div className="dntu-campus-backdrop" aria-hidden="true" />
      <Navbar />
      <main className="relative z-[1] flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileNavigation />
      <DNTUOwlAssistant />
    </div>
  );
}
