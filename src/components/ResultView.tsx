import React, { useRef, useState, useEffect } from 'react';
import { BuilderData, CardType } from '../types';
import { CardCanvas } from './CardCanvas';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import {
  Download, Share2, RotateCcw, Check, Copy, Sparkles,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface ResultViewProps {
  data: BuilderData;
  onRemix: () => void;
}

const CONFETTI_COLORS = ['#00f0ff', '#ff24e4', '#7df4ff', '#ffffff', '#fface8'];

export const ResultView: React.FC<ResultViewProps> = ({ data, onRemix }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<CardType>('card');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasFiredConfetti, setHasFiredConfetti] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null!);

  // Fire confetti once when the result view mounts (first generation)
  useEffect(() => {
    if (!hasFiredConfetti) {
      const timer = setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.55 },
          colors: CONFETTI_COLORS,
        });
        setHasFiredConfetti(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [hasFiredConfetti]);

  const handleDownloadPNG = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);

    try {
      // Wait for cropped image to settle inside the card DOM
      await new Promise((r) => setTimeout(r, 150));

      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 3,          // Targets ~1080px for a 360px-wide card
        cacheBust: true,
        skipFonts: false,
        style: { borderRadius: '0' }, // Avoid clipping in some browsers
      });

      const link = document.createElement('a');
      link.download = `FrameInGoa-2026-${(data.name || 'builder').replace(/\s+/g, '_')}-${activeTab}.png`;
      link.href = dataUrl;
      link.click();

      // Celebrate after successful download
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.65 },
        colors: CONFETTI_COLORS,
      });
      toast('PNG downloaded successfully! 🎉', 'success');
    } catch (err) {
      console.error('PNG export failed:', err);
      toast('PNG generation failed. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareX = () => {
    const text = encodeURIComponent(
      `Just created my HH Goa 2026 Builder Identity 🚀\nRole: ${data.title || data.role}\n\n#FrameInGoa #HHGoa2026`,
    );
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast('Could not access clipboard. Please copy the URL manually.', 'error');
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto w-full flex flex-col items-center py-8 px-6 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-[#00f0ff]/30 text-xs font-mono text-[#00f0ff] mb-2">
          <Sparkles className="w-4 h-4 text-[#ff24e4]" aria-hidden="true" />
          Identity Minted
        </div>
        <h1 className="font-headline-md text-4xl md:text-6xl font-extrabold cyber-gradient-text">
          Your Identity Forged.
        </h1>
        <p className="text-[#b9cacb] max-w-xl mx-auto font-body-lg text-lg">
          Elite credentials minted for the ultimate builder experience in Goa.
        </p>
      </div>

      {/* Tab switcher */}
      <div
        className="flex gap-2 bg-[#1c1b1b] p-1.5 rounded-full border border-white/10 shadow-lg"
        role="tablist"
        aria-label="Card type"
      >
        {(['card', 'pfp'] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-full font-mono text-xs transition-all cursor-pointer ${
              activeTab === tab
                ? tab === 'card'
                  ? 'bg-white/15 text-[#00f0ff] font-bold shadow-sm'
                  : 'bg-white/15 text-[#ff24e4] font-bold shadow-sm'
                : 'text-[#b9cacb] hover:text-[#e5e2e1]'
            }`}
          >
            {tab === 'card' ? 'ID Card' : 'PFP Frame'}
          </button>
        ))}
      </div>

      {/* Card + Actions */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-10 items-center justify-center">
        {/* Card preview */}
        <div
          className="w-full md:w-1/2 flex justify-center"
          role="tabpanel"
          aria-label={activeTab === 'card' ? 'ID Card preview' : 'PFP Frame preview'}
        >
          <div className="w-full max-w-[360px] perspective-1000">
            <CardCanvas
              cardRef={cardRef}
              data={data}
              cardType={activeTab}
              isExporting={isExporting}
            />
          </div>
        </div>

        {/* Action panel */}
        <div className="w-full md:w-1/3 flex flex-col gap-4 justify-center">
          {/* Download */}
          <button
            onClick={handleDownloadPNG}
            disabled={isExporting}
            aria-label={isExporting ? 'Generating PNG…' : 'Download PNG'}
            className="w-full py-4 rounded-xl font-headline-md text-lg font-bold bg-gradient-to-r from-[#00f0ff] to-[#00dbe9] text-black shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:shadow-[0_0_35px_rgba(0,240,255,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" aria-hidden="true" />
                Generating PNG…
              </>
            ) : (
              <>
                <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
                Download 1080×1080 PNG
              </>
            )}
          </button>

          {/* Share + Remix row */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShareX}
              aria-label="Share to X (Twitter)"
              className="glass-panel py-3 rounded-lg flex items-center justify-center gap-2 text-[#e5e2e1] hover:text-[#00f0ff] transition-colors font-mono text-xs hover:bg-white/10 cursor-pointer border border-white/10"
            >
              {/* X (Twitter) logo SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.265 5.638L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
              </svg>
              Share to X
            </button>

            <button
              onClick={onRemix}
              aria-label="Go back and remix your card"
              className="glass-panel py-3 rounded-lg flex items-center justify-center gap-2 text-[#e5e2e1] hover:text-[#ff24e4] transition-colors font-mono text-xs hover:bg-white/10 cursor-pointer border border-white/10"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" /> Remix
            </button>
          </div>

          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            aria-label={copied ? 'Link copied!' : 'Copy share link'}
            className="w-full py-2.5 rounded-lg border border-white/10 text-[#b9cacb] hover:text-[#e5e2e1] hover:bg-white/5 font-mono text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" aria-hidden="true" /> URL Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" aria-hidden="true" /> Copy Share Link
              </>
            )}
          </button>

          {/* Hint */}
          <p className="text-[10px] font-mono text-[#b9cacb] text-center opacity-50">
            Switch tabs above to export the ID Card or PFP Frame separately.
          </p>
        </div>
      </div>
    </div>
  );
};
