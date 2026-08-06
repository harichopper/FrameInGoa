import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { BuilderData, CardType } from '../types';
import { THEMES } from '../constants';
import { getCroppedImg } from '../utils/cropImage';

interface CardCanvasProps {
  data: BuilderData;
  cardType: CardType;
  cardRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
  isExporting?: boolean;
}

/** Resolves the correctly-cropped avatar data-URL, or falls back to the raw URL. */
function useCroppedImage(data: BuilderData): [string | null, boolean] {
  const [croppedUrl, setCroppedUrl] = useState<string | null>(data.photoUrl);
  const [isCropping, setIsCropping] = useState(false);

  useEffect(() => {
    if (!data.photoUrl) {
      setCroppedUrl(null);
      setIsCropping(false);
      return;
    }
    if (!data.croppedAreaPixels) {
      setCroppedUrl(data.photoUrl);
      setIsCropping(false);
      return;
    }

    let cancelled = false;
    setIsCropping(true);
    getCroppedImg(data.photoUrl, data.croppedAreaPixels, data.rotation, 512)
      .then((url) => {
        if (!cancelled) {
          setCroppedUrl(url);
          setIsCropping(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCroppedUrl(data.photoUrl);
          setIsCropping(false);
        }
      });

    return () => { cancelled = true; };
  }, [data.photoUrl, data.croppedAreaPixels, data.rotation]);

  return [croppedUrl, isCropping];
}

// ─── PFP (profile picture) card ───────────────────────────────
function PfpCard({
  data,
  cardRef,
  className = '',
}: Pick<CardCanvasProps, 'data' | 'cardRef' | 'className'>) {
  const theme = THEMES.find((t) => t.id === data.themeId) ?? THEMES[0];
  const [croppedUrl, isCropping] = useCroppedImage(data);

  return (
    <div
      ref={cardRef}
      className={`glass-panel rounded-full shadow-[0_0_60px_rgba(255,36,228,0.2)] aspect-square flex items-center justify-center relative overflow-hidden bg-gradient-to-br ${theme.cardBg} ${className}`}
      role="img"
      aria-label={`${data.name} HH Goa 2026 profile picture`}
    >
      {/* Outer neon ring */}
      <div
        className="absolute inset-4 rounded-full border"
        style={{
          borderColor: theme.secondaryAccent,
          boxShadow: `0 0 20px ${theme.secondaryAccent}60 inset, 0 0 20px ${theme.secondaryAccent}40`,
        }}
      />
      {/* Inner ring */}
      <div
        className="absolute inset-8 rounded-full border-2"
        style={{
          borderColor: theme.accentColor,
          boxShadow: `0 0 15px ${theme.accentColor}50 inset`,
        }}
      />

      {/* Avatar */}
      <div className="w-full h-full rounded-full overflow-hidden relative z-10 p-4 flex items-center justify-center bg-[#131313]">
        {isCropping ? (
          <div className="w-full h-full rounded-full bg-white/5 animate-pulse flex items-center justify-center" aria-live="polite">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#00f0ff] animate-spin" aria-hidden="true" />
          </div>
        ) : croppedUrl ? (
          <div className="w-full h-full rounded-full overflow-hidden relative border-4 border-[#131313]">
            <img
              src={croppedUrl}
              alt={data.name}
              className="w-full h-full object-cover rounded-full"
              crossOrigin="anonymous"
            />
          </div>
        ) : (
          <div className="w-full h-full rounded-full bg-[#1c1b1b] flex flex-col items-center justify-center gap-1">
            <svg className="w-16 h-16 text-[#849495]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-mono text-[#849495]">NO PHOTO</span>
          </div>
        )}
      </div>

      {/* Accent dots */}
      <svg
        className="absolute top-4 right-6 w-6 h-6 opacity-80"
        viewBox="0 0 24 24" fill={theme.accentColor}
        aria-hidden="true"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
      </svg>
      <svg
        className="absolute bottom-6 left-4 w-6 h-6 opacity-70"
        viewBox="0 0 24 24" fill={theme.secondaryAccent}
        aria-hidden="true"
      >
        <path d="M17 7.5C17 10.5376 14.5376 13 11.5 13 8.46243 13 6 10.5376 6 7.5 6 4.46243 8.46243 2 11.5 2c3.0376 0 5.5 2.46243 5.5 5.5zM2 19c0-3.3137 2.6863-6 6-6h8c3.3137 0 6 2.6863 6 6v1H2v-1z"/>
      </svg>

      {/* Badge */}
      <div className="absolute bottom-4 z-20 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-mono tracking-widest text-[#e5e2e1]">
        HH GOA 2026
      </div>
    </div>
  );
}

// ─── ID Card ─────────────────────────────────────────────────
function IdCard({
  data,
  cardRef,
  className = '',
}: Pick<CardCanvasProps, 'data' | 'cardRef' | 'className'>) {
  const theme = THEMES.find((t) => t.id === data.themeId) ?? THEMES[0];
  const [croppedUrl, isCropping] = useCroppedImage(data);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (data.builderId) {
      const url = `${window.location.origin}/builder/${data.builderId}`;
      QRCode.toDataURL(url, {
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then((codeUrl) => setQrCodeUrl(codeUrl))
        .catch((err) => console.error('Failed to generate card QR:', err));
    } else {
      setQrCodeUrl('');
    }
  }, [data.builderId]);

  return (
    <div
      ref={cardRef}
      className={`glass-panel rounded-xl p-6 shadow-[0_0_40px_rgba(0,240,255,0.15)] relative overflow-hidden aspect-[3/4] flex flex-col bg-gradient-to-b ${theme.cardBg} border border-white/10 ${className}`}
      role="img"
      aria-label={`${data.name} HH Goa 2026 builder identity card`}
    >
      {/* Holographic overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-tr ${theme.gradient} opacity-[0.12] mix-blend-overlay pointer-events-none z-10`}
      />
      {/* Circuit bg */}
      <div className="absolute inset-0 opacity-10 circuit-bg pointer-events-none z-0" />

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex justify-between items-start mb-auto z-20 relative">
        <div className="flex flex-col">
          <span className="font-headline-md text-2xl font-bold tracking-tight text-[#dbfcff]">
            FRAME
          </span>
          <span className="font-mono text-[10px] tracking-widest text-[#b9cacb]">
            HH GOA '26
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-[10px] px-2 py-0.5 rounded border bg-black/40"
            style={{ color: theme.textColor, borderColor: `${theme.accentColor}40` }}
          >
            {theme.badge}
          </span>
          {/* Verified checkmark (SVG, renders in export) */}
          <svg
            width="20" height="20" viewBox="0 0 24 24"
            fill={theme.secondaryAccent}
            aria-label="Verified"
          >
            <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              stroke={theme.secondaryAccent} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke={theme.secondaryAccent} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* ── Middle: avatar + info ───────────────────── */}
      <div className="z-20 text-center flex-grow flex flex-col items-center justify-center my-4">
        {/* Avatar ring */}
        <div
          className="w-32 h-32 rounded-full p-[3px] mb-3 relative"
          style={{
            background: `linear-gradient(135deg, ${theme.accentColor}, ${theme.secondaryAccent})`,
            boxShadow: `0 0 24px ${theme.borderGlow}`,
          }}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-[#131313]">
            {isCropping ? (
              <div className="w-full h-full rounded-full bg-white/5 animate-pulse flex items-center justify-center" aria-live="polite">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#00f0ff] animate-spin" aria-hidden="true" />
              </div>
            ) : croppedUrl ? (
              <img
                src={croppedUrl}
                alt={data.name}
                className="w-full h-full object-cover rounded-full"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#1c1b1b] flex items-center justify-center">
                <svg className="w-14 h-14 text-[#849495]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <h2 className="font-headline-md text-2xl font-bold text-[#e5e2e1] tracking-tight max-w-full truncate px-2">
          {data.name || 'Your Name'}
        </h2>

        {/* Title pill */}
        <p
          className="font-mono text-xs uppercase tracking-widest mt-1 font-semibold px-3 py-0.5 rounded-full bg-black/40 border border-white/10 inline-block max-w-full truncate"
          style={{ color: theme.textColor }}
        >
          {data.title || 'Full Stack Alchemist'}
        </p>

        {/* Role */}
        <p className="font-body-sm text-xs text-[#b9cacb] mt-1 max-w-full truncate px-2">
          {data.role || 'Creative Developer'}
        </p>

        {/* Stack chips */}
        {data.stack && data.stack.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mt-3 max-w-[90%]">
            {data.stack.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#e5e2e1]"
              >
                {tech}
              </span>
            ))}
            {data.stack.length > 4 && (
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#b9cacb]">
                +{data.stack.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Footer: metadata + Builder ID + QR ────────── */}
      <div className="z-20 mt-auto pt-4 border-t border-white/10 flex justify-between items-end">
        <div className="flex flex-col gap-0.5 text-left">
          <span className="font-mono text-[9px] text-[#b9cacb] uppercase tracking-wider">
            GOA HACKATHON 2026
          </span>
          <span className="font-mono text-xs font-bold" style={{ color: theme.textColor }}>
            #{data.badgeNumber || 'BLD-0492'}
          </span>
          {data.github && (
            <span className="font-mono text-[9px] text-[#b9cacb] truncate max-w-[140px]">
              github.com/{data.github.replace(/^https?:\/\/github\.com\//, '')}
            </span>
          )}
        </div>

        {/* Builder ID badge — only shown when minted */}
        <div className="flex flex-col items-center gap-1">
          {data.builderId ? (
            <span
              className="font-mono text-[8px] font-bold tracking-wider px-2 py-0.5 rounded-full border bg-black/60 backdrop-blur-sm"
              style={{
                color: theme.accentColor,
                borderColor: `${theme.accentColor}40`,
                textShadow: `0 0 6px ${theme.accentColor}50`,
              }}
            >
              {data.builderId}
            </span>
          ) : (
            <span className="font-mono text-[7px] text-[#b9cacb]/40 tracking-wider">
              NOT MINTED
            </span>
          )}

          {/* QR code (scannable if minted) or generic SVG placeholder */}
          <div className="w-12 h-12 bg-white p-1 rounded relative overflow-hidden flex items-center justify-center shadow-md">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="Scan to Verify Builder ID"
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
            ) : (
              <svg viewBox="0 0 24 24" className="w-full h-full text-black fill-current" aria-label="QR Code">
                <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 2h2v2h-2v-2zm-4-2h2v2h-2v-2zm2 4h2v2h-2v-2zm-2 0h2v2h-2v-2zm4-4h2v2h-2v-2zm0 4h2v2h-2v-2zm-4-8h2v2h-2V10zm2 2h2v2h-2v-2z" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────
export const CardCanvas: React.FC<CardCanvasProps> = ({
  data,
  cardType,
  cardRef,
  className = '',
  isExporting = false,
}) => {
  if (cardType === 'pfp') {
    return <PfpCard data={data} cardRef={cardRef} className={className} />;
  }
  return <IdCard data={data} cardRef={cardRef} className={className} />;
};
