import { useState, useCallback } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';

// Shared authenticated-app shell: sidebar + topbar + content well. Every
// protected page renders through this instead of hand-rolling its own Navbar,
// so nav/layout changes happen in one place and stay visually consistent.
const AppShell = ({ children, wide = false }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={mobileOpen} onClose={closeMobile} />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Topbar onMenuClick={openMobile} />
        <main className="flex-1 w-full">
          <div className={`${wide ? 'max-w-7xl' : 'max-w-6xl'} mx-auto px-4 sm:px-6 py-6 sm:py-8`}>
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AppShell;
