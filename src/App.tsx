import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Easing } from 'motion';
import { ViewMode, BuilderData } from './types';
import { BUILDER_TITLES } from './constants';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { GeneratorView } from './components/GeneratorView';
import { ResultView } from './components/ResultView';
import { ProfileView } from './components/ProfileView';
import { ShaderBackground } from './components/ThreeBackground';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// ─── Initial state ────────────────────────────────────────────
function generateBadgeNumber(): string {
  return `BLD-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

function pickRandomTitle(): string {
  return BUILDER_TITLES[Math.floor(Math.random() * BUILDER_TITLES.length)];
}

const INITIAL_BUILDER_DATA: BuilderData = {
  name: '',
  role: '',
  stack: [],
  github: '',
  title: pickRandomTitle(),
  badgeNumber: generateBadgeNumber(),
  photoUrl: null,
  crop: { x: 0, y: 0 },
  zoom: 1,
  rotation: 0,
  croppedAreaPixels: null,
  themeId: 'cyber',
};

const STORAGE_KEY = 'frame_in_goa_builder_state_v3';
const MAX_HISTORY = 50;

function loadState(): BuilderData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BuilderData;
      if (!parsed.badgeNumber) parsed.badgeNumber = generateBadgeNumber();
      return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return INITIAL_BUILDER_DATA;
}

// ─── Page transition variants ──────────────────────────────────
const _ease: Easing = 'easeOut';
const _easeIn: Easing = 'easeIn';
const pageVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0, transition: { duration: 0.3, ease: _ease } },
  exit:  { opacity: 0, y: -8, transition: { duration: 0.18, ease: _easeIn } },
};

function MainAppContent() {
  const [view, setView] = useState<ViewMode>('home');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [builderData, setBuilderData] = useState<BuilderData>(loadState);

  // Auth Context hooks
  const { user, profile: authProfile } = useAuth();

  // Undo / Redo
  const [history, setHistory]     = useState<BuilderData[]>([]);
  const [redoStack, setRedoStack] = useState<BuilderData[]>([]);

  // Debounce timer for history pushes
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPrevRef     = useRef<BuilderData | null>(null);

  // Track whether the initial auth → builderData sync has run.
  // This prevents subsequent profile saves from overwriting user edits
  // (e.g. a freshly uploaded photo getting reverted to the X avatar).
  const initialSyncDone = useRef(false);

  // Sync builderData with authenticated profile — ONCE on initial session load only
  useEffect(() => {
    if (initialSyncDone.current) return;

    if (authProfile) {
      initialSyncDone.current = true;
      setBuilderData((prev) => ({
        ...prev,
        name: authProfile.name || prev.name || '',
        role: authProfile.role || prev.role || '',
        title: authProfile.title || prev.title || pickRandomTitle(),
        stack: authProfile.stack || prev.stack || [],
        github: authProfile.github || prev.github || '',
        themeId: authProfile.theme_id || prev.themeId || 'cyber',
        badgeNumber: authProfile.badge_number || prev.badgeNumber || generateBadgeNumber(),
        photoUrl: authProfile.photo_url || prev.photoUrl || null,
        crop: authProfile.crop || prev.crop || { x: 0, y: 0 },
        zoom: authProfile.zoom || prev.zoom || 1.0,
        rotation: authProfile.rotation || prev.rotation || 0,
        croppedAreaPixels: authProfile.cropped_area_pixels || prev.croppedAreaPixels || null,
        builderId: authProfile.builder_id || prev.builderId,
      }));
    } else if (user) {
      initialSyncDone.current = true;
      setBuilderData((prev) => {
        if (!prev.name && user.twitter_name) {
          return {
            ...prev,
            name: user.twitter_name,
            photoUrl: user.twitter_profile_image || prev.photoUrl,
            github: prev.github || '',
          };
        }
        return prev;
      });
    }
  }, [authProfile, user]);

  // Handle URL redirect query parameters for both Supabase & Mock flow fallbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    const username = params.get('username');
    const avatar = params.get('avatar');
    if (name || avatar) {
      setBuilderData((prev) => ({
        ...prev,
        name: name || prev.name,
        photoUrl: avatar || prev.photoUrl,
      }));
      // Clean query parameters from URL
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }
  }, []);

  // Handle Routing (Hash and dynamic Path for Vercel dynamic mapping /builder/:id)
  useEffect(() => {
    const handleRouting = () => {
      const path = window.location.pathname;
      const builderMatch = path.match(/^\/builder\/([^/]+)$/);
      
      if (builderMatch) {
        setProfileId(builderMatch[1]);
        setView('profile');
      } else {
        const hash = window.location.hash;
        if (hash === '#generator') {
          setView('generator');
        } else if (hash === '#result') {
          setView('result');
        } else {
          setView('home');
        }
      }
    };

    handleRouting();
    window.addEventListener('popstate', handleRouting);
    window.addEventListener('hashchange', handleRouting);

    return () => {
      window.removeEventListener('popstate', handleRouting);
      window.removeEventListener('hashchange', handleRouting);
    };
  }, []);

  const navigateTo = (newView: ViewMode) => {
    if (newView === 'profile') return; // Profile route requires a builder ID parameter
    
    if (newView === 'home') {
      window.history.pushState({}, '', '/');
      setView('home');
    } else {
      window.location.hash = `#${newView}`;
      setView(newView);
    }
  };

  // Mouse glow
  useEffect(() => {
    const glow = document.getElementById('cursor-glow');
    if (!glow) return;
    const onMove = (e: MouseEvent) => {
      glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setRedoStack((r) => [builderData, ...r]);
      setBuilderData(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prev));
      } catch {}
      return h.slice(0, -1);
    });
  }, [builderData]);

  const handleRedo = useCallback(() => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const next = r[0];
      setHistory((h) => [...h, builderData]);
      setBuilderData(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return r.slice(1);
    });
  }, [builderData]);

  // Global keyboard: Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const persistState = useCallback((data: BuilderData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, []);

  const updateBuilderData = useCallback(
    (updates: Partial<BuilderData>) => {
      setBuilderData((prev) => {
        if (!pendingPrevRef.current) {
          pendingPrevRef.current = prev;
        }

        if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
        historyDebounceRef.current = setTimeout(() => {
          if (pendingPrevRef.current) {
            setHistory((h) => [...h.slice(-MAX_HISTORY + 1), pendingPrevRef.current!]);
            setRedoStack([]);
            pendingPrevRef.current = null;
          }
        }, 600);

        const next = { ...prev, ...updates };
        persistState(next);
        return next;
      });
    },
    [persistState]
  );

  return (
    <div
      className="min-h-screen flex flex-col relative text-[#e5e2e1] bg-[#131313] selection:bg-[#00f0ff] selection:text-[#006970]"
    >
      {/* Cursor glow */}
      <div
        id="cursor-glow"
        className="fixed w-[400px] h-[400px] rounded-full pointer-events-none z-0 -translate-x-1/2 -translate-y-1/2 mix-blend-screen will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(0,240,255,0.12) 0%, rgba(0,240,255,0) 70%)',
        }}
        aria-hidden="true"
      />

      {/* WebGL aurora background */}
      <ErrorBoundary fallback={<div aria-hidden="true" />}>
        <ShaderBackground />
      </ErrorBoundary>

      {/* Navbar */}
      <Navbar currentView={view} onNavigate={navigateTo} />

      {/* Main content with page transitions */}
      <main className="flex-grow relative z-10 pt-24" id="main-content">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-[#00f0ff] text-black px-4 py-2 rounded z-50 font-mono text-sm"
        >
          Skip to content
        </a>

        <AnimatePresence mode="wait">
          <motion.div
            key={view === 'profile' ? `profile-${profileId}` : view}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <ErrorBoundary>
              {view === 'home' && (
                <HomeView onStart={() => navigateTo('generator')} />
              )}

              {view === 'generator' && (
                <GeneratorView
                  data={builderData}
                  onChange={updateBuilderData}
                  onGenerate={() => navigateTo('result')}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  canUndo={history.length > 0}
                  canRedo={redoStack.length > 0}
                />
              )}

              {view === 'result' && (
                <ResultView
                  data={builderData}
                  onRemix={() => navigateTo('generator')}
                />
              )}

              {view === 'profile' && profileId && (
                <ProfileView
                  builderId={profileId}
                  onNavigateHome={() => navigateTo('generator')}
                />
              )}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
