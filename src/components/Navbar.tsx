import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewMode } from '../types';
import { Menu, X } from 'lucide-react';
import { NavAuthButton } from './IdentityPanel';

interface NavbarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { label: string; view?: ViewMode }[] = [
    { label: 'Gallery', view: 'home' },
    { label: 'Build', view: 'generator' },
  ];

  const handleNav = (view?: ViewMode) => {
    if (view) onNavigate(view);
    setMobileOpen(false);
  };

  return (
    <header>
      <nav
        className="fixed top-0 w-full z-50 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-[0_0_20px_rgba(0,240,255,0.08)]"
        aria-label="Main navigation"
      >
        <div className="flex justify-between items-center px-6 py-4 max-w-[1280px] mx-auto">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            aria-label="FrameInGoa — go to home"
            className="font-headline-md text-3xl font-bold tracking-tighter text-[#dbfcff] cursor-pointer hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] rounded"
          >
            FrameInGoa
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex gap-2 items-center" role="list">
            {navItems.map(({ label, view }) => {
              const active =
                view === 'home'
                  ? currentView === 'home'
                  : currentView === 'generator' || currentView === 'result';
              return (
                <button
                  key={label}
                  role="listitem"
                  onClick={() => handleNav(view)}
                  aria-current={active ? 'page' : undefined}
                  className={`font-body-sm text-sm px-3 py-2 rounded-lg transition-all duration-200 ${
                    active
                      ? 'text-[#dbfcff] border-b-2 border-[#00f0ff] bg-white/10'
                      : 'text-[#b9cacb] hover:text-[#dbfcff] hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Desktop right: Auth button + CTA */}
          <div className="hidden md:flex gap-3 items-center">
            {/* X Auth button */}
            <NavAuthButton />

            <button
              onClick={() => onNavigate('generator')}
              className="glass-panel font-mono text-xs text-[#dbfcff] px-4 py-2 rounded-lg hover:bg-[#00f0ff]/20 transition-all duration-300 border border-[#00f0ff]/20 hover:scale-105 active:scale-95 bg-[#00f0ff]/10 cursor-pointer"
              aria-label="Start building your identity"
            >
              Start Building →
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-[#b9cacb] hover:text-[#dbfcff] hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              id="mobile-menu"
              role="navigation"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-white/10 bg-[#131313]/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-6 py-4 flex flex-col gap-2">
                {navItems.map(({ label, view }) => {
                  const active =
                    view === 'home'
                      ? currentView === 'home'
                      : currentView === 'generator' || currentView === 'result';
                  return (
                    <button
                      key={label}
                      onClick={() => handleNav(view)}
                      aria-current={active ? 'page' : undefined}
                      className={`text-left px-4 py-3 rounded-lg font-body-sm text-sm transition-all ${
                        active
                          ? 'bg-white/10 text-[#dbfcff]'
                          : 'text-[#b9cacb] hover:bg-white/5 hover:text-[#dbfcff]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}

                {/* Mobile: auth button */}
                <div className="pt-1 border-t border-white/10">
                  <NavAuthButton />
                </div>

                <button
                  onClick={() => handleNav('generator')}
                  className="mt-2 btn-primary-gradient text-black font-bold text-sm py-3 rounded-lg font-headline-md cursor-pointer"
                >
                  Start Building →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};
