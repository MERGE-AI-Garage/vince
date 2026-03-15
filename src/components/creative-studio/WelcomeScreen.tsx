// ABOUTME: Welcome screen for Creative Studio — dark cinematic splash with two states
// ABOUTME: Full dark treatment with glass cards, immersive brand imagery, and prominent guidelines

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ImagePlus, Film, Scissors,
  MessagesSquare, Camera,
  Sparkles, Dna, AudioLines, Bot,
  LayoutTemplate, Shield, Palette,
  Upload, ArrowRight, Box,
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
  onUploadClick: () => void;
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

// ── System capabilities data ──────────────────────────────────────────────────

interface Capability {
  key: WelcomeImageKey;
  icon: typeof ImagePlus;
  title: string;
  desc: string;
  learnMore: string;
  models: string[];
  strengths: string[];
  tryIt: string;
}

const CAPABILITIES: readonly Capability[] = [
  {
    key: 'image_generation',
    icon: ImagePlus,
    title: 'Image Generation',
    desc: 'Gemini 3 Pro, Imagen 3 & 4 — text-to-image with brand voice injection',
    learnMore: 'Create images from text descriptions. When a brand is selected, the studio automatically injects brand voice, color palette, and visual identity into every generation — so output feels on-brand without extra prompting.',
    models: ['Nano Banana 2', 'Nano Banana Pro', 'Imagen 4 Standard', 'Imagen 4 Fast'],
    strengths: ['Brand-aware prompting', 'Multiple model choice', 'Aspect ratio control', 'Temperature tuning'],
    tryIt: 'Select a brand, type "hero banner for summer campaign" and compare Nano Banana vs Imagen output.',
  },
  {
    key: 'video_generation',
    icon: Film,
    title: 'Video Generation',
    desc: 'Veo 2 & 3 — text, image, keyframe, and director-mode video with audio',
    learnMore: 'Generate short video clips from text prompts or reference images. Veo 3 adds synchronized audio generation and cinematic camera controls. Director Mode lets you choreograph camera movement, focus, and pacing.',
    models: ['Veo 3.1', 'Veo 3.1 Fast', 'Veo 2'],
    strengths: ['Text-to-video', 'Image-to-video', 'Audio generation', 'Director Mode camera controls'],
    tryIt: 'Try "slow dolly forward through a sun-dappled forest" to see how Director Mode interprets camera direction.',
  },
  {
    key: 'editing_suite',
    icon: Scissors,
    title: 'Editing Suite',
    desc: 'Background swap, object removal & insertion, subject swap, canvas expansion',
    learnMore: 'Upload any image and use AI to modify it selectively. Draw masks to target specific regions, or let the AI auto-detect subjects and backgrounds. Supports object removal, insertion, background replacement, and outpainting beyond the original frame.',
    models: ['Imagen 3 Editing', 'Nano Banana 2'],
    strengths: ['Mask-based editing', 'Object removal', 'Background replacement', 'Canvas outpainting'],
    tryIt: 'Upload a product photo, select "Background Swap" and describe a new setting — the product stays, the scene changes.',
  },
  {
    key: 'conversational_editing',
    icon: MessagesSquare,
    title: 'Conversational Editing',
    desc: 'Multi-turn chat-based image refinement with memory',
    learnMore: 'Refine images through natural conversation. Generate an image, then ask for changes — "make the sky warmer," "add a person on the left," "zoom in on the product." The AI maintains context across turns so each edit builds on the last.',
    models: ['Nano Banana 2', 'Nano Banana Pro'],
    strengths: ['Multi-turn memory', 'Iterative refinement', 'Natural language edits', 'Context preservation'],
    tryIt: 'Generate any image, then type follow-up requests like "move the subject left" or "change the color palette to autumn tones."',
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

// ── Component ─────────────────────────────────────────────────────────────────

export function WelcomeScreen({
  brand,
  brandStats,
  onUploadClick,
  onOpenBrandDNA,
  onOpenArtDirection,
  onOpenPromptLibrary,
  onOpenBrandAgent,
  onOpenGuidelines,
  onQuickPromptClick,
  onDemoClick,
}: WelcomeScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (brand) {
    return (
      <BrandWelcome
        brand={brand}
        brandStats={brandStats}
        onUploadClick={onUploadClick}
        onOpenBrandDNA={onOpenBrandDNA}
        onOpenArtDirection={onOpenArtDirection}
        onOpenPromptLibrary={onOpenPromptLibrary}
        onOpenBrandAgent={onOpenBrandAgent}
        onOpenGuidelines={onOpenGuidelines}
        onQuickPromptClick={onQuickPromptClick}
        fileInputRef={fileInputRef}
      />
    );
  }

  return (
    <SystemWelcome onUploadClick={onUploadClick} fileInputRef={fileInputRef} onDemoClick={onDemoClick} />
  );
}

// ── State A: No brand — System Capabilities ──────────────────────────────────

function SystemWelcome({
  onUploadClick,
  fileInputRef,
  onDemoClick,
}: {
  onUploadClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
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
      {/* Background: ambient glow + vignette */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full opacity-[0.08] blur-3xl animate-pulse"
          style={{
            background: 'radial-gradient(circle, #00856C, transparent)',
            animationDuration: '6s',
          }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 rounded-full opacity-[0.05] blur-3xl animate-pulse"
          style={{
            background: 'radial-gradient(circle, #00856C, transparent)',
            animationDuration: '8s',
            animationDelay: '2s',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5))]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-6 pb-4">

        {/* Page header — bare text, no card */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-4xl flex items-end justify-between mb-5"
        >
          <div>
            <h2 className="font-fraunces text-3xl font-semibold text-white tracking-tight leading-none mb-1">
              Vince
            </h2>
            <p className="font-epilogue text-xs text-white/40">
              Brand-aware AI creative production
            </p>
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <button
              onClick={onUploadClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-white/70 hover:bg-white/[0.14] hover:text-white transition-colors font-epilogue text-xs"
            >
              <Upload className="w-3 h-3" />
              Upload to Edit
            </button>
            {onDemoClick && (
              <button
                onClick={onDemoClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1ED75F]/10 border border-[#1ED75F]/20 text-[#1ED75F]/80 hover:bg-[#1ED75F]/20 hover:text-[#1ED75F] transition-colors font-epilogue text-xs"
              >
                <Wand2 className="w-3 h-3" />
                Platform Demo
              </button>
            )}
          </div>
        </motion.div>

        {/* Capability cards */}
        <motion.div
          variants={containerVariants}
          className="max-w-4xl w-full mb-4"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CAPABILITIES.map((cap) => (
              <HoverCard key={cap.title} openDelay={300} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <motion.div
                    variants={itemVariants}
                    className={cn(
                      'group/cap flex flex-col rounded-xl cursor-default overflow-hidden',
                      GLASS, GLASS_HOVER,
                    )}
                  >
                    {welcomeImages?.[cap.key] ? (
                      <div className="w-full h-28 overflow-hidden">
                        <img src={welcomeImages[cap.key]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover/cap:scale-105" />
                      </div>
                    ) : (
                      <div className="w-full h-28 flex items-center justify-center bg-white/[0.03]">
                        <cap.icon className="w-6 h-6 text-white/20" />
                      </div>
                    )}
                    <div className="px-3 py-2.5">
                      <h3 className="font-epilogue text-[11px] font-semibold text-white/85 mb-0.5">{cap.title}</h3>
                      <p className="font-epilogue text-[10px] text-white/35 leading-snug line-clamp-2">{cap.desc}</p>
                    </div>
                  </motion.div>
                </HoverCardTrigger>
                <HoverCardContent
                  side="bottom"
                  align="center"
                  className="w-80 p-0 overflow-hidden border-white/[0.12] bg-[#0F1F19]/95 backdrop-blur-xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)]"
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.03]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#00856C]/20 flex items-center justify-center">
                        <cap.icon className="w-4 h-4 text-[#00D26A]" />
                      </div>
                      <div>
                        <p className="font-epilogue text-sm font-semibold text-white/90">{cap.title}</p>
                        <p className="font-epilogue text-[10px] text-white/35">{cap.models.join(' · ')}</p>
                      </div>
                    </div>
                  </div>
                  {/* Body */}
                  <div className="px-4 py-3 space-y-3">
                    <p className="font-epilogue text-xs text-white/50 leading-relaxed">{cap.learnMore}</p>
                    <div className="space-y-1.5">
                      <p className="font-epilogue text-[10px] font-medium text-white/25 uppercase tracking-wider">Strengths</p>
                      <div className="flex flex-wrap gap-1">
                        {cap.strengths.map((s) => (
                          <span key={s} className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium font-epilogue bg-[#00856C]/15 border border-[#00856C]/20 text-[#00D26A]/70">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/[0.06]">
                      <p className="font-epilogue text-[10px] text-white/40">
                        <span className="font-medium text-[#00D26A]/60">Try it:</span> {cap.tryIt}
                      </p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        </motion.div>

        {/* Powered-by model line */}
        <motion.div variants={itemVariants} className="max-w-4xl w-full flex items-center justify-center gap-2 mb-5">
          <span className="font-epilogue text-[10px] text-white/20 uppercase tracking-wider">Powered by</span>
          <ModelBadges />
        </motion.div>

        {/* Chrome Extension CTA */}
        <motion.div
          variants={itemVariants}
          className="max-w-4xl w-full mb-4 relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#133B34]/[0.60] to-[#0D1B16]/[0.60] border border-[#00856C]/20 backdrop-blur-sm"
        >
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 px-6 py-3">
            <div className="w-9 h-9 rounded-xl bg-[#1ED75F]/10 flex items-center justify-center shrink-0">
              <Chrome className="w-5 h-5 text-[#1ED75F]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-fraunces text-sm font-semibold text-white mb-0.5">
                AI Brand Guidelines Chrome Extension
              </h3>
              <p className="font-epilogue text-xs text-white/50 leading-relaxed mb-2">
                Brand intelligence in a sidebar — next to ChatGPT, Gemini, Claude, Midjourney, and more.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['ChatGPT', 'Gemini', 'Claude', 'Midjourney', 'Firefly'].map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] font-epilogue text-[10px] text-white/50"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#1ED75F]" />
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <a
              href="/vince-extension.zip"
              download
              className="inline-flex items-center gap-2 rounded-xl bg-[#1ED75F] text-[#0D1B16] font-semibold font-epilogue text-xs px-5 py-2.5 hover:bg-[#1ED75F]/90 transition-colors shadow-lg shadow-[#1ED75F]/20 shrink-0"
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
  onUploadClick,
  onOpenBrandDNA,
  onOpenArtDirection,
  onOpenPromptLibrary,
  onOpenBrandAgent,
  onOpenGuidelines,
  onQuickPromptClick,
  fileInputRef,
}: {
  brand: CreativeStudioBrand;
  brandStats?: BrandStats;
  onUploadClick: () => void;
  onOpenBrandDNA?: () => void;
  onOpenArtDirection?: () => void;
  onOpenPromptLibrary?: () => void;
  onOpenBrandAgent?: () => void;
  onOpenGuidelines?: () => void;
  onQuickPromptClick?: (prompt: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
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
                onClick={onUploadClick}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.12] border border-white/[0.20] text-white/80 hover:bg-white/[0.20] hover:text-white transition-colors font-epilogue text-xs backdrop-blur-sm"
              >
                <Upload className="w-3 h-3" />
                Upload Reference
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
