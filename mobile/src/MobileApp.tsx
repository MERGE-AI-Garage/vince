// ABOUTME: Root component for the Vince mobile app (iOS)
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

function VinceHome() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [loadingBrands, setLoadingBrands] = useState(true);

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
      background: '#ffffff',
    }}>
      {/* Brand picker header */}
      {brands.length > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          paddingTop: 'max(env(safe-area-inset-top, 8px), 8px)',
          background: '#0f0a1e',
          borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          flexShrink: 0,
        }}>
          {brands.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBrandId(b.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 20,
                border: b.id === selectedBrandId
                  ? '1.5px solid #a855f7'
                  : '1px solid rgba(255,255,255,0.1)',
                background: b.id === selectedBrandId ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                color: b.id === selectedBrandId ? '#e0e0e0' : '#9ca3af',
                fontSize: 13,
                fontWeight: b.id === selectedBrandId ? 600 : 400,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: b.primary_color || '#a855f7',
              }} />
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Vince agent — full screen */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <BrandAgentApp
          brandId={selectedBrandId}
          brandName={selectedBrand?.name || 'Vince'}
          onBrandCreated={handleBrandCreated}
        />
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
