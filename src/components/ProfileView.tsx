import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { CardCanvas } from './CardCanvas';
import { BuilderProfile, Wallet } from '../context/AuthContext';
import { THEMES } from '../constants';
import { BuilderData, CardType } from '../types';
import { toPng } from 'html-to-image';
import {
  Globe, Github, Twitter, Wallet as WalletIcon, Calendar, Palette, Download, Sparkles, AlertTriangle, ArrowLeft, ExternalLink, RefreshCw
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface ProfileViewProps {
  builderId: string;
  onNavigateHome: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ builderId, onNavigateHome }) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<BuilderProfile | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [qrUrl, setQrUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<CardType>('card');
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Fetch builder details from backend API
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch(`/api/builder/get?id=${encodeURIComponent(builderId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Profile not found');
        }
        return res.json();
      })
      .then((data) => {
        if (active) {
          setProfile(data.profile);
          setWallets(data.wallets || []);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Failed to load profile details');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [builderId]);

  // Generate QR Code once profile loads
  useEffect(() => {
    if (!profile) return;
    const profileUrl = `${window.location.origin}/builder/${profile.builder_id}`;
    QRCode.toDataURL(profileUrl, {
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => setQrUrl(url))
      .catch(err => console.error('QR code generation failed:', err));
  }, [profile]);

  // Map database BuilderProfile to local BuilderData for CardCanvas
  const getCardData = (): BuilderData => {
    if (!profile) return {
      name: '', role: '', stack: [], title: '', badgeNumber: '', photoUrl: null,
      crop: { x: 0, y: 0 }, zoom: 1, rotation: 0, croppedAreaPixels: null, themeId: 'cyber'
    };

    return {
      name: profile.name,
      role: profile.role || '',
      stack: profile.stack || [],
      github: profile.github || '',
      title: profile.title || '',
      badgeNumber: profile.badge_number || 'BLD-9999',
      photoUrl: profile.photo_url || null,
      crop: profile.crop || { x: 0, y: 0 },
      zoom: profile.zoom || 1.0,
      rotation: profile.rotation || 0,
      croppedAreaPixels: profile.cropped_area_pixels || null,
      themeId: profile.theme_id || 'cyber'
    };
  };

  const handleDownload = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);

    try {
      await new Promise((r) => setTimeout(r, 150));
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        cacheBust: true,
        style: { borderRadius: '0' },
      });

      const link = document.createElement('a');
      link.download = `HHGoa-${profile?.builder_id}-${activeTab}.png`;
      link.href = dataUrl;
      link.click();
      toast('PNG downloaded!', 'success');
    } catch (err) {
      console.error('PNG download error:', err);
      toast('Failed to download image', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-6 text-center space-y-6" aria-live="polite">
        <RefreshCw className="w-12 h-12 text-[#00f0ff] animate-spin mx-auto" aria-hidden="true" />
        <p className="text-[#dbfcff] font-mono text-sm">Retrieving Builder Credentials...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto py-16 px-6">
        <div className="glass-panel p-8 rounded-xl border border-red-500/20 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
            <AlertTriangle className="w-8 h-8" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#e5e2e1]">Identity Lookup Failed</h2>
            <p className="text-[#b9cacb] text-sm font-mono">{error || 'Builder ID not found'}</p>
          </div>
          <button
            onClick={onNavigateHome}
            className="px-6 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-[#b9cacb] border border-white/10 transition-colors flex items-center gap-2 mx-auto cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const theme = THEMES.find((t) => t.id === profile.theme_id) ?? THEMES[0];
  const formattedDate = new Date(profile.created_at || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-6 space-y-12">
      {/* Back button */}
      <button
        onClick={onNavigateHome}
        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-[#b9cacb] border border-white/10 transition-colors flex items-center gap-2 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Generator
      </button>

      {/* Header section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-[#00f0ff]/30 text-xs font-mono text-[#00f0ff]">
          <Sparkles className="w-4 h-4 text-[#ff24e4]" aria-hidden="true" />
          Verified Builder Profile
        </div>
        <h1 className="font-headline-md text-3xl md:text-5xl font-extrabold text-[#dbfcff]">
          {profile.name}
        </h1>
        <p className="text-[#00f0ff] font-mono text-sm tracking-widest uppercase">
          {profile.builder_id}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Public Profile Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-xl border border-white/10 space-y-6">
            
            {/* Identity Bio */}
            {profile.bio && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono text-[#b9cacb] uppercase tracking-wider">Bio</h3>
                <p className="text-[#e5e2e1] text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Profile specifications */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-mono text-[#b9cacb] uppercase mb-1">Builder Title</h4>
                <p className="text-sm font-mono text-[#ff24e4] font-semibold">{profile.title || 'Alchemist'}</p>
              </div>
              <div>
                <h4 className="text-xs font-mono text-[#b9cacb] uppercase mb-1">Primary Role</h4>
                <p className="text-sm text-[#e5e2e1]">{profile.role || 'Hacker'}</p>
              </div>
            </div>

            {/* Tech stack */}
            {profile.stack && profile.stack.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono text-[#b9cacb] uppercase tracking-wider">Core Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.stack.map(tech => (
                    <span key={tech} className="font-mono text-xs px-2.5 py-1 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff]">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Wallets */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h3 className="text-xs font-mono text-[#b9cacb] uppercase tracking-wider flex items-center gap-1.5">
                <WalletIcon className="w-4 h-4 text-[#ff24e4]" />
                Connected Wallet(s)
              </h3>
              {wallets.length === 0 ? (
                <p className="text-xs font-mono text-[#b9cacb]/50">No verified Web3 wallets connected.</p>
              ) : (
                <div className="space-y-2">
                  {wallets.map(w => (
                    <div key={w.address} className="flex justify-between items-center bg-[#0e0e0e] border border-white/5 p-3 rounded-lg">
                      <span className="font-mono text-xs text-[#e5e2e1]">
                        {w.address.slice(0, 6)}...{w.address.slice(-4)}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400">
                        Verified EVM
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Social and Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="space-y-2">
                <h4 className="text-xs font-mono text-[#b9cacb] uppercase">Social Connections</h4>
                <div className="flex flex-col gap-2">
                  {profile.github && (
                    <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[#b9cacb] hover:text-[#00f0ff] transition-colors">
                      <Github className="w-4 h-4" /> github.com/{profile.github} <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  )}
                  {profile.twitter && (
                    <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[#b9cacb] hover:text-[#00f0ff] transition-colors">
                      <Twitter className="w-4 h-4" /> twitter.com/{profile.twitter} <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  )}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[#b9cacb] hover:text-[#00f0ff] transition-colors">
                      <Globe className="w-4 h-4" /> {profile.website.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-mono text-[#b9cacb] uppercase">Metadata</h4>
                <div className="flex flex-col gap-2 text-xs text-[#b9cacb]">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#ff24e4]" /> Generated on {formattedDate}
                  </span>
                  <span className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#00f0ff]" /> Theme: {theme.name}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Card Preview & QR Code */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card Frame Tab */}
          <div className="glass-panel p-6 rounded-xl border border-white/10 space-y-6 flex flex-col items-center">
            
            {/* Tab switcher */}
            <div className="flex gap-2 bg-[#1c1b1b] p-1 rounded-full border border-white/10 shadow-lg">
              {(['card', 'pfp'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full font-mono text-xs transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-white/15 text-[#00f0ff] font-bold'
                      : 'text-[#b9cacb] hover:text-[#e5e2e1]'
                  }`}
                >
                  {tab === 'card' ? 'ID Card' : 'PFP Frame'}
                </button>
              ))}
            </div>

            {/* Graphic display container */}
            <div className="w-full max-w-[280px]">
              <CardCanvas cardRef={cardRef} data={getCardData()} cardType={activeTab} />
            </div>

            {/* Action buttons */}
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="w-full py-3 rounded-lg font-mono text-xs font-bold bg-[#00f0ff] text-black hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isExporting ? (
                'Generating PNG...'
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download 1080×1080 PNG
                </>
              )}
            </button>
          </div>

          {/* Public ID scan card */}
          {qrUrl && (
            <div className="glass-panel p-6 rounded-xl border border-white/10 flex flex-col items-center text-center space-y-4">
              <h3 className="text-sm font-bold text-[#dbfcff] font-mono">Scan to Verify</h3>
              <div className="w-32 h-32 bg-white p-2 rounded-lg shadow-lg">
                <img src={qrUrl} alt="Builder ID Profile URL QR Code" className="w-full h-full" />
              </div>
              <p className="text-[10px] font-mono text-[#b9cacb] max-w-xs opacity-60">
                Scan this QR code to view the live builder profile page and verify connected EVM credentials.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
