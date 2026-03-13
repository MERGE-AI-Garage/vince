// ABOUTME: Cinematic showcase modal for Vince — hackathon pitch for Gemini Live Agent Challenge
// ABOUTME: 6-slide Vince narrative: Voice → Video Drop + Tool Calls → Competitive Intel → DNA → Director → Output

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Mic, Clapperboard, AudioWaveform, X, ChevronRight,
  Palette, Shield, PenTool, Camera, Youtube,
  Target, Layers, Film, Zap,
} from 'lucide-react';

// ── Design tokens ────────────────────────────────────────────────────────────

const T = {
  bg:           'rgba(7, 8, 20, 0.98)',
  surface:      'rgba(255,255,255,0.04)',
  border:       'rgba(255,255,255,0.08)',
  accent:       '#7C3AED',
  accentBg:     'rgba(124,58,237,0.14)',
  accentBorder: 'rgba(124,58,237,0.28)',
  text:         'rgba(255,255,255,0.92)',
  sub:          'rgba(255,255,255,0.50)',
  muted:        'rgba(255,255,255,0.26)',
  dot:          '#9061F9',
  xboxGreen:    '#107C10',
} as const;

// ── Reusable cycling effect ──────────────────────────────────────────────────

function useCycle(steps: number[], onStep: (i: number) => void, loopMs: number) {
  useEffect(() => {
    let active = true;
    function run() {
      if (!active) return;
      const timers = [
        ...steps.map((ms, i) => setTimeout(() => active && onStep(i + 1), ms)),
        setTimeout(run, loopMs),
      ];
      return () => timers.forEach(clearTimeout);
    }
    const cleanup = run();
    return () => { active = false; cleanup?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ── Slide 1 — Voice Spectrum (Vince Intro) ───────────────────────────────────

const SPECTRUM = [0.25, 0.55, 0.80, 0.95, 0.70, 1.00, 0.60, 0.85, 0.45, 0.90,
                  0.75, 1.00, 0.50, 0.88, 0.65, 0.78, 0.40, 0.92, 0.55, 0.70];

function VoiceSpectrumVisual() {
  return (
    <div className="flex flex-col items-center gap-5 select-none">
      <div className="relative flex items-center justify-center">
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ width: 140 + i * 48, height: 140 + i * 48, border: '1px solid rgba(124,58,237,0.18)' }}
            animate={{ opacity: [0.25, 0.55, 0.25] }}
            transition={{ duration: 3, delay: i * 0.9, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        {[0, 1, 2].map(i => (
          <motion.div key={`p${i}`} className="absolute rounded-full"
            style={{ width: 100, height: 100, border: '1.5px solid rgba(124,58,237,0.45)' }}
            animate={{ scale: [0.35, 1.4], opacity: [0.6, 0] }}
            transition={{ duration: 2.4, delay: i * 0.65, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
        <motion.div
          className="relative z-10 flex items-center justify-center rounded-full"
          style={{ width: 64, height: 64, background: T.accentBg, border: `1px solid ${T.accentBorder}` }}
          animate={{ boxShadow: ['0 0 0px rgba(124,58,237,0)', '0 0 28px rgba(124,58,237,0.42)', '0 0 0px rgba(124,58,237,0)'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Mic className="w-7 h-7" style={{ color: T.accent }} />
        </motion.div>
      </div>

      <div className="flex items-end justify-center gap-[3px]" style={{ height: 52 }}>
        {SPECTRUM.map((h, i) => (
          <motion.div key={i} className="w-1.5 rounded-full"
            style={{ background: 'linear-gradient(to top, #7C3AED, #A78BFA)', originY: 1 }}
            animate={{ scaleY: [h * 0.35, h, h * 0.55, h * 0.88, h * 0.35] }}
            transition={{ duration: 1.2 + (i % 4) * 0.22, repeat: Infinity, ease: 'easeInOut', delay: i * 0.055 }}
            initial={{ scaleY: h * 0.35 }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <motion.div className="w-2 h-2 rounded-full" style={{ background: T.accent }}
          animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
        <span className="text-[11px] font-semibold tracking-[0.12em] uppercase"
          style={{ color: 'rgba(167,139,250,0.72)' }}>
          Gemini Live · Native Audio · Real-time
        </span>
      </div>
    </div>
  );
}

// ── Slide 2 — The Drop: Tool Call Conversation Flow ──────────────────────────
// Ported from AI Garage IntelligenceLayer ConversationFlow pattern

const VINCE_TOOLS = ['analyze_video(url)', 'extract_creative_strategy()', 'generate_competitive_brief(brand="Xbox")'];

function VinceDropVisual() {
  const [phase, setPhase] = useState(0);
  // 0=empty 1=user msg 2=yt chip 3=tool chips 4=processing 5=complete
  useCycle([350, 950, 1650, 2600, 3700], (i) => setPhase(i), 9000);

  return (
    <div className="w-full space-y-2.5">
      {/* User voice message */}
      {phase >= 1 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}
          className="flex justify-end">
          <div className="px-3 py-2 rounded-2xl rounded-tr-sm max-w-[88%] text-[11px] leading-relaxed"
            style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.28)', color: 'rgba(255,255,255,0.78)' }}>
            Apple just dropped a new ad. They're coming for us.
          </div>
        </motion.div>
      )}

      {/* YouTube link chip */}
      {phase >= 2 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}
          className="flex justify-end">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <Youtube className="w-3.5 h-3.5 shrink-0" style={{ color: '#FF0000' }} />
            <div>
              <div className="text-[9px] font-semibold" style={{ color: 'rgba(255,255,255,0.68)' }}>
                Apple — "Relentless" — iPhone 16e
              </div>
              <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.28)' }}>youtube.com · 1:23</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Vince tool calls — the money shot */}
      {phase >= 3 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
          <div className="text-[9px] font-medium mb-1.5 pl-1" style={{ color: T.muted }}>Vince</div>
          <div className="flex flex-wrap gap-1.5">
            {VINCE_TOOLS.map((tool, i) => (
              <motion.span key={tool}
                initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.18, duration: 0.22 }}
                className="px-2 py-1 rounded text-[9px] font-mono"
                style={{
                  background: 'rgba(124,58,237,0.12)',
                  color: 'rgba(167,139,250,0.80)',
                  border: '1px solid rgba(124,58,237,0.22)',
                }}>
                {tool}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Processing bar */}
      {phase === 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
          className="space-y-1.5 pl-1">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: T.dot }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 0.85, delay: i * 0.18, repeat: Infinity }} />
            ))}
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.28)' }}>Analyzing creative strategy...</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 2, background: 'rgba(255,255,255,0.07)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #7C3AED, #A78BFA)' }}
              initial={{ width: '0%' }} animate={{ width: '100%' }}
              transition={{ duration: 1.1, ease: 'easeInOut' }} />
          </div>
        </motion.div>
      )}

      {/* Complete */}
      {phase >= 5 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="px-3 py-2.5 rounded-2xl rounded-tl-sm"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', maxWidth: '94%' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] font-medium" style={{ color: T.muted }}>Vince</span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <div className="w-1 h-1 rounded-full" style={{ background: '#22C55E' }} />
              <span className="text-[8px] font-bold" style={{ color: '#4ADE80' }}>Analysis complete</span>
            </div>
          </div>
          <div className="text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.62)' }}>
            Emotion-first, specs buried. Price anchor without proof. Here's exactly where Xbox wins.
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Slide 3 — Competitive Intelligence Output ────────────────────────────────
// Directly mirrors the real Vince output from the screenshots

const INTEL_SECTIONS = [
  {
    label: 'COMPETITIVE INTEL',
    color: '#EF4444',
    items: [
      'Emotion-led, specs buried — "Relentless" feeling, no benchmarks',
      'Price anchor at $599 without performance context or comparison',
    ],
  },
  {
    label: 'STRATEGIC OPENINGS',
    color: '#F59E0B',
    items: [
      'Zero gaming benchmarks shown — Xbox dominates this lane',
      'No ecosystem depth — Halo, Game Pass, cross-device completely absent',
    ],
  },
  {
    label: 'COUNTER BRIEF — XBOX',
    color: T.xboxGreen,
    items: [
      '"Power. No Compromise." — Lead hard with specs, close with identity',
      'Tone: Bold · Defiant · Player-first · Never lifestyle, never soft',
    ],
  },
];

function CompetitiveIntelVisual() {
  const [visible, setVisible] = useState(0);
  useCycle([350, 1450, 2600], (i) => setVisible(i), 9000);

  return (
    <div className="w-full space-y-3">
      {INTEL_SECTIONS.map((sec, i) => (
        <motion.div key={sec.label}
          initial={{ opacity: 0, x: 16 }}
          animate={visible > i ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1 h-3 rounded-full shrink-0" style={{ background: sec.color }} />
            <span className="text-[9px] font-bold uppercase tracking-[0.13em]"
              style={{ color: `${sec.color}cc` }}>
              {sec.label}
            </span>
          </div>
          <div className="space-y-1 pl-3 border-l" style={{ borderColor: `${sec.color}20` }}>
            {sec.items.map((item, j) => (
              <motion.div key={j}
                initial={{ opacity: 0, x: 6 }}
                animate={visible > i ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.07 * j, duration: 0.22 }}
                className="flex items-start gap-1.5">
                <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: `${sec.color}55` }} />
                <span className="text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.68)' }}>
                  {item}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Slide 4 — Brand DNA Card Cascade (Xbox) ───────────────────────────────────

const DNA_SPECIALISTS = [
  { icon: Camera,  title: 'Director of Photography', detail: 'Dark studio · 35mm · Hard contrast · Green rim light', color: '#3B82F6' },
  { icon: Palette, title: 'Art Director',            detail: `Xbox Green ${T.xboxGreen} · Black bg · Aggressive space`, color: T.xboxGreen },
  { icon: PenTool, title: 'Copywriter',              detail: 'Bold · Defiant · Player-first · Never corporate',       color: '#8B5CF6' },
  { icon: Shield,  title: 'Brand Manager',           detail: 'Controller in frame · No lifestyle · No softness',      color: '#14B8A6' },
];

function DnaCardCascadeVisual() {
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCycle(c => c + 1), 5400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full space-y-1.5">
      {DNA_SPECIALISTS.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={`${s.title}-${cycle}`}
            initial={{ opacity: 0, x: 160, rotate: 5 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ delay: 0.06 + i * 0.13, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border"
            style={{ background: `${s.color}08`, borderColor: `${s.color}22` }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${s.color}18` }}>
              <Icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold leading-tight" style={{ color: 'rgba(255,255,255,0.88)' }}>
                {s.title}
              </div>
              <div className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.30)' }}>
                {s.detail}
              </div>
            </div>
            <motion.div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.8, delay: 0.5 + i * 0.2, repeat: Infinity }} />
          </motion.div>
        );
      })}
      <motion.p key={`src-${cycle}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.78 }} className="text-center text-[10px] pt-0.5"
        style={{ color: 'rgba(255,255,255,0.18)' }}>
        Extracted from xbox.com · brand guidelines
      </motion.p>
    </div>
  );
}

// ── Slide 5 — Director Mode: Animated Field Fill (Xbox counter-ad) ────────────

const DIRECTOR_FIELDS = [
  { label: 'Scene',    value: 'Dark arena, lone player, crowd blur bg',    color: '#3B82F6' },
  { label: 'Lens',     value: '35mm f/1.4, rack focus hands → screen',    color: T.xboxGreen },
  { label: 'Lighting', value: 'Deep blue key · hard green rim · flare',   color: '#8B5CF6' },
  { label: 'Camera',   value: 'Handheld push in → crane pull back',        color: '#14B8A6' },
];

function DirectorFillVisual() {
  const [phase, setPhase] = useState<'empty' | 'glow' | 'filled'>('empty');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    function runCycle() {
      if (!active) return;
      setPhase('empty');
      const t1 = setTimeout(() => active && setPhase('glow'), 1000);
      const t2 = setTimeout(() => active && setPhase('filled'), 1800);
      const t3 = setTimeout(() => {
        if (active) { setPhase('empty'); setTick(n => n + 1); }
      }, 5200);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
    const cleanup = runCycle();
    return () => { active = false; cleanup?.(); };
  }, [tick]);

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Clapperboard className="w-3 h-3" style={{ color: T.muted }} />
        <span className="text-[9px] font-bold uppercase tracking-[0.13em]" style={{ color: T.muted }}>
          Right Panel · Director Mode
        </span>
      </div>

      {DIRECTOR_FIELDS.map((f, i) => (
        <motion.div key={f.label}
          animate={{ borderLeftColor: phase === 'filled' ? f.color : 'rgba(255,255,255,0.08)' }}
          transition={{ delay: phase === 'filled' ? 0.08 * i : 0, duration: 0.3 }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
          style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeftWidth: 2 }}
        >
          <span className="text-[10px] font-medium shrink-0 w-12" style={{ color: T.muted }}>{f.label}</span>
          <AnimatePresence mode="wait">
            {phase === 'filled' ? (
              <motion.span key="filled" initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }} transition={{ delay: 0.07 * i, duration: 0.25 }}
                className="text-[11px]" style={{ color: 'rgba(255,255,255,0.78)' }}>
                {f.value}
              </motion.span>
            ) : (
              <motion.span key="empty" initial={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[11px]" style={{ color: 'rgba(255,255,255,0.18)' }}>—</motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      <div className="relative mt-2">
        {phase === 'glow' && (
          <motion.div className="absolute inset-0 rounded-lg"
            style={{ background: 'rgba(124,58,237,0.38)', filter: 'blur(12px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.75 }} />
        )}
        <motion.div
          animate={phase === 'glow' ? { scale: [1, 1.04, 1] } : {}}
          transition={{ duration: 0.35 }}
          className="relative flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold cursor-default"
          style={{
            background: phase !== 'empty'
              ? 'linear-gradient(135deg,rgba(124,58,237,0.28),rgba(109,40,217,0.28))'
              : T.accentBg,
            border: `1px solid ${T.accentBorder}`,
            color: '#C4B5FD',
          }}
        >
          <span style={{ fontSize: 10 }}>✦</span>
          Enhance with Brand DNA
        </motion.div>
      </div>
    </div>
  );
}

// ── Slide 6 — Creative Package Output ────────────────────────────────────────
// Mirrors the real "Creative package ready" output from the Vince screenshots

const HEADLINE_WORDS = ['Power.', 'No', 'Compromise.'];
const PACKAGE_TAGS = ['Brand Aligned', 'Counter Brief', 'Director Spec', 'Veo 3 Ready'];

function CreativePackageVisual() {
  const [words, setWords] = useState(0);
  const [showImg, setShowImg] = useState(false);
  const [showTags, setShowTags] = useState(false);

  useEffect(() => {
    let active = true;
    function run() {
      if (!active) return;
      setWords(0); setShowImg(false); setShowTags(false);
      const timers = [
        setTimeout(() => active && setWords(1), 300),
        setTimeout(() => active && setWords(2), 680),
        setTimeout(() => active && setWords(3), 1020),
        setTimeout(() => active && setShowImg(true), 1500),
        setTimeout(() => active && setShowTags(true), 2150),
        setTimeout(run, 7800),
      ];
      return () => timers.forEach(clearTimeout);
    }
    const cleanup = run();
    return () => { active = false; cleanup?.(); };
  }, []);

  return (
    <div className="w-full space-y-2">
      {/* Package ready badge */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full"
          style={{ background: T.accentBg, border: `1px solid ${T.accentBorder}` }}>
          <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22C55E' }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          <span className="text-[9px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'rgba(167,139,250,0.88)' }}>
            Creative Package Ready
          </span>
        </div>
        <div className="flex items-center gap-1 text-[9px]" style={{ color: T.muted }}>
          <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>Xbox</span>
          <span>·</span><span>0:23s</span>
        </div>
      </motion.div>

      {/* Card */}
      <div className="rounded-xl overflow-hidden"
        style={{ background: `${T.xboxGreen}09`, border: `1px solid ${T.xboxGreen}28` }}>
        {/* Headline */}
        <div className="px-4 py-3 border-b" style={{ borderColor: `${T.xboxGreen}18` }}>
          <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5"
            style={{ color: `${T.xboxGreen}aa` }}>Headline</div>
          <div className="text-[20px] font-bold tracking-tight leading-tight"
            style={{ color: T.text, fontFamily: 'system-ui,-apple-system,sans-serif', minHeight: 28 }}>
            {HEADLINE_WORDS.slice(0, words).join(' ')}
            {words < HEADLINE_WORDS.length && (
              <motion.span className="inline-block w-[11px] h-[22px] ml-1 rounded-sm align-middle"
                style={{ background: T.accent, verticalAlign: 'middle' }}
                animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.7, repeat: Infinity }} />
            )}
          </div>
        </div>

        {/* Generated image / Veo preview */}
        <AnimatePresence>
          {showImg && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
              className="relative overflow-hidden"
              style={{ height: 64, background: `linear-gradient(135deg, ${T.xboxGreen}18, rgba(7,8,20,0.85))` }}>
              <motion.div className="absolute inset-y-0 w-24 pointer-events-none"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)' }}
                animate={{ x: [-96, 440] }}
                transition={{ duration: 2.0, repeat: Infinity, ease: 'linear', repeatDelay: 0.5 }} />
              <div className="absolute inset-0 flex items-center justify-center gap-2">
                <Film className="w-4 h-4" style={{ color: `${T.xboxGreen}66` }} />
                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  Generating · Veo 3 · 30s spot
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tags */}
        <AnimatePresence>
          {showTags && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="px-4 py-2.5 flex items-center gap-1.5 flex-wrap">
              {PACKAGE_TAGS.map((tag, i) => (
                <motion.span key={tag}
                  initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.07 * i, duration: 0.2 }}
                  className="text-[8px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${T.xboxGreen}15`, color: `${T.xboxGreen}cc`, border: `1px solid ${T.xboxGreen}28` }}>
                  {tag}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Slide definitions ────────────────────────────────────────────────────────

interface SlideData {
  icon: React.ElementType;
  label: string;
  headline: string;
  sub: string;
  visual: React.ReactNode | null;
  fullWidth?: boolean;
}

const SLIDES: SlideData[] = [
  {
    icon: Mic,
    label: 'CREATIVE DIRECTOR',
    headline: 'Meet Vince.\nYour AI Creative Director.',
    sub: "Powered by Gemini Live native audio. Vince knows your brand cold — every photography spec, color rule, tone of voice. Brief him out loud. Get a complete campaign.",
    visual: <VoiceSpectrumVisual />,
    fullWidth: true,
  },
  {
    icon: Youtube,
    label: 'VIDEO INTELLIGENCE',
    headline: "Drop a competitor's video.\nVince is already watching.",
    sub: "Share a YouTube link. Vince calls analyze_video(), extract_creative_strategy(), generate_competitive_brief() — competitive intel in seconds, brand-governed from word one.",
    visual: <VinceDropVisual />,
  },
  {
    icon: Target,
    label: 'COMPETITIVE INTEL',
    headline: "What they're claiming.\nWhere they're exposed.",
    sub: "Vince surfaces their strategy — the emotional hooks, the spec gaps, the claims they can't back up. Then writes your counter brief.",
    visual: <CompetitiveIntelVisual />,
  },
  {
    icon: Layers,
    label: 'BRAND DNA',
    headline: 'Every output,\nbrand-governed.',
    sub: "Four specialist layers — photography, color science, copy voice, brand compliance — active on every generation. Extracted from your guidelines, never guessed.",
    visual: <DnaCardCascadeVisual />,
  },
  {
    icon: Clapperboard,
    label: 'DIRECTOR MODE',
    headline: 'Brief to Veo.\nCinematography locked.',
    sub: 'Switch to Video. Director Mode opens in the right panel — scene, lens, lighting, camera movement. "Enhance with Brand DNA" fills every field from your brand\'s photography standards.',
    visual: <DirectorFillVisual />,
  },
  {
    icon: AudioWaveform,
    label: 'GET STARTED',
    headline: 'One voice session.\nComplete campaign.',
    sub: "Competitive intel. Counter brief. Director specs. Brand-governed imagery. All from speaking to Vince.",
    visual: <CreativePackageVisual />,
    fullWidth: true,
  },
];

// ── Transitions ──────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 52 : -52, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -52 : 52, opacity: 0 }),
};

// ── Component ────────────────────────────────────────────────────────────────

interface ShowcaseModalProps {
  open: boolean;
  onClose: () => void;
  onStartTour?: () => void;  // opens Vince voice mode
}

export function ShowcaseModal({ open, onClose, onStartTour }: ShowcaseModalProps) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const isLast = idx === SLIDES.length - 1;
  const slide = SLIDES[idx];

  const advance = useCallback(() => {
    if (isLast) { onClose(); return; }
    setDir(1); setIdx(i => i + 1);
  }, [isLast, onClose]);

  const back = useCallback(() => {
    if (idx === 0) return;
    setDir(-1); setIdx(i => i - 1);
  }, [idx]);

  const dismiss = useCallback(() => onClose(), [onClose]);

  const handleOpenVince = useCallback(() => {
    onClose();
    onStartTour?.();
  }, [onClose, onStartTour]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') advance();
      else if (e.key === 'ArrowLeft') back();
      else if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, advance, back, dismiss]);

  useEffect(() => {
    if (open) { setIdx(0); setDir(1); }
  }, [open]);

  const Icon = slide.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={e => { if (e.target === e.currentTarget) dismiss(); }}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 20 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full flex flex-col"
            style={{
              maxWidth: 640,
              background: T.bg,
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              boxShadow: '0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.05)',
              overflow: 'hidden',
            }}
          >
            {/* Close */}
            <button onClick={dismiss}
              className="absolute top-4 right-4 z-20 flex items-center justify-center w-7 h-7 rounded-full transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', color: T.muted }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.cssText += 'color:rgba(255,255,255,0.9);background:rgba(255,255,255,0.13)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.cssText += `color:${T.muted};background:rgba(255,255,255,0.07)`; }}
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Fixed-height content — prevents accordion */}
            <div style={{ height: 480, overflow: 'hidden' }}>
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div key={idx} custom={dir}
                  variants={slideVariants} initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full"
                >
                  {slide.fullWidth ? (
                    /* Full-width layout (Vince intro, CTA) */
                    <div className="h-full px-10 pt-8 pb-4 flex flex-col">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: T.accentBg, border: `1px solid ${T.accentBorder}` }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: T.accent }} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em]"
                          style={{ color: 'rgba(167,139,250,0.75)' }}>{slide.label}</span>
                      </div>

                      <h2 style={{ fontSize: 28, fontWeight: 660, lineHeight: 1.16, letterSpacing: '-0.036em', color: T.text, whiteSpace: 'pre-line', fontFamily: 'system-ui,-apple-system,sans-serif', flexShrink: 0 }}>
                        {slide.headline}
                      </h2>
                      <p className="mt-3" style={{ fontSize: 14, lineHeight: 1.62, color: T.sub, maxWidth: 480, flexShrink: 0 }}>
                        {slide.sub}
                      </p>

                      <div className="flex-1 flex items-center justify-center mt-4 overflow-hidden">
                        {slide.visual}
                      </div>

                      {isLast && (
                        <div className="flex flex-col items-center gap-3 mt-3">
                          <button onClick={handleOpenVince}
                            className="relative overflow-hidden flex items-center gap-2 font-semibold transition-all"
                            style={{ fontSize: 14, background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', boxShadow: '0 4px 22px rgba(124,58,237,0.46), 0 0 0 1px rgba(124,58,237,0.32)', color: '#fff', border: 'none', borderRadius: 11, height: 44, padding: '0 24px', cursor: 'pointer', letterSpacing: '-0.01em' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 7px 28px rgba(124,58,237,0.62)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 22px rgba(124,58,237,0.46)'; }}
                          >
                            <motion.div className="absolute inset-y-0 w-16 pointer-events-none"
                              style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)' }}
                              animate={{ x: [-64, 340] }}
                              transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', repeatDelay: 0.9 }} />
                            Talk to Vince
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button onClick={dismiss}
                            className="text-[11px] transition-colors"
                            style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.sub; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.muted; }}
                          >
                            Skip — explore the studio
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Split layout (video, intel, DNA, director) */
                    <div className="h-full flex">
                      <div className="flex flex-col justify-center px-8 pt-10 pb-6" style={{ width: '44%', flexShrink: 0 }}>
                        <div className="flex items-center gap-2 mb-5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: T.accentBg, border: `1px solid ${T.accentBorder}` }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: T.accent }} />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.14em]"
                            style={{ color: 'rgba(167,139,250,0.75)' }}>{slide.label}</span>
                        </div>
                        <h2 style={{ fontSize: 21, fontWeight: 660, lineHeight: 1.22, letterSpacing: '-0.030em', color: T.text, whiteSpace: 'pre-line', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
                          {slide.headline}
                        </h2>
                        <p className="mt-3" style={{ fontSize: 13, lineHeight: 1.62, color: T.sub }}>
                          {slide.sub}
                        </p>
                      </div>

                      <div className="self-stretch my-8" style={{ width: 1, background: T.border, flexShrink: 0 }} />

                      <div className="flex-1 flex items-center justify-center px-5 py-6 overflow-hidden">
                        <div className="w-full" style={{ maxHeight: 420, overflow: 'hidden' }}>
                          {slide.visual}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 flex items-center gap-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-1.5 flex-1">
                {SLIDES.map((_, i) => (
                  <button key={i} onClick={() => { setDir(i > idx ? 1 : -1); setIdx(i); }}
                    className="rounded-full transition-all duration-200"
                    style={{ width: i === idx ? 18 : 5, height: 5, background: i === idx ? T.dot : 'rgba(255,255,255,0.14)', border: 'none', cursor: 'pointer', flexShrink: 0 }} />
                ))}
              </div>

              {idx > 0 && !isLast && (
                <button onClick={back} className="text-[13px] transition-colors"
                  style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.sub; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.muted; }}>
                  ← Back
                </button>
              )}

              {!isLast && (
                <button onClick={advance}
                  className="flex items-center gap-1.5 font-semibold transition-all"
                  style={{ fontSize: 13, background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', boxShadow: '0 3px 12px rgba(124,58,237,0.36)', color: '#fff', border: 'none', borderRadius: 8, height: 32, padding: '0 16px', cursor: 'pointer', letterSpacing: '-0.01em' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 5px 18px rgba(124,58,237,0.54)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 3px 12px rgba(124,58,237,0.36)'; }}>
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
