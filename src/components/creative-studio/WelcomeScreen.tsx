// ABOUTME: Welcome screen for Creative Studio — dark cinematic splash with two states
// ABOUTME: Full dark treatment with glass cards, immersive brand imagery, and prominent guidelines

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImagePlus, Film, Scissors,
  MessagesSquare, Camera, Layers, Mic,
  Sparkles, Dna, AudioLines, Bot,
  LayoutTemplate, Shield, Palette,
  ArrowRight, Box, Star,
  Users, Zap, Share, BookOpen,
  MessageSquare, Wand2,
  Chrome, Download, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { useBrandToolApprovals } from '@/hooks/useBrandToolApprovals';
import { useBrandGenerationPrompt, parsePromptSections } from '@/hooks/useBrandGenerationPrompt';
import { GENERATION_PROMPT_SECTIONS } from '@/types/creative-studio';
import { useStudioWelcomeImages } from '@/hooks/useStudioWelcomeImages';
import type { WelcomeImageKey } from '@/hooks/useStudioWelcomeImages';
import type { CreativeStudioBrand } from '@/types/creative-studio';
import type { BrandStats } from '@/hooks/useCreativeStudioBrandIntelligence';

// ── Types ─────────────────────────────────────────────────────────────────────

interface WelcomeScreenProps {
  brand?: CreativeStudioBrand;
  brandStats?: BrandStats;
  onOpenBrandDNA?: () => void;
  onOpenArtDirection?: () => void;
  onOpenPromptLibrary?: () => void;
  onOpenBrandAgent?: () => void;
  onOpenGuidelines?: () => void;
  onQuickPromptClick?: (prompt: string) => void;
  onDemoClick?: () => void;
}

// ── Shared styles & animation ─────────────────────────────────────────────────

const GLASS = 'bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm';
const GLASS_HOVER = 'hover:bg-white/[0.07] hover:border-white/[0.15] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-5px_rgba(255,255,255,0.05)] transition-all duration-300';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

// ── Quick-prompt icon lookup ────────────────────────────────────────────────

const qpIconMap: Record<string, React.ElementType> = {
  box: Box,
  users: Users,
  zap: Zap,
  share: Share,
  'book-open': BookOpen,
  palette: Palette,
};

// ── Brief card animation data ─────────────────────────────────────────────────

const BRIEF_SCENARIOS = [
  {
    brand: 'MERGE',
    color: '#1ED75F',
    brief: 'Campaign package for the brand relaunch — full suite, all formats, copy and images together',
    formats: ['Billboard 16:9', 'Email header', 'OOH transit'],
  },
  {
    brand: 'Google',
    color: '#4285F4',
    brief: 'Beat this ad — competitor URL, give me 3 counter directions for our Q2 Workspace push',
    formats: ['Scene analysis', '3 counter briefs', 'Creative directions'],
  },
  {
    brand: 'MERGE',
    color: '#A78BFA',
    brief: 'LinkedIn post for the AI Enablement Summit — thought leadership, forward-looking, executive tone',
    formats: ['LinkedIn post', 'Event banner 16:9', 'Story 9:16'],
  },
] as const;

// ── Feature card data ─────────────────────────────────────────────────────────

interface FeatureCard {
  imageKey: WelcomeImageKey;
  icon: typeof ImagePlus;
  title: string;
  accent: string;
  headline: string;
  desc: string;
  tags: string[];
}

const FEATURE_CARDS: readonly FeatureCard[] = [
  {
    imageKey: 'image_generation',
    icon: Mic,
    title: 'Creative Director',
    accent: '#2563EB',
    headline: 'Brief by voice. Get a campaign.',
    desc: 'Talk to Vince like you\'d brief a junior designer. He asks the right questions, generates complete packages — copy and images together — without any prompt engineering.',
    tags: ['Real-time voice', '26 callable tools', 'No prompt engineering'],
  },
  {
    imageKey: 'video_generation',
    icon: Dna,
    title: 'Brand Intelligence',
    accent: '#00856C',
    headline: 'Tell him once. He never forgets.',
    desc: 'Vince learns your brand from website, guidelines, and images — building a persistent memory that governs every generation automatically.',
    tags: ['One-time setup', 'pgvector memory', 'Auto injection'],
  },
  {
    imageKey: 'editing_suite',
    icon: Zap,
    title: 'Beat This Ad',
    accent: '#F97316',
    headline: 'Competitor URL → counter-campaign.',
    desc: 'Paste a competitor\'s video mid-session. Get scene analysis, strategic gaps, and three counter-campaign directions grounded in your brand.',
    tags: ['Video analysis', 'Multimodal AI', '3 counter directions'],
  },
  {
    imageKey: 'conversational_editing',
    icon: Layers,
    title: 'Campaign Packages',
    accent: '#A78BFA',
    headline: 'Copy and images. Together. Ready.',
    desc: '14 agency formats — LinkedIn, billboard, OOH, email, social — all with fully written copy and on-brand images interleaved in one response.',
    tags: ['14 formats', 'Interleaved copy + images', 'ZIP for handoff'],
  },
];

// ── Model badges ────────────────────────────────────────────────────────────

const MODEL_BADGES = [
  'Nano Banana 2',
  'Nano Banana Pro',
  'Gemini 3 Pro',
  'Imagen 4',
  'Veo 3.1',
  'Veo 2',
] as const;

function ModelBadges({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1 shrink-0 flex-wrap', className)}>
      {MODEL_BADGES.map((label) => {
        const isBanana = label.startsWith('Nano Banana');
        return (
          <span
            key={label}
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full font-epilogue text-[9px] font-medium',
              isBanana
                ? 'bg-yellow-500/[0.10] border border-yellow-400/15 text-yellow-300/60'
                : 'bg-white/[0.06] border border-white/[0.08] text-white/40',
            )}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

// ── Director Brief Card ───────────────────────────────────────────────────────

function DirectorBriefCard() {
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'generating' | 'done'>('typing');
  const scenario = BRIEF_SCENARIOS[idx];

  useEffect(() => { setChars(0); setPhase('typing'); }, [idx]);

  useEffect(() => {
    if (phase === 'typing') {
      if (chars < scenario.brief.length) {
        const t = setTimeout(() => setChars(c => c + 1), 24);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase('generating'), 400);
      return () => clearTimeout(t);
    }
    if (phase === 'generating') {
      const t = setTimeout(() => setPhase('done'), 1600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIdx(i => (i + 1) % BRIEF_SCENARIOS.length), 3000);
    return () => clearTimeout(t);
  }, [phase, chars, scenario.brief.length]);

  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm shadow-[0_32px_80px_-16px_rgba(0,0,0,0.5)]">
      {/* Voice header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          {/* Pulsing voice orb */}
          <div className="relative w-8 h-8 flex items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: `${scenario.color}18` }}
              animate={{ scale: phase === 'typing' ? [1, 1.35, 1] : 1 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `${scenario.color}30` }}>
              <Mic className="w-2.5 h-2.5" style={{ color: scenario.color }} />
            </div>
          </div>
          <div>
            <p className="font-epilogue text-[11px] font-semibold text-white/80">Vince</p>
            <div className="flex items-center gap-1.5">
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: scenario.color }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="font-epilogue text-[9px] font-medium" style={{ color: scenario.color }}>
                {phase === 'typing' ? 'Listening...' : phase === 'generating' ? 'Generating...' : 'Ready'}
              </span>
            </div>
          </div>
        </div>
        {/* Voice waveform */}
        <div className="flex items-center gap-[3px] h-6">
          {([0.5, 0.9, 0.6, 1, 0.7, 0.85, 0.45] as const).map((h, i) => (
            <motion.div
              key={i}
              className="w-[3px] rounded-full"
              style={{ background: `${scenario.color}70`, height: `${h * 14}px` }}
              animate={phase === 'typing' ? { scaleY: [1, 1.8, 1] } : { scaleY: 0.2 }}
              transition={{ duration: 0.4 + i * 0.07, repeat: Infinity, ease: 'easeInOut', delay: i * 0.06 }}
            />
          ))}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Brand context */}
        <div className="flex items-center gap-2">
          <span className="font-epilogue text-[10px] text-white/25 uppercase tracking-[0.12em]">Brand</span>
          <motion.span
            key={scenario.brand}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-2.5 py-0.5 rounded-full font-epilogue text-[10px] font-semibold border"
            style={{ color: scenario.color, borderColor: `${scenario.color}50`, background: `${scenario.color}15` }}
          >
            {scenario.brand}
          </motion.span>
        </div>

        {/* Brief */}
        <div>
          <p className="font-epilogue text-[10px] text-white/25 uppercase tracking-[0.12em] mb-1.5">Brief</p>
          <div className="min-h-[68px] rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
            <p className="font-epilogue text-[12px] text-white/75 leading-relaxed">
              {scenario.brief.slice(0, chars)}
              {phase === 'typing' && (
                <span className="inline-block w-[2px] h-[13px] bg-white/60 ml-0.5 translate-y-[2px] animate-pulse" />
              )}
            </p>
          </div>
        </div>

        {/* Status — fixed height so card never jumps during phase transitions */}
        <div className="h-[72px] relative">
          <AnimatePresence mode="wait">
            {phase === 'typing' && <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} className="absolute inset-0" />}
            {phase === 'generating' && (
              <motion.div key="gen" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute inset-0 flex items-center gap-2.5"
              >
                <div
                  className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                  style={{ borderColor: scenario.color, borderTopColor: 'transparent' }}
                />
                <span className="font-epilogue text-[11px]" style={{ color: scenario.color }}>
                  Generating campaign...
                </span>
              </motion.div>
            )}
            {phase === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute inset-0 rounded-xl px-3 py-2.5 border flex flex-col justify-center gap-2"
                style={{ borderColor: `${scenario.color}25`, background: `${scenario.color}08` }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: scenario.color }} />
                  <span className="font-epilogue text-[10px] font-semibold" style={{ color: scenario.color }}>Package ready</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {scenario.formats.map(f => (
                    <span key={f} className="font-epilogue text-[10px] text-white/45 bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scenario dots */}
        <div className="flex justify-center gap-2 pt-1">
          {BRIEF_SCENARIOS.map((s, i) => (
            <div key={i} className="h-1 rounded-full transition-all duration-500"
              style={{ width: i === idx ? '20px' : '6px', background: i === idx ? scenario.color : 'rgba(255,255,255,0.15)' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WelcomeScreen({
  brand,
  brandStats,
  onOpenBrandDNA,
  onOpenArtDirection,
  onOpenPromptLibrary,
  onOpenBrandAgent,
  onOpenGuidelines,
  onQuickPromptClick,
  onDemoClick,
}: WelcomeScreenProps) {
  if (brand) {
    return (
      <BrandWelcome
        brand={brand}
        brandStats={brandStats}
        onOpenBrandDNA={onOpenBrandDNA}
        onOpenArtDirection={onOpenArtDirection}
        onOpenPromptLibrary={onOpenPromptLibrary}
        onOpenBrandAgent={onOpenBrandAgent}
        onOpenGuidelines={onOpenGuidelines}
        onQuickPromptClick={onQuickPromptClick}
      />
    );
  }

  return (
    <SystemWelcome onDemoClick={onDemoClick} />
  );
}

// ── State A: No brand — Vince splash ─────────────────────────────────────────

function SystemWelcome({
  onDemoClick,
}: {
  onDemoClick?: () => void;
}) {
  const { data: welcomeImages } = useStudioWelcomeImages();
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full h-full overflow-y-auto bg-[#0D1B16]"
    >
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/3 -left-1/4 w-3/4 h-3/4 rounded-full opacity-[0.10] blur-3xl animate-pulse"
          style={{ background: 'radial-gradient(circle, #00856C, transparent)', animationDuration: '7s' }} />
        <div className="absolute top-1/2 right-0 w-1/2 h-1/2 rounded-full opacity-[0.06] blur-3xl animate-pulse"
          style={{ background: 'radial-gradient(circle, #2563EB, transparent)', animationDuration: '9s', animationDelay: '1s' }} />
        <div className="absolute -bottom-1/4 left-1/4 w-2/3 h-2/3 rounded-full opacity-[0.05] blur-3xl animate-pulse"
          style={{ background: 'radial-gradient(circle, #A78BFA, transparent)', animationDuration: '11s', animationDelay: '3s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.4))]" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 pt-8 pb-10 gap-10">

        {/* ── Hero ── */}
        <motion.div variants={containerVariants} className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">

          {/* Left: value prop */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="space-y-3">
              <h1 className="font-fraunces text-4xl lg:text-[52px] font-semibold tracking-tight leading-[1.08]">
                <span className="text-white">Meet </span>
                <span style={{ color: '#1ED75F' }}>Vince.</span>
                <br />
                <span className="text-white/50">Your AI Creative</span>
                <br />
                <span className="text-white">Director.</span>
              </h1>
              <p className="font-epilogue text-[15px] text-white/50 leading-relaxed max-w-[420px]">
                Talk to Vince. He already knows your brand — copy and images together, every format, in seconds.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {onDemoClick && (
                <button
                  onClick={onDemoClick}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1ED75F] text-[#0D1B16] font-bold font-epilogue text-sm hover:bg-[#22ef6a] transition-colors shadow-[0_0_24px_rgba(30,215,95,0.3)]"
                >
                  <Wand2 className="w-4 h-4" />
                  See it live
                </button>
              )}
              <button
                onClick={() => window.open('/showcase', '_blank')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.07] border border-white/[0.12] text-white/70 hover:bg-white/[0.12] hover:text-white transition-colors font-epilogue text-sm"
              >
                <Star className="w-4 h-4" />
                View showcase
              </button>
            </div>
          </motion.div>

          {/* Right: animated brief card */}
          <motion.div variants={itemVariants}>
            <DirectorBriefCard />
          </motion.div>
        </motion.div>

        {/* ── Feature cards ── */}
        <motion.div variants={containerVariants} className="max-w-5xl w-full space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FEATURE_CARDS.map((card) => (
              <motion.div
                key={card.title}
                variants={itemVariants}
                className={cn('group/fc rounded-2xl overflow-hidden flex flex-col', GLASS, GLASS_HOVER)}
              >
                {/* Visual header */}
                <div
                  className="h-32 relative overflow-hidden flex items-center justify-center"
                  style={{ background: `linear-gradient(145deg, ${card.accent}28, ${card.accent}08)` }}
                >
                  <div className="absolute inset-0 opacity-25"
                    style={{ background: `radial-gradient(circle at 50% 70%, ${card.accent}, transparent 65%)` }} />
                  {welcomeImages?.[card.imageKey] ? (
                    <img src={welcomeImages[card.imageKey]} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/fc:scale-105" />
                  ) : (
                    <card.icon className="w-10 h-10 relative z-10 transition-transform duration-300 group-hover/fc:scale-110" style={{ color: `${card.accent}CC` }} />
                  )}
                </div>
                {/* Content */}
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div>
                    <h3 className="font-epilogue text-[12px] font-bold text-white/90 mb-0.5">{card.title}</h3>
                    <p className="font-epilogue text-[11px] font-medium leading-snug" style={{ color: card.accent }}>{card.headline}</p>
                  </div>
                  <p className="font-epilogue text-[10px] text-white/40 leading-relaxed flex-1">{card.desc}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {card.tags.map(t => (
                      <span key={t} className="font-epilogue text-[9px] text-white/30 bg-white/[0.04] border border-white/[0.07] px-1.5 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Powered by ── */}
        <motion.div variants={itemVariants} className="max-w-5xl w-full flex items-center justify-center gap-2">
          <span className="font-epilogue text-[10px] text-white/15 uppercase tracking-wider">Powered by</span>
          <ModelBadges />
        </motion.div>

        {/* ── Chrome Extension CTA ── */}
        <motion.div
          variants={itemVariants}
          className="max-w-5xl w-full relative rounded-2xl overflow-hidden border border-[#1ED75F]/15 backdrop-blur-sm"
          style={{ background: 'linear-gradient(135deg, rgba(19,59,52,0.7), rgba(13,27,22,0.7))' }}
        >
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 px-7 py-5">
            <div className="w-11 h-11 rounded-2xl bg-[#1ED75F]/10 border border-[#1ED75F]/20 flex items-center justify-center shrink-0">
              <Chrome className="w-5 h-5 text-[#1ED75F]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-fraunces text-base font-semibold text-white mb-1">
                Brand Intelligence Chrome Extension
              </h3>
              <p className="font-epilogue text-xs text-white/45 leading-relaxed mb-2.5">
                Vince's brand context in a sidebar — next to any AI tool you already use.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['ChatGPT', 'Gemini', 'Claude', 'Midjourney', 'Firefly'].map(p => (
                  <span key={p} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.09] font-epilogue text-[10px] text-white/50">
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#1ED75F]" />
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <a
              href="/vince-extension.zip"
              download
              className="inline-flex items-center gap-2 rounded-xl bg-[#1ED75F] text-[#0D1B16] font-bold font-epilogue text-xs px-5 py-2.5 hover:bg-[#22ef6a] transition-colors shadow-[0_0_20px_rgba(30,215,95,0.25)] shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download Extension
            </a>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

// ── State B: Brand selected — Brand Guide ────────────────────────────────────

function BrandWelcome({
  brand,
  brandStats,
  onOpenBrandDNA,
  onOpenArtDirection,
  onOpenPromptLibrary,
  onOpenBrandAgent,
  onOpenGuidelines,
  onQuickPromptClick,
}: {
  brand: CreativeStudioBrand;
  brandStats?: BrandStats;
  onOpenBrandDNA?: () => void;
  onOpenArtDirection?: () => void;
  onOpenPromptLibrary?: () => void;
  onOpenBrandAgent?: () => void;
  onOpenGuidelines?: () => void;
  onQuickPromptClick?: (prompt: string) => void;
}) {
  const [brandVoiceOpen, setBrandVoiceOpen] = useState(false);
  const { data: generationPrompt } = useBrandGenerationPrompt(brand.id);
  const { data: toolApprovalsData } = useBrandToolApprovals(brand.id);
  const toolApprovals = toolApprovalsData?.approvals || [];
  const colors = brand.color_palette && brand.color_palette.length > 0
    ? brand.color_palette
    : [brand.primary_color, brand.secondary_color];
  const backgroundImage = brand.header_image_url || brand.hero_image_url;
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full h-full overflow-y-auto bg-[#0D1B16]"
    >
      {/* Background: brand image wash + animated color orbs + vignette */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-[0.35] blur-lg scale-110"
          />
        )}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            background: `radial-gradient(ellipse at top center, ${brand.primary_color}, transparent 70%)`,
          }}
        />
        <div
          className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full opacity-[0.07] blur-3xl animate-pulse"
          style={{
            background: `radial-gradient(circle, ${brand.primary_color}, transparent)`,
            animationDuration: '6s',
          }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 rounded-full opacity-[0.04] blur-3xl animate-pulse"
          style={{
            background: `radial-gradient(circle, ${brand.primary_color}, transparent)`,
            animationDuration: '8s',
            animationDelay: '2s',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5))]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 py-6">
        {/* Hero banner — cinematic brand header */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-4xl rounded-2xl overflow-hidden mb-8"
        >
          <div className="relative h-52 overflow-hidden">
            {backgroundImage ? (
              <img
                src={backgroundImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${brand.primary_color}, ${brand.secondary_color || brand.primary_color})`,
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.3))]" />

            {/* Centered logo */}
            <div className="absolute inset-0 flex items-center justify-center pb-12">
              {brand.logo_url ? (
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="max-w-[320px] max-h-28 object-contain brightness-0 invert drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]"
                />
              ) : (
                <span className="text-4xl font-bold text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)] font-fraunces">
                  {brand.name}
                </span>
              )}
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 inset-x-0 px-6 pb-4 pt-8 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-fraunces text-xl font-semibold text-white tracking-tight">
                  Creating with {brand.name}
                </h2>
                {brand.brand_voice && (
                  <p className="font-epilogue text-[11px] text-white/50 leading-relaxed italic mt-0.5 line-clamp-1">
                    &ldquo;{brand.brand_voice.length > 120
                      ? brand.brand_voice.slice(0, 120) + '...'
                      : brand.brand_voice}&rdquo;
                  </p>
                )}
              </div>
              <button
                onClick={() => window.open('/showcase', '_blank')}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.12] border border-white/[0.20] text-white/80 hover:bg-white/[0.20] hover:text-white transition-colors font-epilogue text-xs backdrop-blur-sm"
              >
                <Star className="w-3 h-3" />
                View showcase
              </button>
            </div>
          </div>

          {/* Color palette bar — click to copy */}
          <div className="flex items-center gap-1.5 px-6 py-2.5 bg-black/60 border-t border-white/[0.06]">
            {colors.map((color, i) => (
              <div
                key={i}
                className="relative w-5 h-5 rounded-full border border-white/20 shadow-sm transition-all hover:scale-125 cursor-pointer hover:ring-2 hover:ring-white/30"
                style={{ backgroundColor: color }}
                title={`${color} — click to copy`}
                onClick={(e) => { e.stopPropagation(); handleCopyColor(color); }}
              >
                {copiedColor === color && (
                  <div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/90 text-[9px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none border border-white/10"
                    style={{ color: brand.primary_color }}
                  >
                    {color}
                  </div>
                )}
              </div>
            ))}
            <span className="font-epilogue text-[10px] text-white/30 ml-2 font-medium">{colors.length} colors</span>
          </div>

          {/* Model badges row */}
          <div className="flex items-center gap-2 px-6 py-2 bg-black/40 border-t border-white/[0.04]">
            <span className="font-epilogue text-[9px] text-white/25 uppercase tracking-wider font-medium shrink-0">Models</span>
            <ModelBadges className="flex-1 justify-start" />
          </div>
        </motion.div>

        {/* Guidelines — two separate striped cards */}
        <motion.div
          variants={containerVariants}
          className="grid md:grid-cols-2 gap-4 w-full max-w-4xl mb-8"
        >
          {/* Brand DNA card */}
          <motion.div
            variants={itemVariants}
            className={cn(
              'flex overflow-hidden rounded-xl backdrop-blur-sm group/bd transition-all duration-300',
              brandStats?.hasProfile && 'cursor-pointer',
              'hover:shadow-[0_8px_30px_-5px_rgba(255,255,255,0.08)] hover:-translate-y-0.5',
            )}
            style={{
              background: `linear-gradient(135deg, ${brand.primary_color}18, rgba(255,255,255,0.04))`,
              border: `1px solid ${brand.primary_color}40`,
            }}
            onClick={brandStats?.hasProfile ? onOpenBrandDNA : undefined}
          >
            <div
              className="w-2 shrink-0"
              style={{ background: `linear-gradient(to bottom, ${brand.primary_color}, ${brand.primary_color}50)` }}
            />
            <div className="flex-1 p-5 space-y-3 relative">
              <div
                className="absolute top-4 right-4 w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{ background: `${brand.primary_color}30` }}
              >
                <Dna className="w-11 h-11" style={{ color: brand.primary_color }} />
              </div>
              <div className="pr-20">
                <h3 className="font-fraunces text-base font-semibold text-white">Brand DNA</h3>
                <p className="font-epilogue text-[11px] text-white/70">Visual identity, typography, and photography intelligence</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', brandStats?.hasProfile ? 'bg-green-400' : 'bg-white/20')} />
                  <span className="font-epilogue text-[11px] text-white/60">
                    {brandStats?.hasProfile ? 'Visual DNA active' : 'Visual DNA not built'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', generationPrompt ? 'bg-green-400' : 'bg-white/20')} />
                  <span className="font-epilogue text-[11px] text-white/60">
                    {generationPrompt ? 'Prompt injection active' : 'Prompt injection not configured'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', brand.brand_voice ? 'bg-green-400' : 'bg-white/20')} />
                  <span className="font-epilogue text-[11px] text-white/60">
                    {brand.brand_voice ? 'Brand voice configured' : 'No brand voice'}
                  </span>
                </div>
              </div>
              {brandStats?.hasProfile && (
                <span className="inline-flex items-center gap-1 font-epilogue text-xs font-medium group-hover/bd:gap-2 transition-all" style={{ color: brand.primary_color }}>
                  Explore DNA <ArrowRight className="w-3 h-3" />
                </span>
              )}
            </div>
          </motion.div>

          {/* AI Guidelines card */}
          <motion.div
            variants={itemVariants}
            className="flex overflow-hidden rounded-xl backdrop-blur-sm group/gl cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_-5px_rgba(255,255,255,0.08)] hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${brand.primary_color}18, rgba(255,255,255,0.04))`,
              border: `1px solid ${brand.primary_color}40`,
            }}
            onClick={onOpenGuidelines}
          >
            <div
              className="w-2 shrink-0"
              style={{ background: `linear-gradient(to bottom, ${brand.primary_color}90, ${brand.primary_color}30)` }}
            />
            <div className="flex-1 p-5 space-y-3 relative">
              <div
                className="absolute top-4 right-4 w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{ background: `${brand.primary_color}30` }}
              >
                <Shield className="w-11 h-11" style={{ color: brand.primary_color }} />
              </div>
              <div className="pr-20">
                <h3 className="font-fraunces text-base font-semibold text-white">AI Guidelines</h3>
                <p className="font-epilogue text-[11px] text-white/70">Approved tools and usage policies for client work</p>
              </div>
              {toolApprovals.length > 0 ? (
                <div className="space-y-1.5">
                  {toolApprovals.slice(0, 3).map((approval) => {
                    const dotColor = approval.approval_status === 'approved'
                      ? 'bg-green-400'
                      : approval.approval_status === 'restricted'
                      ? 'bg-amber-400'
                      : 'bg-red-400';
                    return (
                      <div key={approval.id} className="flex items-center gap-2">
                        <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColor)} />
                        <span className="font-epilogue text-[11px] text-white/60 truncate">
                          {approval.product.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="font-epilogue text-[11px] text-white/55">
                  Configure brand-specific tool approvals in admin
                </p>
              )}
              <span className="inline-flex items-center gap-1 font-epilogue text-xs font-medium group-hover/gl:gap-2 transition-all" style={{ color: brand.primary_color }}>
                View Guidelines <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Tool cards */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl mb-8"
        >
          {/* Generation Prompt / Brand Voice */}
          <motion.div
            variants={itemVariants}
            className={cn('group/card rounded-xl cursor-pointer overflow-hidden', GLASS, GLASS_HOVER)}
            onClick={() => setBrandVoiceOpen(true)}
          >
            <div className="h-24 relative overflow-hidden">
              {brand.card_images?.generation_prompt ? (
                <img src={brand.card_images.generation_prompt} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105" />
              ) : (
                <div
                  className="h-full flex items-center justify-center relative"
                  style={{ background: `linear-gradient(135deg, #7C3AED50, #7C3AED18)` }}
                >
                  <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at 30% 50%, #A78BFA, transparent 60%)' }} />
                  {generationPrompt ? <Wand2 className="w-8 h-8 text-purple-300/70 relative z-10" /> : <AudioLines className="w-8 h-8 text-purple-300/70 relative z-10" />}
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-epilogue text-sm font-semibold text-white/90 mb-1">
                {generationPrompt ? 'Generation Prompt' : 'Brand Voice'}
              </h3>
              <p className="font-epilogue text-[11px] text-white/50 leading-relaxed">
                {generationPrompt
                  ? `${GENERATION_PROMPT_SECTIONS.filter(s => generationPrompt.section_toggles[s.key]).length} active sections`
                  : `Auto-injected into every generation`}
              </p>
            </div>
          </motion.div>

          {/* Art Direction */}
          <motion.div
            variants={itemVariants}
            className={cn('group/card rounded-xl cursor-pointer overflow-hidden', GLASS, GLASS_HOVER)}
            onClick={onOpenArtDirection}
          >
            <div className="h-24 relative overflow-hidden">
              {brand.card_images?.art_direction ? (
                <img src={brand.card_images.art_direction} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105" />
              ) : (
                <div
                  className="h-full flex items-center justify-center relative"
                  style={{ background: `linear-gradient(135deg, #05966950, #05966918)` }}
                >
                  <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at 60% 40%, #6EE7B7, transparent 60%)' }} />
                  <Camera className="w-8 h-8 text-emerald-300/70 relative z-10" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-epilogue text-sm font-semibold text-white/90 mb-1">Art Direction</h3>
              <p className="font-epilogue text-[11px] text-white/50 leading-relaxed">
                Shot types, composition & visual standards
              </p>
            </div>
          </motion.div>

          {/* Prompt Templates */}
          <motion.div
            variants={itemVariants}
            className={cn('group/card rounded-xl cursor-pointer overflow-hidden', GLASS, GLASS_HOVER)}
            onClick={onOpenPromptLibrary}
          >
            <div className="h-24 relative overflow-hidden">
              {brand.card_images?.templates ? (
                <img src={brand.card_images.templates} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105" />
              ) : (
                <div
                  className="h-full flex items-center justify-center relative"
                  style={{ background: `linear-gradient(135deg, #D9770650, #D9770618)` }}
                >
                  <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at 50% 30%, #FCD34D, transparent 60%)' }} />
                  <LayoutTemplate className="w-8 h-8 text-amber-300/70 relative z-10" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-epilogue text-sm font-semibold text-white/90 mb-1">Templates</h3>
              <p className="font-epilogue text-[11px] text-white/50 leading-relaxed">
                {brandStats && brandStats.promptCount > 0
                  ? `${brandStats.promptCount} saved configurations`
                  : `Reusable generation configurations`}
              </p>
            </div>
          </motion.div>

          {/* Brand Agent */}
          <motion.div
            variants={itemVariants}
            className={cn('group/card rounded-xl cursor-pointer overflow-hidden', GLASS, GLASS_HOVER)}
            onClick={onOpenBrandAgent}
          >
            <div className="h-24 relative overflow-hidden">
              {brand.card_images?.brand_agent ? (
                <img src={brand.card_images.brand_agent} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105" />
              ) : (
                <div
                  className="h-full flex items-center justify-center relative"
                  style={{ background: `linear-gradient(135deg, #2563EB50, #2563EB18)` }}
                >
                  <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at 40% 60%, #60A5FA, transparent 60%)' }} />
                  <Bot className="w-8 h-8 text-blue-300/70 relative z-10" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-epilogue text-sm font-semibold text-white/90 mb-1">Creative Director</h3>
              <p className="font-epilogue text-[11px] text-white/50 leading-relaxed">
                Brief campaigns by voice or text — copy and images together
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Quick prompts */}
        {brand.quick_prompts && brand.quick_prompts.length > 0 && (
          <motion.div variants={itemVariants} className="max-w-4xl w-full mb-8">
            <p className="font-epilogue text-[10px] font-medium text-white/30 mb-2.5 text-center uppercase tracking-wider">
              Quick Prompts
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {brand.quick_prompts.map((qp, i) => {
                const Icon = qp.icon ? qpIconMap[qp.icon] || Sparkles : Sparkles;
                return (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    onClick={() => onQuickPromptClick?.(qp.prompt)}
                    className="h-8 text-[11px] px-3.5 gap-1.5 rounded-full bg-white/[0.06] border border-white/[0.10] text-white/60 hover:bg-white/[0.10] hover:border-white/[0.18] hover:text-white/90 transition-all duration-200"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {qp.name}
                  </Button>
                );
              })}
            </div>
          </motion.div>
        )}

      </div>

      {/* Generation Prompt / Brand Voice Dialog */}
      <Dialog open={brandVoiceOpen} onOpenChange={setBrandVoiceOpen}>
        <DialogContent className="max-w-[650px] max-h-[80vh] p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {generationPrompt ? 'Generation Prompt' : 'Brand Voice'} — {brand.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            How {brand.name}&apos;s brand direction is applied to your prompts
          </DialogDescription>

          {/* Header */}
          <div
            className="px-6 py-5"
            style={{
              background: `linear-gradient(135deg, ${brand.primary_color}, ${brand.secondary_color})`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                {generationPrompt
                  ? <Wand2 className="w-5 h-5 text-white" />
                  : <AudioLines className="w-5 h-5 text-white" />}
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/60">
                  {generationPrompt ? 'Generation Prompt' : 'Brand Voice'}
                </p>
                <h2 className="text-lg font-semibold text-white">
                  {brand.name}
                </h2>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(80vh-100px)]">
            {generationPrompt ? (
              <>
                {/* Explanation */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A structured generation prompt is automatically prepended to every image or video you create.
                  It covers brand identity, visual style, color, typography, photography direction, and more —
                  so even a simple prompt produces on-brand results.
                </p>

                {/* Section cards */}
                <div className="space-y-2">
                  {parsePromptSections(generationPrompt.prompt_text).map((section, i) => {
                    const isEnabled = section.key ? generationPrompt.section_toggles[section.key] : true;

                    return (
                      <div
                        key={i}
                        className={cn(
                          'border rounded-lg p-3 space-y-1',
                          isEnabled ? 'bg-card' : 'opacity-40 bg-muted/20',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold">{section.heading}</h4>
                          {!isEnabled && (
                            <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              disabled
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                          {section.content}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <p className="text-[11px] text-muted-foreground border-t pt-3">
                  This prompt is automatically prepended to every generation. Admins can edit sections and
                  toggle them on/off in the Brand Intelligence tab.
                </p>
              </>
            ) : (
              <>
                {/* Legacy brand voice view */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-primary" />
                    How Brand Voice Works
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Every time you generate an image or video, {brand.name}&apos;s
                    brand voice is automatically prepended to your prompt before it reaches the AI model.
                    Even a simple prompt like &ldquo;product hero shot&rdquo; will be guided by
                    the brand&apos;s tone, personality, and style direction.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    {brand.name}&apos;s Voice
                  </h3>
                  {brand.brand_voice ? (
                    <div className="bg-muted/40 rounded-lg p-4 border">
                      <p className="text-sm leading-relaxed italic text-foreground">
                        &ldquo;{brand.brand_voice}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        No brand voice configured yet. An admin can set this in the Brand Intelligence tab.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-muted/20 rounded-lg p-4 space-y-3 border border-dashed">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    What the AI model sees
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <p className="text-xs text-muted-foreground">
                        <strong>Brand voice</strong> (auto-injected) — sets tone, personality, and style direction
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <p className="text-xs text-muted-foreground">
                        <strong>Your prompt</strong> — whatever you type in the input field
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    This happens server-side — you don&apos;t need to do anything special.
                  </p>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    A structured generation prompt can be synthesized from brand intelligence data
                    in the Brand Intelligence admin tab.
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
