import React from 'react';
import { motion } from 'motion/react';
import { ThreeMotif } from './ThreeBackground';
import { ArrowRight, Terminal, Fingerprint, Network, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Twitter/X icon (not in lucide)
const XIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface HomeViewProps {
  onStart: () => void;
}

const FADE_UP_INITIAL = { opacity: 0, y: 20 };
const FADE_UP_ANIMATE = { opacity: 1, y: 0 };

const CARD_INITIAL = { opacity: 0, y: 24 };
const CARD_ANIMATE = { opacity: 1, y: 0 };

export const HomeView: React.FC<HomeViewProps> = ({ onStart }) => {
  const { user, loading, loginWithTwitter } = useAuth();
  return (
    <div className="space-y-24 pb-16">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section
        className="min-h-[80vh] flex items-center justify-center relative px-6 py-12 overflow-hidden"
        aria-labelledby="hero-headline"
      >
        {/* Three.js motif */}
        <div
          className="absolute inset-0 z-[-1] opacity-70 flex justify-center items-center pointer-events-none mix-blend-screen"
          aria-hidden="true"
        >
          <ThreeMotif />
        </div>

        <div className="max-w-[1280px] mx-auto text-center relative z-10 space-y-8">
          {/* Badge pill */}
          <motion.div
            initial={FADE_UP_INITIAL}
            animate={FADE_UP_ANIMATE}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-[#00f0ff]/30 text-xs font-mono text-[#00f0ff]"
          >
            <Sparkles className="w-4 h-4 text-[#ff24e4]" aria-hidden="true" />
            GOA CREATIVE DEVELOPER GATHERING 2026
          </motion.div>

          {/* H1 */}
          <motion.h1
            id="hero-headline"
            initial={FADE_UP_INITIAL}
            animate={FADE_UP_ANIMATE}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            className="font-headline-md text-5xl md:text-7xl font-extrabold text-[#dbfcff] tracking-tighter leading-tight max-w-5xl mx-auto"
          >
            Become an{' '}
            <span className="cyber-gradient-text">HH Goa</span>{' '}
            Builder.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={FADE_UP_INITIAL}
            animate={FADE_UP_ANIMATE}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
            className="font-body-lg text-lg md:text-xl text-[#b9cacb] max-w-2xl mx-auto leading-relaxed"
          >
            Claim your identity for Goa's premier creative developer gathering.
            Forge your path in the cyber-tropical frontier.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={FADE_UP_INITIAL}
            animate={FADE_UP_ANIMATE}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
            className="pt-4 flex flex-col items-center gap-4"
          >
            <button
              onClick={onStart}
              aria-label="Start generating your builder identity"
              className="btn-primary-gradient font-headline-md text-lg font-bold text-[#002022] px-10 py-5 rounded-full shadow-[0_0_35px_rgba(0,240,255,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-3"
            >
              Generate My Builder Identity
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* X Sign-in pill — only shown when logged out */}
            {!loading && !user && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={loginWithTwitter}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-full glass-panel border border-[#e5e2e1]/15 text-[#b9cacb] hover:text-[#e5e2e1] hover:border-[#e5e2e1]/30 font-mono text-xs transition-all cursor-pointer"
                aria-label="Sign in with X to unlock builder identity"
              >
                <XIcon className="w-3.5 h-3.5" />
                Claim your Builder ID with X
                <ShieldCheck className="w-3.5 h-3.5 text-[#00f0ff]" aria-hidden="true" />
              </motion.button>
            )}

            {/* Logged in micro-state */}
            {!loading && user && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 text-xs font-mono text-[#00f0ff]"
              >
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                Signed in as <span className="font-bold">{user.twitter_name || `@${user.twitter_username}`}</span>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Bento Grid ────────────────────────────────────────────── */}
      <section
        className="px-6 max-w-[1280px] mx-auto"
        aria-label="Features"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[260px]">

          {/* Card 1: Build in Paradise */}
          <motion.div
            initial={CARD_INITIAL}
            whileInView={CARD_ANIMATE}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.15 }}
            className="glass-panel rounded-xl p-8 col-span-1 md:col-span-2 flex flex-col justify-end relative overflow-hidden group border border-white/10 hover:border-[#00f0ff]/40 transition-colors"
          >
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-50 transition-opacity duration-500 mix-blend-luminosity"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1000&auto=format&fit=crop')`,
              }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-transparent z-0" aria-hidden="true" />
            <div className="relative z-10 space-y-2">
              <div className="w-12 h-12 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff] mb-2 group-hover:scale-110 transition-transform">
                <Terminal className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="font-headline-md text-2xl font-bold text-[#dbfcff]">
                Build in Paradise
              </h3>
              <p className="font-body-sm text-sm text-[#b9cacb]">
                Seamlessly blend deep work with tropical living in the heart of Goa.
              </p>
            </div>
          </motion.div>

          {/* Card 2: Unique Mint */}
          <motion.div
            initial={CARD_INITIAL}
            whileInView={CARD_ANIMATE}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.23 }}
            className="glass-panel rounded-xl p-8 col-span-1 flex flex-col justify-between items-start group border border-white/10 hover:border-[#ff24e4]/40 transition-colors"
          >
            <span className="font-mono text-xs bg-[#ffd7f0]/10 text-[#fface8] px-3 py-1 rounded-full border border-[#ffd7f0]/20 inline-block">
              IDENTITY
            </span>
            <div className="space-y-2">
              <Fingerprint className="w-10 h-10 text-[#fface8] group-hover:scale-110 transition-transform" aria-hidden="true" />
              <h3 className="font-body-lg text-lg font-bold text-[#e5e2e1]">
                Unique Mint
              </h3>
              <p className="font-body-sm text-sm text-[#b9cacb]">
                Your profile card is cryptographically styled &amp; ready for social export.
              </p>
            </div>
          </motion.div>

          {/* Card 3: Elite Network */}
          <motion.div
            initial={CARD_INITIAL}
            whileInView={CARD_ANIMATE}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.31 }}
            className="glass-panel rounded-xl p-8 col-span-1 flex flex-col justify-between items-start group border border-white/10 hover:border-[#00f0ff]/40 transition-colors"
          >
            <span className="font-mono text-xs bg-[#00f0ff]/10 text-[#00dbe9] px-3 py-1 rounded-full border border-[#00f0ff]/20 inline-block">
              NETWORK
            </span>
            <div className="space-y-2">
              <Network className="w-10 h-10 text-[#00dbe9] group-hover:scale-110 transition-transform" aria-hidden="true" />
              <h3 className="font-body-lg text-lg font-bold text-[#e5e2e1]">
                Elite Roster
              </h3>
              <p className="font-body-sm text-sm text-[#b9cacb]">
                Connect with 100+ vetted creative developers and Web3 innovators.
              </p>
            </div>
          </motion.div>

          {/* Card 4: Action banner */}
          <motion.div
            initial={CARD_INITIAL}
            whileInView={CARD_ANIMATE}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.39 }}
            className="glass-panel rounded-xl p-8 col-span-1 md:col-span-2 flex flex-col justify-center items-center text-center relative overflow-hidden group border border-white/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff]/10 to-[#ff24e4]/10 z-0" aria-hidden="true" />
            <div className="relative z-10 space-y-4">
              <h3 className="font-headline-md text-3xl font-bold text-[#dbfcff]">
                Ready to Hack?
              </h3>
              <button
                onClick={onStart}
                aria-label="Launch the builder studio"
                className="glass-panel font-body-sm text-sm text-[#dbfcff] px-8 py-3 rounded-full hover:bg-white/10 transition-all duration-300 border border-white/20 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,240,255,0.2)] cursor-pointer"
              >
                Launch Builder Studio
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
