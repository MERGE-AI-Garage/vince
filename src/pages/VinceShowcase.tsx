// ABOUTME: Comprehensive showcase page for Vince — AI Creative Director.
// ABOUTME: Apple/Google product-launch aesthetic. Full-bleed sections. Every feature.

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Bot,
  Zap,
  Layers,
  Globe,
  Smartphone,
  Chrome,
  Dna,
  BarChart2,
  FileText,
  Image,
  Video,
  Volume2,
  BrainCircuit,
  MonitorPlay,
  Sparkles,
  ChevronRight,
  Star,
  ArrowRight,
  Play,
  CheckCircle2,
  Circle,
  Database,
  Server,
  Cpu,
  MessageSquare,
  Camera,
  Package,
  Award,
  Users,
  Clock,
  TrendingUp,
  Copy,
  ClipboardCheck,
} from 'lucide-react';

// ─── Brand palette ────────────────────────────────────────────────────────────
const GREEN = '#1ED75F';
const BLUE = '#4285F4';
const ORANGE = '#F97316';
const PURPLE = '#A78BFA';
const TEAL = '#2DD4BF';
const ROSE = '#F43F5E';

// Muted glow colors — dark/desaturated versions for ambient section backgrounds.
// Vivid brand colors look neon as blurs; these match the WelcomeScreen treatment.
const GLOW_GREEN = '#0A5C28';
const GLOW_BLUE = '#1A4A8A';
const GLOW_ORANGE = '#6B3A0A';
const GLOW_PURPLE = '#4A3A7A';
const GLOW_TEAL = '#0D6B60';
const GLOW_ROSE = '#6B1A2A';

// ─── Fade-in section wrapper ──────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-8 py-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
      <span className="text-4xl font-black tracking-tighter" style={{ color }}>
        {value}
      </span>
      <span className="text-sm text-white/50 text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── Feature badge ────────────────────────────────────────────────────────────
function Badge({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium"
      style={{ borderColor: `${color}40`, color, backgroundColor: `${color}10` }}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
}

// ─── Section glow blobs ───────────────────────────────────────────────────────
// motion.div handles x/y drift; inner div uses CSS animate-pulse for opacity —
// matching WelcomeScreen brand-page treatment exactly (same opacities, same pulse).
function SectionGlow({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4"
        animate={{ x: [0, 60, -35, 15, 0], y: [0, -35, 60, -20, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="w-full h-full rounded-full opacity-[0.025] blur-3xl animate-pulse"
          style={{ background: `radial-gradient(circle, ${color}, transparent)`, animationDuration: '6s' }}
        />
      </motion.div>
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4"
        animate={{ x: [0, -45, 25, -15, 0], y: [0, 35, -45, 20, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      >
        <div
          className="w-full h-full rounded-full opacity-[0.015] blur-3xl animate-pulse"
          style={{ background: `radial-gradient(circle, ${color}, transparent)`, animationDuration: '8s', animationDelay: '2s' }}
        />
      </motion.div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5))]" />
    </div>
  );
}

// Hero glows — three drifting orbs, WelcomeScreen "no brand" opacities + movement.
// Four-corner ambient blobs — one muted color per corner, slow drift + pulse.
function HeroGlow() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top-left — green */}
      <motion.div
        className="absolute -top-1/4 -left-1/4 w-2/3 h-2/3"
        animate={{ x: [0, 35, -20, 10, 0], y: [0, -20, 35, -10, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-full h-full rounded-full opacity-[0.05] blur-3xl animate-pulse"
          style={{ background: `radial-gradient(circle, ${GLOW_GREEN}, transparent)`, animationDuration: '8s' }} />
      </motion.div>
      {/* Top-right — orange */}
      <motion.div
        className="absolute -top-1/4 -right-1/4 w-2/3 h-2/3"
        animate={{ x: [0, -30, 20, -10, 0], y: [0, -15, 30, -10, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      >
        <div className="w-full h-full rounded-full opacity-[0.04] blur-3xl animate-pulse"
          style={{ background: `radial-gradient(circle, ${GLOW_ORANGE}, transparent)`, animationDuration: '10s', animationDelay: '2s' }} />
      </motion.div>
      {/* Bottom-left — blue */}
      <motion.div
        className="absolute -bottom-1/4 -left-1/4 w-2/3 h-2/3"
        animate={{ x: [0, 25, -35, 15, 0], y: [0, 30, -20, 10, 0] }}
        transition={{ duration: 36, repeat: Infinity, ease: 'easeInOut', delay: 7 }}
      >
        <div className="w-full h-full rounded-full opacity-[0.04] blur-3xl animate-pulse"
          style={{ background: `radial-gradient(circle, ${GLOW_BLUE}, transparent)`, animationDuration: '9s', animationDelay: '1s' }} />
      </motion.div>
      {/* Bottom-right — purple */}
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 w-2/3 h-2/3"
        animate={{ x: [0, -25, 15, -10, 0], y: [0, 25, -30, 10, 0] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'easeInOut', delay: 12 }}
      >
        <div className="w-full h-full rounded-full opacity-[0.04] blur-3xl animate-pulse"
          style={{ background: `radial-gradient(circle, ${GLOW_PURPLE}, transparent)`, animationDuration: '11s', animationDelay: '3s' }} />
      </motion.div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.4))]" />
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  eyebrow,
  headline,
  sub,
  eyebrowColor = GREEN,
  center = true,
}: {
  eyebrow?: string;
  headline: string | React.ReactNode;
  sub?: string;
  eyebrowColor?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? 'text-center' : ''}>
      {eyebrow && (
        <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: eyebrowColor }}>
          {eyebrow}
        </p>
      )}
      <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.1] mb-4">
        {headline}
      </h2>
      {sub && <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">{sub}</p>}
    </div>
  );
}

// ─── Director Brief Card (animated) ──────────────────────────────────────────
const DEMO_BRIEFS = [
  {
    brand: 'MERGE',
    color: GREEN,
    brief: "Full campaign package for the AI Enablement Summit. Executive tone, thought leadership angle. I need everything — all formats, ready to go.",
    deliverables: [
      { label: 'Billboard', ratio: '16:9' },
      { label: 'LinkedIn post', ratio: '1:1' },
      { label: 'Email header', ratio: '3:1' },
    ],
    category: 'Campaign',
  },
  {
    brand: 'Google',
    color: BLUE,
    brief: "Microsoft just dropped a new Surface Pro ad targeting our Q2 audience. Analyze it and give me three counter-campaign directions grounded in our positioning.",
    deliverables: [
      { label: 'Scene analysis', ratio: null as string | null },
      { label: 'Counter brief ×3', ratio: null as string | null },
      { label: 'Creative directions', ratio: null as string | null },
    ],
    category: 'Beat This Ad',
  },
  {
    brand: 'MERGE',
    color: PURPLE,
    brief: "Brand refresh launch — I need hero imagery, a full social suite, OOH transit, and copy that lands the repositioning. All formats.",
    deliverables: [
      { label: 'Hero banner', ratio: '16:9' },
      { label: 'Story', ratio: '9:16' },
      { label: 'OOH transit', ratio: '2:1' },
    ],
    category: 'Brand Launch',
  },
];

function DirectorBriefHero() {
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'generating' | 'done'>('typing');
  const scenario = DEMO_BRIEFS[idx];

  useEffect(() => {
    setChars(0);
    setPhase('typing');
  }, [idx]);

  useEffect(() => {
    if (phase === 'typing') {
      if (chars < scenario.brief.length) {
        const t = setTimeout(() => setChars((c) => c + 1), 22);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase('generating'), 400);
        return () => clearTimeout(t);
      }
    }
    if (phase === 'generating') {
      const t = setTimeout(() => setPhase('done'), 1800);
      return () => clearTimeout(t);
    }
    if (phase === 'done') {
      const t = setTimeout(() => setIdx((i) => (i + 1) % DEMO_BRIEFS.length), 3200);
      return () => clearTimeout(t);
    }
  }, [phase, chars, scenario.brief.length, idx]);

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl bg-white/[0.04] border border-white/[0.09] w-full max-w-lg mx-auto backdrop-blur-sm">
      {/* Voice header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: `${scenario.color}18` }}
              animate={{ scale: phase === 'typing' ? [1, 1.35, 1] : 1 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${scenario.color}30` }}>
              <Mic className="w-3 h-3" style={{ color: scenario.color }} />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white/90">Vince</p>
            <div className="flex items-center gap-1.5">
              <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: scenario.color }}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
              <span className="text-[10px] font-medium" style={{ color: scenario.color }}>
                {phase === 'typing' ? 'Listening...' : phase === 'generating' ? 'Generating...' : 'Ready'}
              </span>
            </div>
          </div>
        </div>
        {/* Waveform */}
        <div className="flex items-center gap-[3px] h-6">
          {([0.5, 0.9, 0.6, 1, 0.7, 0.85, 0.45] as const).map((h, i) => (
            <motion.div key={i} className="w-[3px] rounded-full"
              style={{ background: `${scenario.color}70`, height: `${h * 16}px` }}
              animate={phase === 'typing' ? { scaleY: [1, 1.9, 1] } : { scaleY: 0.2 }}
              transition={{ duration: 0.4 + i * 0.07, repeat: Infinity, ease: 'easeInOut', delay: i * 0.06 }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Brand badge */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: `${scenario.color}20`, color: scenario.color }}
          >
            <Mic className="w-3 h-3" />
            {scenario.brand} · {scenario.category}
          </div>
          <div className="flex gap-1">
            {DEMO_BRIEFS.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{ backgroundColor: i === idx ? scenario.color : '#555' }}
              />
            ))}
          </div>
        </div>

        {/* Brief textarea */}
        <div className="bg-[#2C2C2E] rounded-xl p-4 min-h-[90px]">
          <p className="text-[10px] text-white/30 mb-2 font-medium tracking-wide uppercase">Brief</p>
          <p className="text-sm text-white/80 leading-relaxed font-mono">
            {scenario.brief.slice(0, chars)}
            {phase === 'typing' && <span className="animate-pulse ml-0.5 text-white/60">|</span>}
          </p>
        </div>

        {/* Status */}
        <AnimatePresence mode="wait">
          {phase === 'generating' && (
            <motion.div
              key="gen"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#2C2C2E]"
            >
              <div
                className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: scenario.color, borderTopColor: 'transparent' }}
              />
              <span className="text-xs text-white/50">Generating campaign package…</span>
            </motion.div>
          )}
          {phase === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-xl border p-3"
              style={{ borderColor: `${scenario.color}30`, backgroundColor: `${scenario.color}08` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: scenario.color }} />
                <span className="text-xs font-semibold" style={{ color: scenario.color }}>
                  Package ready — {scenario.deliverables.length} deliverables
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {scenario.deliverables.map((d, i) => (
                  <motion.div
                    key={d.label}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, type: 'spring', stiffness: 350, damping: 22 }}
                    className="rounded-lg border p-2 flex flex-col items-center gap-1.5"
                    style={{ borderColor: `${scenario.color}25`, backgroundColor: `${scenario.color}10` }}
                  >
                    <div
                      className="w-full flex items-center justify-center rounded py-1.5"
                      style={{ backgroundColor: `${scenario.color}18` }}
                    >
                      {d.ratio ? (
                        <span className="font-mono text-[9px] font-bold" style={{ color: scenario.color }}>{d.ratio}</span>
                      ) : (
                        <CheckCircle2 className="w-3 h-3" style={{ color: scenario.color }} />
                      )}
                    </div>
                    <span className="text-[9px] text-white/50 text-center leading-tight">{d.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Problem Section ──────────────────────────────────────────────────────────
const PROBLEM_EXAMPLES = [
  { tool: 'Gemini', user: 'Alex (Account)', result: 'Generic wellness stock photo, wrong green' },
  { tool: 'Firefly', user: 'Jordan (Creative)', result: 'On-brand colors, wrong photography style' },
  { tool: 'Claude', user: 'Sam (Writer)', result: 'Good copy, no visual context' },
  { tool: 'Midjourney', user: 'Taylor (Designer)', result: 'Beautiful. Wrong brand entirely.' },
  { tool: 'ChatGPT', user: 'Morgan (Strategy)', result: 'Uses brand name. Ignores guidelines.' },
];

function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative py-32 overflow-hidden bg-[#0A0A0F]">
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${ORANGE}, transparent)` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,_rgba(239,68,68,0.04)_0%,_transparent_60%)]" />
      <SectionGlow color={GLOW_ROSE} />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <Reveal className="flex items-center gap-3 mb-16">
          <div className="h-px w-6 bg-red-500" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">The Problem</span>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: stat + 50 interpretations card */}
          <Reveal>
            <div
              className="font-black leading-none mb-6"
              style={{
                fontSize: 'clamp(6rem, 16vw, 12rem)',
                background: 'linear-gradient(135deg, #EF4444 0%, #F97316 45%, #F59E0B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              60%
            </div>
            <p className="text-lg text-white/50 leading-relaxed max-w-sm mb-8">
              of marketing materials don't conform to brand guidelines today. That's with humans trying their best — before AI entered the workflow.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border border-red-500/15 bg-red-500/[0.04] p-5"
            >
              <div className="flex items-baseline gap-3 mb-2">
                <span
                  className="text-6xl font-black leading-none tracking-tight"
                  style={{
                    background: 'linear-gradient(135deg, #EF4444 0%, #F97316 60%, #F59E0B 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  50
                </span>
                <span className="text-xl font-bold text-white/70 leading-tight">
                  interpretations<br />of your brand.
                </span>
              </div>
              <p className="text-sm text-white/40 leading-relaxed mt-3">
                Ten people. Five AI tools. One brief.{' '}
                <span className="text-white/75 font-semibold">None of them right.</span>{' '}
                All of them close enough that someone might use them anyway.
              </p>
            </motion.div>
          </Reveal>

          {/* Right: explanation + table */}
          <Reveal delay={0.15}>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-[1.1] tracking-tight">
              Add AI.
              <br />
              <span className="text-red-400">Multiply the problem.</span>
            </h2>
            <p className="text-base text-white/50 leading-relaxed mb-8">
              At every company right now, people are using Gemini, Firefly, Claude, and a dozen other tools to generate content. Each person grabs whatever brand context they can find — a hex code from memory, a paragraph from the brand guide, a screenshot from the client's site — and pastes it into a prompt.
            </p>

            <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/35">
                  5 people · 5 tools · 1 campaign brief · 5 different results
                </span>
              </div>
              {PROBLEM_EXAMPLES.map((ex, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-4 px-5 py-3 border-b border-white/[0.04] last:border-0"
                  initial={{ opacity: 0, x: -8 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.08 }}
                >
                  <span className="font-mono text-[10px] text-white/30 w-20 shrink-0">{ex.tool}</span>
                  <span className="text-[11px] text-white/40 w-32 shrink-0">{ex.user}</span>
                  <span className="text-[11px] text-red-400/70 flex-1">{ex.result}</span>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#050508]">
      <HeroGlow />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
        {/* Left: copy */}
        <div>
          <Reveal>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-8 border"
              style={{ borderColor: `${GREEN}40`, color: GREEN, backgroundColor: `${GREEN}10` }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Brand-Native AI
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-[1.0] text-white mb-6">
              <span style={{ color: GREEN }}>Vince</span> doesn't reference
              <br />
              <span className="text-white/60">your brand guidelines.</span>
              <br />
              He becomes them.
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-xl text-white/50 leading-relaxed mb-10 max-w-lg">
              Brief by voice. Copy and images together, every format, grounded in your brand's DNA.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-wrap gap-3 mb-12">
              {[
                { icon: Mic, label: 'Voice-First', color: GREEN },
                { icon: Dna, label: 'Brand-Native', color: BLUE },
                { icon: Zap, label: 'Interleaved Output', color: ORANGE },
                { icon: BarChart2, label: 'Beat This Ad', color: PURPLE },
              ].map(({ icon, label, color }) => (
                <Badge key={label} icon={icon} label={label} color={color} />
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="grid grid-cols-4 gap-3">
              <StatCard value="14" label="Campaign formats" color={GREEN} />
              <StatCard value="26" label="Voice tools" color={BLUE} />
              <StatCard value="3" label="Gemini models" color={ORANGE} />
              <StatCard value="∞" label="Brand memory" color={PURPLE} />
            </div>
          </Reveal>
        </div>

        {/* Right: animated card */}
        <Reveal delay={0.2} className="flex justify-center">
          <DirectorBriefHero />
        </Reveal>
      </div>
    </section>
  );
}

// ─── Brand Intelligence Section ───────────────────────────────────────────────
const IMPORT_SOURCES = [
  { icon: Globe, label: 'Website URL', note: 'Scraped automatically', color: BLUE, auto: true },
  { icon: FileText, label: 'Brand Style Guide', note: 'PDF', color: GREEN },
  { icon: Package, label: 'Product Catalog', note: 'PDF / CSV', color: ORANGE },
  { icon: Camera, label: 'Photography References', note: 'JPG / PNG', color: TEAL },
  { icon: Image, label: 'Logo Package', note: 'SVG / PNG', color: PURPLE },
  { icon: BarChart2, label: 'Annual Report', note: 'PDF', color: BLUE },
  { icon: Video, label: 'Brand Video', note: 'MP4', color: ROSE },
  { icon: MonitorPlay, label: 'Competitive Examples', note: 'URL / file', color: ORANGE },
];

const INTELLIGENCE_OUTPUTS = [
  { icon: Dna, label: 'Brand DNA', note: 'Voice, values, personality', color: GREEN },
  { icon: Camera, label: 'Photography Direction', note: 'f/2.8 · 5600K · editorial', color: TEAL },
  { icon: Sparkles, label: 'Art Direction', note: 'Composition rules, hero angles', color: BLUE },
  { icon: Image, label: 'Color Palette', note: 'Primary, secondary, semantic', color: PURPLE },
  { icon: BrainCircuit, label: 'Agent Directives', note: '12 behavioral rules', color: ORANGE },
  { icon: FileText, label: 'Generation Prompts', note: 'Master prompt, auto-injected', color: GREEN },
  { icon: Zap, label: 'Quick Starters', note: '6 ready campaign briefs', color: TEAL },
  { icon: Database, label: 'Visual Reference Library', note: 'Logos + approved images indexed', color: BLUE },
];

function BrandIntelligenceSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-60px' });
  const [revealed, setRevealed] = useState(0);
  const total = IMPORT_SOURCES.length + INTELLIGENCE_OUTPUTS.length;

  useEffect(() => {
    if (!inView) {
      setRevealed(0);
      return;
    }
    if (revealed >= total) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), 160);
    return () => clearTimeout(t);
  }, [inView, revealed, total]);

  return (
    <section id="brand-intelligence" ref={ref} className="relative py-32 bg-[#080A0F] overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${BLUE}, transparent)` }}
      />
      <SectionGlow color={GLOW_BLUE} />

      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="mb-16">
          <SectionHeader
            eyebrow="Brand Intelligence"
            eyebrowColor={BLUE}
            headline={
              <>
                Import once.
                <br />
                <span style={{ color: BLUE }}>Brief forever.</span>
              </>
            }
            sub="Tell Vince your brand and he'll scrape your website, build the Brand DNA, and start briefing immediately. Then keep feeding it — style guides, catalogs, photography, logos, annual reports. The more context you give it, the deeper the intelligence."
          />
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_64px_1fr] gap-4 items-start">
          {/* Inputs panel */}
          <div className="rounded-2xl bg-[#111318] border border-white/[0.08] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">What you bring</p>
            </div>
            <div className="p-3 space-y-1.5">
              {IMPORT_SOURCES.map((src, i) => {
                const visible = revealed > i;
                return (
                  <motion.div
                    key={src.label}
                    animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -10 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ backgroundColor: visible ? `${src.color}08` : 'transparent' }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${src.color}18`, color: visible ? src.color : '#444' }}
                    >
                      <src.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white/80 leading-none mb-0.5">{src.label}</p>
                      <p className="font-mono text-[10px] text-white/30">{src.note}</p>
                    </div>
                    {src.auto && visible && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                        style={{ backgroundColor: `${BLUE}20`, color: BLUE }}
                      >
                        AUTO
                      </span>
                    )}
                    {!src.auto && visible && (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: src.color }} />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Synthesis column */}
          <div className="flex flex-row md:flex-col items-center justify-center gap-3 py-4 md:py-12">
            {revealed < total ? (
              <motion.div
                className="w-8 h-8 rounded-full border-2"
                style={{ borderColor: BLUE, borderTopColor: 'transparent' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <CheckCircle2 className="w-8 h-8" style={{ color: BLUE }} />
            )}
            <ArrowRight className="w-4 h-4 text-white/15 md:rotate-90" />
            <p className="font-mono text-[9px] text-white/20 text-center leading-relaxed">
              pgvector{'\n'}HNSW
            </p>
          </div>

          {/* Outputs panel */}
          <div className="rounded-2xl bg-[#111318] border border-white/[0.08] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">What Vince creates</p>
            </div>
            <div className="p-3 space-y-1.5">
              {INTELLIGENCE_OUTPUTS.map((out, i) => {
                const visible = revealed > IMPORT_SOURCES.length + i;
                return (
                  <motion.div
                    key={out.label}
                    animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : 10 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ backgroundColor: visible ? `${out.color}08` : 'transparent' }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${out.color}18`, color: visible ? out.color : '#444' }}
                    >
                      <out.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white/80 leading-none mb-0.5">{out.label}</p>
                      <p className="font-mono text-[10px] text-white/30">{out.note}</p>
                    </div>
                    {visible && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: out.color }} />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* pgvector callout */}
        <Reveal delay={0.2} className="mt-10">
          <div className="rounded-2xl bg-gradient-to-r from-blue-950/40 to-blue-900/20 border border-blue-500/20 p-6 flex items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-white mb-1">Semantic brand rule injection via pgvector</p>
              <p className="text-sm text-white/40">
                Brand rules are stored as vector embeddings in PostgreSQL. At generation time, Vince retrieves the
                most relevant rules for the current brief and injects them into the prompt — automatically, every time.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Brand Travels Section ────────────────────────────────────────────────────
// "AI Brand Guidelines" — the category moment. Shows the Chrome extension
// sidebar alongside a live AI tool, demonstrating how compiled brand prompts
// travel from Vince to any AI tool on any surface.

interface TravelBrand {
  id: string;
  name: string;
  color: string;
  aiTool: string;
  aiToolLabel: string;
  starters: string[];
  selectedStarter: string;
  fields: { key: string; value: string }[];
  compiledLines: string[];
  pasteText: string;
  response: { label: string; text: string }[];
}

const TRAVEL_BRANDS: TravelBrand[] = [
  {
    id: 'merge',
    name: 'MERGE',
    color: GREEN,
    aiTool: 'gemini.google.com',
    aiToolLabel: 'Gemini',
    starters: ['AI Summit Campaign Hero', 'LinkedIn Thought Leadership', 'Billboard 16:9 OOH'],
    selectedStarter: 'AI Summit Campaign Hero',
    fields: [
      { key: 'Campaign', value: 'AI Enablement Summit 2026' },
      { key: 'Tone', value: 'Executive, thought leadership' },
      { key: 'Lens', value: '85mm f/2.8, editorial clean' },
      { key: 'Color', value: '#1ED75F MERGE green' },
    ],
    compiledLines: [
      'AI Enablement Summit 2026 hero · Executive editorial · MERGE voice: direct, confident,',
      'no corporate jargon · 85mm f/2.8 clean studio · Photography DNA: high-contrast,',
      'authentic moments, #1ED75F accent — guardrails: zero stock-photo, thought-leadership POV',
    ],
    pasteText: 'AI Enablement Summit 2026 hero · Executive editorial · MERGE voice: direct, confident, no corporate jargon · 85mm f/2.8 clean studio · Photography DNA: high-contrast, authentic moments, #1ED75F accent — guardrails: zero stock-photo, thought-leadership POV',
    response: [
      { label: 'LinkedIn Draft', text: 'The agencies that figure out AI first won\'t be the biggest ones. They\'ll be the most intentional ones. We\'ve spent the last year wiring AI into creative workflows that actually scale — not just using the tools, but building the infrastructure around them.' },
      { label: 'Hook Variation', text: 'Most AI conversations in agencies start with the tool. The smart ones start with the brand.' },
      { label: 'Voice Check', text: 'Reads direct, confident, no corporate filler — MERGE brand voice honored. No hedging, no jargon. POV-first. Ready to post as-is.' },
      { label: 'Brand voice applied', text: 'MERGE guardrails active · confident, direct, no jargon · copy ready ↗' },
    ],
  },
  {
    id: 'google',
    name: 'GOOGLE',
    color: BLUE,
    aiTool: 'gemini.google.com',
    aiToolLabel: 'Gemini',
    starters: ['Pixel Launch Campaign', 'Made By Google Editorial', 'YouTube Brand Story'],
    selectedStarter: 'Pixel Launch Campaign',
    fields: [
      { key: 'Product', value: 'Pixel 9 Pro' },
      { key: 'Tone', value: 'Optimistic, human-centered' },
      { key: 'Format', value: '16:9 hero + Story 9:16' },
      { key: 'Color', value: '#4285F4 Google Blue' },
    ],
    compiledLines: [
      'Pixel 9 Pro launch · Optimistic human-centered tone · Google voice: accessible,',
      'curious, empowering · 16:9 hero + 9:16 story · Photography DNA: real people,',
      'authentic moments, diverse · #4285F4 — guardrails: warmth over precision, no tech-bro',
    ],
    pasteText: 'Pixel 9 Pro launch · Optimistic human-centered tone · Google voice: accessible, curious, empowering · 16:9 hero + 9:16 story · Photography DNA: real people, authentic moments, diverse representation · #4285F4 Google Blue — guardrails: warmth over precision, no tech-bro aesthetic',
    response: [
      { label: 'Image Prompt', text: 'Person in natural morning light, Pixel 9 Pro held loosely — candid, not posed. 5600K warm ambient, shallow DOF f/2.8. Google Blue #4285F4 enters through a wardrobe detail. Real moment, not a product shoot.' },
      { label: 'Hero Copy', text: '"See what matters." No product spec. No feature list. Single declarative thought. 18px Epilogue Regular, white on dark, #4285F4 underline treatment.' },
      { label: 'Voice Check', text: 'Optimistic, warm, human-centered — Google brand DNA honored throughout. Zero tech-bro aesthetic. Authentic over aspirational. Warmth before precision.' },
      { label: 'Google brand voice applied', text: 'Photography DNA active · guardrails enforced · prompt ready to use ↗' },
    ],
  },
];

type TravelPhase = 'idle' | 'fields' | 'compiled' | 'copied' | 'pasting' | 'responding' | 'done';

function BrandTravelsMockup() {
  const [brandIdx, setBrandIdx] = useState(0);
  const [revealedFields, setRevealedFields] = useState(0);
  const [phase, setPhase] = useState<TravelPhase>('idle');
  const [pasteChars, setPasteChars] = useState(0);
  const [revealedChunks, setRevealedChunks] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const brand = TRAVEL_BRANDS[brandIdx];

  useEffect(() => {
    if (!inView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    brand.fields.forEach((_, i) => {
      timers.push(setTimeout(() => setRevealedFields(i + 1), 700 + i * 480));
    });
    const afterFields = 700 + brand.fields.length * 480;
    timers.push(setTimeout(() => setPhase('compiled'), afterFields + 300));
    timers.push(setTimeout(() => setPhase('copied'), afterFields + 1600));
    timers.push(setTimeout(() => setPhase('pasting'), afterFields + 2800));
    const pasteDone = afterFields + 2800 + brand.pasteText.length * 8 + 800;
    // Responding: reveal each chunk 550ms apart
    timers.push(setTimeout(() => setPhase('responding'), pasteDone));
    brand.response.forEach((_, i) => {
      timers.push(setTimeout(() => setRevealedChunks(i + 1), pasteDone + 400 + i * 600));
    });
    const respondingDone = pasteDone + 400 + brand.response.length * 600 + 2000;
    timers.push(setTimeout(() => {
      setPhase('done');
      setTimeout(() => {
        setBrandIdx(idx => (idx + 1) % TRAVEL_BRANDS.length);
        setRevealedFields(0);
        setRevealedChunks(0);
        setPhase('idle');
        setPasteChars(0);
        setCycleKey(k => k + 1);
      }, 1800);
    }, respondingDone));

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, cycleKey]);

  useEffect(() => {
    if (phase !== 'pasting') { setPasteChars(0); return; }
    let i = 0;
    const iv = setInterval(() => { i++; setPasteChars(i); if (i >= brand.pasteText.length) clearInterval(iv); }, 8);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const isPasting = phase === 'pasting' || phase === 'done';

  return (
    <div ref={ref} className="w-full rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl" style={{ background: '#0E0E16' }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]" style={{ background: '#0A0A12' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]/70" />
        </div>
        <div className="flex-1 h-6 bg-white/[0.04] rounded-md px-3 flex items-center gap-1.5 mx-3">
          <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 shrink-0" fill="rgba(255,255,255,0.2)">
            <path d="M9 5V3.5a3 3 0 0 0-6 0V5H2v6h8V5H9zm-4-1.5a1 1 0 0 1 2 0V5H5V3.5z" />
          </svg>
          <AnimatePresence mode="wait">
            <motion.span
              key={brand.id}
              className="font-mono text-[9px] text-white/30"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {brand.aiTool}
            </motion.span>
          </AnimatePresence>
        </div>
        {/* Vince extension icon */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ backgroundColor: `${brand.color}18` }}>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill={brand.color}>
            <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <rect x="9" y="1" width="6" height="14" rx="1" fill="currentColor" opacity="0.5" />
          </svg>
          <span className="font-mono text-[8px]" style={{ color: brand.color }}>Vince</span>
        </div>
      </div>

      {/* Body: AI nav sidebar + AI main + Vince extension */}
      <div className="flex" style={{ height: 460 }}>

        {/* AI tool left nav sidebar */}
        <div className="flex flex-col border-r border-white/[0.05] flex-shrink-0" style={{ width: 136, background: '#09090F' }}>
          <div className="flex items-center gap-2 px-3 py-3 border-b border-white/[0.04]">
            <AnimatePresence mode="wait">
              <motion.div key={brand.id} className="flex items-center gap-2"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              >
                {brand.id === 'merge'
                  ? <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill="#4285F4" /></svg>
                  : <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill="#4285F4" /></svg>
                }
                <span className="text-[10px] font-semibold text-white/40">{brand.aiToolLabel}</span>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mx-2.5 mt-3 mb-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-white/[0.07] cursor-pointer">
            <span className="text-white/25 text-[10px] leading-none">✏</span>
            <span className="text-[9px] text-white/25">New chat</span>
          </div>
          <div className="px-2.5 py-1 flex-1">
            <p className="font-mono text-[7px] uppercase tracking-widest text-white/15 px-1.5 py-1.5">Recent</p>
            {['Brand campaign brief', 'AI summit copy', 'LinkedIn strategy'].map((chat, i) => (
              <div key={chat} className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-md" style={{ backgroundColor: i === 0 ? 'rgba(255,255,255,0.04)' : 'transparent' }}>
                <MessageSquare className="w-2.5 h-2.5 flex-shrink-0 text-white/15" />
                <span className="text-[9px] text-white/22 truncate">{chat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI tool main chat area */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: '#0D0D1A' }}>
          {/* Top bar — model indicator */}
          <div className="flex items-center justify-between px-5 py-2 border-b border-white/[0.04]">
            <AnimatePresence mode="wait">
              <motion.span key={brand.id} className="text-[10px] text-white/25 font-mono"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              >
                gemini-2.5-flash
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Chat history */}
          <div className="flex-1 flex flex-col justify-end px-5 py-4 gap-3 overflow-hidden">
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-tr-sm px-3 py-2 max-w-[75%]" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] text-white/30">
                  {brand.id === 'merge'
                    ? 'Create a hero for our AI Enablement Summit — executive, editorial'
                    : 'Need a Pixel 9 Pro launch hero — optimistic, real people'}
                </p>
              </div>
            </div>
            <div className="flex justify-start gap-2">
              <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                style={{ background: 'rgba(66,133,244,0.15)' }}>
                <span className="text-[8px]">✦</span>
              </div>
              <div className="rounded-2xl rounded-tl-sm px-3 py-2 max-w-[75%]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-[10px] text-white/20">I'd love to help — could you share your brand guidelines and photography preferences?</p>
              </div>
            </div>

            {/* Brand prompt pasting in */}
            <AnimatePresence>
              {isPasting && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                  <div className="rounded-2xl rounded-tr-sm px-3 py-2.5 max-w-[90%] border"
                    style={{ borderColor: `${brand.color}30`, backgroundColor: `${brand.color}0C` }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Layers className="w-3 h-3 flex-shrink-0" style={{ color: brand.color }} />
                      <span className="font-mono text-[8px] font-bold uppercase tracking-wider" style={{ color: `${brand.color}80` }}>
                        {brand.name} Brand DNA · Active
                      </span>
                    </div>
                    <p className="font-mono text-[9px] leading-relaxed" style={{ color: `${brand.color}BB` }}>
                      {brand.pasteText.slice(0, pasteChars)}
                      {phase === 'pasting' && <span className="animate-pulse">|</span>}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Gemini response */}
            <AnimatePresence>
              {(phase === 'responding' || phase === 'done') && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start gap-2"
                >
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: 'rgba(66,133,244,0.18)' }}>
                    <svg viewBox="0 0 24 24" className="w-3 h-3"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill="#4285F4" /></svg>
                  </div>
                  <div className="flex-1 rounded-2xl rounded-tl-sm px-3 py-3 border border-white/[0.07] bg-white/[0.03] space-y-2.5">
                    {brand.response.map((chunk, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: i < revealedChunks ? 1 : 0, y: i < revealedChunks ? 0 : 6 }}
                        transition={{ duration: 0.4 }}
                      >
                        {i < brand.response.length - 1 ? (
                          <div>
                            <span className="font-mono text-[8px] font-bold uppercase tracking-wider mb-1 block" style={{ color: `${brand.color}70` }}>
                              {chunk.label}
                            </span>
                            <p className="text-[10px] text-white/65 leading-relaxed">{chunk.text}</p>
                          </div>
                        ) : (
                          // Last chunk is the status/ready line
                          <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06] mt-1">
                            <motion.div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: brand.color }}
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                            <p className="font-mono text-[9px]" style={{ color: `${brand.color}90` }}>{chunk.text}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {revealedChunks < brand.response.length && (
                      <div className="flex items-center gap-1 pt-1">
                        {[0, 1, 2].map(i => (
                          <motion.div key={i} className="w-1 h-1 rounded-full bg-white/30"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Gemini-style large input */}
          <div className="px-5 pb-4 pt-2">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3">
              <div className="min-h-[24px] flex items-center">
                {phase === 'responding' || phase === 'done' ? (
                  <span className="text-[10px] text-white/15">Ask {brand.aiToolLabel} anything…</span>
                ) : isPasting ? (
                  <span className="text-[10px] font-mono" style={{ color: `${brand.color}90` }}>
                    {brand.pasteText.slice(0, Math.min(pasteChars, 90))}{pasteChars < brand.pasteText.length ? '|' : ''}
                  </span>
                ) : (
                  <span className="text-[10px] text-white/15">Ask {brand.aiToolLabel} anything…</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <Mic className="w-3.5 h-3.5 text-white/20" />
                  <span className="text-[8px] font-mono text-white/15">+ Attach</span>
                </div>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${brand.color}20` }}>
                  <ArrowRight className="w-3 h-3" style={{ color: brand.color }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vince extension sidebar */}
        <div className="flex flex-col overflow-hidden border-l border-white/[0.07]" style={{ width: 230, background: '#09090F' }}>
          {/* Brand header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06]">
            <motion.div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: brand.color }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.1, repeat: Infinity }}
            />
            <AnimatePresence mode="wait">
              <motion.span
                key={brand.id}
                className="font-mono text-[9px] font-bold"
                style={{ color: brand.color }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {brand.name}
              </motion.span>
            </AnimatePresence>
            <span className="font-mono text-[8px] text-white/20 ml-auto">DNA active</span>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-white/[0.05]">
            {['QuickStarters', 'Brand DNA'].map((tab, i) => (
              <div
                key={tab}
                className="flex-1 text-center py-1.5 font-epilogue text-[8px] border-b-2"
                style={{
                  borderColor: i === 0 ? brand.color : 'transparent',
                  color: i === 0 ? brand.color : 'rgba(255,255,255,0.2)',
                }}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Starter list */}
          <div className="border-b border-white/[0.04]">
            <AnimatePresence mode="wait">
              <motion.div
                key={brand.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                {brand.starters.map((label, i) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 px-3 py-2 text-[9px]"
                    style={{
                      backgroundColor: i === 0 ? `${brand.color}12` : 'transparent',
                      color: i === 0 ? brand.color : 'rgba(255,255,255,0.28)',
                    }}
                  >
                    {i === 0
                      ? <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" style={{ color: brand.color }} />
                      : <div className="w-2.5" />
                    }
                    <span className="font-epilogue leading-tight">{label}</span>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Fields */}
          <div className="flex-1 p-3 space-y-1.5 overflow-hidden">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3 h-3 flex-shrink-0" style={{ color: brand.color }} />
              <AnimatePresence mode="wait">
                <motion.span
                  key={brand.id}
                  className="font-epilogue text-[9px] font-semibold text-white/45"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  {brand.selectedStarter}
                </motion.span>
              </AnimatePresence>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={brand.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-1.5"
              >
                {brand.fields.map((field, i) => (
                  <motion.div
                    key={field.key}
                    animate={{ opacity: i < revealedFields ? 1 : 0, y: i < revealedFields ? 0 : 5 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-1.5"
                  >
                    <span className="font-mono text-[8px] text-white/25 w-11 flex-shrink-0">{field.key}</span>
                    <div className="flex-1 rounded border border-white/[0.06] bg-black/25 px-1.5 py-0.5">
                      <span className="font-epilogue text-[8px] text-white/55">{field.value}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Compiled prompt */}
          <AnimatePresence>
            {(phase === 'compiled' || phase === 'copied' || phase === 'pasting' || phase === 'done') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t px-3 py-2.5"
                style={{ borderColor: `${brand.color}20`, backgroundColor: `${brand.color}06` }}
              >
                <div className="flex items-center gap-1 mb-1.5">
                  <Layers className="w-2.5 h-2.5 flex-shrink-0" style={{ color: brand.color }} />
                  <span className="font-mono text-[7px] uppercase tracking-wider" style={{ color: `${brand.color}70` }}>
                    Brand DNA Active
                  </span>
                  <motion.div
                    className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[7px] font-bold"
                    style={{
                      backgroundColor: phase === 'copied' ? `${brand.color}25` : 'rgba(255,255,255,0.04)',
                      color: phase === 'copied' ? brand.color : 'rgba(255,255,255,0.2)',
                      border: `1px solid ${phase === 'copied' ? brand.color : 'rgba(255,255,255,0.08)'}`,
                    }}
                    animate={phase === 'copied' ? { scale: [1, 1.12, 1] } : {}}
                    transition={{ duration: 0.25 }}
                  >
                    {phase === 'copied'
                      ? <><ClipboardCheck className="w-2 h-2" /> COPIED</>
                      : <><Copy className="w-2 h-2" /> COPY</>
                    }
                  </motion.div>
                </div>
                {brand.compiledLines.map((line, i) => (
                  <p key={i} className="font-mono text-[8px] text-white/40 leading-relaxed">{line}</p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function BrandTravelsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} id="brand-travels" className="relative py-32 bg-[#070A0F] overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${TEAL}, transparent)` }}
      />
      <SectionGlow color={GLOW_TEAL} />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <Reveal className="mb-16 text-center">
          <SectionHeader
            eyebrow="AI Brand Guidelines"
            eyebrowColor={TEAL}
            headline={
              <>
                The brand travels
                <br />
                <span style={{ color: TEAL }}>with the prompt.</span>
              </>
            }
            sub="Brand guidelines used to live in a PDF nobody opened. Vince converts your brand into executable AI directives — Photography DNA, voice rules, guardrails — pre-compiled and ready to fire into any AI tool, from any surface."
          />
        </Reveal>

        {/* Browser + extension mockup */}
        <Reveal delay={0.2} className="mb-12">
          {inView && <BrandTravelsMockup />}
        </Reveal>

        {/* Feature row */}
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            {
              color: GREEN,
              icon: FileText,
              title: 'From PDF to prompt',
              desc: 'Brand intelligence converted into executable AI directives — not a document for humans, but a prompt artifact that fires every time.',
            },
            {
              color: BLUE,
              icon: Globe,
              title: 'Works in any AI tool',
              desc: 'Gemini, Claude, ChatGPT, Midjourney, Firefly. Paste the compiled prompt anywhere. The brand goes with it. No platform lock-in.',
            },
            {
              color: PURPLE,
              icon: Smartphone,
              title: 'Every surface',
              desc: 'Chrome extension sidebar, iOS, Android, and inside Vince Director Mode. The same brand intelligence — everywhere you work.',
            },
          ].map(({ color, icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={0.35 + i * 0.08}>
              <div className="flex items-start gap-3 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20`, color }}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm mb-1">{title}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Differentiator */}
        <Reveal delay={0.5} className="mt-8">
          <div className="flex items-start gap-4 px-6 py-5 rounded-xl border" style={{ borderColor: `${TEAL}18`, backgroundColor: `${TEAL}04` }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: TEAL }} />
            <p className="text-sm text-white/50 leading-relaxed">
              <span className="text-white/80 font-medium">Model-agnostic at the browser plane.</span>{' '}
              This is a structural advantage. When a new AI tool ships next quarter,
              the brand layer is already there — the sidebar stays open, the brand travels with you.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Creative Director / Voice Section ───────────────────────────────────────
const VOICE_TOOLS = [
  { icon: Camera, label: 'Generate hero image', color: GREEN },
  { icon: Video, label: 'Animate a scene', color: BLUE },
  { icon: FileText, label: 'Write campaign copy', color: ORANGE },
  { icon: Package, label: 'Build a full package', color: PURPLE },
  { icon: BarChart2, label: 'Beat this ad', color: ROSE },
  { icon: Image, label: 'Resize for all formats', color: TEAL },
  { icon: MessageSquare, label: 'Brief a direction', color: GREEN },
  { icon: Sparkles, label: 'Run brand audit', color: BLUE },
];

function CreativeDirectorSection() {
  const [activeTools, setActiveTools] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTools((prev) => {
        if (prev.length >= 4) return [];
        const next = (prev[prev.length - 1] ?? -1) + 1;
        if (next >= VOICE_TOOLS.length) return [];
        return [...prev, next];
      });
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="creative-director" className="relative py-32 bg-[#050508] overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)` }}
      />
      <SectionGlow color={GLOW_GREEN} />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Visual: voice tool grid */}
          <Reveal className="order-2 md:order-1">
            <div className="rounded-2xl bg-[#111318] border border-white/10 p-6">
              {/* Mic indicator */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${GREEN}20` }}
                >
                  <Mic className="w-5 h-5" style={{ color: GREEN }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Creative Director</p>
                  <p className="text-xs text-white/40">26 creative tools · Gemini Live</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 rounded-full"
                      style={{ backgroundColor: GREEN }}
                      animate={{ height: [8, 18 + i * 4, 8] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>

              {/* Tool grid */}
              <div className="grid grid-cols-2 gap-2">
                {VOICE_TOOLS.map((tool, i) => (
                  <motion.div
                    key={tool.label}
                    className="flex items-center gap-2.5 p-3 rounded-xl border transition-all"
                    animate={{
                      borderColor: activeTools.includes(i) ? `${tool.color}60` : 'rgba(255,255,255,0.06)',
                      backgroundColor: activeTools.includes(i) ? `${tool.color}12` : 'rgba(255,255,255,0.02)',
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <tool.icon
                      className="w-4 h-4 shrink-0"
                      style={{ color: activeTools.includes(i) ? tool.color : '#555' }}
                    />
                    <span
                      className="text-xs font-medium leading-tight"
                      style={{ color: activeTools.includes(i) ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)' }}
                    >
                      {tool.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              <p className="text-center text-[10px] text-white/25 mt-4 font-mono">
                + 18 more tools · all invokable by voice
              </p>
            </div>
          </Reveal>

          {/* Copy */}
          <div className="order-1 md:order-2">
            <Reveal>
              <SectionHeader
                eyebrow="Creative Director"
                eyebrowColor={GREEN}
                headline={
                  <>
                    Say it.
                    <br />
                    <span style={{ color: GREEN }}>Get a campaign.</span>
                  </>
                }
                sub="Vince listens over a live voice session. Brief a concept, ask to beat a competitor's ad, or request the full package — copy and images together, in every format."
                center={false}
              />
            </Reveal>

            <Reveal delay={0.2} className="mt-10 space-y-5">
              {[
                {
                  icon: Mic,
                  color: GREEN,
                  title: 'Gemini Live API',
                  desc: 'Persistent bidirectional voice session with sub-400ms response latency',
                },
                {
                  icon: Layers,
                  color: BLUE,
                  title: 'Interleaved output',
                  desc: 'Copy and images generated together — not sequentially — and delivered in 14 agency formats',
                },
                {
                  icon: Zap,
                  color: ORANGE,
                  title: 'Fire-and-forget async',
                  desc: 'Long-running generation doesn\'t block the conversation — results stream in via realtime push',
                },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm mb-0.5">{title}</p>
                    <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Full Studio Section ──────────────────────────────────────────────────────

// — Video (Director Mode) —
const CAMERA_MOVEMENTS = [
  'Crane Shot', 'Dolly In', 'Dolly Out', 'Steadicam', 'Orbit',
  'Pan Left', 'Pan Right', 'Tilt Up', 'Tilt Down', 'Tracking Shot',
  'Dutch Angle', 'Handheld', 'Lock Off', 'Whip Pan',
];
const LIGHTING_PRESETS = [
  'Golden Hour', 'Neon Glow', 'Studio 3-Point', 'Blue Hour',
  'Overcast Diffuse', 'Rim Light', 'Backlit Silhouette',
  'High Key Commercial', 'Low Key Dramatic', 'Natural Window', 'Practical Tungsten',
];
const LENS_PRESETS = [
  '16mm Ultra-Wide', '24mm Wide', '35mm Standard', '50mm Normal',
  '85mm Portrait', '135mm Telephoto', 'Anamorphic 2.39:1',
  'Tilt-Shift Miniature', 'Macro Close-Up', 'Fish-Eye 180°', 'Vintage Anamorphic',
];

// — Still Photography —
const CAMERA_BODIES = [
  'Canon EOS R5', 'Sony A7R V', 'Hasselblad X2D 100C', 'Leica M11',
  'Phase One IQ4 150MP', 'Fujifilm GFX 100S', 'Nikon Z9',
  'ARRI Alexa 35', 'Mamiya RZ67', 'Pentax 67 Medium Format',
];
const FILM_STOCKS = [
  'Kodak Portra 400', 'Kodak Ektar 100', 'Fuji Velvia 50',
  'Ilford HP5 Plus', 'Kodak Tri-X 400', 'CineStill 800T',
  'Kodak Gold 200', 'Fuji Superia 400', 'Lomochrome Purple', 'Fuji Pro 400H',
];
const APERTURE_STOPS = ['f/1.4', 'f/1.8', 'f/2.0', 'f/2.8', 'f/4.0', 'f/5.6', 'f/8.0', 'f/11', 'f/16', 'f/22'];
const FOCAL_LENGTHS = ['16mm', '24mm', '35mm', '40mm', '50mm', '75mm', '85mm', '100mm', '135mm', '150mm', '200mm'];
const LIGHTING_SETUPS = [
  'Golden Hour', 'Natural Window Light', 'Studio 3-Point', 'Overcast Diffuse',
  'Rim Light', 'High Key Commercial', 'Low Key Dramatic',
  'Backlit Silhouette', 'Practical Tungsten', 'Hard Direct Flash',
];
const SHOT_TYPES = [
  'Hero Product Shot', 'Environmental Portrait', 'Detail Close-Up',
  'Lifestyle Scene', 'Editorial Fashion', 'Food Styling Hero',
  'Corporate Headshot', 'Architecture Wide', 'Street Candid', 'Still Life',
];
const COLOR_GRADES = [
  'Natural', 'Cinematic Teal & Orange', 'Vintage Film', 'High Contrast B&W',
  'Muted & Desaturated', 'Warm Analog', 'Cool & Sterile', 'Cross-Processed',
];
const DEPTH_OF_FIELD = [
  'Shallow — subject isolation', 'Medium — balanced focus',
  'Deep — full scene sharp', 'Extreme shallow — bokeh foreground',
];

function buildDirectorPrompt(camera: string, lighting: string, lens: string, subject: string): string {
  if (!subject.trim()) return 'Enter a subject to see the compiled director prompt...';
  return `Shot of: ${subject.trim()} · Camera: ${camera} movement · Lighting: ${lighting} · Lens: ${lens} · Output: Veo 3.1 cinematic video, 16:9, broadcast quality`;
}

function buildStillPrompt(body: string, aperture: string, focal: string, film: string, lighting: string, shot: string, dof: string, grade: string): string {
  return `${body} · ${focal} ${aperture} · ${film} · ${lighting} · ${dof.split('—')[0].trim()} · ${shot} · ${grade} · Brand DNA active`;
}

function StudioSelect({ label, value, options, onChange, accent }: {
  label: string; value: string; options: string[];
  onChange: (v: string) => void; accent: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] text-white/35 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-black/30 border border-white/[0.10] rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none transition-all cursor-pointer pr-8"
          style={{ ['--tw-ring-color' as string]: accent }}
        >
          {options.map(o => <option key={o} value={o} className="bg-[#1a1a20]">{o}</option>)}
        </select>
        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none rotate-90" />
      </div>
    </div>
  );
}

function SliderField({ label, value, max, displayValue, leftLabel, rightLabel, onChange, accent }: {
  label: string; value: number; max: number; displayValue: string;
  leftLabel: string; rightLabel: string; onChange: (v: number) => void; accent: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="font-mono text-[10px] text-white/35 uppercase tracking-wider">{label}</label>
        <span className="font-mono text-[11px] font-semibold" style={{ color: accent }}>{displayValue}</span>
      </div>
      <input
        type="range" min={0} max={max} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: accent }}
      />
      <div className="flex justify-between">
        <span className="font-mono text-[9px] text-white/20">{leftLabel}</span>
        <span className="font-mono text-[9px] text-white/20">{rightLabel}</span>
      </div>
    </div>
  );
}

function DirectorModeSection() {
  const [mode, setMode] = useState<'still' | 'video'>('still');

  // Still photography state
  const [cameraBody, setCameraBody] = useState('Canon EOS R5');
  const [filmStock, setFilmStock] = useState('Kodak Portra 400');
  const [apertureIdx, setApertureIdx] = useState(3); // f/2.8
  const [focalIdx, setFocalIdx] = useState(6); // 85mm
  const [lightingSetup, setLightingSetup] = useState('Golden Hour');
  const [shotType, setShotType] = useState('Environmental Portrait');
  const [dof, setDof] = useState('Shallow — subject isolation');
  const [colorGrade, setColorGrade] = useState('Cinematic Teal & Orange');

  // Video (Director Mode) state
  const [camera, setCamera] = useState('Crane Shot');
  const [lighting, setLighting] = useState('Golden Hour');
  const [lens, setLens] = useState('85mm Portrait');
  const [subject, setSubject] = useState('A confident creative director at a modern agency workspace');

  const stillPrompt = buildStillPrompt(
    cameraBody, APERTURE_STOPS[apertureIdx], FOCAL_LENGTHS[focalIdx],
    filmStock, lightingSetup, shotType, dof, colorGrade,
  );
  const videoPrompt = buildDirectorPrompt(camera, lighting, lens, subject);

  const isStill = mode === 'still';
  const accent = isStill ? GREEN : PURPLE;

  return (
    <section className="relative py-32 bg-[#080A0F] overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <SectionGlow color={isStill ? GLOW_GREEN : GLOW_PURPLE} />

      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="mb-14">
          <SectionHeader
            eyebrow="Full Studio Mode"
            eyebrowColor={accent}
            headline={
              <>
                When you want
                <br />
                <span style={{ color: accent }}>full control.</span>
              </>
            }
            sub="Vince is off. The studio is on. Every camera parameter, every lens character, every film treatment — compiled into a production-ready prompt automatically."
          />
        </Reveal>

        {/* Mode toggle */}
        <Reveal className="mb-10">
          <div className="flex justify-center">
            <div className="flex p-1 rounded-2xl border border-white/[0.08] bg-white/[0.02] gap-1">
              {([
                { id: 'still', label: '📷  Still Photography', color: GREEN },
                { id: 'video', label: '🎬  Director Mode · Veo 3', color: PURPLE },
              ] as const).map(({ id, label, color }) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={mode === id
                    ? { backgroundColor: `${color}18`, color, border: `1px solid ${color}35` }
                    : { color: 'rgba(255,255,255,0.35)', border: '1px solid transparent' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left: controls panel */}
          <Reveal>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  {isStill
                    ? <Camera className="w-4 h-4" style={{ color: GREEN }} />
                    : <Video className="w-4 h-4" style={{ color: PURPLE }} />
                  }
                  <span className="text-sm font-semibold text-white/70">
                    {isStill ? 'Photography Controls' : 'Director Controls'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                  style={{ backgroundColor: `${accent}10`, borderColor: `${accent}25` }}>
                  <motion.div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }}
                    animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
                  <span className="font-mono text-[9px]" style={{ color: accent }}>
                    {isStill ? 'BRAND DNA ACTIVE' : 'VEO 3 READY'}
                  </span>
                </div>
              </div>

              <div className="px-5 py-5 space-y-4">
                {isStill ? (
                  <>
                    <StudioSelect label="Camera Body" value={cameraBody} options={CAMERA_BODIES} onChange={setCameraBody} accent={GREEN} />
                    <StudioSelect label="Film Stock" value={filmStock} options={FILM_STOCKS} onChange={setFilmStock} accent={GREEN} />
                    <SliderField
                      label="Aperture" value={apertureIdx} max={APERTURE_STOPS.length - 1}
                      displayValue={APERTURE_STOPS[apertureIdx]}
                      leftLabel="Bokeh" rightLabel="Sharp"
                      onChange={setApertureIdx} accent={GREEN}
                    />
                    <SliderField
                      label="Focal Length" value={focalIdx} max={FOCAL_LENGTHS.length - 1}
                      displayValue={FOCAL_LENGTHS[focalIdx]}
                      leftLabel="Wide" rightLabel="Telephoto"
                      onChange={setFocalIdx} accent={GREEN}
                    />
                    <StudioSelect label="Lighting Setup" value={lightingSetup} options={LIGHTING_SETUPS} onChange={setLightingSetup} accent={GREEN} />
                    <StudioSelect label="Shot Type" value={shotType} options={SHOT_TYPES} onChange={setShotType} accent={GREEN} />
                    <StudioSelect label="Depth of Field" value={dof} options={DEPTH_OF_FIELD} onChange={setDof} accent={GREEN} />
                    <StudioSelect label="Color Grade" value={colorGrade} options={COLOR_GRADES} onChange={setColorGrade} accent={GREEN} />
                  </>
                ) : (
                  <>
                    {[
                      { label: 'Camera Movement', value: camera, options: CAMERA_MOVEMENTS, set: setCamera },
                      { label: 'Lighting Preset', value: lighting, options: LIGHTING_PRESETS, set: setLighting },
                      { label: 'Lens', value: lens, options: LENS_PRESETS, set: setLens },
                    ].map(({ label, value, options, set }) => (
                      <StudioSelect key={label} label={label} value={value} options={options} onChange={set} accent={PURPLE} />
                    ))}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-[10px] text-white/35 uppercase tracking-wider">Subject / Scene</label>
                      <textarea
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        rows={2}
                        className="bg-black/30 border border-white/[0.10] rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none resize-none transition-all"
                        placeholder="Describe your subject or scene..."
                      />
                    </div>
                  </>
                )}

                {/* Compiled prompt */}
                <div className="rounded-xl bg-black/40 p-4 border" style={{ borderColor: `${accent}18` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-3.5 h-3.5" style={{ color: accent }} />
                    <span className="font-mono text-[9px] uppercase" style={{ color: `${accent}99` }}>
                      {isStill ? 'Compiled Photography Prompt' : 'Generated Director Prompt'}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-white/55 leading-relaxed">
                    {isStill ? stillPrompt : videoPrompt}
                  </p>
                </div>

                <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all border"
                  style={{ backgroundColor: `${accent}15`, borderColor: `${accent}30`, color: accent }}
                >
                  {isStill
                    ? <><Image className="w-4 h-4" /> Generate Image</>
                    : <><Play className="w-4 h-4" /> Generate Video</>
                  }
                </button>
              </div>
            </div>
          </Reveal>

          {/* Right: count pills + preview */}
          <Reveal delay={0.2} className="flex flex-col gap-6">
            {isStill ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { count: 10, label: 'Camera Bodies', color: GREEN },
                    { count: 10, label: 'Film Stocks', color: TEAL },
                    { count: 10, label: 'Aperture Stops', color: GREEN },
                    { count: 11, label: 'Focal Lengths', color: TEAL },
                    { count: 10, label: 'Lighting Setups', color: GREEN },
                    { count: 8, label: 'Color Grades', color: TEAL },
                  ].map(({ count, label, color }) => (
                    <div key={label} className="flex flex-col items-center px-4 py-3 rounded-xl border"
                      style={{ borderColor: `${color}20`, backgroundColor: `${color}06` }}>
                      <span className="text-2xl font-black" style={{ color }}>{count}</span>
                      <span className="text-[10px] text-white/35 mt-0.5 text-center leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
                {/* Viewfinder preview */}
                <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${GREEN}25`, backgroundColor: `${GREEN}04` }}>
                  <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: `${GREEN}15` }}>
                    <Camera className="w-4 h-4" style={{ color: GREEN }} />
                    <span className="text-xs font-semibold" style={{ color: `${GREEN}CC` }}>Viewfinder</span>
                    <div className="ml-auto px-2 py-0.5 rounded-full border" style={{ borderColor: `${GREEN}25`, backgroundColor: `${GREEN}10` }}>
                      <span className="font-mono text-[9px]" style={{ color: GREEN }}>BRAND DNA ACTIVE</span>
                    </div>
                  </div>
                  <div className="relative aspect-[4/3] bg-black/50 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: `linear-gradient(${GREEN}40 1px, transparent 1px), linear-gradient(90deg, ${GREEN}40 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                      }} />
                    {/* Viewfinder corners */}
                    {[
                      'top-3 left-3 border-t border-l',
                      'top-3 right-3 border-t border-r',
                      'bottom-3 left-3 border-b border-l',
                      'bottom-3 right-3 border-b border-r',
                    ].map((cls, i) => (
                      <div key={i} className={`absolute w-5 h-5 ${cls}`} style={{ borderColor: `${GREEN}60` }} />
                    ))}
                    <div className="relative text-center">
                      <p className="text-xs font-semibold text-white/60">{cameraBody}</p>
                      <p className="text-[10px] text-white/35 mt-1">{FOCAL_LENGTHS[focalIdx]} · {APERTURE_STOPS[apertureIdx]} · {filmStock}</p>
                      <p className="text-[10px] text-white/25 mt-0.5">{lightingSetup}</p>
                    </div>
                    <div className="absolute top-3 right-10 px-2 py-0.5 rounded bg-black/60 border border-white/10">
                      <span className="font-mono text-[9px] text-white/40">{shotType.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-4 justify-center">
                  {[
                    { count: 14, label: 'Camera Presets', color: PURPLE },
                    { count: 11, label: 'Lighting Moods', color: TEAL },
                    { count: 11, label: 'Lens Characters', color: PURPLE },
                  ].map(({ count, label, color }) => (
                    <div key={label} className="flex flex-col items-center px-5 py-4 rounded-xl border flex-1"
                      style={{ borderColor: `${color}25`, backgroundColor: `${color}08` }}>
                      <span className="text-3xl font-black" style={{ color }}>{count}</span>
                      <span className="text-[10px] text-white/40 mt-1 text-center leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.04] overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-violet-500/15">
                    <Video className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-semibold text-violet-300">Video Output Preview</span>
                    <div className="ml-auto px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25">
                      <span className="font-mono text-[9px] text-violet-400">VEO 3.1</span>
                    </div>
                  </div>
                  <div className="relative aspect-video bg-black/50 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: 'linear-gradient(rgba(139,92,246,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.2) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                      }} />
                    <div className="relative flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                        <Play className="w-6 h-6 text-violet-400 ml-0.5" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-white/60">{camera} — {lens}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{lighting}</p>
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 border border-white/10">
                      <span className="font-mono text-[9px] text-white/40">16:9 · 24fps</span>
                    </div>
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-violet-500/20 border border-violet-500/30">
                      <span className="font-mono text-[9px] text-violet-400">Brand DNA Active</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-5 py-3 border-t border-violet-500/10">
                    <div className="flex gap-1 flex-1">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <motion.div key={i} className="flex-1 rounded-sm bg-violet-500/20"
                          style={{ height: 12 + Math.sin(i * 1.3) * 6 }}
                          animate={{ opacity: [0.4, 0.8, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }} />
                      ))}
                    </div>
                    <span className="font-mono text-[9px] text-white/25 ml-2">0:05</span>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <Dna className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }} />
              <p className="text-xs text-white/40 leading-relaxed">
                {isStill
                  ? 'Google\'s own Nano Banana prompting guide says prompt like a creative director — control the lens, the lighting, the film stock. We built this independently and arrived at the same architecture.'
                  : 'Brand DNA is injected into every video prompt automatically — your brand\'s visual language governs every frame without you specifying it.'
                }
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Beat This Ad Section ─────────────────────────────────────────────────────
const SCENE_ROWS = [
  { time: '0:00–0:06', element: 'Opening hook — relatable frustration', insight: 'Allegiance through pain', flag: ORANGE },
  { time: '0:07–0:11', element: 'Problem statement, humor + exaggeration', insight: 'Disarms with comedy', flag: ORANGE },
  { time: '0:12–0:16', element: 'Product teaser — anticipation build', insight: 'Withholds the reveal', flag: BLUE },
  { time: '0:17–0:21', element: 'Device reveal — Surface Pro introduced', insight: 'Intrigue peaks here', flag: BLUE },
  { time: '0:22–0:27', element: 'Feature highlight montage', insight: 'Desire, aspiration', flag: GREEN },
  { time: '0:28–0:30', element: 'Flexibility messaging — use cases', insight: 'Rational justification', flag: GREEN },
  { time: '0:31–0:36', element: 'Quirky lifestyle cuts', insight: 'Amusement — widens audience', flag: PURPLE },
  { time: '0:37–0:43', element: 'Power demonstration — heavy tasks', insight: 'Amazement, credibility', flag: PURPLE },
  { time: '0:44–0:49', element: 'Feature deep-dive — Copilot AI', insight: 'Intrigue, differentiation', flag: TEAL },
  { time: '0:50–0:54', element: 'Lifestyle integration — campus, coffee', insight: 'Aspiration, belonging', flag: TEAL },
  { time: '0:55–1:01', element: 'Battery life proof point', insight: 'Reassurance close', flag: BLUE },
  { time: '1:01–1:12', element: 'Product summary + CTA', insight: 'Confidence — brand late again', flag: ROSE },
];

// Total ad duration in seconds for scrubber math
const AD_DURATION_S = 72;

function timeToSeconds(t: string): number {
  const start = t.split('–')[0].trim();
  const [m, s] = start.split(':').map(Number);
  return m * 60 + s;
}

const COUNTER_DIRECTIONS = [
  {
    color: GREEN,
    title: 'Seamless Integration, Effortless Productivity',
    tagline: '"Everything works together — by design."',
    desc: "Microsoft shows features in isolation. The counter move: a single workflow that crosses devices, apps, and AI in one unbroken motion. The integration IS the product. Show a real person moving from a meeting note to a draft to a finished deliverable — no switching, no friction, no cut.",
  },
  {
    color: BLUE,
    title: 'Brand from Frame One',
    tagline: '"You know us before we say a word."',
    desc: "Their brand lock-up lands at 1:01 — the last second of a 72-second ad. Ours anchors frame one. Every format, every platform, every cut opens with unmistakable visual identity. Brand recall isn't built in the CTA. It's built in the first three frames.",
  },
  {
    color: ORANGE,
    title: 'Substance Over Style',
    tagline: '"Not a vibe. A tool that changes how you work."',
    desc: "Trendy cuts and humor win attention but don't convert professionals who need to justify a hardware purchase. Lead with a real task, a measurable outcome, a real person — not a montage of reactions. Let the product be the hero, not the aesthetic.",
  },
];

const AD_ANALYSIS = [
  { label: 'Emotional arc', value: 'Relatability → Aspiration → Rational close', color: ORANGE },
  { label: 'Target', value: 'Students, lifestyle buyers, first-time PC upgraders', color: BLUE },
  { label: 'Brand reveal', value: 'Logo appears at 1:01 of 1:12 — final 1.5% of runtime', color: ROSE },
  { label: 'Pacing', value: '12 scene cuts, avg 6s each — high-density MTV-style', color: PURPLE },
  { label: 'Differentiator', value: 'Copilot AI introduced at 0:44 — buried past the midpoint', color: GREEN },
];

const WEAKNESSES = [
  {
    title: "Fast-paced cuts overwhelm segment buyers",
    desc: "The 12-scene, 72-second structure averages 6 seconds per cut. Practically-minded buyers disengage before product benefits register — they're still processing scene 3 when scene 8 plays.",
  },
  {
    title: "Style-first approach alienates decision-makers",
    desc: "Heavy lifestyle imagery and humor prioritize tone over task. Professionals evaluating a $1,200+ hardware purchase need evidence of outcomes — not a vibe. The ROI case is never made.",
  },
  {
    title: "Trendy creative has a short shelf life",
    desc: "The comedy references and aesthetic choices are moment-specific. Buyers who encounter this ad 6 months post-launch will find a dated feel — reducing conversion on evergreen placements.",
  },
];

function BeatThisAdSection() {
  const [revealedRows, setRevealedRows] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setRevealedRows(i);
      if (i >= SCENE_ROWS.length) {
        clearInterval(interval);
        setTimeout(() => setAnalysisComplete(true), 400);
      }
    }, 220);
    return () => clearInterval(interval);
  }, [inView]);

  const scrubProgress = revealedRows > 0
    ? timeToSeconds(SCENE_ROWS[Math.min(revealedRows - 1, SCENE_ROWS.length - 1)].time) / AD_DURATION_S
    : 0;

  return (
    <section id="beat-this-ad" className="relative py-32 bg-[#080A0F] overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${ORANGE}, transparent)` }}
      />
      <SectionGlow color={GLOW_ORANGE} />

      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="mb-20 text-center">
          <SectionHeader
            eyebrow="Beat This Ad"
            eyebrowColor={ORANGE}
            headline={
              <>
                Drop a competitor URL.
                <br />
                <span style={{ color: ORANGE }}>Walk out with 3 counter-campaigns.</span>
              </>
            }
            sub="Vince watches the ad, breaks it down scene-by-scene, identifies strategic openings, and generates counter-directions with copy and imagery — all in one voice session."
          />
        </Reveal>

        <div className="grid md:grid-cols-5 gap-8" ref={ref}>
          {/* Left: video player + scene table */}
          <div className="md:col-span-2 space-y-4">

            {/* Video player mockup */}
            <div className="rounded-2xl bg-[#0D0F14] border border-white/10 overflow-hidden">
              {/* Player body */}
              <div className="relative h-72 bg-[#090B10] flex items-center justify-center overflow-hidden">
                {/* Brand watermark */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 select-none pointer-events-none">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/40 border border-white/[0.06]">
                    <MonitorPlay className="w-5 h-5 text-orange-400/80" />
                    <span className="text-sm font-bold text-white/70 tracking-wide">Microsoft Surface Pro</span>
                  </div>
                  <span className="text-[10px] text-white/20 tracking-widest uppercase">Competitor Ad · 1:12</span>
                </div>
                {/* Scan line overlay while analyzing */}
                <AnimatePresence>
                  {!analysisComplete && (
                    <motion.div
                      className="absolute left-0 w-full h-[2px] bg-orange-400/60"
                      style={{ boxShadow: `0 0 12px ${ORANGE}` }}
                      initial={{ top: '0%' }}
                      animate={{ top: '100%' }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: (SCENE_ROWS.length * 0.22), ease: 'linear', repeat: Infinity }}
                    />
                  )}
                </AnimatePresence>
                {/* Complete overlay */}
                <AnimatePresence>
                  {analysisComplete && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center bg-black/30"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-bold text-green-300">Analysis complete</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Scrubber */}
              <div className="px-4 py-3 space-y-2 border-t border-white/[0.06]">
                <div className="relative h-1 rounded-full bg-white/10">
                  <motion.div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ backgroundColor: ORANGE }}
                    animate={{ width: `${scrubProgress * 100}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-lg"
                    style={{ backgroundColor: ORANGE }}
                    animate={{ left: `calc(${scrubProgress * 100}% - 5px)` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/30">
                    {revealedRows > 0 ? SCENE_ROWS[Math.min(revealedRows - 1, SCENE_ROWS.length - 1)].time.split('–')[0] : '0:00'}
                  </span>
                  <span className="text-[10px] font-mono text-white/30">1:12</span>
                </div>
              </div>
            </div>

            {/* Scene breakdown table */}
            <div className="rounded-2xl bg-[#111318] border border-white/10 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10 bg-[#0D0F14]">
                <BarChart2 className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-semibold text-white/60">Scene breakdown</span>
                <div className="ml-auto">
                  <AnimatePresence mode="wait">
                    {!analysisComplete ? (
                      <motion.div
                        key="analyzing"
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20"
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                        <span className="text-[10px] text-orange-400 font-bold">ANALYZING</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="complete"
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        <span className="text-[10px] text-green-400 font-bold">COMPLETE</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="divide-y divide-white/[0.04]">
                {SCENE_ROWS.map((row, i) => (
                  <motion.div
                    key={row.time}
                    initial={{ opacity: 0, y: 6 }}
                    animate={i < revealedRows ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="grid grid-cols-[72px_1fr_1fr] gap-3 items-center px-4 py-2.5"
                    style={{
                      backgroundColor: i === revealedRows - 1 && !analysisComplete
                        ? `${row.flag}08`
                        : undefined,
                    }}
                  >
                    <span className="text-[10px] font-mono text-white/25">{row.time}</span>
                    <span className="text-[11px] text-white/55 leading-snug">{row.element}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: row.flag }} />
                      <span className="text-[11px] leading-snug" style={{ color: `${row.flag}BB` }}>
                        {row.insight}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: analysis + weaknesses + counter directions */}
          <div className="md:col-span-3 space-y-4">
            {/* Ad analysis */}
            <Reveal>
              <div className="rounded-2xl bg-[#111318] border border-white/10 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ORANGE }} />
                  <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: ORANGE }}>Vince Analysis</span>
                </div>
                <div className="space-y-2.5">
                  {AD_ANALYSIS.map((row) => (
                    <div key={row.label} className="grid grid-cols-[110px_1fr] gap-3 items-start">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25">{row.label}</span>
                      <span className="text-[11px] leading-relaxed" style={{ color: `${row.color}CC` }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Strategic openings */}
            <Reveal>
              <div className="rounded-2xl bg-[#111318] border border-white/10 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ROSE }} />
                  <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: ROSE }}>Strategic Openings</span>
                </div>
                <div className="space-y-4">
                  {WEAKNESSES.map((w, i) => (
                    <Reveal key={i} delay={0.1 + i * 0.08}>
                      <div className="flex items-start gap-3">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5"
                          style={{ backgroundColor: `${ROSE}20`, color: ROSE }}
                        >
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white/80 mb-1">{w.title}</p>
                          <p className="text-[11px] text-white/40 leading-relaxed">{w.desc}</p>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Counter directions */}
            {COUNTER_DIRECTIONS.map((dir, i) => (
              <Reveal key={dir.title} delay={0.15 + i * 0.1}>
                <div
                  className="rounded-2xl border p-5"
                  style={{ borderColor: `${dir.color}28`, backgroundColor: `${dir.color}07` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                      style={{ backgroundColor: dir.color, color: '#000' }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-xs font-bold text-white/90 leading-snug">{dir.title}</span>
                  </div>
                  <p className="text-[11px] font-semibold mb-2 leading-snug" style={{ color: dir.color }}>
                    {dir.tagline}
                  </p>
                  <p className="text-[11px] text-white/35 leading-relaxed">{dir.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Campaign Packages Section ────────────────────────────────────────────────
const FORMATS = [
  { label: 'Billboard', ratio: '16:9', icon: MonitorPlay, color: GREEN },
  { label: 'LinkedIn', ratio: '1:1', icon: FileText, color: BLUE },
  { label: 'Story', ratio: '9:16', icon: Smartphone, color: PURPLE },
  { label: 'Email header', ratio: '3:1', icon: MessageSquare, color: ORANGE },
  { label: 'OOH transit', ratio: '16:5', icon: Layers, color: TEAL },
  { label: 'Product hero', ratio: '4:3', icon: Image, color: ROSE },
  { label: 'YouTube thumb', ratio: '16:9', icon: Play, color: ORANGE },
  { label: 'Print full-page', ratio: '2:3', icon: FileText, color: BLUE },
];

function CampaignPackagesSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % FORMATS.length), 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="packages" className="relative py-32 bg-[#050508] overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${PURPLE}, transparent)` }}
      />
      <SectionGlow color={GLOW_PURPLE} />
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Copy */}
          <div>
            <Reveal>
              <SectionHeader
                eyebrow="Campaign Packages"
                eyebrowColor={PURPLE}
                headline={
                  <>
                    Copy and images.
                    <br />
                    <span style={{ color: PURPLE }}>Together. Ready.</span>
                  </>
                }
                sub="One brief generates a full campaign package — 14 agency formats, copy and imagery interleaved, delivered as a single coherent creative system."
                center={false}
              />
            </Reveal>

            <Reveal delay={0.15} className="mt-6">
              <p className="text-sm text-white/45 leading-relaxed">
                Brief Vince by voice or text — describe the campaign, upload a reference image to set visual direction, and name your brand. He generates every format simultaneously: headline copy, body copy, and a brand-calibrated image for each one. LinkedIn post, billboard, OOH transit, email header, story, YouTube thumbnail — written and designed together, not separately. Everything arrives in a single response, ready to hand off. No resizing. No copy-pasting. No prompt engineering required.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  'Upload reference image',
                  'Voice or text brief',
                  'Copy + image per format',
                  'Brand DNA auto-applied',
                  'ZIP for handoff',
                  '14 agency formats',
                ].map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border"
                    style={{ borderColor: `${PURPLE}30`, color: `${PURPLE}CC`, backgroundColor: `${PURPLE}08` }}
                  >
                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: PURPLE }} />
                    {f}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.2} className="mt-8">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: '14', label: 'Output formats', color: PURPLE },
                  { value: '1', label: 'Brief to trigger it', color: GREEN },
                  { value: '∞', label: 'Brand-consistent', color: BLUE },
                  { value: '0', label: 'Manual resizes', color: ORANGE },
                ].map(({ value, label, color }) => (
                  <div
                    key={label}
                    className="p-4 rounded-2xl border text-center"
                    style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}
                  >
                    <p className="text-3xl font-black" style={{ color }}>
                      {value}
                    </p>
                    <p className="text-xs text-white/40 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Format grid visual */}
          <Reveal delay={0.3}>
            <div className="rounded-2xl bg-[#111318] border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-5">
                <Package className="w-4 h-4" style={{ color: PURPLE }} />
                <span className="text-xs text-white/50 font-mono">campaign_package · 8 of 14 formats shown</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {FORMATS.map((fmt, i) => {
                  const [w, h] = fmt.ratio.split(':').map(Number);
                  const maxH = 56;
                  const maxW = 72;
                  const scale = Math.min(maxW / w, maxH / h);
                  const fmtW = Math.round(w * scale);
                  const fmtH = Math.round(h * scale);

                  return (
                    <motion.div
                      key={fmt.label}
                      className="flex flex-col items-center gap-1.5 cursor-pointer"
                      onClick={() => setActive(i)}
                    >
                      <div
                        className="rounded border transition-all duration-300 flex items-center justify-center"
                        style={{
                          width: fmtW,
                          height: fmtH,
                          borderColor: active === i ? `${fmt.color}80` : 'rgba(255,255,255,0.1)',
                          backgroundColor: active === i ? `${fmt.color}20` : 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <fmt.icon
                          className="w-3.5 h-3.5"
                          style={{ color: active === i ? fmt.color : '#444' }}
                        />
                      </div>
                      <span className="text-[9px] text-white/30 text-center leading-tight">{fmt.label}</span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Active format detail */}
              <div
                className="mt-4 px-4 py-3 rounded-xl border transition-all"
                style={{
                  borderColor: `${FORMATS[active].color}30`,
                  backgroundColor: `${FORMATS[active].color}08`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{FORMATS[active].label}</span>
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${FORMATS[active].color}20`, color: FORMATS[active].color }}
                  >
                    {FORMATS[active].ratio}
                  </span>
                </div>
                <p className="text-xs text-white/30 mt-1">Copy + image generated together · Brand-calibrated</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Available Everywhere Section ─────────────────────────────────────────────
function AvailableEverywhereSection() {
  return (
    <section id="platforms" className="relative py-32 bg-[#080A0F] overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${TEAL}, ${PURPLE}, transparent)` }}
      />
      <SectionGlow color={GLOW_TEAL} />

      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="mb-16">
          <SectionHeader
            eyebrowColor={TEAL}
            headline={
              <>
                Available
                <br />
                <span style={{ color: TEAL }}>everywhere.</span>
              </>
            }
            sub="Three surfaces. One Creative Director. Your brand built in across browser, iOS, and Android."
          />
        </Reveal>

        {/* Browser + phone mockups side by side */}
        <Reveal className="mb-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Browser mockup */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4 text-center" style={{ color: TEAL }}>Chrome Extension</p>
              <VinceBrowserMockup />
            </div>

            {/* Phone mockup */}
            <div className="flex flex-col items-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4 text-center" style={{ color: PURPLE }}>iOS + Android</p>
              <div className="relative">
                <div className="w-56 h-[480px] rounded-[2.5rem] bg-[#1C1C1E] border-2 border-white/20 shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-b-2xl z-10" />
                  <div className="absolute inset-0 pt-8 px-4 pb-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4 mt-2">
                      <p className="text-xs font-semibold text-white">Vince</p>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: GREEN }} />
                    </div>
                    <div className="flex-1 space-y-3 overflow-hidden">
                      <div className="flex justify-end">
                        <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                          <p className="text-[10px] text-white">Build me a LinkedIn campaign for the summit</p>
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-[#2C2C2E] rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%]">
                          <p className="text-[10px] text-white/80">On it — pulling MERGE brand context…</p>
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div
                          className="rounded-2xl rounded-tl-sm p-2 max-w-[85%] border"
                          style={{ borderColor: `${GREEN}30`, backgroundColor: `${GREEN}10` }}
                        >
                          <div className="w-full h-20 rounded-xl bg-gradient-to-br from-green-900/50 to-green-700/30 mb-2 flex items-center justify-center">
                            <Image className="w-6 h-6 text-green-400/50" />
                          </div>
                          <p className="text-[9px]" style={{ color: GREEN }}>
                            LinkedIn post · 1:1 · Copy + image
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-[#2C2C2E] rounded-full px-3 py-2">
                      <Mic className="w-3.5 h-3.5" style={{ color: GREEN }} />
                      <div className="flex-1 flex gap-0.5 items-center">
                        {[2, 4, 3, 5, 2, 4, 3].map((h, i) => (
                          <motion.div
                            key={i}
                            className="w-0.5 rounded-full"
                            style={{ backgroundColor: GREEN }}
                            animate={{ height: [h, h * 2.5, h] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                          />
                        ))}
                      </div>
                    </div>
                </div>
              </div>

              </div>
            </div>
          </div>
        </Reveal>

        {/* Download CTAs */}
        <Reveal delay={0.15} className="mb-12">
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#"
              className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: TEAL, color: '#000' }}
            >
              <Chrome className="w-4 h-4" />
              Add to Chrome
            </a>
            <a
              href="#"
              className="flex items-center gap-2 px-6 py-3 rounded-full border font-semibold text-sm transition-all hover:bg-white/10"
              style={{ borderColor: `${PURPLE}50`, color: PURPLE }}
            >
              <svg viewBox="0 0 14 17" className="w-3.5 h-4 fill-current" aria-hidden>
                <path d="M13.2 8.7c0-2.7 2.2-4 2.3-4.1-1.2-1.8-3.1-2-3.8-2.1-1.6-.2-3.2 1-4 1s-2.1-1-3.5-.9C2.6 3.7 1 4.7.3 6.2-1.2 9.4.1 14.1 1.6 16.8c.7 1.3 1.6 2.8 2.8 2.7 1.1-.1 1.5-.7 2.9-.7s1.7.7 2.9.7c1.2 0 2-1.3 2.7-2.6.9-1.5 1.2-2.9 1.2-3C14 13.9 13.2 11.8 13.2 8.7zM10.5 1.7C11.1.9 11.5-.1 11.3-1c-.9.1-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.8.9.1 1.9-.5 2.7-1.5z" />
              </svg>
              App Store
            </a>
            <a
              href="#"
              className="flex items-center gap-2 px-6 py-3 rounded-full border font-semibold text-sm transition-all hover:bg-white/10"
              style={{ borderColor: `${GREEN}50`, color: GREEN }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden>
                <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5S11 23.33 11 22.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0 0 12 1.5c-.96 0-1.86.23-2.66.63L7.88.65c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C7.15 3.53 6 5.47 6 7.5h12c0-2.03-1.15-3.97-2.47-5.34zM10 5.5H9v-1h1v1zm5 0h-1v-1h1v1z" />
              </svg>
              Google Play
            </a>
          </div>
        </Reveal>

        {/* Feature grid */}
        <Reveal delay={0.2}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                color: TEAL,
                title: 'Brand Quick Starters',
                desc: 'Every brand gets its own pre-briefed starting points — available in the extension and on mobile.',
              },
              {
                icon: Bot,
                color: GREEN,
                title: 'Full Creative Director',
                desc: 'The same 26-tool voice session from the studio, in a browser side panel or your phone.',
              },
              {
                icon: Globe,
                color: BLUE,
                title: 'Context-aware',
                desc: "Vince can see the page you're on. Reference competitor sites, LinkedIn posts, or briefs directly.",
              },
              {
                icon: Mic,
                color: PURPLE,
                title: 'Voice on the go',
                desc: 'Full Gemini Live voice session on mobile. Brief campaigns from a cab, lobby, or coffee shop.',
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm mb-0.5">{title}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Animated Request Flow ────────────────────────────────────────────────────
const FLOW_NODES = [
  { label: 'Voice Input', color: BLUE },
  { label: 'Gemini Live', color: BLUE },
  { label: 'Tool Dispatch', color: GREEN },
  { label: 'Brand Context', color: GREEN },
  { label: 'Imagen 4 / Veo 3.1', color: PURPLE },
  { label: 'Edge Function', color: ORANGE },
  { label: 'Realtime Push', color: ORANGE },
  { label: 'Campaign Package', color: TEAL },
];

function RequestFlowDiagram() {
  const [activeNode, setActiveNode] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-80px' });

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setActiveNode((n) => (n + 1) % FLOW_NODES.length);
    }, 700);
    return () => clearInterval(interval);
  }, [inView]);

  return (
    <Reveal delay={0.3} className="mt-10">
      <div ref={ref} className="rounded-2xl border border-white/10 p-6 bg-[#111318]">
        <p className="text-xs text-white/30 font-mono mb-5">// system.architecture · request_flow</p>
        <div className="flex flex-wrap items-center gap-0">
          {FLOW_NODES.map((node, i) => (
            <div key={node.label} className="flex items-center">
              <motion.div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-300"
                animate={{
                  borderColor: i === activeNode ? `${node.color}60` : 'rgba(255,255,255,0.06)',
                  backgroundColor: i === activeNode ? `${node.color}15` : 'transparent',
                  scale: i === activeNode ? 1.04 : 1,
                }}
                transition={{ duration: 0.25 }}
              >
                <motion.div
                  className="w-1.5 h-1.5 rounded-full"
                  animate={{
                    backgroundColor: i === activeNode ? node.color : 'rgba(255,255,255,0.15)',
                    boxShadow: i === activeNode ? `0 0 6px ${node.color}` : 'none',
                  }}
                  transition={{ duration: 0.25 }}
                />
                <span
                  className="font-mono text-[11px] transition-colors duration-300"
                  style={{ color: i === activeNode ? node.color : 'rgba(255,255,255,0.25)' }}
                >
                  {node.label}
                </span>
              </motion.div>
              {i < FLOW_NODES.length - 1 && (
                <motion.span
                  className="font-mono text-xs mx-1"
                  animate={{ color: i < activeNode ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)' }}
                  transition={{ duration: 0.3 }}
                >
                  →
                </motion.span>
              )}
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

// ─── Browser Extension Mockup ─────────────────────────────────────────────────
const EXT_QUICK_STARTERS = [
  { label: 'Beat this ad', color: ORANGE, icon: BarChart2 },
  { label: 'LinkedIn post', color: BLUE, icon: FileText },
  { label: 'Campaign brief', color: GREEN, icon: Package },
  { label: 'Brand audit', color: PURPLE, icon: Star },
];

// The on-brand prompt Vince generates for "LinkedIn post"
const PASTE_TEXT = 'Write a LinkedIn post for MERGE — executive tone, AI enablement angle, ≤200 words. Voice: direct, confident, no corporate jargon. Open with a sharp insight about how agencies are (mis)using AI. End with a clear POV, no CTA.';

// phases: closed → quickstart → selected → prompt_ready → copied → pasting
type ExtPhase = 'closed' | 'quickstart' | 'selected' | 'prompt_ready' | 'copied' | 'pasting';

function VinceBrowserMockup() {
  const [phase, setPhase] = useState<ExtPhase>('closed');
  const [pasteChars, setPasteChars] = useState(0);
  const [cycle, setCycle] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  // Cycle reset
  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setCycle((c) => c + 1);
      setPhase('closed');
      setPasteChars(0);
    }, 24000);
    return () => clearInterval(interval);
  }, [inView]);

  // Phase timeline
  useEffect(() => {
    if (!inView) return;
    const timers = [
      setTimeout(() => setPhase('quickstart'), 1000),   // panel opens, quick starters shown
      setTimeout(() => setPhase('selected'), 3500),      // LinkedIn post button highlighted
      setTimeout(() => setPhase('prompt_ready'), 5500),  // brand prompt appears in sidebar
      setTimeout(() => setPhase('copied'), 9200),        // copy button flashes
      setTimeout(() => setPhase('pasting'), 10400),      // types into Gemini input bar
    ];
    return () => timers.forEach(clearTimeout);
  }, [cycle, inView]);

  // Typewriter effect into Gemini input
  useEffect(() => {
    if (phase !== 'pasting') { setPasteChars(0); return; }
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setPasteChars(i);
      if (i >= PASTE_TEXT.length) clearInterval(interval);
    }, 22);
    return () => clearInterval(interval);
  }, [phase]);

  const panelOpen = phase !== 'closed';
  const isPasting = phase === 'pasting';

  return (
    <div ref={ref} className="w-full max-w-3xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#1C1C26]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#13131D] border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]/70" />
        </div>
        <div className="flex-1 h-6 bg-white/[0.05] rounded-md px-3 flex items-center gap-1.5 mx-4">
          <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 shrink-0" fill="rgba(255,255,255,0.2)">
            <path d="M9 5V3.5a3 3 0 0 0-6 0V5H2v6h8V5H9zm-4-1.5a1 1 0 0 1 2 0V5H5V3.5z" />
          </svg>
          <span className="font-mono text-[9px] text-white/25">gemini.google.com</span>
        </div>
        <motion.div
          className="w-6 h-6 rounded flex items-center justify-center cursor-pointer"
          style={{ backgroundColor: panelOpen ? `${GREEN}20` : 'transparent' }}
          animate={!panelOpen ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 1.4, repeat: !panelOpen ? Infinity : 0 }}
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill={panelOpen ? GREEN : 'rgba(255,255,255,0.3)'}>
            <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <rect x="9" y="1" width="6" height="14" rx="1" fill="currentColor" opacity="0.5" />
          </svg>
        </motion.div>
      </div>

      {/* Browser body */}
      <div className="flex" style={{ height: 360 }}>
        {/* Gemini page */}
        <div className="flex-1 bg-[#1A1A28] overflow-hidden flex flex-col">
          {/* Gemini nav */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.05]">
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill="#4285F4" />
              </svg>
              <span className="text-[11px] font-semibold text-white/40">Gemini</span>
            </div>
            <div className="flex gap-3 ml-4">
              {['Explore', 'Gem manager'].map((t) => (
                <span key={t} className="text-[9px] text-white/20">{t}</span>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 px-5 py-4 flex flex-col justify-between overflow-hidden">
            <div className="space-y-3">
              <div className="flex justify-end">
                <div className="bg-white/[0.06] rounded-2xl rounded-tr-sm px-3 py-2 max-w-[70%]">
                  <p className="text-[10px] text-white/50 leading-relaxed">What's the best hardware for a creative team on a budget?</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4285F4, #8B5CF6)' }}>
                  <span className="text-[7px] font-bold text-white">G</span>
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="h-2 bg-white/[0.08] rounded w-full" />
                  <div className="h-2 bg-white/[0.06] rounded w-5/6" />
                  <div className="h-2 bg-white/[0.06] rounded w-4/5" />
                  <div className="mt-2 p-2 bg-white/[0.04] rounded-lg border border-white/[0.05]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-8 h-8 bg-white/[0.05] rounded-md" />
                      <div className="space-y-1 flex-1">
                        <div className="h-2 bg-white/[0.08] rounded w-2/3" />
                        <div className="h-1.5 bg-white/[0.04] rounded w-1/2" />
                      </div>
                    </div>
                    <div className="text-[8px] text-blue-400/50">Microsoft Surface Pro — featured result</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Input bar — typewriters the Vince prompt when pasting */}
            <motion.div
              className="mt-3 flex items-start gap-2 rounded-2xl px-4 py-3 border min-h-[36px]"
              animate={{
                borderColor: isPasting ? 'rgba(66,133,244,0.45)' : 'rgba(255,255,255,0.07)',
                backgroundColor: isPasting ? 'rgba(66,133,244,0.06)' : 'rgba(255,255,255,0.04)',
              }}
              transition={{ duration: 0.3 }}
            >
              {isPasting ? (
                <p className="text-[9px] text-blue-300/80 flex-1 font-mono leading-relaxed break-words">
                  {PASTE_TEXT.slice(0, pasteChars)}
                  <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>|</motion.span>
                </p>
              ) : (
                <>
                  <span className="text-[9px] text-white/15 flex-1 self-center">Ask Gemini</span>
                  <Mic className="w-3 h-3 text-white/15 shrink-0 self-center" />
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* Vince sidebar */}
        <motion.div
          className="bg-[#0B1C14] border-l border-white/[0.08] flex-shrink-0 overflow-hidden"
          animate={{ width: panelOpen ? 210 : 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          <div className="w-[210px] h-full flex flex-col">
            {/* Panel header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06]">
              <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black shrink-0" style={{ backgroundColor: GREEN, color: '#000' }}>V</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white/80">Vince</p>
                <p className="text-[8px] text-white/30">Creative Director · MERGE</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: GREEN }} />
            </div>

            {/* Sidebar content */}
            <div className="flex-1 overflow-hidden relative">

              {/* Phase: quick starters */}
              <AnimatePresence>
                {(phase === 'quickstart' || phase === 'selected') && (
                  <motion.div
                    key="quickstart"
                    className="absolute inset-0 p-2.5 flex flex-col gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-[9px] text-white/25 font-semibold uppercase tracking-widest px-1 mt-1">MERGE Quick Start</p>
                    {EXT_QUICK_STARTERS.map((qs, i) => {
                      const isSelected = phase === 'selected' && i === 1; // LinkedIn post
                      return (
                        <motion.div
                          key={qs.label}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-lg border"
                          style={{
                            borderColor: isSelected ? `${qs.color}55` : `${qs.color}18`,
                            backgroundColor: isSelected ? `${qs.color}15` : `${qs.color}07`,
                          }}
                          animate={isSelected ? { scale: [1, 0.97, 1] } : {}}
                          transition={{ duration: 0.25 }}
                        >
                          <qs.icon className="w-3 h-3 shrink-0" style={{ color: qs.color }} />
                          <span className="text-[10px] font-medium flex-1" style={{ color: isSelected ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)' }}>
                            {qs.label}
                          </span>
                          {isSelected && (
                            <motion.div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: qs.color }}
                              animate={{ opacity: [1, 0.2, 1] }}
                              transition={{ duration: 0.45, repeat: Infinity }}
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Phase: prompt ready + copy button */}
              <AnimatePresence>
                {(phase === 'prompt_ready' || phase === 'copied') && (
                  <motion.div
                    key="prompt"
                    className="absolute inset-0 p-2.5 flex flex-col gap-2"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="flex items-center gap-1.5 px-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BLUE }} />
                      <p className="text-[9px] text-white/30 font-semibold uppercase tracking-widest">On-brand prompt</p>
                    </div>
                    <div
                      className="flex-1 rounded-xl border p-2.5 text-[9px] font-mono leading-relaxed overflow-hidden"
                      style={{ borderColor: `${BLUE}25`, backgroundColor: `${BLUE}07`, color: `${BLUE}BB` }}
                    >
                      {PASTE_TEXT}
                    </div>
                    <motion.button
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border text-[10px] font-semibold transition-all"
                      animate={{
                        borderColor: phase === 'copied' ? `${GREEN}50` : 'rgba(255,255,255,0.12)',
                        backgroundColor: phase === 'copied' ? `${GREEN}20` : 'rgba(255,255,255,0.05)',
                        color: phase === 'copied' ? GREEN : 'rgba(255,255,255,0.5)',
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {phase === 'copied'
                        ? <><ClipboardCheck className="w-3 h-3" /> Copied to clipboard</>
                        : <><Copy className="w-3 h-3" /> Copy prompt</>
                      }
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Phase: pasting — show a "Paste it anywhere" confirmation */}
              <AnimatePresence>
                {phase === 'pasting' && (
                  <motion.div
                    key="pasting"
                    className="absolute inset-0 p-2.5 flex flex-col items-center justify-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    <motion.div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${GREEN}20` }}
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      <ClipboardCheck className="w-5 h-5" style={{ color: GREEN }} />
                    </motion.div>
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-bold text-white/70">Pasting into Gemini</p>
                      <p className="text-[9px] text-white/30 leading-relaxed">Brand-calibrated prompt,<br />any AI window.</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-white/[0.08] bg-white/[0.03]">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: BLUE }} />
                      <span className="text-[8px] text-white/25 font-mono">site-agnostic</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="p-2.5 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 bg-white/[0.04] rounded-lg px-2.5 py-1.5">
                <Mic className="w-3 h-3 shrink-0" style={{ color: GREEN }} />
                <span className="text-[9px] text-white/20 flex-1">Or brief Vince by voice...</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Technical Architecture Section ──────────────────────────────────────────
const TECH_STACK = [
  {
    layer: 'Voice & Reasoning',
    color: BLUE,
    items: [
      { icon: Mic, label: 'Gemini Live API', desc: 'Persistent bidirectional audio session, sub-400ms response latency' },
      { icon: BrainCircuit, label: 'Gemini 2.5 Pro', desc: 'Advanced multimodal reasoning — video, image, and text in one call' },
      { icon: Sparkles, label: 'Gemini 3.1 Flash', desc: 'Fast generation backbone for real-time creative output' },
    ],
  },
  {
    layer: 'Image & Video Generation',
    color: PURPLE,
    items: [
      { icon: Image, label: 'Imagen 4 Standard · Ultra', desc: 'Photorealistic brand image generation — Standard for speed, Ultra for maximum quality' },
      { icon: Image, label: '🍌 Nano Banana 2 · Pro', desc: 'Ultra-fast low-cost generation for rapid iteration, previews, and high-volume output' },
      { icon: Video, label: 'Veo 3.1', desc: 'Video generation for motion creative, B-roll, and scene animation' },
    ],
  },
  {
    layer: 'Brand Memory',
    color: GREEN,
    items: [
      { icon: Database, label: 'pgvector', desc: 'Vector embeddings for semantic brand rule retrieval at generation time' },
      { icon: Server, label: 'PostgreSQL', desc: 'Relational brand data, campaign history, and asset registry' },
    ],
  },
  {
    layer: 'Execution',
    color: ORANGE,
    items: [
      { icon: Cpu, label: 'Edge Functions', desc: 'Distributed compute for generation pipelines and async jobs' },
      { icon: Zap, label: 'Realtime Push', desc: 'WebSocket-backed delivery for long-running generation results' },
    ],
  },
];

function TechSection() {
  return (
    <section id="architecture" className="relative py-32 bg-[#080A0F] overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${ROSE}, transparent)` }}
      />
      <SectionGlow color={GLOW_ROSE} />

      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="mb-20">
          <SectionHeader
            eyebrow="Architecture"
            eyebrowColor={ROSE}
            headline={
              <>
                Built on the
                <br />
                <span style={{ color: ROSE }}>frontier stack.</span>
              </>
            }
            sub="Gemini Live for voice reasoning, Imagen 3 for generation, pgvector for brand memory, Edge Functions for async execution. No shortcuts."
          />
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          {TECH_STACK.map((group, gi) => (
            <Reveal key={group.layer} delay={gi * 0.1}>
              <div className="rounded-2xl bg-[#111318] border border-white/10 p-5 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                  <span
                    className="text-xs font-bold tracking-wide uppercase"
                    style={{ color: group.color }}
                  >
                    {group.layer}
                  </span>
                </div>
                <div className="space-y-4">
                  {group.items.map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${group.color}15`, color: group.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{label}</p>
                        <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Animated request flow */}
        <RequestFlowDiagram />
      </div>
    </section>
  );
}

// ─── Architecture Section ─────────────────────────────────────────────────────
function VoiceVisual() {
  return (
    <div className="flex items-end gap-[3px] h-7 mt-3">
      {([0.5, 0.85, 0.55, 1, 0.65, 0.9, 0.45, 0.75, 0.6] as const).map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{ background: `${GREEN}55`, height: `${h * 26}px` }}
          animate={{ scaleY: [1, 1.7, 1] }}
          transition={{ duration: 0.45 + i * 0.06, repeat: Infinity, ease: 'easeInOut', delay: i * 0.07 }}
        />
      ))}
    </div>
  );
}

function DnaVisual() {
  return (
    <div className="flex gap-1.5 mt-3 flex-wrap" style={{ maxWidth: 120 }}>
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: BLUE }}
          animate={{ opacity: [0.15, 0.85, 0.15] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.09, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function PipelineVisual() {
  return (
    <div className="flex items-center gap-2 mt-3">
      <div
        className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold"
        style={{ border: `1px solid ${TEAL}35`, color: TEAL, backgroundColor: `${TEAL}10` }}
      >
        Live
      </div>
      <div className="flex-1 flex items-center">
        <motion.div
          className="h-px w-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${TEAL}, transparent)` }}
          animate={{ scaleX: [0, 1, 0], originX: 0 }}
          transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div
        className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold"
        style={{ border: `1px solid ${TEAL}35`, color: TEAL, backgroundColor: `${TEAL}10` }}
      >
        Flash
      </div>
    </div>
  );
}

function BrowserVisual() {
  return (
    <div className="mt-3 rounded-lg border overflow-hidden" style={{ borderColor: `${ORANGE}25`, maxWidth: 120 }}>
      <div className="flex items-center gap-1 px-2 py-1 border-b" style={{ borderColor: `${ORANGE}15`, backgroundColor: `${ORANGE}08` }}>
        {[1, 2, 3].map((k) => (
          <div key={k} className="w-1.5 h-1.5 rounded-full bg-white/15" />
        ))}
      </div>
      <div className="flex gap-1 p-1.5">
        <div className="flex-1 h-8 rounded bg-white/[0.03]" />
        <motion.div
          className="w-6 h-8 rounded"
          style={{ backgroundColor: `${ORANGE}15`, border: `1px solid ${ORANGE}35` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      </div>
    </div>
  );
}

const DIFFERENTIATORS = [
  {
    color: GREEN,
    icon: Mic,
    title: 'Voice-first creative direction',
    tag: 'Category Differentiator',
    desc: 'You speak your brief. Vince responds in real time, retrieves brand memory, builds the prompt, and directs the generation — all by voice. No keyboard. No prompt engineering.',
    Visual: VoiceVisual,
  },
  {
    color: BLUE,
    icon: Dna,
    title: 'Brand DNA as a retrieval layer',
    tag: 'Technical Foundation',
    desc: "Brand intelligence isn't a static system prompt. It's a semantic retrieval layer — chunked, embedded, indexed with pgvector HNSW. The exact relevant context is retrieved automatically at generation time.",
    Visual: DnaVisual,
  },
  {
    color: TEAL,
    icon: Layers,
    title: 'Dual Gemini model pipeline',
    tag: 'Novel Architecture',
    desc: "Gemini Live owns the agent loop — voice, tools, conversation. Gemini Flash handles interleaved text and image generation in parallel. The Live session speaks while results render. Dead air eliminated by design.",
    Visual: PipelineVisual,
  },
  {
    color: ORANGE,
    icon: Globe,
    title: 'Browser-level brand distribution',
    tag: 'Distribution Advantage',
    desc: "Not a point integration — a browser layer. Gemini, Claude, Firefly, Midjourney, ChatGPT — the brand sidebar is present on all of them. The brand travels with the prompt.",
    Visual: BrowserVisual,
  },
];

function WhySection() {
  return (
    <section className="relative py-32 bg-[#050508] overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)` }}
      />
      <SectionGlow color={GLOW_GREEN} />
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="mb-20">
          <SectionHeader
            eyebrow="Architecture"
            eyebrowColor={GREEN}
            headline={
              <>
                Four decisions.
                <br />
                <span style={{ color: GREEN }}>Each one deliberate.</span>
              </>
            }
            sub="Voice-first input. Brand DNA as a retrieval layer. Dual Gemini models. Browser-level distribution. Four architectural choices — each one solving a specific problem in how AI tools handle brand context today."
          />
        </Reveal>

        <div className="grid md:grid-cols-2 gap-5">
          {DIFFERENTIATORS.map((d, i) => (
            <Reveal key={d.title} delay={i * 0.1}>
              <div
                className="rounded-2xl border p-7 h-full flex flex-col gap-4"
                style={{ borderColor: `${d.color}20`, backgroundColor: `${d.color}06` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${d.color}18`, color: d.color, border: `1px solid ${d.color}25` }}
                  >
                    <d.icon className="w-5 h-5" />
                  </div>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0"
                    style={{ color: d.color, background: `${d.color}12`, border: `1px solid ${d.color}20` }}
                  >
                    {d.tag}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2 leading-snug">{d.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{d.desc}</p>
                </div>
                <d.Visual />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="relative py-48 bg-[#080A0F] overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)` }}
      />
      <SectionGlow color={GLOW_GREEN} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 70% 60% at 50% 110%, ${GREEN}0A, transparent)` }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 35% 35% at 50% 85%, ${GREEN}05, transparent)` }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Eyebrow */}
        <Reveal>
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border" style={{ borderColor: `${GREEN}25`, backgroundColor: `${GREEN}08` }}>
              <Users className="w-3 h-3" style={{ color: GREEN }} />
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: GREEN }}>Human × AI Collaboration</span>
            </div>
          </div>

          {/* Main headline */}
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-white leading-[1.02] mb-14">
            Your brand.
            <br />
            <span style={{ color: GREEN }}>Built in.</span>
          </h2>

          {/* The one line */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="relative w-7 h-7 flex items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: `${GREEN}18` }}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${GREEN}30` }}>
                <Mic className="w-2 h-2" style={{ color: GREEN }} />
              </div>
            </div>
            <p className="text-3xl md:text-4xl font-semibold text-white/90 tracking-tight">
              Vince doesn't reference your brand guidelines. He becomes them.
            </p>
          </div>

          <p className="text-base text-white/35 mb-14 leading-relaxed max-w-lg mx-auto">
            Brief by voice. Copy and images together, every format, grounded in your brand's DNA.
          </p>
        </Reveal>
      </div>

      {/* Meta story + tech stack — full page width */}
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <Reveal delay={0.15}>
          <div
            className="rounded-2xl border p-8 md:p-10 mb-6 text-left"
            style={{ borderColor: `${GREEN}18`, backgroundColor: `${GREEN}06` }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-10 rounded-full" style={{ background: `linear-gradient(to bottom, ${GREEN}, ${BLUE})` }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 mb-0.5">The meta-story</p>
                <p className="text-xs text-white/25">Google Gemini Live API Hackathon · March 2026</p>
              </div>
            </div>
            <p className="text-xl md:text-2xl font-semibold text-white/85 leading-relaxed mb-5 max-w-3xl">
              I'm <span style={{ color: '#4ade80' }}>NOT</span> a developer… I'm <span style={{ color: '#4ade80' }}>Built Different</span>.
              <br />
              I'm the Director of AI Enablement at{' '}
              <a href="https://mergeworld.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4ade80' }}>MERGE</a>
              {' '}— a marketing and technology agency at the intersection of health and wellness.
              <br />
              Google's AI ecosystem enabled me to build this.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <p className="text-sm text-white/45 leading-relaxed">
                The code was the last step, not the first. I take walks and talk to <a href="https://apps.apple.com/us/app/google-gemini/id6477489729" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 transition-all">Gemini</a> on my phone — thirty minutes of unfiltered brain dump, stream of consciousness, no filter. Those ideas go straight into <a href="https://notebooklm.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 transition-all">NotebookLM</a> alongside the raw API docs and code lab notebooks, where I reason across my own thinking and the real specifications at the same time. <a href="https://gemini.google.com/deepresearch" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 transition-all">Gemini Deep Research</a> pressure-tested every architecture decision across the full LLM landscape — not just Google's docs, but cross-stack — so I understood Gemini's constraints and advantages in context, not in isolation. <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 transition-all">Gemini Canvas</a> drafted and extended the product narrative. <a href="https://colab.research.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 transition-all">Google Colab</a> gave me working examples before I touched the codebase.
              </p>
              <p className="text-sm text-white/45 leading-relaxed">
                <a href="https://stitch.withgoogle.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 transition-all">Stitch</a> translated concepts into screen designs. <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 transition-all">AI Studio</a> and <a href="https://console.cloud.google.com/vertex-ai/studio" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 transition-all">Vertex AI Studio</a> tested prompt patterns against real models. <a href="https://jules.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 transition-all">Jules</a> was my architecture sounding board. Connecting my <span className="text-white/65">GitHub repo to Gemini</span> and walking, talking out loud, asking questions about code I'd already written — that feedback loop compressed weeks into hours. Only then did implementation start — <span className="text-white/65">Gemini</span> and <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 transition-all">Claude</a> as my AI collaborators, the human-AI partnership that took everything I'd researched, designed, and mapped and built it into something real.
              </p>
            </div>
            <p className="text-sm font-semibold leading-relaxed mt-6" style={{ color: `${GREEN}CC` }}>
              The product demonstrates human-AI collaboration.
              <br />
              So does the fact that it was built at all.
            </p>
            <div className="flex items-center gap-3 mt-5 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="w-px h-8 rounded-full" style={{ backgroundColor: `${GREEN}40` }} />
              <p className="text-xs text-white/40 leading-relaxed">
                <a href="https://www.linkedin.com/in/macintoshexpert" target="_blank" rel="noopener noreferrer" className="text-white/65 font-semibold hover:text-white transition-colors">Kurt Miller</a>
                {' · '}Director of AI Enablement at{' '}
                <a href="https://mergeworld.com" target="_blank" rel="noopener noreferrer"
                  style={{ color: '#4ade80' }}>
                  MERGE
                </a>
                {' — '}a marketing and technology agency at the intersection of health and wellness. <span style={{ color: '#4ade80' }}>Built Different.</span>{' '}
                <a href="https://mergeworld.com" target="_blank" rel="noopener noreferrer"
                  className="text-white/35 hover:text-white/60 transition-colors">
                  mergeworld.com
                </a>
              </p>
            </div>
          </div>
        </Reveal>

        {/* Tech stack + pillars — two columns */}
        <Reveal delay={0.2}>
          <div className="grid md:grid-cols-2 gap-6 mb-14 text-left">
            {/* Tech badges */}
            <div
              className="rounded-2xl border p-6"
              style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mb-5">Built with</p>
              <div className="space-y-4">
                {[
                  {
                    group: 'Gemini + Google Cloud',
                    color: BLUE,
                    items: [
                      { label: 'gemini-2.5-flash-native-audio' },
                      { label: 'gemini-3.1-flash-image-preview' },
                      { label: 'gemini-3-pro-image-preview' },
                      { label: 'gemini-2.0-flash' },
                      { label: 'text-embedding-004' },
                      { label: 'Veo 3' },
                      { label: 'Cloud Run' },
                      { label: 'Google GenAI SDK' },
                      { label: 'Gemini Live API' },
                      { label: '🍌 Nano Banana', customColor: '#F5C842' },
                    ],
                  },
                  {
                    group: 'Data + Backend',
                    color: GREEN,
                    items: [
                      { label: '21 Supabase Edge Functions' },
                      { label: 'PostgreSQL + pgvector' },
                      { label: 'Supabase Realtime' },
                      { label: 'Supabase Storage' },
                    ],
                  },
                  {
                    group: 'Client',
                    color: PURPLE,
                    items: [
                      { label: 'React + TypeScript + Vite' },
                      { label: 'Chrome Extension MV3' },
                      { label: 'Capacitor iOS + Android' },
                    ],
                  },
                ].map(({ group, color, items }) => (
                  <div key={group}>
                    <p className="font-mono text-[9px] uppercase tracking-widest mb-2" style={{ color: `${color}60` }}>{group}</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map(({ label, customColor }) => {
                        const c = customColor ?? color;
                        return (
                          <div
                            key={label}
                            className="px-3 py-1.5 rounded-full border font-mono text-[11px] font-semibold"
                            style={{ borderColor: `${c}25`, color: `${c}CC`, backgroundColor: `${c}10` }}
                          >
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature manifesto */}
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}
            >
              <div className="px-6 pt-5 pb-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">What Vince does</p>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {[
                  { icon: Mic, color: GREEN, title: 'Brief by voice', desc: 'Talk. Campaign in your archive. Brand-aligned. Built in one conversation.' },
                  { icon: TrendingUp, color: ORANGE, title: 'Beat any competitor', desc: 'Drop a URL. Get hooks, gaps, counter-direction — while you\'re still talking.' },
                  { icon: Layers, color: BLUE, title: 'Interleaved copy + images', desc: 'One API call. Copy blocks and visuals alternating in a single response.' },
                  { icon: Dna, color: GREEN, title: 'Invisible brand memory', desc: 'pgvector RAG retrieves the right rules before every generation. Zero settings panel.' },
                  { icon: Globe, color: BLUE, title: 'Brand travels with the prompt', desc: 'Chrome Extension. Your team\'s existing tools. The brand slides in from the side.' },
                  { icon: Smartphone, color: PURPLE, title: 'Walk. Talk. Campaign waiting.', desc: 'iOS + Android. Voice brief on the road. Full campaign at your desk.' },
                  { icon: Camera, color: TEAL, title: 'Person-in-scene', desc: 'Upload a headshot. Vince puts you in the campaign. Face preserved exactly.' },
                  { icon: BrainCircuit, color: PURPLE, title: '26 live tools', desc: 'Real-time voice orchestration across brand build, generate, analyze, and iterate.' },
                ].map(({ icon: Icon, color, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 px-6 py-3.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}20` }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/80 leading-tight">{title}</p>
                      <p className="text-xs text-white/35 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function ShowcaseNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-14 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(5, 5, 8, 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black"
          style={{ backgroundColor: GREEN, color: '#000' }}
        >
          V
        </div>
        <span className="text-sm font-bold text-white">Vince</span>
      </div>

      <div className="hidden md:flex items-center gap-6 text-xs text-white/40">
        {[
          { label: 'Brand Intelligence', id: 'brand-intelligence' },
          { label: 'Creative Director', id: 'creative-director' },
          { label: 'Beat This Ad', id: 'beat-this-ad' },
          { label: 'Packages', id: 'packages' },
          { label: 'Platforms', id: 'platforms' },
          { label: 'Architecture', id: 'architecture' },
        ].map(({ label, id }) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-white transition-colors"
          >
            {label}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold"
          style={{ borderColor: `${BLUE}30`, color: `${BLUE}AA`, backgroundColor: `${BLUE}08` }}
        >
          <Sparkles className="w-3 h-3" />
          Built with Gemini
        </div>
        <a
          href="/"
          className="text-xs font-semibold px-4 py-2 rounded-full border transition-all hover:bg-white/10"
          style={{ borderColor: `${GREEN}50`, color: GREEN }}
        >
          Open Studio →
        </a>
      </div>
    </nav>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function VinceShowcase() {
  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans antialiased">
      <ShowcaseNav />
      <HeroSection />
      <ProblemSection />
      <BrandTravelsSection />
      <BrandIntelligenceSection />
      <CreativeDirectorSection />
      <BeatThisAdSection />
      <CampaignPackagesSection />
      <DirectorModeSection />
      <AvailableEverywhereSection />
      <TechSection />
      <WhySection />
      <CTASection />
    </div>
  );
}
