import React from 'react';
import { BuilderData } from '../types';
import { POPULAR_STACKS, THEMES } from '../constants';
import { Sparkles, RefreshCw, Palette, Github, User, Code } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface BuilderFormProps {
  data: BuilderData;
  onChange: (updates: Partial<BuilderData>) => void;
  onGenerateRandomTitle: () => void;
}

const MAX_STACK = 6;

export const BuilderForm: React.FC<BuilderFormProps> = ({
  data,
  onChange,
  onGenerateRandomTitle,
}) => {
  const { toast } = useToast();

  const toggleStack = (tech: string) => {
    const current = data.stack ?? [];
    if (current.includes(tech)) {
      onChange({ stack: current.filter((item) => item !== tech) });
    } else {
      if (current.length >= MAX_STACK) {
        toast(`Maximum ${MAX_STACK} technologies allowed for clean badge rendering.`, 'error');
        return;
      }
      onChange({ stack: [...current, tech] });
    }
  };

  return (
    <div
      className="glass-panel p-6 rounded-xl space-y-6 border border-white/10"
      role="form"
      aria-label="Builder credentials form"
    >
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-white/10">
        <h3 className="text-lg font-bold text-[#dbfcff] flex items-center gap-2">
          <User className="w-5 h-5 text-[#00f0ff]" aria-hidden="true" />
          Builder Credentials
        </h3>
        <span
          className="font-mono text-xs px-2.5 py-1 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20"
          aria-label={`Badge ID: ${data.badgeNumber}`}
        >
          ID: #{data.badgeNumber}
        </span>
      </div>

      {/* Builder Name */}
      <div>
        <label htmlFor="builder-name" className="block text-xs font-mono text-[#b9cacb] uppercase mb-1.5">
          Builder Name *
        </label>
        <input
          id="builder-name"
          type="text"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Alex Dev"
          maxLength={40}
          required
          aria-required="true"
          className="w-full px-4 py-3 rounded-lg bg-[#0e0e0e] border border-white/10 text-[#e5e2e1] focus:outline-none focus:border-[#00f0ff] transition-colors placeholder:text-[#4a5568]"
        />
      </div>

      {/* Builder Title */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label htmlFor="builder-title" className="text-xs font-mono text-[#b9cacb] uppercase flex items-center gap-1">
            Builder Title
            <Sparkles className="w-3 h-3 text-[#ff24e4]" aria-hidden="true" />
          </label>
          <button
            type="button"
            onClick={onGenerateRandomTitle}
            className="text-xs font-mono text-[#00f0ff] hover:underline flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00f0ff] rounded"
            aria-label="Generate a random builder title"
          >
            <RefreshCw className="w-3 h-3" aria-hidden="true" /> Roll Title
          </button>
        </div>
        <input
          id="builder-title"
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Full Stack Alchemist"
          maxLength={40}
          className="w-full px-4 py-3 rounded-lg bg-[#0e0e0e] border border-white/10 text-[#00f0ff] font-mono text-sm focus:outline-none focus:border-[#ff24e4] transition-colors placeholder:text-[#4a5568]"
        />
      </div>

      {/* Primary Role */}
      <div>
        <label htmlFor="builder-role" className="block text-xs font-mono text-[#b9cacb] uppercase mb-1.5">
          Primary Role
        </label>
        <input
          id="builder-role"
          type="text"
          value={data.role}
          onChange={(e) => onChange({ role: e.target.value })}
          placeholder="e.g. Creative Developer"
          maxLength={50}
          className="w-full px-4 py-3 rounded-lg bg-[#0e0e0e] border border-white/10 text-[#e5e2e1] focus:outline-none focus:border-[#00f0ff] transition-colors placeholder:text-[#4a5568]"
        />
      </div>

      {/* GitHub */}
      <div>
        <label htmlFor="builder-github" className="block text-xs font-mono text-[#b9cacb] uppercase mb-1.5 flex items-center gap-1">
          <Github className="w-3.5 h-3.5" aria-hidden="true" /> GitHub Username
          <span className="normal-case opacity-50">(optional)</span>
        </label>
        <input
          id="builder-github"
          type="text"
          value={data.github ?? ''}
          onChange={(e) => onChange({ github: e.target.value })}
          placeholder="e.g. alexdev2026"
          maxLength={40}
          className="w-full px-4 py-3 rounded-lg bg-[#0e0e0e] border border-white/10 text-[#e5e2e1] focus:outline-none focus:border-[#00f0ff] transition-colors placeholder:text-[#4a5568]"
        />
      </div>

      {/* Stack Selector */}
      <div>
        <label className="block text-xs font-mono text-[#b9cacb] uppercase mb-2 flex items-center gap-1" id="stack-label">
          <Code className="w-3.5 h-3.5" aria-hidden="true" />
          Core Tech Stack
          <span className="normal-case opacity-50">(up to {MAX_STACK})</span>
          <span className="ml-auto text-[#00f0ff]">{data.stack?.length ?? 0}/{MAX_STACK}</span>
        </label>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-labelledby="stack-label"
        >
          {POPULAR_STACKS.map((tech) => {
            const isSelected = (data.stack ?? []).includes(tech);
            return (
              <button
                key={tech}
                type="button"
                onClick={() => toggleStack(tech)}
                aria-pressed={isSelected}
                aria-label={`${tech} — ${isSelected ? 'selected, click to remove' : 'click to add'}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#00f0ff] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'bg-white/5 border border-white/10 text-[#b9cacb] hover:bg-white/10'
                }`}
              >
                {tech} {isSelected ? '✓' : '+'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Picker */}
      <div className="pt-2 border-t border-white/10">
        <label className="block text-xs font-mono text-[#b9cacb] uppercase mb-3 flex items-center gap-1" id="theme-label">
          <Palette className="w-3.5 h-3.5 text-[#ff24e4]" aria-hidden="true" /> Cyber Theme Palette
        </label>
        <div
          className="grid grid-cols-3 gap-3"
          role="group"
          aria-labelledby="theme-label"
        >
          {THEMES.map((theme) => {
            const isActive = data.themeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onChange({ themeId: theme.id })}
                aria-pressed={isActive}
                aria-label={`${theme.name} theme${isActive ? ' — currently selected' : ''}`}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#00f0ff] bg-[#00f0ff]/10 scale-[1.03] shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className={`w-full h-6 rounded-md bg-gradient-to-r ${theme.gradient}`} />
                <span className="text-xs font-mono text-[#e5e2e1] font-semibold">
                  {theme.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
