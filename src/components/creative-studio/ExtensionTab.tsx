// ABOUTME: Apple-style product page for the Vince Chrome Extension and mobile apps.
// ABOUTME: Hero, feature grid, mobile apps section, how-it-works, installation guide + download CTA.

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Chrome,
  Palette,
  Sparkles,
  Zap,
  Globe,
  Copy,
  BookmarkPlus,
  Download,
  Package,
  ArrowUpRight,
  CheckCircle2,
  Smartphone,
  Apple,
} from 'lucide-react';

const EXTENSION_DOWNLOAD_URL = '/vince-extension.zip';
const EXTENSION_VERSION = '1.0.0';

const features = [
  {
    icon: Palette,
    title: 'Multi-Brand Switching',
    description:
      'Every brand built in Creative Studio appears automatically. Select a brand — the extension recolors itself to match the brand\'s palette.',
    stripe: 'from-emerald-400 to-emerald-600',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
  },
  {
    icon: Sparkles,
    title: 'LLM-Powered Prompt Builder',
    description:
      'Describe what you need, select a category, and Gemini builds a fully on-brand prompt — hex values, Photography DNA, voice principles included.',
    stripe: 'from-purple-400 to-purple-600',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
  },
  {
    icon: Zap,
    title: 'QuickStarters',
    description:
      'Category-specific preset templates with variable fields. Fully constructed prompts with ingredient accuracy, camera specs, and forbidden aesthetics baked in.',
    stripe: 'from-amber-400 to-amber-600',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
  },
  {
    icon: Globe,
    title: 'Site Detection',
    description:
      'The extension knows which AI tool you\'re using — ChatGPT, Gemini, Firefly, Midjourney, Claude, Jasper — and provides contextual guidance.',
    stripe: 'from-blue-400 to-blue-600',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
  {
    icon: Copy,
    title: 'Copy-for-Prompt',
    description:
      'Every section of the brand guidelines has a copy button that formats data for AI consumption. Colors as hex lists. Voice as instruction sets.',
    stripe: 'from-teal-400 to-teal-600',
    iconBg: 'bg-teal-500/10',
    iconColor: 'text-teal-500',
  },
  {
    icon: BookmarkPlus,
    title: 'Save & Promote',
    description:
      'Save prompts that work brilliantly. Admins can promote user-discovered prompts into the system library — crowd-sourced brand intelligence.',
    stripe: 'from-rose-400 to-rose-600',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-500',
  },
];

const steps = [
  {
    icon: Download,
    label: 'Download',
    description: 'Get the extension package from this page. One zip file, everything included.',
  },
  {
    icon: Package,
    label: 'Install',
    description: 'Unzip and load in Chrome. Takes 30 seconds — no app store required.',
  },
  {
    icon: Sparkles,
    label: 'Create',
    description: 'Open alongside any AI tool. Select a brand. Generate on-brand prompts instantly.',
  },
];

const installSteps = [
  { text: 'Click **Download Extension** above to get the `.zip` file', note: null },
  { text: 'Unzip the file to a permanent folder on your computer', note: 'Don\'t delete this folder — Chrome reads from it directly' },
  { text: 'Open Chrome and navigate to', code: 'chrome://extensions', note: null },
  { text: 'Toggle **Developer mode** on', note: 'Top-right corner of the extensions page' },
  { text: 'Click **Load unpacked** and select the unzipped folder', note: null },
  { text: 'Click the puzzle icon in Chrome toolbar and **pin** the extension', note: null },
];

const platforms = [
  'ChatGPT', 'Gemini', 'Claude', 'Midjourney', 'Firefly', 'Copilot',
  'Leonardo', 'Ideogram', 'AI Studio', 'NotebookLM', 'Jasper', 'Shutterstock',
];

function DownloadButton({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const isLarge = size === 'lg';
  return (
    <a
      href={EXTENSION_DOWNLOAD_URL}
      download
      className={`inline-flex items-center gap-2 rounded-xl bg-violet-600 text-white font-semibold transition-all hover:bg-violet-500 shadow-lg shadow-violet-900/30 hover:shadow-violet-800/40 ${
        isLarge ? 'px-8 py-3.5 text-sm' : 'px-6 py-2.5 text-xs'
      }`}
    >
      <Download className={isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      Download Extension
    </a>
  );
}

function formatStepText(text: string) {
  // Render **bold** and `code` in step text
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-muted rounded-md px-1.5 py-0.5 font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function ExtensionTab() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const mobileRef = useRef(null);
  const howRef = useRef(null);
  const installRef = useRef(null);
  const ctaRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true, margin: '-50px' });
  const featuresInView = useInView(featuresRef, { once: true, margin: '-80px' });
  const mobileInView = useInView(mobileRef, { once: true, margin: '-80px' });
  const howInView = useInView(howRef, { once: true, margin: '-80px' });
  const installInView = useInView(installRef, { once: true, margin: '-80px' });
  const ctaInView = useInView(ctaRef, { once: true, margin: '-80px' });

  return (
    <div className="space-y-0">
      {/* ── Section 1: Hero ── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1e1b4b] via-[#4c1d95] to-[#1e1b4b] py-20 px-8"
      >
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(139,92,246,0.20),transparent_60%)]" />

        {/* Chrome watermark */}
        <Chrome className="absolute -bottom-6 -right-6 w-40 h-40 text-white/[0.04] transform -rotate-12" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative z-10 text-center max-w-3xl mx-auto"
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 mb-8">
            <Chrome className="w-4 h-4 text-violet-300" />
            <span className="font-epilogue text-sm font-medium text-white/80">Browser & Mobile</span>
          </div>

          <h1 className="font-fraunces text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Brand Intelligence,{' '}
            <span className="block">Everywhere You Create</span>
          </h1>

          <p className="font-epilogue text-lg text-white/70 max-w-2xl mx-auto leading-relaxed mb-10">
            A Chrome Extension that puts the full weight of every brand's intelligence into a
            sidebar — available next to any AI tool. The brand travels with the person, not the tool.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <DownloadButton />
            <a
              href="/brand-intelligence"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-epilogue text-sm font-medium text-white/60 hover:text-white/90 transition-colors"
            >
              Learn More
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          <p className="font-epilogue text-[11px] text-white/40 mt-6">
            Version {EXTENSION_VERSION} · Chrome · Requires Vince account
          </p>
        </motion.div>
      </section>

      {/* ── Section 2: Feature Grid ── */}
      <section ref={featuresRef} className="py-16 px-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="font-fraunces text-2xl font-bold mb-2">
            Everything Your Brand Needs in a Sidebar
          </h2>
          <p className="font-epilogue text-sm text-muted-foreground max-w-xl mx-auto">
            Six capabilities that turn any AI tool into a brand-aware creative partner.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                className="flex overflow-hidden rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`w-1.5 bg-gradient-to-b ${feature.stripe} shrink-0`} />
                <div className="flex-1 p-5 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg ${feature.iconBg} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${feature.iconColor}`} />
                    </div>
                    <h3 className="font-epilogue text-sm font-semibold">{feature.title}</h3>
                  </div>
                  <p className="font-epilogue text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Section 3: Mobile Apps ── */}
      <section
        ref={mobileRef}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1e1b4b] via-[#2d1b69] to-[#1e1b4b] py-16 px-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(139,92,246,0.15),transparent_70%)]" />
        <Smartphone className="absolute -top-4 -right-4 w-48 h-48 text-white/[0.03] transform rotate-12" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={mobileInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 mb-6">
            <Smartphone className="w-4 h-4 text-violet-300" />
            <span className="font-epilogue text-sm font-medium text-white/80">Mobile Apps</span>
          </div>
          <h2 className="font-fraunces text-3xl font-bold text-white mb-4">
            Take Vince Everywhere
          </h2>
          <p className="font-epilogue text-base text-white/65 max-w-2xl mx-auto leading-relaxed">
            The original vision for Vince was always mobile-first. Talk to Vince while you're on the go —
            your creative direction, brand knowledge, and generated assets waiting when you get back to your desk.
          </p>
        </motion.div>

        <div className="relative z-10 grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* iOS — Available Now */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={mobileInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="bg-white/8 border border-white/15 rounded-2xl p-8 flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                <Apple className="w-8 h-8 text-white" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                Available Now
              </span>
            </div>
            <h3 className="font-fraunces text-xl font-bold text-white mb-3">iOS App</h3>
            <p className="font-epilogue text-sm text-white/65 leading-relaxed flex-1">
              Generate brand-aligned imagery on the go. Talk to Vince while you're jogging or commuting —
              your creative direction and generated assets are waiting when you get back to your desk.
              Full access to Creative Studio from your iPhone.
            </p>
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="font-epilogue text-xs text-white/40">iPhone · iOS 16+ · Available on App Store</p>
            </div>
          </motion.div>

          {/* Android — Coming Soon */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={mobileInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/4 border border-white/8 rounded-2xl p-8 flex flex-col opacity-80"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/8 flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-white/50" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/8 border border-white/15 text-white/50 text-xs font-semibold">
                In Development
              </span>
            </div>
            <h3 className="font-fraunces text-xl font-bold text-white/70 mb-3">Android App</h3>
            <p className="font-epilogue text-sm text-white/45 leading-relaxed flex-1">
              Android version is in active development. The same full Vince experience — brand intelligence,
              on-the-go generation, and Creative Studio access — coming to Android and Google Play.
            </p>
            <div className="mt-6 pt-6 border-t border-white/8">
              <p className="font-epilogue text-xs text-white/30">Android · Google Play · Coming Soon</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Section 4: How It Works ── */}
      <section ref={howRef} className="py-16 px-2 bg-muted/30 rounded-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={howInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-fraunces text-2xl font-bold mb-2">Up and Running in 3 Minutes</h2>
          <p className="font-epilogue text-sm text-muted-foreground">
            No app store review. No IT ticket. Download, install, create.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto px-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 20 }}
                animate={howInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                className="text-center relative"
              >
                {/* Connecting line (hidden on mobile, visible on md+) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-px bg-border" />
                )}

                <div className="w-14 h-14 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-violet-500" />
                </div>
                <div className="font-epilogue text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Step {i + 1}
                </div>
                <h3 className="font-epilogue text-base font-semibold mb-2">{step.label}</h3>
                <p className="font-epilogue text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Section 5: Installation Guide ── */}
      <section ref={installRef} className="py-16 px-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={installInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="font-fraunces text-2xl font-bold mb-2">Installation</h2>
          <p className="font-epilogue text-sm text-muted-foreground">
            Step-by-step guide to get the extension running in Chrome.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={installInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden"
        >
          <div className="divide-y divide-border/40">
            {installSteps.map((step, i) => (
              <div key={i} className="flex gap-4 p-5">
                <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-epilogue text-sm font-bold text-violet-400">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-epilogue text-sm leading-relaxed">
                    {formatStepText(step.text)}
                    {step.code && (
                      <>
                        {' '}
                        <code className="bg-muted rounded-md px-1.5 py-0.5 font-mono text-xs">
                          {step.code}
                        </code>
                      </>
                    )}
                  </p>
                  {step.note && (
                    <p className="font-epilogue text-[11px] text-muted-foreground mt-1">
                      {step.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/40 bg-muted/30 px-5 py-4">
            <p className="font-epilogue text-xs text-muted-foreground leading-relaxed">
              Once installed, click the extension icon to open the sidebar on any AI tool.
              Sign in with your Vince credentials to load your brands.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── Section 6: Supported Platforms + Final CTA ── */}
      <section
        ref={ctaRef}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1e1b4b] via-[#4c1d95] to-[#1e1b4b] py-16 px-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(139,92,246,0.15),transparent_60%)]" />

        <div className="relative z-10 grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {/* Left — Supported platforms */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={ctaInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h3 className="font-fraunces text-xl font-bold text-white mb-6">
              Works With Every AI Tool
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {platforms.map((platform) => (
                <span
                  key={platform}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 font-epilogue text-xs text-white/80"
                >
                  <CheckCircle2 className="w-3 h-3 text-violet-400" />
                  {platform}
                </span>
              ))}
            </div>
            <p className="font-epilogue text-xs text-white/50 leading-relaxed">
              And any other tool — the extension detects the site automatically.
              New platforms are supported without updates.
            </p>
          </motion.div>

          {/* Right — Download card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={ctaInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center"
          >
            <Chrome className="w-12 h-12 text-violet-400 mb-4" />
            <h3 className="font-epilogue text-base font-semibold text-white mb-1">
              Vince
            </h3>
            <p className="font-epilogue text-[11px] text-white/40 mt-4">
              AI-powered brand intelligence
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
