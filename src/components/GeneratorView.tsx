import React, { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { toPng } from 'html-to-image';
import { BuilderData } from '../types';
import { PhotoUploader } from './PhotoUploader';
import { BuilderForm } from './BuilderForm';
import { CardCanvas } from './CardCanvas';
import { IdentityPanel } from './IdentityPanel';
import { BUILDER_TITLES } from '../constants';
import { ArrowRight, ArrowLeft, Eye, Sparkles, CheckCircle, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface GeneratorViewProps {
  data: BuilderData;
  onChange: (updates: Partial<BuilderData>) => void;
  onGenerate: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: 'Upload',
  2: 'Adjust',
  3: 'Details',
};

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? -40 : 40,
    opacity: 0,
  }),
};

export const GeneratorView: React.FC<GeneratorViewProps> = ({
  data,
  onChange,
  onGenerate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [savingProfile, setSavingProfile] = useState(false);
  const { user, saveProfile } = useAuth();
  const { toast } = useToast();

  const cardRef = useRef<HTMLDivElement>(null);

  const goToStep = (next: Step) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const rollRandomTitle = () => {
    const idx = Math.floor(Math.random() * BUILDER_TITLES.length);
    onChange({ title: BUILDER_TITLES[idx] });
  };

  const handleSaveProfile = useCallback(async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      let cardImageBase64 = '';
      if (cardRef.current) {
        try {
          // Wait for DOM to settle
          await new Promise((r) => setTimeout(r, 150));
          cardImageBase64 = await toPng(cardRef.current, {
            quality: 0.85,
            pixelRatio: 1.5, // 1.5x ratio is fast to transmit and ideal size for OG image previews
            cacheBust: true,
            style: { borderRadius: '0' },
          });
        } catch (err) {
          console.error('Failed to capture card PNG for database/storage:', err);
        }
      }

      const saved = await saveProfile({
        name: data.name,
        title: data.title,
        role: data.role,
        stack: data.stack,
        github: data.github,
        theme_id: data.themeId,
        badge_number: data.badgeNumber,
        photo_url: data.photoUrl || undefined,
        crop: data.crop,
        zoom: data.zoom,
        rotation: data.rotation,
        cropped_area_pixels: data.croppedAreaPixels,
        card_image_base64: cardImageBase64 || undefined,
      } as any);

      if (saved) {
        toast(`Builder ID minted: ${saved.builder_id}`, 'success');
        onChange({ builderId: saved.builder_id });
      }
    } finally {
      setSavingProfile(false);
    }
  }, [user, saveProfile, data, toast]);

  const handleNext = () => {
    if (step < 3) {
      goToStep((step + 1) as Step);
    } else {
      onGenerate();
    }
  };

  const handleBack = () => {
    if (step > 1) goToStep((step - 1) as Step);
  };

  return (
    <div className="max-w-[1280px] mx-auto w-full pt-8 pb-16 px-6 space-y-10">
      {/* Page header */}
      <div className="text-center space-y-3">
        <h1 className="font-headline-md text-4xl md:text-6xl font-extrabold text-[#dbfcff]">
          Generate Your Frame
        </h1>
        <p className="font-body-lg text-lg text-[#b9cacb] max-w-xl mx-auto">
          Upload your avatar, adjust the details, and mint your official HH Goa 2026 digital badge.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left column ────────────────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step indicator */}
          <nav
            className="flex items-center glass-panel p-4 rounded-xl border border-white/10"
            aria-label="Progress steps"
          >
            {([1, 2, 3] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <button
                  onClick={() => goToStep(s)}
                  aria-current={step === s ? 'step' : undefined}
                  aria-label={`Step ${s}: ${STEP_LABELS[s]}`}
                  className={`flex items-center gap-2 cursor-pointer transition-opacity ${
                    step === s ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      step >= s
                        ? 'bg-[#00f0ff] text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                        : 'border border-white/20 text-[#b9cacb]'
                    }`}
                  >
                    {s}
                  </div>
                  <span className="text-xs font-mono font-bold text-[#e5e2e1]">
                    {STEP_LABELS[s]}
                  </span>
                </button>
                {i < 2 && (
                  <div className="h-px bg-white/20 flex-1 mx-3" aria-hidden="true" />
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Undo / Redo toolbar */}
          <div className="flex justify-between items-center px-1">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                aria-label="Undo last change"
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[#b9cacb] disabled:opacity-30 cursor-pointer hover:bg-white/10 disabled:cursor-not-allowed transition-colors"
              >
                ↩ Undo
              </button>
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                aria-label="Redo last change"
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[#b9cacb] disabled:opacity-30 cursor-pointer hover:bg-white/10 disabled:cursor-not-allowed transition-colors"
              >
                ↪ Redo
              </button>
            </div>
            <span className="text-[11px] font-mono text-[#00f0ff] flex items-center gap-1" aria-live="polite">
              <Sparkles className="w-3 h-3" aria-hidden="true" /> Autosaved
            </span>
          </div>

          {/* Animated step content */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
              >
                {step === 1 || step === 2 ? (
                  <PhotoUploader
                    photoUrl={data.photoUrl}
                    crop={data.crop}
                    zoom={data.zoom}
                    rotation={data.rotation}
                    onPhotoChange={(url) => onChange({ photoUrl: url })}
                    onCropChange={(crop) => onChange({ crop })}
                    onZoomChange={(zoom) => onChange({ zoom })}
                    onRotationChange={(rotation) => onChange({ rotation })}
                    onCropComplete={(_, pixels) => onChange({ croppedAreaPixels: pixels })}
                  />
                ) : (
                  <BuilderForm
                    data={data}
                    onChange={onChange}
                    onGenerateRandomTitle={rollRandomTitle}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center pt-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Go to previous step"
                className="px-6 py-3 rounded-lg border border-white/20 text-[#e5e2e1] font-mono text-sm hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
              </button>
            ) : (
              <div aria-hidden="true" />
            )}

            <button
              type="button"
              onClick={handleNext}
              aria-label={step === 3 ? 'Mint and export badge' : 'Go to next step'}
              className="btn-primary-gradient px-8 py-3.5 rounded-lg font-bold text-black font-headline-md text-base hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center gap-2 cursor-pointer"
            >
              {step === 3 ? (
                <>Mint &amp; Export Badge <CheckCircle className="w-5 h-5" aria-hidden="true" /></>
              ) : (
                <>Next Step <ArrowRight className="w-5 h-5" aria-hidden="true" /></>
              )}
            </button>
          </div>
        </div>

        {/* ── Right column: live preview + identity ─── */}
        <aside className="lg:col-span-5 sticky top-28 space-y-4" aria-label="Live badge preview">
          <div className="glass-panel p-6 rounded-xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-xl text-[#dbfcff] font-bold flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#00f0ff]" aria-hidden="true" /> Live Badge Preview
              </h2>
              <span className="font-mono text-[10px] bg-[#201f1f] px-2 py-1 rounded text-[#fface8] border border-white/5">
                PREVIEW_MODE
              </span>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-[340px]">
                <CardCanvas cardRef={cardRef} data={data} cardType="card" />
              </div>
            </div>
          </div>

          {/* Identity Panel — optional sign-in & wallet */}
          <IdentityPanel
            onNameSynced={(name, avatar) => {
              if (!data.name) onChange({ name });
              if (avatar && !data.photoUrl) onChange({ photoUrl: avatar });
            }}
          />

          {/* Save Profile CTA — only shown when logged in */}
          {user && (
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile || !data.name}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-mono text-sm font-bold bg-[#ff24e4]/10 hover:bg-[#ff24e4]/20 border border-[#ff24e4]/20 text-[#ff24e4] hover:text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,36,228,0.1)]"
              aria-label="Save builder profile and mint Builder ID"
            >
              {savingProfile ? (
                <>Minting Builder ID…</>
              ) : (
                <><Save className="w-4 h-4" /> Save & Mint Builder ID</>
              )}
            </button>
          )}
        </aside>
      </div>
    </div>
  );
};
