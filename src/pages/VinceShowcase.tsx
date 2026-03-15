// ABOUTME: Comprehensive showcase page for Vince — AI Creative Director by MERGE.
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
} from 'lucide-react';

// ─── Brand palette ────────────────────────────────────────────────────────────
const GREEN = '#1ED75F';
const BLUE = '#4285F4';
const ORANGE = '#F97316';
const PURPLE = '#A78BFA';
const TEAL = '#2DD4BF';
const ROSE = '#F43F5E';

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
    brief: 'Campaign package for the AI Enablement Summit — executive tone, thought leadership, all formats',
    formats: ['Billboard 16:9', 'LinkedIn post', 'Email header'],
    category: 'Campaign',
  },
  {
    brand: 'Google',
    color: BLUE,
    brief: 'Beat this ad — paste Workspace competitor URL, give me 3 counter directions for Q2 push',
    formats: ['Scene analysis', '3 counter briefs', 'Creative directions'],
    category: 'Beat This Ad',
  },
  {
    brand: 'MERGE',
    color: PURPLE,
    brief: 'Brand refresh launch — hero imagery, social suite, OOH transit, copy that lands the repositioning',
    formats: ['Hero 16:9', 'Story 9:16', 'OOH transit'],
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
              className="rounded-xl border p-3 space-y-2"
              style={{ borderColor: `${scenario.color}30`, backgroundColor: `${scenario.color}08` }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: scenario.color }} />
                <span className="text-xs font-semibold" style={{ color: scenario.color }}>
                  Package ready — {scenario.formats.length} deliverables
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {scenario.formats.map((f) => (
                  <span
                    key={f}
                    className="text-[10px] px-2 py-0.5 rounded-full border"
                    style={{ borderColor: `${scenario.color}40`, color: `${scenario.color}CC` }}
                  >
                    {f}
                  </span>
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,_rgba(239,68,68,0.04)_0%,_transparent_60%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <Reveal className="flex items-center gap-3 mb-16">
          <div className="h-px w-6 bg-red-500" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">The Problem</span>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: stat */}
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
            <p className="text-lg text-white/50 leading-relaxed max-w-sm">
              of marketing materials don't conform to brand guidelines today. That's with humans trying their best — before AI entered the workflow.
            </p>
          </Reveal>

          {/* Right: explanation */}
          <Reveal delay={0.15}>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-[1.1] tracking-tight">
              Add AI.
              <br />
              <span className="text-red-400">Multiply the problem.</span>
            </h2>
            <p className="text-base text-white/50 leading-relaxed mb-8">
              At every agency right now, people are using Gemini, Firefly, Claude, and a dozen other tools to generate content. Each person grabs whatever brand context they can find — a hex code from memory, a paragraph from the brand guide, a screenshot from the client's site — and pastes it into a prompt.
            </p>

            <div className="rounded-2xl border border-white/[0.07] overflow-hidden mb-6">
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

            <motion.p
              className="text-sm text-white/35 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.8 }}
            >
              Ten people prompting five different AI tools means fifty interpretations of your brand. None of them right. All of them close enough that someone might use them anyway.
            </motion.p>
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
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
          style={{ background: `radial-gradient(circle, ${GREEN}, transparent)` }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] opacity-15"
          style={{ background: `radial-gradient(circle, ${BLUE}, transparent)` }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
        {/* Left: copy */}
        <div>
          <Reveal>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-8 border"
              style={{ borderColor: `${GREEN}40`, color: GREEN, backgroundColor: `${GREEN}10` }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Brand-Native AI · Google Gemini Live API Hackathon
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-[1.0] text-white mb-6">
              Meet{' '}
              <span style={{ color: GREEN }}>Vince.</span>
              <br />
              <span className="text-white/60">Your AI Creative</span>
              <br />
              Director.
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-xl text-white/50 leading-relaxed mb-10 max-w-lg">
              Brief campaigns by voice. Get copy and images together, in every format, with your brand
              built in — the first time and every time.
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
const DNA_LAYERS = [
  { icon: FileText, label: 'Brand DNA', color: GREEN, desc: 'Voice, values, personality — the brand\'s foundational identity' },
  { icon: BrainCircuit, label: 'Agent Directives', color: BLUE, desc: 'How Vince thinks about your brand — rules, guardrails, style' },
  { icon: Sparkles, label: 'Generation Prompt', color: ORANGE, desc: 'Synthesized prompt that shapes every creative output' },
  { icon: Zap, label: 'Quick Starters', color: PURPLE, desc: 'Ready-to-brief campaign scenarios tailored to the brand' },
  { icon: Image, label: 'Output Control', color: TEAL, desc: 'Visual style, color system, aspect ratios, photography direction' },
];

function BrandIntelligenceSection() {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-80px' });

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setActive((a) => (a + 1) % DNA_LAYERS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [inView]);

  return (
    <section id="brand-intelligence" ref={ref} className="relative py-32 bg-[#080A0F] overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${BLUE}, transparent)` }}
      />

      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="mb-20">
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
            sub="Tell Vince about your brand once. He synthesizes it into a living knowledge stack that governs every generation — voice, visual, composition, guardrails — automatically."
          />
        </Reveal>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Layer list */}
          <div className="space-y-3">
            {DNA_LAYERS.map((layer, i) => (
              <Reveal key={layer.label} delay={i * 0.08}>
                <button
                  onClick={() => setActive(i)}
                  className="w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300"
                  style={{
                    borderColor: active === i ? `${layer.color}50` : 'transparent',
                    backgroundColor: active === i ? `${layer.color}10` : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${layer.color}20`, color: layer.color }}
                  >
                    <layer.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm mb-1">{layer.label}</p>
                    <p className="text-xs text-white/40 leading-relaxed">{layer.desc}</p>
                  </div>
                  {active === i && <ArrowRight className="w-4 h-4 ml-auto shrink-0 mt-1" style={{ color: layer.color }} />}
                </button>
              </Reveal>
            ))}
          </div>

          {/* Visual: pipeline */}
          <Reveal delay={0.3}>
            <div className="rounded-2xl bg-[#111318] border border-white/10 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: BLUE }} />
                <span className="text-xs text-white/40 font-mono">brand_intelligence.knowledge_stack</span>
              </div>

              {DNA_LAYERS.map((layer, i) => (
                <motion.div
                  key={layer.label}
                  animate={{ opacity: i <= active ? 1 : 0.3, x: i <= active ? 0 : 10 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: i <= active ? `${layer.color}20` : 'rgba(255,255,255,0.05)',
                      color: i <= active ? layer.color : '#555',
                    }}
                  >
                    <layer.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: layer.color }}
                      animate={{ width: i <= active ? '100%' : '0%' }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    />
                  </div>
                  <span
                    className="text-xs font-medium w-32 text-right"
                    style={{ color: i <= active ? layer.color : '#444' }}
                  >
                    {layer.label}
                  </span>
                </motion.div>
              ))}

              <div className="mt-6 pt-4 border-t border-white/10">
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: `${DNA_LAYERS[active].color}15`, color: DNA_LAYERS[active].color }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {DNA_LAYERS[active].label} active — injected into every output
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* pgvector callout */}
        <Reveal delay={0.2} className="mt-16">
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
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[160px] opacity-10 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${GREEN}, transparent)` }}
      />

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

// ─── Director Mode Section ────────────────────────────────────────────────────
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

function buildDirectorPrompt(camera: string, lighting: string, lens: string, subject: string): string {
  if (!subject.trim()) return 'Enter a subject to see the compiled director prompt...';
  return `Shot of: ${subject.trim()} · Camera: ${camera} movement · Lighting: ${lighting} · Lens: ${lens} · Output: Veo 3.1 cinematic video, 16:9, broadcast quality`;
}

function DirectorModeSection() {
  const [camera, setCamera] = useState('Crane Shot');
  const [lighting, setLighting] = useState('Golden Hour');
  const [lens, setLens] = useState('85mm Portrait');
  const [subject, setSubject] = useState('A confident creative director at a modern agency workspace');
  const compiledPrompt = buildDirectorPrompt(camera, lighting, lens, subject);

  return (
    <section className="relative py-32 bg-[#080A0F] overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${PURPLE}, transparent)` }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.07)_0%,_transparent_60%)]" />

      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="mb-20">
          <SectionHeader
            eyebrow="Director Mode · Veo 3.1"
            eyebrowColor={PURPLE}
            headline={
              <>
                You're not writing prompts.
                <br />
                <span style={{ color: PURPLE }}>You're directing.</span>
              </>
            }
            sub="14 camera movements. 11 lighting moods. 11 lens characters. Select your vision — the prompt compiles itself."
          />
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left: interactive controls */}
          <Reveal>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-semibold text-white/70">Director Controls</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
                  <motion.div className="w-1.5 h-1.5 rounded-full bg-violet-400"
                    animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
                  <span className="font-mono text-[9px] text-violet-400">VEO 3 READY</span>
                </div>
              </div>

              <div className="px-5 py-5 space-y-4">
                {[
                  { label: 'Camera Movement', value: camera, options: CAMERA_MOVEMENTS, set: setCamera },
                  { label: 'Lighting Preset', value: lighting, options: LIGHTING_PRESETS, set: setLighting },
                  { label: 'Lens', value: lens, options: LENS_PRESETS, set: setLens },
                ].map(({ label, value, options, set }) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] text-white/35 uppercase tracking-wider">{label}</label>
                    <div className="relative">
                      <select
                        value={value}
                        onChange={e => set(e.target.value)}
                        className="w-full appearance-none bg-black/30 border border-white/[0.10] rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:border-violet-500/40 transition-all cursor-pointer pr-8"
                      >
                        {options.map(o => <option key={o} value={o} className="bg-[#1a1a20]">{o}</option>)}
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none rotate-90" />
                    </div>
                  </div>
                ))}

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10px] text-white/35 uppercase tracking-wider">Subject / Scene</label>
                  <textarea
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    rows={2}
                    className="bg-black/30 border border-white/[0.10] rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:border-violet-500/40 resize-none transition-all"
                    placeholder="Describe your subject or scene..."
                  />
                </div>

                {/* Compiled prompt */}
                <div className="rounded-xl bg-black/40 border border-violet-500/15 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-3.5 h-3.5 text-violet-400" />
                    <span className="font-mono text-[9px] text-violet-400/70 uppercase">Generated Director Prompt</span>
                  </div>
                  <p className="font-mono text-[11px] text-white/55 leading-relaxed">{compiledPrompt}</p>
                </div>

                <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 font-semibold text-sm hover:bg-violet-500/25 transition-all">
                  <Play className="w-4 h-4" />
                  Generate Video
                </button>
              </div>
            </div>
          </Reveal>

          {/* Right: counts + brand note */}
          <Reveal delay={0.2} className="flex flex-col gap-6">
            <div className="flex gap-4 justify-center">
              {[
                { count: 14, label: 'Camera Presets', color: PURPLE },
                { count: 11, label: 'Lighting Presets', color: TEAL },
                { count: 11, label: 'Lens Characters', color: PURPLE },
              ].map(({ count, label, color }) => (
                <div key={label} className="flex flex-col items-center px-5 py-4 rounded-xl border flex-1"
                  style={{ borderColor: `${color}25`, backgroundColor: `${color}08` }}>
                  <span className="text-3xl font-black" style={{ color }}>{count}</span>
                  <span className="text-[10px] text-white/40 mt-1 text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {/* Video preview card */}
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

            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <Dna className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <p className="text-xs text-white/40 leading-relaxed">
                Brand DNA is injected into every video prompt automatically — your brand's visual language governs every frame without you specifying it.
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
              <div className="relative h-32 bg-[#090B10] flex items-center justify-center overflow-hidden">
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

// ─── Chrome Extension Section ─────────────────────────────────────────────────
function ChromeExtensionSection() {

  return (
    <section id="chrome-extension" className="relative py-32 bg-[#080A0F] overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${TEAL}, transparent)` }}
      />

      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="mb-20">
          <div className="text-center mb-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08]">
              {/* Chrome logo */}
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                <circle cx="12" cy="12" r="10" fill="#4285F4" />
                <circle cx="12" cy="12" r="4" fill="white" />
                <path d="M12 8h10a10 10 0 0 0-10-6V8z" fill="#EA4335" />
                <path d="M12 8H2a10 10 0 0 0 5 8.66L12 8z" fill="#FBBC04" />
                <path d="M12 16a4 4 0 0 1-3.46-2L3 22a10 10 0 0 0 18 0l-5.54-8A4 4 0 0 1 12 16z" fill="#34A853" />
              </svg>
              <span className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: TEAL }}>Chrome Extension</span>
            </div>
          </div>
          <SectionHeader
            eyebrowColor={TEAL}
            headline={
              <>
                Vince lives in
                <br />
                <span style={{ color: TEAL }}>your browser.</span>
              </>
            }
            sub="One-click access to the Creative Director from any tab. Brief campaigns, generate images, and query brand standards without switching context."
          />
        </Reveal>

        {/* Full-width browser mockup */}
        <Reveal className="mb-16">
          <VinceBrowserMockup />
        </Reveal>

        <Reveal delay={0.2}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                color: TEAL,
                title: 'Brand Quick Starters',
                desc: 'Every brand gets its own set of pre-briefed starting points — configured in the studio, available in the extension.',
              },
              {
                icon: Bot,
                color: GREEN,
                title: 'Full Creative Director access',
                desc: 'The same 26-tool voice session available in the studio, in a side panel. Works on any tab.',
              },
              {
                icon: Globe,
                color: BLUE,
                title: 'Context-aware',
                desc: "Vince can see the page you're on. Reference competitor sites, LinkedIn posts, or briefs directly.",
              },
              {
                icon: Chrome,
                color: PURPLE,
                title: 'One-click install',
                desc: 'Packaged as a Chrome extension. No separate login — same auth as the studio.',
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

// ─── Mobile Apps Section ──────────────────────────────────────────────────────
function MobileAppsSection() {
  return (
    <section id="mobile" className="relative py-32 bg-[#050508] overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${PURPLE}, transparent)` }}
      />
      <div
        className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${PURPLE}, transparent)` }}
      />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Copy */}
          <div>
            <Reveal>
              <SectionHeader
                eyebrow="iOS & Android"
                eyebrowColor={PURPLE}
                headline={
                  <>
                    The Creative Director
                    <br />
                    <span style={{ color: PURPLE }}>in your pocket.</span>
                  </>
                }
                sub="Full Vince experience on mobile — voice briefing, image generation, brand intelligence, and campaign packages. Capacitor-native on both platforms."
                center={false}
              />
            </Reveal>

            <Reveal delay={0.2} className="mt-10 space-y-4">
              {[
                { icon: Mic, color: PURPLE, label: 'Voice briefing', desc: 'Full Gemini Live voice session on mobile' },
                { icon: Image, color: BLUE, label: 'Image generation', desc: 'Generate and preview campaign assets on-device' },
                { icon: Dna, color: GREEN, label: 'Brand intelligence', desc: 'Full brand knowledge stack — works offline-capable' },
                { icon: Smartphone, color: ORANGE, label: 'Capacitor native', desc: 'iOS and Android from a single React codebase' },
              ].map(({ icon: Icon, color, label, desc }) => (
                <div key={label} className="flex items-center gap-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-white/40">{desc}</p>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>

          {/* Phone mockup */}
          <Reveal delay={0.2} className="flex justify-center">
            <div className="relative">
              {/* Phone frame */}
              <div className="w-56 h-[480px] rounded-[2.5rem] bg-[#1C1C1E] border-2 border-white/20 shadow-2xl overflow-hidden relative">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-b-2xl z-10" />

                {/* Screen */}
                <div className="absolute inset-0 pt-8 px-4 pb-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <p className="text-xs font-semibold text-white">Vince</p>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: GREEN }} />
                  </div>

                  {/* Chat bubbles */}
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

                  {/* Input */}
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

              {/* Floating badges */}
              <div
                className="absolute -left-14 top-1/4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium shadow-lg"
                style={{ backgroundColor: '#111318', borderColor: `${BLUE}40`, color: BLUE }}
              >
                {/* Apple logo */}
                <svg viewBox="0 0 14 17" className="w-3 h-3.5 fill-current" aria-hidden>
                  <path d="M13.2 8.7c0-2.7 2.2-4 2.3-4.1-1.2-1.8-3.1-2-3.8-2.1-1.6-.2-3.2 1-4 1s-2.1-1-3.5-.9C2.6 3.7 1 4.7.3 6.2-1.2 9.4.1 14.1 1.6 16.8c.7 1.3 1.6 2.8 2.8 2.7 1.1-.1 1.5-.7 2.9-.7s1.7.7 2.9.7c1.2 0 2-1.3 2.7-2.6.9-1.5 1.2-2.9 1.2-3C14 13.9 13.2 11.8 13.2 8.7zM10.5 1.7C11.1.9 11.5-.1 11.3-1c-.9.1-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.8.9.1 1.9-.5 2.7-1.5z" />
                </svg>
                iOS
              </div>
              <div
                className="absolute -right-16 top-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium shadow-lg"
                style={{ backgroundColor: '#111318', borderColor: `${GREEN}40`, color: GREEN }}
              >
                {/* Android robot */}
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden>
                  <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5S11 23.33 11 22.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0 0 12 1.5c-.96 0-1.86.23-2.66.63L7.88.65c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C7.15 3.53 6 5.47 6 7.5h12c0-2.03-1.15-3.97-2.47-5.34zM10 5.5H9v-1h1v1zm5 0h-1v-1h1v1z" />
                </svg>
                Android
              </div>
            </div>
          </Reveal>
        </div>
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
const EXT_CHAT = [
  { role: 'user', text: 'Build me a counter-campaign for this post' },
  { role: 'tool', text: 'Reading page context...' },
  { role: 'vince', text: "Got it — I can see this is a Microsoft Surface ad targeting students. Pulling MERGE brand context now." },
  { role: 'user', text: 'Go. All formats.' },
  { role: 'vince', text: '3 counter directions ready. Generating LinkedIn, Billboard, and Story with copy + images.' },
];

function VinceBrowserMockup() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [chatStep, setChatStep] = useState(0);
  const [cycle, setCycle] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setCycle((c) => c + 1);
      setPanelOpen(false);
      setChatStep(0);
    }, 16000);
    return () => clearInterval(interval);
  }, [inView]);

  useEffect(() => {
    if (!inView) return;
    const timers = [
      setTimeout(() => setPanelOpen(true), 800),
      setTimeout(() => setChatStep(1), 2200),
      setTimeout(() => setChatStep(2), 3600),
      setTimeout(() => setChatStep(3), 5200),
      setTimeout(() => setChatStep(4), 7000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [cycle, inView]);

  return (
    <div ref={ref} className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#1A1A2E]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#12121C] border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]/70" />
        </div>
        <div className="flex-1 h-5 bg-white/[0.05] rounded-md px-3 flex items-center mx-4">
          <span className="font-mono text-[9px] text-white/25">linkedin.com/feed · Microsoft Surface promoted post</span>
        </div>
        {/* Extension icon in toolbar */}
        <motion.div
          className="w-6 h-6 rounded flex items-center justify-center cursor-pointer"
          style={{ backgroundColor: panelOpen ? `${GREEN}25` : 'transparent' }}
          animate={!panelOpen ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 1.2, repeat: !panelOpen ? Infinity : 0 }}
          onClick={() => setPanelOpen((p) => !p)}
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill={panelOpen ? GREEN : 'rgba(255,255,255,0.35)'}>
            <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <rect x="9" y="1" width="6" height="14" rx="1" fill="currentColor" opacity="0.6" />
          </svg>
        </motion.div>
      </div>

      {/* Browser body */}
      <div className="flex" style={{ height: 320 }}>
        {/* Page content */}
        <div className="flex-1 p-5 bg-[#0E0E1A] overflow-hidden">
          <div className="space-y-3 opacity-50">
            <div className="h-2.5 bg-white/[0.08] rounded w-2/3" />
            <div className="h-2 bg-white/[0.05] rounded w-full" />
            <div className="h-2 bg-white/[0.05] rounded w-5/6" />
            <div className="h-28 bg-white/[0.04] rounded-lg mt-3 flex items-center justify-center">
              <span className="text-[10px] text-white/20 font-mono">Microsoft Surface — promoted</span>
            </div>
            <div className="h-2 bg-white/[0.04] rounded w-3/4" />
            <div className="h-2 bg-white/[0.04] rounded w-1/2" />
          </div>
        </div>

        {/* Vince sidebar panel */}
        <motion.div
          className="bg-[#0A1A14] border-l border-white/[0.08] flex-shrink-0 overflow-hidden"
          animate={{ width: panelOpen ? 220 : 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          <div className="w-[220px] h-full flex flex-col">
            {/* Panel header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06]">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black" style={{ backgroundColor: GREEN, color: '#000' }}>V</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white/80">Vince</p>
                <p className="text-[8px] text-white/30">Creative Director · MERGE</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: GREEN }} />
            </div>

            {/* Chat */}
            <div className="flex-1 p-2.5 space-y-2 overflow-hidden">
              {EXT_CHAT.slice(0, chatStep).map((msg, i) => (
                <motion.div key={`${cycle}-${i}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  {msg.role === 'user' && (
                    <div className="bg-white/[0.07] rounded-xl rounded-tr-sm px-2.5 py-1.5 ml-6">
                      <p className="text-[9px] text-white/65 leading-relaxed">{msg.text}</p>
                    </div>
                  )}
                  {msg.role === 'tool' && (
                    <div className="flex items-center gap-1.5 px-1">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <Sparkles className="w-2.5 h-2.5 text-orange-400" />
                      </motion.div>
                      <span className="font-mono text-[8px] text-orange-400/60">{msg.text}</span>
                    </div>
                  )}
                  {msg.role === 'vince' && (
                    <div className="rounded-xl rounded-tl-sm px-2.5 py-1.5 mr-4 border" style={{ backgroundColor: `${GREEN}08`, borderColor: `${GREEN}20` }}>
                      <p className="text-[9px] leading-relaxed" style={{ color: `${GREEN}CC` }}>{msg.text}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="p-2.5 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 bg-white/[0.05] rounded-lg px-2.5 py-1.5">
                <Mic className="w-3 h-3 shrink-0" style={{ color: GREEN }} />
                <span className="text-[9px] text-white/20 flex-1">Brief Vince...</span>
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
      { icon: Image, label: 'Imagen 4 Standard', desc: 'Photorealistic image generation from synthesized brand prompts' },
      { icon: Image, label: 'Imagen 4 Ultra', desc: 'Next-gen image quality with improved instruction following' },
      { icon: Image, label: '🍌 Nano Banana Pro', desc: 'Ultra-fast low-cost image generation for rapid iteration and previews' },
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

// ─── Why Vince Wins Section ───────────────────────────────────────────────────
const DIFFERENTIATORS = [
  {
    color: GREEN,
    icon: Mic,
    title: 'Voice-first creative direction',
    tag: 'Category Differentiator',
    desc: 'You speak your brief. Vince responds in real time, retrieves brand memory, builds the prompt, and directs the generation — all by voice. No keyboard. No prompt engineering. This UX exists nowhere else in creative AI.',
  },
  {
    color: BLUE,
    icon: Dna,
    title: 'Brand DNA as a retrieval layer',
    tag: 'Technical Foundation',
    desc: "Brand intelligence isn't a static system prompt. It's a semantic retrieval layer — chunked, embedded, indexed with pgvector HNSW. When a brief arrives, the exact relevant context is retrieved automatically.",
  },
  {
    color: TEAL,
    icon: Layers,
    title: 'Two-model Gemini pipeline',
    tag: 'Novel Architecture',
    desc: "Gemini Live owns the agent loop (voice, tools, conversation); Gemini Flash handles interleaved text+image generation in parallel. The Live session speaks while results render. Dead air eliminated by design.",
  },
  {
    color: ORANGE,
    icon: Globe,
    title: 'Browser-level distribution',
    tag: 'Distribution Advantage',
    desc: "Not an integration with specific AI tools — a browser-level layer. Gemini, Claude, Firefly, Midjourney, ChatGPT — Vince's brand sidebar is there on all of them. The brand travels with the prompt.",
  },
];

function WhySection() {
  return (
    <section className="relative py-32 bg-[#050508] overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)` }}
      />
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="mb-20">
          <SectionHeader
            eyebrow="Why Vince Wins"
            eyebrowColor={GREEN}
            headline={
              <>
                Four things.
                <br />
                <span style={{ color: GREEN }}>No one has all four.</span>
              </>
            }
            sub="The market is full of AI asset generators. What the market doesn't have: voice-first direction, brand DNA as a retrieval layer, a two-model Gemini pipeline, and a browser-level distribution mechanism — combined, in production."
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
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 leading-snug">{d.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{d.desc}</p>
                </div>
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
    <section className="relative py-40 bg-[#080A0F] overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)` }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 100%, ${GREEN}18, transparent)`,
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <Reveal>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: GREEN }}>
            Vince · by MERGE
          </p>
          <h2 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.05] mb-6">
            Your brand.
            <br />
            <span style={{ color: GREEN }}>Built in.</span>
          </h2>
          <p className="text-xl text-white/40 mb-12 leading-relaxed">
            Talk to Vince. He already knows your brand — copy and images together, every format, every output.
            <br />
            Powered by Gemini Live, Imagen 4, and pgvector.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: Mic, label: 'Voice-first', color: GREEN },
              { icon: Globe, label: 'Chrome Extension', color: BLUE },
              { icon: Smartphone, label: 'iOS + Android', color: PURPLE },
              { icon: BarChart2, label: 'Beat This Ad', color: ORANGE },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs text-white/40">{label}</span>
              </div>
            ))}
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
        <span className="text-xs text-white/30 ml-1">by MERGE</span>
      </div>

      <div className="hidden md:flex items-center gap-6 text-xs text-white/40">
        {[
          { label: 'Brand Intelligence', id: 'brand-intelligence' },
          { label: 'Creative Director', id: 'creative-director' },
          { label: 'Beat This Ad', id: 'beat-this-ad' },
          { label: 'Packages', id: 'packages' },
          { label: 'Chrome Extension', id: 'chrome-extension' },
          { label: 'Mobile', id: 'mobile' },
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

      <a
        href="/"
        className="text-xs font-semibold px-4 py-2 rounded-full border transition-all hover:bg-white/10"
        style={{ borderColor: `${GREEN}50`, color: GREEN }}
      >
        Open Studio →
      </a>
    </nav>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function VinceShowcase() {
  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans antialiased">
      <ShowcaseNav />
      <HeroSection />
      <BrandIntelligenceSection />
      <CreativeDirectorSection />
      <BeatThisAdSection />
      <CampaignPackagesSection />
      <ChromeExtensionSection />
      <MobileAppsSection />
      <TechSection />
      <WhySection />
      <CTASection />
    </div>
  );
}
