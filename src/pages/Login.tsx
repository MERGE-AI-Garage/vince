// ABOUTME: Login page for Vince demo.
// ABOUTME: Full-bleed hero background with glass card and brand identity.

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Full-bleed background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/studio-hero.jpeg)' }}
      />

      {/* Dark gradient overlay — deep teal/emerald, matches app interior */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0D1B16]/92 via-[#0A2820]/88 to-[#071A10]/95" />

      {/* Subtle radial glow behind the card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      {/* Login card */}
      <div
        className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-white/10 p-10 shadow-2xl animate-fade-in"
        style={{
          background: 'rgba(10, 28, 20, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Brand identity */}
        <div className="mb-10 space-y-3">
          <h1
            className="text-5xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Vince
          </h1>
          <p className="text-white/80 text-lg font-medium leading-snug">
            Brief by voice.<br />Get a complete campaign.
          </p>
          <p className="text-white/40 text-sm leading-relaxed">
            Your brand intelligence — in every prompt, across every tool.
          </p>
        </div>

        {/* Form */}
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

        {/* Footer */}
        <p className="mt-8 text-center text-white/20 text-xs">
          Google Gemini Live Agent Challenge · 2026
        </p>
      </div>
    </div>
  );
}
