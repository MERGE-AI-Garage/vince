// ABOUTME: Root component for the Vince mobile app (iOS and Android)
// ABOUTME: Full-screen Vince chat/voice interface with brand picker, mobile-optimized layout

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SplashScreen } from '@capacitor/splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGate } from './AuthGate';
import { MobileSplash } from './MobileSplash';
import { supabase } from '@/integrations/supabase/client';
import { BrandAgentApp } from '@/components/creative-studio/BrandAgentApp';
import { CompactMediaGrid } from '@/components/creative-studio/CompactMediaGrid';
import { CreationsTab } from '@/components/creative-studio/CreationsTab';
import { BrandDNATab } from './BrandDNATab';
import { PromptsTab } from './PromptsTab';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
    },
  },
});

class MobileErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Vince Mobile] Unhandled error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', background: '#0f0a1e', color: '#e0e0e0', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#ef4444', marginBottom: '8px' }}>Something went wrong</p>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px', maxWidth: '300px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #374151', background: '#1e1632', color: '#e0e0e0', fontSize: '14px', cursor: 'pointer', minHeight: '48px' }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface Brand {
  id: string;
  name: string;
  primary_color: string | null;
  logo_url: string | null;
}

/** Convert hex color to HSL components [h, s, l] */
function hexToHsl(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  const n = parseInt(c.length === 3 ? c.split('').map(x => x + x).join('') : c, 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/** Derive a very dark background and a readable accent from a brand hex color */
function deriveMobileBrandTheme(primaryColor: string | null | undefined) {
  const DEFAULT = { bg: '#0f0a1e', bgHsl: '260 45% 8%', accent: '#a855f7', border: 'rgba(168,85,247,0.2)', accentAlpha: 'rgba(168,85,247,0.15)' };
  if (!primaryColor) return DEFAULT;
  try {
    const [h, s] = hexToHsl(primaryColor);
    // Very dark bg: keep brand hue, reduce saturation slightly, very low lightness
    const bgHsl = `${h} ${Math.max(20, Math.round(s * 0.6))}% 9%`;
    // Accent: keep brand hue but brighten for contrast
    const accentHsl = `hsl(${h}, ${Math.min(90, s + 10)}%, 65%)`;
    const borderAlpha = `hsla(${h}, ${s}%, 65%, 0.22)`;
    const accentAlpha = `hsla(${h}, ${s}%, 65%, 0.15)`;
    return { bg: `hsl(${bgHsl})`, bgHsl, accent: accentHsl, border: borderAlpha, accentAlpha };
  } catch {
    return DEFAULT;
  }
}

function VinceHome() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [activeView, setActiveView] = useState<'chat' | 'gallery' | 'brand' | 'prompts' | 'media'>('chat');
  const [visitedViews, setVisitedViews] = useState<Set<string>>(new Set(['chat']));
  const [chatKey, setChatKey] = useState(0);

  function navigateTo(view: 'chat' | 'gallery' | 'brand' | 'prompts' | 'media') {
    setVisitedViews(prev => new Set([...prev, view]));
    setActiveView(view);
  }

  useEffect(() => {
    async function fetchBrands() {
      const { data, error } = await supabase
        .from('creative_studio_brands')
        .select('id, name, primary_color, logo_url')
        .order('name');

      if (error) {
        console.error('[Vince Mobile] Failed to fetch brands:', error);
      } else {
        setBrands(data || []);
        // Auto-select first brand if available
        if (data && data.length > 0 && !selectedBrandId) {
          setSelectedBrandId(data[0].id);
        }
      }
      setLoadingBrands(false);
    }
    fetchBrands();
  }, []);

  const selectedBrand = useMemo(
    () => brands.find(b => b.id === selectedBrandId),
    [brands, selectedBrandId]
  );

  const theme = useMemo(
    () => deriveMobileBrandTheme(selectedBrand?.primary_color),
    [selectedBrand?.primary_color]
  );

  const handleBrandCreated = useCallback((brandId: string) => {
    setSelectedBrandId(brandId);
    // Refresh brand list
    supabase
      .from('creative_studio_brands')
      .select('id, name, primary_color, logo_url')
      .order('name')
      .then(({ data }) => {
        if (data) setBrands(data);
      });
  }, []);

  if (loadingBrands) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0f0a1e',
      }}>
        <style>{`@keyframes blLoadSpin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          width: 28,
          height: 28,
          border: '3px solid #1e1632',
          borderTopColor: '#a855f7',
          borderRadius: '50%',
          animation: 'blLoadSpin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      display: 'flex',
      flexDirection: 'column',
      background: theme.bg,
      // Override Tailwind's --background so BrandAgentApp inherits the brand color
      ['--background' as string]: theme.bgHsl,
    }}>
      {/* Top bar — brand picker + new chat button, always visible */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6px)',
        background: theme.bg,
        borderBottom: `1px solid ${theme.border}`,
        flexShrink: 0,
      }}>
        {/* Brand pills — scrollable */}
        <div style={{ flex: 1, display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
          {brands.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBrandId(b.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                borderRadius: 20,
                border: b.id === selectedBrandId
                  ? `1.5px solid ${theme.accent}`
                  : '1px solid rgba(255,255,255,0.1)',
                background: b.id === selectedBrandId ? theme.accentAlpha : 'transparent',
                color: b.id === selectedBrandId ? '#e0e0e0' : '#9ca3af',
                fontSize: 12,
                fontWeight: b.id === selectedBrandId ? 600 : 400,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: b.primary_color || '#a855f7' }} />
              {b.name}
            </button>
          ))}
        </div>
        {/* Sign out */}
        <button
          onClick={() => supabase.auth.signOut()}
          title="Sign out"
          style={{
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            padding: '4px 2px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Sign out
        </button>
        {/* New chat button */}
        {activeView === 'chat' && (
          <button
            onClick={() => { setChatKey(k => k + 1); }}
            title="New chat"
            style={{
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        )}
      </div>

      {/* Main content — tabs lazy-mount on first visit */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'hidden', display: activeView === 'chat' ? 'flex' : 'none', flexDirection: 'column' }}>
          <BrandAgentApp
            key={chatKey}
            brandId={selectedBrandId}
            brandName={selectedBrand?.name || 'Vince'}
            brandColor={theme.accent}
            source="mobile"
            onBrandCreated={handleBrandCreated}
          />
        </div>
        {visitedViews.has('gallery') && (
          <div style={{ flex: 1, overflow: 'hidden', display: activeView === 'gallery' ? 'flex' : 'none', flexDirection: 'column' }}>
            <CreationsTab brandId={selectedBrandId} brandColor={selectedBrand?.primary_color || undefined} background={theme.bg} />
          </div>
        )}
        {visitedViews.has('media') && (
          <div style={{ flex: 1, overflow: 'hidden', display: activeView === 'media' ? 'flex' : 'none', flexDirection: 'column' }}>
            <CompactMediaGrid background={theme.bg} />
          </div>
        )}
        {visitedViews.has('brand') && (
          <div style={{ flex: 1, overflow: 'hidden', display: activeView === 'brand' ? 'flex' : 'none', flexDirection: 'column' }}>
            <BrandDNATab brandId={selectedBrandId} brandColor={theme.accent} />
          </div>
        )}
        {visitedViews.has('prompts') && (
          <div style={{ flex: 1, overflow: 'hidden', display: activeView === 'prompts' ? 'flex' : 'none', flexDirection: 'column' }}>
            <PromptsTab brandId={selectedBrandId} brandName={selectedBrand?.name} brandColor={theme.accent} />
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <div style={{
        display: 'flex',
        borderTop: `1px solid ${theme.border}`,
        background: theme.bg,
        flexShrink: 0,
        minHeight: 49,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {(['chat', 'prompts', 'gallery', 'media', 'brand'] as const).map(view => (
          <button
            key={view}
            onClick={() => navigateTo(view)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: activeView === view ? theme.accent : 'rgba(255,255,255,0.35)',
              fontSize: 10,
              fontWeight: activeView === view ? 600 : 400,
              fontFamily: 'system-ui, sans-serif',
              gap: 3,
            }}
          >
            {view === 'chat' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            ) : view === 'gallery' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            ) : view === 'brand' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
              </svg>
            ) : view === 'prompts' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="3" width="6" height="18" rx="1"/><rect x="16" y="3" width="6" height="18" rx="1"/>
              </svg>
            )}
            {view === 'chat' ? 'Vince' : view === 'brand' ? 'Brand' : view === 'prompts' ? 'Prompts' : view === 'gallery' ? 'Campaigns' : 'Media'}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MobileApp() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  // Hide the native Capacitor splash overlay as soon as this component mounts.
  // This must live here (not in MobileSplash) so it fires even if a child crashes.
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MobileErrorBoundary>
          {!splashDone && <MobileSplash onComplete={handleSplashComplete} />}
          <AuthGate>
            <AuthProvider>
              <MemoryRouter>
                <VinceHome />
              </MemoryRouter>
            </AuthProvider>
          </AuthGate>
        </MobileErrorBoundary>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
