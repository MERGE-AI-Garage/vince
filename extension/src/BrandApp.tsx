// ABOUTME: Root component for the AI brand guidelines Chrome extension
// ABOUTME: Brand-adaptive header with 2-tab layout, auth gate, and error boundary

import React, { useState, useMemo } from 'react';
import { AuthGate } from './AuthGate';
import { PromptBuilderTab } from './tabs/PromptBuilderTab';
import { BrandKitTab } from './tabs/BrandKitTab';
import { LogosTab } from './tabs/LogosTab';
import { CreationsTab } from './tabs/CreationsTab';
import { ChatTab } from './chat/ChatTab';
import { useSiteDetection } from './hooks/useSiteDetection';
import { useBrands, type Brand } from './hooks/useBrands';
import { Wand2, BookOpen, MessageSquare, ChevronDown, Mic, MicOff, ArrowLeft, Image, Sparkles } from 'lucide-react';
import { useVinceVoice } from './hooks/useVinceVoice';
import { VoiceStrip } from './voice/VoiceStrip';

type TabId = 'prompt-builder' | 'brand-kit' | 'logos' | 'creations' | 'chat';

/** Derive header background (dark) and accent color from brand colors */
function deriveBrandTheme(brand: Brand | undefined) {
  if (!brand || brand.is_default) {
    return { headerBg: '#0d0d0d', accent: '#8b5cf6', dropdownBg: '#1a1a1a' };
  }

  const primary = brand.primary_color || '#333333';
  const secondary = brand.secondary_color || '#ffffff';

  // Determine which color is darker for the header background
  const primaryLum = luminance(primary);
  const secondaryLum = luminance(secondary);

  let headerBg: string;
  let accent: string;

  if (primaryLum < 0.15) {
    // Primary is already dark enough (T-Mobile black, TNF black, Vans black)
    headerBg = primary;
    accent = secondaryLum > 0.3 ? secondary : lighten(primary, 80);
  } else if (secondaryLum < 0.15) {
    // Secondary is dark (Sloan's #002742)
    headerBg = secondary;
    accent = primary;
  } else {
    // Neither is very dark — darken the primary
    headerBg = darken(primary, 60);
    accent = primaryLum > secondaryLum ? primary : secondary;
  }

  // Ensure accent is visible against the dark header
  const accentLum = luminance(accent);
  if (accentLum < 0.2) {
    accent = lighten(accent, 100);
  }

  const dropdownBg = lighten(headerBg, 15);

  return { headerBg, accent, dropdownBg };
}

function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function darken(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function lighten(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + amount);
  const g = Math.min(255, ((n >> 8) & 0xff) + amount);
  const b = Math.min(255, (n & 0xff) + amount);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

class ExtensionErrorBoundary extends React.Component<
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
    console.error('[BrandAI] Unhandled error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', background: '#0d0d0d', color: '#EAE8E3', fontFamily: 'Epilogue, system-ui, sans-serif', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#ef4444', marginBottom: '8px' }}>Something went wrong</p>
          <p style={{ fontSize: '12px', color: '#EAE8E3', opacity: 0.7, marginBottom: '16px', maxWidth: '280px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '8px 20px', borderRadius: '6px', border: '1px solid rgba(234, 232, 227, 0.2)', background: 'rgba(234, 232, 227, 0.1)', color: '#EAE8E3', fontSize: '13px', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function TabLayout() {
  const [activeTab, setActiveTab] = useState<TabId>('prompt-builder');
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const detectedPlatform = useSiteDetection();
  const { brands, selectedBrandId, setSelectedBrandId } = useBrands();

  const selectedBrand = brands.find(b => b.id === selectedBrandId);
  const theme = useMemo(() => deriveBrandTheme(selectedBrand), [selectedBrand]);
  const vince = useVinceVoice(selectedBrandId);

  const tabs: { id: TabId; label: string; icon: typeof Wand2 }[] = [
    { id: 'prompt-builder', label: 'Prompts', icon: Wand2 },
    { id: 'brand-kit', label: 'Brand', icon: BookOpen },
    { id: 'logos', label: 'Logos', icon: Image },
    { id: 'creations', label: 'Create', icon: Sparkles },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ];

  // Accent as rgba for transparent overlays
  const accentRgb = hexToRgb(theme.accent);
  const accentAlpha = (a: number) => `rgba(${accentRgb}, ${a})`;

  return (
    <div style={{ fontFamily: 'Epilogue, system-ui, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column', background: '#fafafa', color: '#111111' }}>
      {/* Header bar — two modes: full nav (tools) vs minimal chat header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: theme.headerBg,
        borderBottom: `1px solid ${accentAlpha(0.15)}`,
        transition: 'background 0.3s ease',
      }}>
        {activeTab === 'chat' ? (
          /* ── Chat mode: minimal header with back button ── */
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('prompt-builder')}
              title="Back to tools"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', borderRadius: '6px',
                border: `1px solid ${accentAlpha(0.2)}`, background: accentAlpha(0.07),
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <ArrowLeft size={13} style={{ color: 'rgba(234,232,227,0.6)' }} />
            </button>
            {/* Brand dot + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1, minWidth: 0 }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: selectedBrand?.primary_color || theme.accent, border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#EAE8E3', letterSpacing: '0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedBrand?.name || 'Vince'}
              </span>
            </div>
            {/* Mic control in chat header */}
            {vince.isReady && vince.voiceState !== 'idle' && (
              <button
                onClick={vince.toggleMute}
                title={vince.isMuted ? 'Unmute microphone' : 'Mute microphone'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '28px', height: '28px', borderRadius: '50%',
                  border: vince.isMuted ? '1.5px solid rgba(239,68,68,0.5)' : `1.5px solid ${accentAlpha(0.4)}`,
                  background: vince.isMuted ? 'rgba(239,68,68,0.12)' : accentAlpha(0.15),
                  cursor: 'pointer',
                }}
              >
                {vince.isMuted
                  ? <MicOff size={12} style={{ color: '#fca5a5' }} />
                  : <Mic size={12} style={{ color: theme.accent }} />
                }
              </button>
            )}
            {vince.isReady && vince.voiceState === 'idle' && (
              <button
                onClick={vince.startVoice}
                title="Talk to Vince"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '28px', height: '28px', borderRadius: '50%',
                  border: '1.5px solid rgba(234,232,227,0.2)',
                  background: 'rgba(234,232,227,0.06)',
                  cursor: 'pointer',
                }}
              >
                <Mic size={12} style={{ color: 'rgba(234,232,227,0.45)' }} />
              </button>
            )}
          </div>
        ) : (
          /* ── Tools mode: full brand picker + tabs ── */
          <>
            {/* Brand picker row */}
            {brands.length > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 12px',
                borderBottom: `1px solid ${accentAlpha(0.08)}`,
                position: 'relative',
              }}>
                <button
                  onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${accentAlpha(0.15)}`,
                    background: accentAlpha(0.06),
                    cursor: 'pointer',
                    fontFamily: 'Epilogue, system-ui, sans-serif',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Brand icon — prefer logo_mark_url (monogram), fall back to logo_url, then dot */}
                  {(selectedBrand?.logo_mark_url || selectedBrand?.logo_url) ? (
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '4px',
                      background: 'rgba(255,255,255,0.95)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', flexShrink: 0,
                    }}>
                      <img
                        src={selectedBrand.logo_mark_url || selectedBrand.logo_url!}
                        alt={selectedBrand.name}
                        style={{ maxWidth: '16px', maxHeight: '16px', objectFit: 'contain' }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: selectedBrand?.primary_color || theme.accent,
                      border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0,
                    }} />
                  )}
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#EAE8E3', letterSpacing: '0.01em' }}>
                    {selectedBrand?.name || 'Select brand'}
                  </span>
                  <ChevronDown size={10} style={{
                    color: 'rgba(234, 232, 227, 0.5)',
                    transform: brandDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease',
                  }} />
                </button>

                {brandDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                    minWidth: '180px', borderRadius: '8px',
                    border: `1px solid ${accentAlpha(0.15)}`,
                    background: theme.dropdownBg,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    overflow: 'hidden', zIndex: 50,
                  }}>
                    {brands.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => { setSelectedBrandId(brand.id); setBrandDropdownOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          width: '100%', padding: '8px 12px',
                          background: brand.id === selectedBrandId ? accentAlpha(0.1) : 'transparent',
                          border: 'none', borderBottom: `1px solid ${accentAlpha(0.06)}`,
                          cursor: 'pointer', fontFamily: 'Epilogue, system-ui, sans-serif',
                          transition: 'background 0.1s ease', textAlign: 'left',
                        }}
                        onMouseEnter={(e) => { if (brand.id !== selectedBrandId) e.currentTarget.style.background = accentAlpha(0.06); }}
                        onMouseLeave={(e) => { if (brand.id !== selectedBrandId) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: brand.primary_color || '#636466', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', fontWeight: brand.id === selectedBrandId ? 700 : 500, color: brand.id === selectedBrandId ? theme.accent : '#EAE8E3' }}>
                          {brand.name}
                        </span>
                        {brand.is_default && (
                          <span style={{ fontSize: '8px', fontWeight: 600, color: 'rgba(234,232,227,0.4)', background: 'rgba(234,232,227,0.08)', padding: '1px 5px', borderRadius: '4px', marginLeft: 'auto' }}>
                            Default
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center' }}>
              {/* Tabs — icon + label, compact for 5 tabs */}
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      title={tab.label}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        padding: '10px 0', background: 'none', border: 'none',
                        borderBottom: isActive ? `2px solid ${theme.accent}` : '2px solid transparent',
                        color: isActive ? theme.accent : 'rgba(234, 232, 227, 0.4)',
                        cursor: 'pointer', fontSize: '10px', fontWeight: isActive ? 700 : 500,
                        fontFamily: 'Epilogue, system-ui, sans-serif', transition: 'all 0.15s ease', letterSpacing: '0.01em',
                        minWidth: 0,
                      }}
                    >
                      <Icon size={12} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right side: platform badge + Vince mic */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px 0 4px' }}>
                {detectedPlatform && (() => {
                  const isGoogle = ['Gemini', 'AI Studio', 'NotebookLM'].includes(detectedPlatform);
                  const badgeColor = isGoogle ? '#4285F4' : theme.accent;
                  return (
                    <span style={{ fontSize: '9px', fontWeight: 700, color: badgeColor, background: `${badgeColor}18`, border: `1px solid ${badgeColor}30`, padding: '2px 7px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {detectedPlatform}
                    </span>
                  );
                })()}
                {vince.isReady && (
                  <button
                    onClick={() => vince.voiceState === 'idle' ? vince.startVoice() : vince.stopVoice()}
                    title={vince.voiceState === 'idle' ? 'Talk to Vince' : 'End voice session'}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '26px', height: '26px', borderRadius: '50%',
                      border: vince.voiceState !== 'idle' ? `1.5px solid ${theme.accent}` : '1.5px solid rgba(234, 232, 227, 0.2)',
                      background: vince.voiceState !== 'idle' ? accentAlpha(0.2) : 'rgba(234, 232, 227, 0.06)',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      animation: vince.voiceState === 'active' ? 'vinceMicPulse 2s ease-in-out infinite' : undefined,
                    }}
                  >
                    <Mic size={13} strokeWidth={2} style={{ color: vince.voiceState !== 'idle' ? theme.accent : 'rgba(234, 232, 227, 0.5)', transition: 'color 0.2s ease' }} />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tab content — ChatTab is always mounted to preserve history */}
      <div style={{ display: activeTab === 'chat' ? 'flex' : 'none', flex: 1, flexDirection: 'column', minHeight: 0, background: '#0d0d0d' }}>
        <ChatTab
          brandId={selectedBrandId}
          voiceState={vince.voiceState}
          isMuted={vince.isMuted}
          voiceTranscript={vince.transcript}
          voiceToolResults={vince.toolResults}
          volumeRef={vince.volumeRef}
          onStartVoice={vince.startVoice}
          onStopVoice={vince.stopVoice}
          onToggleMute={vince.toggleMute}
        />
      </div>
      <div style={{ display: activeTab !== 'chat' ? 'flex' : 'none', flex: 1, overflowY: activeTab === 'logos' || activeTab === 'creations' ? 'hidden' : 'auto', flexDirection: 'column', background: '#fafafa', color: '#111111', paddingBottom: vince.voiceState !== 'idle' ? '180px' : 0 }}>
        {activeTab === 'prompt-builder' && (
          <PromptBuilderTab
            detectedPlatform={detectedPlatform}
            brandId={selectedBrandId}
            brandName={selectedBrand?.name}
            brandColor={selectedBrand?.primary_color}
            brandLogoUrl={selectedBrand?.logo_url}
            isDefaultBrand={!!selectedBrand?.is_default}
          />
        )}
        {activeTab === 'brand-kit' && <BrandKitTab brandId={selectedBrandId} isDefaultBrand={!!selectedBrand?.is_default} brandName={selectedBrand?.name} />}
        {activeTab === 'logos' && <LogosTab brandId={selectedBrandId} brandColor={selectedBrand?.primary_color || undefined} />}
        {activeTab === 'creations' && <CreationsTab brandId={selectedBrandId} brandColor={selectedBrand?.primary_color || undefined} />}
      </div>

      {/* Vince voice strip — hidden on chat tab (voice is inline there) */}
      {vince.voiceState !== 'idle' && activeTab !== 'chat' && (
        <VoiceStrip
          voiceState={vince.voiceState}
          transcript={vince.transcript}
          toolResults={vince.toolResults}
          volumeRef={vince.volumeRef}
          onStop={vince.stopVoice}
          headerBg={theme.headerBg}
        />
      )}

      {/* Mic button pulse animation */}
      <style>{`
        @keyframes vinceMicPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.3); }
          50% { box-shadow: 0 0 0 4px rgba(139, 92, 246, 0); }
        }
      `}</style>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  return `${(n >> 16) & 0xff}, ${(n >> 8) & 0xff}, ${n & 0xff}`;
}

export function BrandApp() {
  return (
    <ExtensionErrorBoundary>
      <AuthGate>
        <TabLayout />
      </AuthGate>
    </ExtensionErrorBoundary>
  );
}
