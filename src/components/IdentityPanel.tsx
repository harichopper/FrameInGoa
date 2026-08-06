import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Wallet, LogIn, LogOut, Twitter, CheckCircle,
  Link2, Unlink, Loader2, Shield, Copy, ExternalLink, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// ─── Twitter "X" SVG Icon (not in lucide-react) ──────────────
const XIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// ─── Subcomponent: wallet address pill ───────────────────────
const WalletPill: React.FC<{ address: string; onDisconnect: () => void }> = ({
  address, onDisconnect,
}) => {
  const { toast } = useToast();
  const [disconnecting, setDisconnecting] = useState(false);
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    toast('Address copied to clipboard', 'success');
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    await onDisconnect();
    setDisconnecting(false);
  };

  return (
    <div className="flex items-center justify-between bg-[#0e0e0e] border border-white/5 rounded-lg px-3 py-2 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Shield className="w-3.5 h-3.5 text-green-400 flex-shrink-0" aria-hidden="true" />
        <span className="font-mono text-xs text-[#e5e2e1] truncate">{short}</span>
        <span className="text-[10px] font-mono text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded bg-green-500/5">
          EVM
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={copy}
          title="Copy full address"
          className="p-1.5 rounded hover:bg-white/5 text-[#b9cacb] hover:text-[#00f0ff] transition-colors cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          title="Disconnect wallet"
          className="p-1.5 rounded hover:bg-red-500/10 text-[#b9cacb] hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
        >
          {disconnecting
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Unlink className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

// ─── Main Identity Panel component ────────────────────────────
interface IdentityPanelProps {
  /** Called when X login succeeds and display name is available (for auto-fill) */
  onNameSynced?: (name: string, avatarUrl?: string) => void;
}

export const IdentityPanel: React.FC<IdentityPanelProps> = ({ onNameSynced }) => {
  const { user, profile, wallets, loading, loginWithTwitter, logout, connectMetaMask, disconnectWallet } = useAuth();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Ensure name/avatar sync only fires once (not on every render)
  const hasSynced = React.useRef(false);

  // Notify parent once user data resolves (auto-fill name) — ONE TIME ONLY
  React.useEffect(() => {
    if (hasSynced.current) return;
    if (user?.twitter_name && onNameSynced) {
      hasSynced.current = true;
      onNameSynced(user.twitter_name, user.twitter_profile_image);
    }
  }, [user?.twitter_name, user?.twitter_profile_image, onNameSynced]);

  const handleConnectWallet = async () => {
    setConnectingWallet(true);
    try {
      await connectMetaMask();
    } finally {
      setConnectingWallet(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setExpanded(false);
    } finally {
      setLoggingOut(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="glass-panel rounded-xl border border-white/10 p-4 flex items-center gap-3 animate-pulse" aria-busy="true">
        <div className="w-8 h-8 rounded-full bg-white/10" />
        <div className="h-3 rounded bg-white/10 w-24" />
      </div>
    );
  }

  // ── Not authenticated ──────────────────────────────────────
  if (!user) {
    return (
      <div className="glass-panel rounded-xl border border-white/10 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center text-[#00f0ff]">
            <User className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#e5e2e1]">Builder Identity</p>
            <p className="text-[10px] text-[#b9cacb] font-mono">Optional — unlock extra features</p>
          </div>
        </div>

        <p className="text-xs text-[#b9cacb] leading-relaxed">
          Sign in to claim a permanent <span className="text-[#00f0ff] font-mono">Builder ID</span>,
          generate a scannable QR card, and connect your Web3 wallets.
        </p>

        <div className="space-y-2.5">
          {/* Continue with X button */}
          <button
            onClick={loginWithTwitter}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg bg-[#e5e2e1] hover:bg-white text-black font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_0_20px_rgba(229,226,225,0.1)]"
            aria-label="Sign in with X (Twitter)"
          >
            <XIcon className="w-4 h-4" />
            Continue with X
          </button>

          {/* Connect MetaMask (as alternative login) */}
          <button
            onClick={handleConnectWallet}
            disabled={connectingWallet}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-[#ff9500]/10 hover:bg-[#ff9500]/20 text-[#ff9500] border border-[#ff9500]/20 font-mono text-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-60"
            aria-label="Connect MetaMask wallet"
          >
            {connectingWallet ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Connecting…
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4" />
                Connect MetaMask
              </>
            )}
          </button>
        </div>

        <p className="text-[10px] text-[#b9cacb]/50 font-mono text-center">
          Image generation works without signing in.
        </p>
      </div>
    );
  }

  // ── Authenticated ─────────────────────────────────────────
  const hasProfileId = !!profile?.builder_id;
  const displayName = user.twitter_name || 'Builder';
  const displayHandle = user.twitter_username ? `@${user.twitter_username}` : null;

  return (
    <div className="glass-panel rounded-xl border border-white/10 overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer"
        aria-expanded={expanded}
        aria-label="Toggle identity panel"
      >
        <div className="flex items-center gap-3">
          {user.twitter_profile_image ? (
            <img
              src={user.twitter_profile_image}
              alt={displayName}
              className="w-9 h-9 rounded-full border-2 border-[#00f0ff]/30 object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center text-[#00f0ff]">
              <User className="w-4 h-4" />
            </div>
          )}
          <div className="text-left">
            <p className="text-sm font-bold text-[#e5e2e1] leading-tight">{displayName}</p>
            <p className="text-[10px] font-mono text-[#b9cacb]">
              {displayHandle ?? (wallets[0] ? `${wallets[0].address.slice(0, 6)}…${wallets[0].address.slice(-4)}` : 'Builder')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasProfileId && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff]">
              {profile!.builder_id}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[#b9cacb] transition-transform ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-3">

              {/* Builder ID badge */}
              {hasProfileId ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-[#b9cacb] uppercase tracking-wider">Builder ID</p>
                    <p className="text-sm font-mono font-bold text-[#00f0ff]">{profile!.builder_id}</p>
                  </div>
                  <a
                    href={`/builder/${profile!.builder_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-mono text-[#b9cacb] hover:text-[#00f0ff] transition-colors"
                    aria-label="View public profile"
                  >
                    View Profile <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <div className="text-[10px] font-mono text-[#b9cacb] bg-[#00f0ff]/5 border border-[#00f0ff]/10 rounded-lg px-3 py-2">
                  Save your profile to mint a permanent <span className="text-[#00f0ff]">Builder ID</span>.
                </div>
              )}

              {/* Twitter/X connection status */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-mono text-[#b9cacb] uppercase tracking-wider flex items-center gap-1.5">
                  <Twitter className="w-3 h-3" /> X Account
                </p>
                {user.twitter_username ? (
                  <div className="flex items-center gap-2 text-xs text-[#e5e2e1] font-mono">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    @{user.twitter_username}
                  </div>
                ) : (
                  <button
                    onClick={loginWithTwitter}
                    className="flex items-center gap-2 text-xs text-[#b9cacb] hover:text-[#e5e2e1] font-mono transition-colors cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" /> Link X Account
                  </button>
                )}
              </div>

              {/* Wallets */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono text-[#b9cacb] uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-3 h-3" /> Wallets ({wallets.length})
                </p>
                {wallets.length > 0 && (
                  <div className="space-y-1.5">
                    {wallets.map(w => (
                      <WalletPill
                        key={w.address}
                        address={w.address}
                        onDisconnect={() => disconnectWallet(w.address)}
                      />
                    ))}
                  </div>
                )}
                <button
                  onClick={handleConnectWallet}
                  disabled={connectingWallet}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-white/10 hover:border-[#ff9500]/30 text-[#b9cacb] hover:text-[#ff9500] text-xs font-mono transition-all cursor-pointer disabled:opacity-50"
                >
                  {connectingWallet ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting…</>
                  ) : (
                    <><Wallet className="w-3.5 h-3.5" /> Add MetaMask Wallet</>
                  )}
                </button>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-[#b9cacb] hover:text-red-400 text-xs font-mono transition-all cursor-pointer border border-white/5 hover:border-red-500/20 disabled:opacity-50"
                aria-label="Sign out"
              >
                {loggingOut
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <LogOut className="w-3.5 h-3.5" />}
                {loggingOut ? 'Signing out…' : 'Sign Out'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Compact Navbar auth button (shown in Navbar) ────────────
export const NavAuthButton: React.FC = () => {
  const { user, loading, loginWithTwitter } = useAuth();

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" aria-busy="true" />
    );
  }

  if (user) {
    const initial = (user.twitter_name || 'B')[0].toUpperCase();
    return (
      <a
        href="#generator"
        className="flex items-center gap-2 text-xs font-mono text-[#b9cacb] hover:text-[#00f0ff] transition-colors"
        aria-label="View identity panel"
      >
        {user.twitter_profile_image ? (
          <img
            src={user.twitter_profile_image}
            alt={user.twitter_name}
            className="w-7 h-7 rounded-full border border-[#00f0ff]/30 object-cover"
          />
        ) : (
          <span className="w-7 h-7 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] font-bold text-xs flex items-center justify-center">
            {initial}
          </span>
        )}
        <span className="hidden md:block">{user.twitter_name || 'Builder'}</span>
      </a>
    );
  }

  return (
    <button
      onClick={loginWithTwitter}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#e5e2e1]/10 hover:bg-[#e5e2e1]/20 border border-[#e5e2e1]/20 text-[#e5e2e1] font-mono text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
      aria-label="Sign in with X (Twitter)"
    >
      <XIcon className="w-3.5 h-3.5" />
      <span className="hidden sm:block">Sign In</span>
    </button>
  );
};
