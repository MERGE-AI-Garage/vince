// ABOUTME: Compact right-sidebar panel promoting the Vince Chrome Extension
// ABOUTME: Shown when "Product Recontext" mode is selected; includes download and install steps

import { Chrome, Download, Palette, Sparkles, Zap, Globe, CheckCircle2 } from 'lucide-react';

const DOWNLOAD_URL = '/vince-extension.zip';

const features = [
  { icon: Palette, label: 'Multi-Brand Switching', color: 'text-emerald-500' },
  { icon: Sparkles, label: 'LLM Prompt Builder', color: 'text-purple-500' },
  { icon: Zap, label: 'QuickStarters', color: 'text-amber-500' },
  { icon: Globe, label: 'Site Detection', color: 'text-blue-500' },
];

const installSteps = [
  'Click Download Extension below',
  'Unzip to a permanent folder',
  'Open Chrome → chrome://extensions',
  'Enable Developer mode, click Load unpacked',
  'Select the unzipped folder and pin the extension',
];

export function ExtensionDownloadPanel() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Chrome className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Chrome Extension</h3>
      </div>

      {/* Hero card */}
      <div className="rounded-xl bg-gradient-to-br from-[#133B34] to-[#0D1B16] border border-[#00856C]/30 p-4 text-center">
        <Chrome className="w-8 h-8 text-[#1ED75F] mx-auto mb-2" />
        <p className="text-sm font-semibold text-white">Brand Intelligence,</p>
        <p className="text-sm font-semibold text-white mb-1">Everywhere You Create</p>
        <p className="text-[11px] text-white/50 leading-relaxed mb-4">
          Full brand context in a sidebar — available next to any AI tool.
        </p>
        <a
          href={DOWNLOAD_URL}
          download
          className="inline-flex items-center gap-2 rounded-lg bg-[#1ED75F] text-[#0D1B16] font-semibold text-xs px-5 py-2 hover:bg-[#1ED75F]/90 transition-colors shadow-lg shadow-[#1ED75F]/20"
        >
          <Download className="w-3.5 h-3.5" />
          Download Extension
        </a>
        <p className="text-[10px] text-white/30 mt-2">v1.0.0 · Chrome · Requires Vince account</p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 gap-2">
        {features.map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-muted/50 border border-border/40"
          >
            <Icon className={`w-3 h-3 shrink-0 ${color}`} />
            <span className="text-[10px] font-medium leading-tight">{label}</span>
          </div>
        ))}
      </div>

      {/* Platforms */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Works with</p>
        <div className="flex flex-wrap gap-1">
          {['ChatGPT', 'Gemini', 'Claude', 'Midjourney', 'Firefly', 'Copilot'].map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border/40 bg-muted/30 text-[10px] text-muted-foreground"
            >
              <CheckCircle2 className="w-2.5 h-2.5 text-[#1ED75F]" />
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Install steps */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Installation</p>
        <div className="rounded-lg border border-border/40 divide-y divide-border/40 overflow-hidden">
          {installSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5 px-3 py-2">
              <span className="w-4 h-4 rounded-full bg-[#00856C]/15 text-[#00856C] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-[11px] text-muted-foreground leading-snug">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
