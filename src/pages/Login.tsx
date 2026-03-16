// ABOUTME: Login page for Vince demo.
// ABOUTME: Split-screen editorial layout — bold copy + animated voice spectrum left, login form right.

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Mic, ArrowRight } from 'lucide-react';

// ── Animation variants (stagger pattern from WelcomeScreen) ──────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

// ── Voice spectrum (adapted from ShowcaseModal — recolored emerald) ───────────

const SPECTRUM = [0.25, 0.55, 0.80, 0.95, 0.70, 1.00, 0.60, 0.85, 0.45, 0.90,
                  0.75, 1.00, 0.50, 0.88, 0.65, 0.78, 0.40, 0.92, 0.55, 0.70];

// ── Cycling brand phrases ─────────────────────────────────────────────────────

const PHRASES = [
  'Brief by voice. Get a complete campaign.',
  '14 formats. Every channel. One brief.',
  'Brand DNA loaded. Always on.',
  'Your tone, your rules — in every asset.',
  'Live audio → campaign ready.',
];

function CyclingPhrase() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % PHRASES.length), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="h-5 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          className="text-[11px] font-medium tracking-wide text-center"
          style={{ color: 'rgba(134,239,172,0.65)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {PHRASES[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function VoiceSpectrumVisual() {
  return (
    <div className="flex flex-col items-center gap-5 select-none">
      {/* Orb with pulsing rings and ripples */}
      <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ width: 140 + i * 48, height: 140 + i * 48, border: '1px solid rgba(74,222,128,0.18)' }}
            animate={{ opacity: [0.25, 0.55, 0.25] }}
            transition={{ duration: 3, delay: i * 0.9, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        {[0, 1, 2].map(i => (
          <motion.div key={`p${i}`} className="absolute rounded-full"
            style={{ width: 100, height: 100, border: '1.5px solid rgba(74,222,128,0.45)' }}
            animate={{ scale: [0.35, 1.4], opacity: [0.6, 0] }}
            transition={{ duration: 2.4, delay: i * 0.65, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
        <motion.div
          className="relative z-10 flex items-center justify-center rounded-full"
          style={{ width: 72, height: 72, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.28)' }}
          animate={{ boxShadow: ['0 0 0px rgba(74,222,128,0)', '0 0 32px rgba(74,222,128,0.4)', '0 0 0px rgba(74,222,128,0)'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Mic className="w-8 h-8 text-emerald-400" />
        </motion.div>
      </div>

      {/* Spectrum bars */}
      <div className="flex items-end justify-center gap-[3px]" style={{ height: 56 }}>
        {SPECTRUM.map((h, i) => (
          <motion.div key={i} className="w-1.5 rounded-full"
            style={{ background: 'linear-gradient(to top, #16a34a, #4ade80)', originY: 1 }}
            animate={{ scaleY: [h * 0.35, h, h * 0.55, h * 0.88, h * 0.35] }}
            transition={{ duration: 1.2 + (i % 4) * 0.22, repeat: Infinity, ease: 'easeInOut', delay: i * 0.055 }}
            initial={{ scaleY: h * 0.35 }}
          />
        ))}
      </div>

      {/* Cycling brand phrases */}
      <CyclingPhrase />
    </div>
  );
}

// ── Stats row ─────────────────────────────────────────────────────────────────

const STATS = [
  { value: '14', label: 'campaign formats' },
  { value: '26', label: 'voice roles' },
  { value: '3', label: 'secret models' },
  { value: '∞', label: 'brand memory' },
];

// ── Login page ────────────────────────────────────────────────────────────────

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError('Invalid credentials. Please try again.');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: '#080F09' }}>

      {/* ── Left panel — editorial ─────────────────────────────────────────── */}
      <motion.div
        className="flex-1 flex flex-col justify-between px-12 py-14 md:px-16 md:py-16"
        style={{ background: 'linear-gradient(160deg, #080F09 0%, #0A1A0F 60%, #091409 100%)' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Wordmark + headline + copy */}
        <div className="space-y-8">
          <motion.div variants={itemVariants}>
            <h1
              className="text-4xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Vince
            </h1>
          </motion.div>

          <div className="space-y-2">
            <motion.p variants={itemVariants} className="text-white/50 text-xl font-medium">
              Brief by voice.
            </motion.p>
            <motion.h2
              variants={itemVariants}
              className="text-5xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight"
            >
              He becomes<br />your brand.
            </motion.h2>
          </div>

          <motion.p variants={itemVariants} className="text-white/40 text-base leading-relaxed max-w-sm">
            Your brand intelligence — in every prompt,<br />across every tool.
          </motion.p>

          <motion.div variants={itemVariants}>
            <Link
              to="/showcase"
              className="inline-flex items-center gap-2 text-base font-semibold group"
              style={{
                background: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              What can Vince do?
              <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Voice spectrum — centered, hidden on mobile */}
        <motion.div
          variants={itemVariants}
          className="hidden md:flex items-center justify-center w-full py-6"
        >
          <VoiceSpectrumVisual />
        </motion.div>

        {/* Stats row — hidden on mobile */}
        <motion.div variants={itemVariants} className="hidden md:flex items-end gap-8">
          {STATS.map((s, i) => (
            <div key={i} className="space-y-0.5">
              <div
                className="text-2xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {s.value}
              </div>
              <div className="text-white/30 text-xs uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Right panel — login form ───────────────────────────────────────── */}
      <motion.div
        className="w-full md:w-[420px] flex flex-col justify-center px-10 py-14 md:px-12"
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
        }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.45, ease: 'easeOut' }}
      >
        <div className="w-full max-w-sm mx-auto space-y-8">
          <h3 className="text-white/80 text-lg font-semibold">Sign in</h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-wide text-white/50 uppercase" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-emerald-400/50 focus:bg-white/8 transition-all text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-wide text-white/50 uppercase" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-emerald-400/50 focus:bg-white/8 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-400/80 text-xs">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              style={{
                background: loading
                  ? 'rgba(74, 222, 128, 0.3)'
                  : 'linear-gradient(135deg, #16a34a 0%, #0d9488 100%)',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(74, 222, 128, 0.25)',
              }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Attribution footer */}
          <div className="space-y-2 pt-2 text-center">
            <p className="text-white/50 text-xs">Built for Google Gemini Live Agent Challenge</p>
            <p className="text-xs flex items-center justify-center gap-1.5 flex-wrap">
              <a
                href="https://www.linkedin.com/in/kurtlmiller/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors font-medium"
              >
                Kurt Miller
              </a>
              <span className="text-white/30">·</span>
              <span className="text-white/50">AI Enablement Director</span>
              <span className="text-white/30">·</span>
              <a
                href="https://www.mergeworld.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors font-medium"
              >
                MERGE
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
