// ABOUTME: Dynamic brand guidelines renderer for non-MERGE brands
// ABOUTME: Renders sections adaptively based on available profile data from Creative Studio

import { useState } from 'react';
import { Loader2, ExternalLink, Globe, Palette, Type, Eye, Camera, Layout, MessageSquare, Heart, Building2, Copy, Check, ChevronDown, Image, Download, PenTool, BookOpen, Landmark } from 'lucide-react';
import type { BrandGuidelinesData } from '../hooks/useBrandGuidelines';
import { LogoCard } from './components/LogoCard';
import { ColorCard } from './components/ColorCard';

interface DynamicBrandKitProps {
  data: BrandGuidelinesData;
}

/** Reusable section sub-heading */
function Heading({ children, sub, accent }: { children: React.ReactNode; sub?: boolean; accent?: string }) {
  return (
    <h3 style={{
      fontFamily: 'Epilogue, system-ui, sans-serif',
      fontSize: sub ? '13px' : '18px',
      fontWeight: sub ? 700 : 800,
      color: sub ? (accent || '#374151') : '#111111',
      margin: '0 0 10px',
      lineHeight: 1.3,
      letterSpacing: sub ? '0.06em' : '-0.01em',
      textTransform: sub ? 'uppercase' : undefined,
    }}>
      {children}
    </h3>
  );
}

/** Card wrapper */
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: '10px',
      background: '#ffffff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.06)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: '2px', background: 'rgba(0,0,0,0.04)' }} />;
}

/**
 * Full-bleed section header band in brand primary color.
 * Uses negative margins to break out of the section's padding,
 * creating a dramatic colored stripe at the top of each section.
 */
function SectionHeader({ icon: Icon, label, accent = '#374151' }: { icon: typeof Palette; label: string; accent?: string }) {
  return (
    <div style={{
      background: accent,
      margin: '-28px -22px 24px -22px',
      padding: '16px 22px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <Icon size={16} style={{ color: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />
      <h2 style={{
        fontFamily: 'Epilogue, system-ui, sans-serif',
        fontSize: '18px',
        fontWeight: 800,
        color: '#ffffff',
        margin: 0,
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
      }}>
        {label}
      </h2>
    </div>
  );
}

/** Clickable color swatch that copies hex to clipboard */
function ColorSwatch({ hex, label, size = 'normal' }: { hex: string; label?: string; size?: 'normal' | 'large' }) {
  const [copied, setCopied] = useState(false);
  const isLarge = size === 'large';

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may not be available in extension context
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        flex: isLarge ? 1 : undefined,
      }}
      title={`Copy ${hex}`}
    >
      <div style={{
        width: isLarge ? '100%' : '40px',
        height: isLarge ? '48px' : '40px',
        borderRadius: '8px',
        background: hex,
        border: '1px solid rgba(0,0,0,0.1)',
        marginBottom: '3px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.1s ease, box-shadow 0.1s ease',
      }}>
        {copied && (
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '4px',
            padding: '2px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
          }}>
            <Check size={8} style={{ color: '#fff' }} />
            <span style={{ fontSize: '8px', fontWeight: 600, color: '#fff' }}>Copied</span>
          </div>
        )}
      </div>
      {label && (
        <div style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center' }}>
          {label}
        </div>
      )}
      <div style={{ fontFamily: 'monospace', fontSize: isLarge ? '9px' : '8px', color: '#9ca3af' }}>{hex}</div>
    </button>
  );
}

// ── Section renderers ──

function HeroSection({ data }: DynamicBrandKitProps) {
  const { brand, profile } = data;
  const identity = profile?.brand_identity;
  const primaryColor = brand.primary_color || '#111111';
  const secondaryColor = brand.secondary_color || '#111111';
  const heroTextColor = getContrastText(primaryColor);

  return (
    <section style={{
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, 20)} 100%)`,
      padding: '32px 16px 24px',
      textAlign: 'center',
      color: getContrastText(primaryColor),
    }}>
      {/* Brand logo in white box */}
      {brand.logo_url && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 16px',
          background: '#ffffff',
          borderRadius: '10px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        }}>
          <img
            src={brand.logo_url}
            alt={brand.name}
            style={{ maxHeight: '36px', maxWidth: '120px', objectFit: 'contain', display: 'block' }}
          />
        </div>
      )}

      {/* Tagline — split on period+space for two-line display */}
      {identity?.tagline && (
        <div style={{
          fontFamily: 'Epilogue, system-ui, sans-serif',
          fontSize: '22px',
          fontWeight: 800,
          lineHeight: 1.25,
          marginBottom: '10px',
          letterSpacing: '-0.02em',
          color: heroTextColor,
          whiteSpace: 'pre-line',
        }}>
          {identity.tagline.replace(/\.\s+/g, '.\n')}
        </div>
      )}

      {/* Description */}
      {brand.description && (
        <div style={{ fontSize: '13px', lineHeight: 1.6, opacity: 0.85, maxWidth: '320px', margin: '0 auto', color: heroTextColor }}>
          {brand.description}
        </div>
      )}

      {/* Website link */}
      {brand.website_url && (
        <a
          href={brand.website_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '12px',
            fontSize: '10px',
            fontWeight: 600,
            color: heroTextColor,
            opacity: 0.7,
            textDecoration: 'none',
          }}
        >
          <Globe size={10} />
          {brand.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          <ExternalLink size={8} />
        </a>
      )}
    </section>
  );
}

function LogosSection({ data }: DynamicBrandKitProps) {
  const { brand, profile } = data;
  const primaryColor = brand.primary_color || '#111111';
  const logoSystem = profile?.brand_standards?.logo_system;
  const logoDescription = logoSystem?.primary?.description || profile?.brand_identity?.logo_description;

  // In Guidelines, only show the primary wordmark + first monogram — full library lives in the Logos tab
  const allLogos = data.brand_logos && data.brand_logos.length > 0
    ? data.brand_logos
    : brand.logo_url
      ? [{ id: 'default', url: brand.logo_url, is_default: true, variant: null, lockup: null, background: null, notes: null, sort_order: 0 }]
      : [];

  const primary = allLogos.find(l => l.is_default);
  const monogram = allLogos.find(l => !l.is_default && l.lockup === 'monogram');
  const logos = [primary, monogram].filter((l): l is typeof allLogos[0] => !!l);

  if (logos.length === 0) return null;

  // Neutral backgrounds work for any logo type — avoid using brand primary
  // since brand logos often contain that color and become illegible
  const bgVariants = [
    { bgColor: '#ffffff', label: 'On White' },
    { bgColor: '#f5f5f5', label: 'On Light' },
    { bgColor: '#111111', label: 'On Dark' },
  ];

  function logoGroupLabel(logo: typeof logos[0], index: number): string {
    if (logo.is_default) return 'Primary Wordmark';
    // Special-case known lockup types for cleaner labels
    if (logo.lockup === 'monogram') return 'Monogram / Lettermark';
    if (logo.lockup === 'stacked') return 'Stacked Lockup';
    const parts: string[] = [];
    if (logo.lockup) parts.push(logo.lockup.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    if (logo.variant) parts.push(logo.variant.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    return parts.length > 0 ? parts.join(' · ') : `Logo Variant ${index + 1}`;
  }

  return (
    <section style={{ padding: '28px 22px' }}>
      <SectionHeader icon={Image} label="Logos" accent={primaryColor} />

      {logos.map((logo, i) => (
        <div key={logo.id} style={{ marginBottom: i < logos.length - 1 ? '20px' : '0' }}>
          {/* Group heading */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1f2937' }}>{logoGroupLabel(logo, i)}</span>
              {logo.is_default && (
                <span style={{ fontSize: '9px', fontWeight: 600, background: `${primaryColor}18`, color: primaryColor, padding: '2px 6px', borderRadius: '999px' }}>Default</span>
              )}
            </div>
            <a href={logo.url} download target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 600, color: primaryColor, textDecoration: 'none', opacity: 0.8 }}>
              <Download size={11} />
              Download
            </a>
          </div>

          {logo.notes && (
            <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 8px', lineHeight: 1.4 }}>{logo.notes}</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {bgVariants.map(({ bgColor, label }) => (
              <LogoCard key={bgColor} src={logo.url} alt={`${brand.name} — ${logoGroupLabel(logo, i)}`} label={label} bgColor={bgColor} downloadUrl={logo.url} />
            ))}
          </div>
        </div>
      ))}

      {/* Primary logo usage guidelines */}
      {(logoDescription || logoSystem?.primary?.clear_space || logoSystem?.primary?.minimum_size) && (
        <Card style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: primaryColor, marginBottom: '6px' }}>
            Primary Wordmark Guidelines
          </div>
          {logoDescription && (
            <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: '0 0 8px' }}>{logoDescription}</p>
          )}
          {logoSystem?.primary?.clear_space && (
            <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '3px' }}>
              <span style={{ fontWeight: 600, color: '#1f2937' }}>Clear space: </span>{logoSystem.primary.clear_space}
            </div>
          )}
          {logoSystem?.primary?.minimum_size && (
            <div style={{ fontSize: '10px', color: '#6b7280' }}>
              <span style={{ fontWeight: 600, color: '#1f2937' }}>Min size: </span>
              {logoSystem.primary.minimum_size.digital && `${logoSystem.primary.minimum_size.digital} digital`}
              {logoSystem.primary.minimum_size.digital && logoSystem.primary.minimum_size.print && ' · '}
              {logoSystem.primary.minimum_size.print && `${logoSystem.primary.minimum_size.print} print`}
            </div>
          )}
        </Card>
      )}

      {/* Monogram / Lettermark */}
      {logoSystem?.monogram && (
        <Card style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '6px' }}>
            Monogram / Lettermark
          </div>
          {logoSystem.monogram.description && (
            <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: '0 0 4px' }}>{logoSystem.monogram.description}</p>
          )}
          {logoSystem.monogram.usage && (
            <p style={{ fontSize: '10px', color: '#6b7280', margin: 0 }}>{logoSystem.monogram.usage}</p>
          )}
          {logoSystem.monogram.variants && logoSystem.monogram.variants.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
              {logoSystem.monogram.variants.map((v) => (
                <span key={v} style={{ fontSize: '9px', fontWeight: 600, background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: '4px', color: '#6b7280' }}>{v}</span>
              ))}
            </div>
          )}
        </Card>
      )}
    </section>
  );
}

function CorporateProfileSection({ data }: DynamicBrandKitProps) {
  const { brand, profile } = data;
  const primaryColor = brand.primary_color || '#8b5cf6';
  const story = profile?.brand_story;
  const mv = story?.mission_vision;
  const cp = story?.competitive_position;

  const sourceMeta = profile?.source_metadata as Record<string, unknown> | undefined;
  const confidence = profile?.confidence_score ?? 0;
  const totalAnalyses = (sourceMeta?.total_analyses as number) || 0;
  const confidenceLabel = confidence >= 0.8 ? 'High' : confidence >= 0.5 ? 'Moderate' : 'Building';
  const confidenceColor = confidence >= 0.8 ? '#22c55e' : confidence >= 0.5 ? '#f59e0b' : '#6b7280';
  const categoryLabel = brand.brand_category
    ? brand.brand_category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null;

  return (
    <section style={{ padding: '28px 22px' }}>
      <SectionHeader icon={Building2} label="Corporate Profile" accent={primaryColor} />

      {/* Narrative overview */}
      {story?.narrative_summary && (
        <div style={{ background: primaryColor, borderRadius: '10px', padding: '20px 22px', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', lineHeight: 1.7, color: getContrastText(primaryColor), margin: 0, opacity: 0.95 }}>
            {story.narrative_summary}
          </p>
        </div>
      )}

      {/* Mission + Vision */}
      {(mv?.mission || mv?.vision) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          {mv?.mission && (
            <Card style={{ borderLeft: `3px solid ${primaryColor}` }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: primaryColor, marginBottom: '4px' }}>Mission</div>
              <p style={{ fontSize: '12px', lineHeight: 1.4, color: '#1f2937', margin: 0 }}>{mv.mission}</p>
            </Card>
          )}
          {mv?.vision && (
            <Card style={{ borderLeft: `3px solid ${primaryColor}40` }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>Vision</div>
              <p style={{ fontSize: '12px', lineHeight: 1.4, color: '#1f2937', margin: 0 }}>{mv.vision}</p>
            </Card>
          )}
        </div>
      )}

      {/* Purpose */}
      {mv?.purpose && (
        <Card style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>Purpose</div>
          <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{mv.purpose}</p>
        </Card>
      )}

      {/* Market position */}
      {cp?.market_position && (
        <Card style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>Market Position</div>
          <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{cp.market_position}</p>
        </Card>
      )}

      {/* Key differentiators */}
      {cp?.key_differentiators && cp.key_differentiators.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <Heading sub accent={primaryColor}>Key Differentiators</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
            {cp.key_differentiators.map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '10px', lineHeight: 1.4 }}>
                <span style={{ color: primaryColor, fontWeight: 700, flexShrink: 0 }}>·</span>
                <span style={{ color: '#1f2937' }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitive landscape */}
      {story?.competitive_position?.awards && story.competitive_position.awards.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <Heading sub accent={primaryColor}>Awards & Recognition</Heading>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
            {story.competitive_position.awards.map((a, i) => (
              <span key={i} style={{ fontSize: '9px', fontWeight: 600, background: `${primaryColor}10`, color: primaryColor, padding: '3px 8px', borderRadius: '4px' }}>{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Per-vertical competitive landscape */}
      {profile?.brand_standards?.competitive_landscape?.per_vertical && profile.brand_standards.competitive_landscape.per_vertical.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <Heading sub accent={primaryColor}>Competitive Landscape</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
            {profile.brand_standards.competitive_landscape.per_vertical.map((row, i) => (
              <Card key={i}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#1f2937', marginBottom: '4px' }}>{row.vertical}</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {row.competitors.map((c) => (
                    <span key={c} style={{ fontSize: '9px', background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: '4px', color: '#6b7280' }}>{c}</span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Metadata chips */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
        {categoryLabel && (
          <span style={{ fontSize: '9px', fontWeight: 600, background: `${primaryColor}12`, padding: '3px 8px', borderRadius: '4px', color: primaryColor }}>{categoryLabel}</span>
        )}
        <span style={{ fontSize: '9px', fontWeight: 600, background: `${confidenceColor}15`, padding: '3px 8px', borderRadius: '4px', color: confidenceColor }}>
          Confidence: {confidenceLabel}
        </span>
        {totalAnalyses > 0 && (
          <span style={{ fontSize: '9px', fontWeight: 600, background: 'rgba(0,0,0,0.04)', padding: '3px 8px', borderRadius: '4px', color: '#6b7280' }}>{totalAnalyses} sources analyzed</span>
        )}
      </div>
    </section>
  );
}

function BrandIdentitySection({ data }: DynamicBrandKitProps) {
  const identity = data.profile?.brand_identity;
  if (!identity) return null;
  const primaryColor = data.brand.primary_color || '#8b5cf6';

  const hasValues = identity.brand_values && identity.brand_values.length > 0;
  const hasMessaging = identity.messaging && identity.messaging.length > 0;

  return (
    <section style={{ padding: '28px 22px' }}>
      <SectionHeader icon={Heart} label="Brand Identity" accent={primaryColor} />

      {/* Positioning */}
      {identity.positioning && (
        <Card style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '4px' }}>
            Positioning
          </div>
          <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>
            {identity.positioning}
          </p>
        </Card>
      )}

      {/* Brand Aesthetic */}
      {identity.brand_aesthetic && (
        <Card style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '4px' }}>
            Aesthetic
          </div>
          <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>
            {identity.brand_aesthetic}
          </p>
        </Card>
      )}

      {/* Brand Values */}
      {hasValues && (
        <div style={{ marginTop: '20px' }}>
          <Heading sub accent={primaryColor}>Brand Values</Heading>
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {identity.brand_values!.map((value, i) => (
              <div key={value} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: `${primaryColor}30`,
                  lineHeight: 1,
                  fontFamily: 'Epilogue, system-ui, sans-serif',
                  minWidth: '36px',
                  letterSpacing: '-0.03em',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: primaryColor, lineHeight: 1.3, marginBottom: '2px' }}>
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Audience */}
      {identity.target_audience && (
        <Card style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '4px' }}>
            Target Audience
          </div>
          <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>
            {identity.target_audience}
          </p>
        </Card>
      )}

      {/* Key Messaging */}
      {hasMessaging && (
        <div style={{ marginTop: '12px' }}>
          <Heading sub accent={primaryColor}>Key Messaging</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            {identity.messaging!.map((msg, i) => (
              <Card key={i} style={{ borderLeft: `3px solid ${primaryColor}`, padding: '10px 12px' }}>
                <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{msg}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Logo Description */}
      {identity.logo_description && (
        <Card style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '4px' }}>
            Logo
          </div>
          <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>
            {identity.logo_description}
          </p>
        </Card>
      )}
    </section>
  );
}

function BrandVoiceSection({ data }: DynamicBrandKitProps) {
  const tov = data.profile?.tone_of_voice;
  const voiceText = data.brand.brand_voice;
  const smv = data.profile?.brand_standards?.social_media_voice;
  const primaryColor = data.brand.primary_color || '#8b5cf6';
  if (!tov && !voiceText && !smv) return null;

  return (
    <section style={{ padding: '28px 22px' }}>
      <SectionHeader icon={MessageSquare} label="Brand Voice" accent={primaryColor} />

      {/* Voice personality summary */}
      {voiceText && (
        <Card style={{ marginBottom: '10px' }}>
          <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#1f2937', margin: 0 }}>
            {voiceText}
          </p>
        </Card>
      )}

      {/* Tone dimensions */}
      {tov && (tov.formality || tov.personality || tov.energy) && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {tov.personality && (
            <Card style={{ flex: '1 1 100px' }}>
              <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', marginBottom: '3px' }}>Personality</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#1f2937' }}>{tov.personality}</div>
            </Card>
          )}
          {tov.formality && (
            <Card style={{ flex: '1 1 80px' }}>
              <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', marginBottom: '3px' }}>Formality</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#1f2937', textTransform: 'capitalize' }}>{tov.formality}</div>
            </Card>
          )}
          {tov.energy && (
            <Card style={{ flex: '1 1 80px' }}>
              <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', marginBottom: '3px' }}>Energy</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#1f2937', textTransform: 'capitalize' }}>{tov.energy}</div>
            </Card>
          )}
        </div>
      )}

      {/* Dos & Don'ts */}
      {tov && (tov.dos?.length || tov.donts?.length) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tov.dos && tov.dos.length > 0 && (
            <Card style={{ borderLeft: '3px solid #22c55e' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', marginBottom: '6px' }}>Do</div>
              {tov.dos.map((d, i) => (
                <p key={i} style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: i > 0 ? '4px 0 0' : 0 }}>{d}</p>
              ))}
            </Card>
          )}
          {tov.donts && tov.donts.length > 0 && (
            <Card style={{ borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: '6px' }}>Don't</div>
              {tov.donts.map((d, i) => (
                <p key={i} style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: i > 0 ? '4px 0 0' : 0 }}>{d}</p>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* Social Media Voice */}
      {smv && (
        <div style={{ marginTop: '16px' }}>
          <Heading sub accent={primaryColor}>Social Media</Heading>
          {smv.persona && (
            <Card style={{ marginTop: '8px', marginBottom: '8px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '3px' }}>Persona</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#1f2937' }}>{smv.persona}</div>
            </Card>
          )}
          {smv.voice_traits && smv.voice_traits.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
              {smv.voice_traits.map((t, i) => (
                <div key={i} style={{ fontSize: '10px', color: '#1f2937', lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 700, color: primaryColor }}>{t.name}: </span>
                  <span style={{ color: '#6b7280' }}>{t.description}</span>
                </div>
              ))}
            </div>
          )}
          {smv.content_types && smv.content_types.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {smv.content_types.map((ct) => (
                <span key={ct} style={{ fontSize: '9px', fontWeight: 600, background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: '4px', color: '#6b7280' }}>{ct}</span>
              ))}
            </div>
          )}
          {smv.hashtags && smv.hashtags.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {smv.hashtags.map((h) => (
                <span key={h} style={{ fontSize: '9px', fontWeight: 600, background: `${primaryColor}12`, color: primaryColor, padding: '2px 8px', borderRadius: '4px' }}>{h}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function VisualDNASection({ data }: DynamicBrandKitProps) {
  const dna = data.profile?.visual_dna;
  if (!dna || Object.keys(dna).length === 0) return null;
  const primaryColor = data.brand.primary_color || '#8b5cf6';

  const signatureStyle = dna.signature_style as string | undefined;
  const visualPrinciples = dna.visual_principles as string[] | undefined;
  const keyDifferentiators = dna.key_differentiators as string[] | undefined;
  const dos = dna.dos as string[] | undefined;
  const donts = dna.donts as string[] | undefined;

  return (
    <section style={{ padding: '28px 22px' }}>
      <SectionHeader icon={Eye} label="Visual DNA" accent={primaryColor} />

      {/* Signature Style */}
      {signatureStyle && (
        <Card style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '4px' }}>
            Signature Style
          </div>
          <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#1f2937', margin: 0 }}>
            {signatureStyle}
          </p>
        </Card>
      )}

      {/* Visual Principles */}
      {visualPrinciples && visualPrinciples.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <Heading sub accent={primaryColor}>Visual Principles</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            {visualPrinciples.map((p, i) => (
              <Card key={i} style={{ borderLeft: `3px solid ${primaryColor}`, padding: '10px 12px' }}>
                <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{p}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Key Differentiators */}
      {keyDifferentiators && keyDifferentiators.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <Heading sub accent={primaryColor}>Key Differentiators</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            {keyDifferentiators.map((d, i) => (
              <Card key={i} style={{
                padding: '10px 12px',
                background: 'rgba(0,0,0,0.015)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: primaryColor,
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '1px',
                }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{d}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Visual Dos & Don'ts */}
      {(dos?.length || donts?.length) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {dos && dos.length > 0 && (
            <Card style={{ borderLeft: '3px solid #22c55e' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', marginBottom: '6px' }}>Do</div>
              {dos.map((d, i) => (
                <p key={i} style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: i > 0 ? '4px 0 0' : 0 }}>{d}</p>
              ))}
            </Card>
          )}
          {donts && donts.length > 0 && (
            <Card style={{ borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: '6px' }}>Don't</div>
              {donts.map((d, i) => (
                <p key={i} style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: i > 0 ? '4px 0 0' : 0 }}>{d}</p>
              ))}
            </Card>
          )}
        </div>
      )}
    </section>
  );
}

function ColorsSection({ data }: DynamicBrandKitProps) {
  const cp = data.profile?.color_profile;
  const bs = data.profile?.brand_standards;
  const colorGroups = bs?.color_system?.color_groups;
  const adaCompliance = bs?.color_system?.ada_compliance;
  const primaryColor = data.brand.primary_color || '#8b5cf6';
  const secondaryColor = data.brand.secondary_color;

  if (!cp && !colorGroups && !primaryColor) return null;

  return (
    <section style={{ padding: '28px 22px' }}>
      <SectionHeader icon={Palette} label="Colors" accent={primaryColor} />
      <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '-8px', marginBottom: '12px' }}>Tap a swatch to copy its hex code</p>

      {/* Brand colors (primary/secondary hero swatches) */}
      {(primaryColor || secondaryColor) && (
        <div style={{ marginBottom: '12px' }}>
          <Heading sub accent={primaryColor}>Brand Colors</Heading>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            {primaryColor && <ColorSwatch hex={primaryColor} label="Primary" size="large" />}
            {secondaryColor && <ColorSwatch hex={secondaryColor} label="Secondary" size="large" />}
          </div>
        </div>
      )}

      {/* Grouped named colors from brand_standards (richest data) */}
      {colorGroups && colorGroups.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {colorGroups.map((group) => (
            <div key={group.name} style={{ marginBottom: '16px' }}>
              <Heading sub accent={primaryColor}>{group.name}</Heading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                {group.colors.map((c) => (
                  <ColorCard
                    key={c.hex}
                    color={{
                      name: c.name || c.hex,
                      hex: c.hex,
                      pms: c.pms || '—',
                      cmyk: c.cmyk || '—',
                      rgb: c.rgb || '—',
                      uses: [],
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fallback: rich brand_colors from color_profile */}
      {!colorGroups && cp?.brand_colors && cp.brand_colors.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <Heading sub accent={primaryColor}>Color Palette</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            {cp.brand_colors.map((c) => (
              <ColorCard
                key={c.hex}
                color={{
                  name: c.name || c.hex,
                  hex: c.hex,
                  pms: c.pms || '—',
                  cmyk: c.cmyk || '—',
                  rgb: c.rgb || '—',
                  uses: c.uses || (c.role ? [c.role] : []),
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fallback: plain hex swatches */}
      {!colorGroups && (!cp?.brand_colors || cp.brand_colors.length === 0) && cp?.mandatory_colors && cp.mandatory_colors.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <Heading sub accent={primaryColor}>Required Colors</Heading>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            {cp.mandatory_colors.map((hex) => (
              <ColorSwatch key={hex} hex={hex} />
            ))}
          </div>
        </div>
      )}

      {/* Palette description */}
      {cp?.palette_relationships && (
        <Card style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '4px' }}>
            Palette Notes
          </div>
          <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{cp.palette_relationships}</p>
        </Card>
      )}

      {/* Forbidden Colors */}
      {cp?.forbidden_colors && cp.forbidden_colors.length > 0 && (
        <Card style={{ borderLeft: '3px solid #ef4444', marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: '6px' }}>
            Forbidden Colors
          </div>
          {cp.forbidden_colors.map((c, i) => (
            <p key={i} style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: i > 0 ? '4px 0 0' : 0 }}>{c}</p>
          ))}
        </Card>
      )}

      {/* ADA Compliance */}
      {adaCompliance && adaCompliance.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <Heading sub accent={primaryColor}>ADA Compliance</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            {adaCompliance.map((pair, i) => {
              const fail = pair.ratio === 'fail' || (pair.ratio && parseFloat(pair.ratio) < 4.5);
              const bg = pair.background || '#ffffff';
              const fg = pair.foreground || '#000000';
              return (
                <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
                  {/* Visual preview bar */}
                  <div style={{ background: bg, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: fg, fontSize: '14px', fontWeight: 700 }}>Sample Text</span>
                    <span style={{ color: fg, fontSize: '11px', opacity: 0.8, fontFamily: 'monospace' }}>{fg} on {bg}</span>
                  </div>
                  {/* Result bar */}
                  <div style={{ background: fail ? '#fef2f2' : '#f0fdf4', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: fail ? '#dc2626' : '#16a34a' }}>
                      {fail ? '✗ Fail' : '✓ Pass'}
                    </span>
                    {pair.level && <span style={{ fontSize: '11px', color: '#6b7280' }}>{pair.level}</span>}
                    {pair.ratio && pair.ratio !== 'fail' && <span style={{ fontSize: '11px', color: '#6b7280' }}>Contrast {pair.ratio}:1</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function TypographySection({ data }: DynamicBrandKitProps) {
  const typo = data.profile?.typography;
  const typoSystem = data.profile?.brand_standards?.typography_system;
  const primaryColor = data.brand.primary_color || '#8b5cf6';
  if (!typo && !typoSystem) return null;

  return (
    <section style={{ padding: '28px 22px', background: 'transparent' }}>
      <SectionHeader icon={Type} label="Typography" accent={primaryColor} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {typo.heading_font && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: primaryColor, color: '#fff' }}>
                Heading
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1f2937', letterSpacing: '0.01em' }}>
                {typo.heading_font}
              </span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 600, marginTop: '8px', fontFamily: `${typo.heading_font}, system-ui, sans-serif`, color: '#c8c6c1', lineHeight: 1.1 }}>
              Aa Bb Cc
            </div>
            <div style={{ fontSize: '12px', marginTop: '6px', fontFamily: `${typo.heading_font}, system-ui, sans-serif`, color: '#6b7280', lineHeight: 1.4 }}>
              ABCDEFGHIJKLMNOPQRSTUVWXYZ
            </div>
          </Card>
        )}

        {typo.body_font && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: '#6b7280', color: '#fff' }}>
                Body
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1f2937', letterSpacing: '0.01em' }}>
                {typo.body_font}
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 400, marginTop: '8px', fontFamily: `${typo.body_font}, system-ui, sans-serif`, color: '#c8c6c1', lineHeight: 1.1 }}>
              Aa Bb Cc
            </div>
            <div style={{ fontSize: '12px', marginTop: '6px', fontFamily: `${typo.body_font}, system-ui, sans-serif`, color: '#6b7280', lineHeight: 1.4 }}>
              abcdefghijklmnopqrstuvwxyz 0123456789
            </div>
          </Card>
        )}
      </div>

      {typo?.style_description && (
        <Card style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '4px' }}>
            Style Notes
          </div>
          <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>
            {typo.style_description}
          </p>
        </Card>
      )}

      {/* Font system details from brand_standards */}
      {(typoSystem?.primary_font || typoSystem?.secondary_font) && (
        <div style={{ marginTop: '12px' }}>
          <Heading sub accent={primaryColor}>Font System</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            {typoSystem?.primary_font && (
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1f2937' }}>{typoSystem.primary_font.name}</div>
                    {typoSystem.primary_font.usage && <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>{typoSystem.primary_font.usage}</div>}
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 600, background: `${primaryColor}18`, color: primaryColor, padding: '2px 8px', borderRadius: '999px' }}>Primary</span>
                </div>
                {typoSystem.primary_font.weights && typoSystem.primary_font.weights.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {typoSystem.primary_font.weights.map((w) => (
                      <span key={w} style={{ fontSize: '9px', background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: '4px', color: '#6b7280' }}>{w}</span>
                    ))}
                  </div>
                )}
              </Card>
            )}
            {typoSystem?.secondary_font && (
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1f2937' }}>{typoSystem.secondary_font.name}</div>
                    {typoSystem.secondary_font.usage && <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>{typoSystem.secondary_font.usage}</div>}
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 600, background: 'rgba(0,0,0,0.06)', color: '#6b7280', padding: '2px 8px', borderRadius: '999px' }}>Secondary</span>
                </div>
                {typoSystem.secondary_font.weights && typoSystem.secondary_font.weights.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {typoSystem.secondary_font.weights.map((w) => (
                      <span key={w} style={{ fontSize: '9px', background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: '4px', color: '#6b7280' }}>{w}</span>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Type hierarchy */}
      {typoSystem?.layout_hierarchy && typoSystem.layout_hierarchy.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <Heading sub accent={primaryColor}>Type Hierarchy</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
            {typoSystem.layout_hierarchy.map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', background: i % 2 === 0 ? '#f9f9f9' : '#fff', borderRadius: '6px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: primaryColor, minWidth: '24px' }}>{row.element}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#1f2937', flex: 1 }}>{row.font}</span>
                {row.color && <div style={{ width: '14px', height: '14px', background: row.color, borderRadius: '3px', border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Typography rules */}
      {typoSystem?.rules && typoSystem.rules.length > 0 && (
        <Card style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px' }}>Rules</div>
          {typoSystem.rules.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', fontSize: '10px', color: '#1f2937', lineHeight: 1.5, ...(i > 0 ? { marginTop: '4px' } : {}) }}>
              <span style={{ color: primaryColor, fontWeight: 700, flexShrink: 0 }}>·</span>
              <span>{r.text}</span>
            </div>
          ))}
        </Card>
      )}
    </section>
  );
}

function PhotographySection({ data }: DynamicBrandKitProps) {
  const photo = data.profile?.photography_style;
  const primaryColor = data.brand.primary_color || '#8b5cf6';
  if (!photo || Object.keys(photo).length === 0) return null;

  const specs = [
    { label: 'Lighting', value: photo.preferred_lighting as string },
    { label: 'Aperture', value: photo.preferred_aperture as string },
    { label: 'Focal Length', value: photo.preferred_focal_length as string },
    { label: 'Color Temperature', value: photo.preferred_color_temperature as string },
    { label: 'Depth of Field', value: photo.depth_of_field_preference as string },
    { label: 'Film Stock Feel', value: photo.film_stock_feel as string },
  ].filter(s => s.value);

  if (specs.length === 0) return null;

  return (
    <section style={{ padding: '28px 22px' }}>
      <SectionHeader icon={Camera} label="Photography Style" accent={primaryColor} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {specs.map(({ label, value }) => (
          <Card key={label}>
            <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '3px' }}>
              {label}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#1f2937', textTransform: 'capitalize' }}>
              {value.replace(/_/g, ' ')}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function CompositionSection({ data }: DynamicBrandKitProps) {
  const comp = data.profile?.composition_rules;
  const primaryColor = data.brand.primary_color || '#8b5cf6';
  if (!comp) return null;

  return (
    <section style={{ padding: '28px 22px' }}>
      <SectionHeader icon={Layout} label="Composition" accent={primaryColor} />

      {comp.aspect_ratio_preference && (
        <Card style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '3px' }}>
            Preferred Aspect Ratio
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>{comp.aspect_ratio_preference}</div>
        </Card>
      )}

      {comp.preferred_layouts && comp.preferred_layouts.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <Heading sub accent={primaryColor}>Layouts</Heading>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
            {comp.preferred_layouts.map((l) => (
              <span key={l} style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.03)',
                border: '1px solid rgba(0,0,0,0.07)',
                fontSize: '12px',
                fontWeight: 500,
                color: '#1f2937',
                textTransform: 'capitalize',
              }}>
                {l.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {comp.framing_conventions && comp.framing_conventions.length > 0 && (
        <div>
          <Heading sub accent={primaryColor}>Framing</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
            {comp.framing_conventions.map((f, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#1f2937', lineHeight: 1.5, paddingLeft: '8px', borderLeft: `2px solid ${primaryColor}40` }}>
                {f}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ProductCatalogSection({ data }: DynamicBrandKitProps) {
  const catalog = data.profile?.product_catalog;
  if (!catalog || Object.keys(catalog).length === 0) return null;
  const primaryColor = data.brand.primary_color || '#8b5cf6';

  const categories = Object.entries(catalog).map(([key, val]) => {
    const v = val as Record<string, unknown>;
    const name = (v.name as string) || key.replace(/_/g, ' ');
    const description = v.description as string | undefined;
    const products = v.products as Record<string, unknown> | undefined;
    const items = products
      ? Object.entries(products).map(([pKey, pVal]) => {
          const p = pVal as Record<string, unknown>;
          return { key: pKey, name: (p.name as string) || pKey.replace(/_/g, ' '), ...(p as Record<string, unknown>) };
        }).sort((a, b) => ((a.number as number) || 0) - ((b.number as number) || 0))
      : extractNestedItems(v);
    return { key, name, description, items };
  });

  return (
    <section style={{ padding: '28px 22px', background: 'transparent' }}>
      <SectionHeader icon={Package} label="Product Catalog" accent={primaryColor} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {categories.map(({ key, name, description, items }) => (
          <ProductCategoryCard
            key={key}
            name={name}
            description={description}
            items={items}
            primaryColor={primaryColor}
          />
        ))}
      </div>
    </section>
  );
}

/** Extract items from categories that use nested objects instead of a products map */
function extractNestedItems(category: Record<string, unknown>): Array<Record<string, unknown>> {
  const skip = new Set(['name', 'description', 'styling_rules', 'required_elements', 'forbidden_elements']);
  const items: Array<Record<string, unknown>> = [];
  for (const [key, val] of Object.entries(category)) {
    if (skip.has(key)) continue;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const v = val as Record<string, unknown>;
      items.push({ key, name: (v.name as string) || key.replace(/_/g, ' '), ...v });
    } else if (Array.isArray(val) && val.length > 0) {
      items.push({ key, name: key.replace(/_/g, ' '), items: val });
    }
  }
  return items;
}

function ProductCategoryCard({ name, description, items, primaryColor }: {
  name: string;
  description?: string;
  items: Array<Record<string, unknown>>;
  primaryColor: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasItems = items.length > 0;

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <button
        onClick={() => hasItems && setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '12px',
          background: 'none',
          border: 'none',
          cursor: hasItems ? 'pointer' : 'default',
          textAlign: 'left',
          fontFamily: 'Epilogue, system-ui, sans-serif',
          gap: '8px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937', textTransform: 'capitalize' }}>
            {name}
          </div>
          {description && (
            <p style={{ fontSize: '10px', lineHeight: 1.4, color: '#6b7280', margin: '3px 0 0' }}>
              {expanded ? description : (description.length > 120 ? description.slice(0, 120) + '...' : description)}
            </p>
          )}
        </div>
        {hasItems && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{
              fontSize: '9px',
              fontWeight: 600,
              color: primaryColor,
              background: `${primaryColor}15`,
              padding: '2px 8px',
              borderRadius: '4px',
            }}>
              {items.length}
            </span>
            <ChevronDown
              size={14}
              style={{
                color: '#6b7280',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s ease',
              }}
            />
          </div>
        )}
      </button>

      {expanded && hasItems && (
        <div style={{
          borderTop: '1px solid rgba(0,0,0,0.06)',
          padding: '8px',
          maxHeight: '400px',
          overflowY: 'auto',
        }}>
          {/* Compact 2-column grid for large lists (>12 items), single column for smaller */}
          {items.length > 12 ? (
            <CompactProductGrid items={items} primaryColor={primaryColor} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {items.map((item, i) => (
                <ProductItem key={item.key as string || i} item={item} primaryColor={primaryColor} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/** Compact 2-column grid for categories with many products (e.g., 25 product variants) */
function CompactProductGrid({ items, primaryColor }: { items: Array<Record<string, unknown>>; primaryColor: string }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const selectedItem = selectedIdx !== null ? items[selectedIdx] : null;

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4px',
      }}>
        {items.map((item, i) => {
          const name = item.name as string;
          const number = item.number as number | undefined;
          const isSelected = selectedIdx === i;
          return (
            <button
              key={item.key as string || i}
              onClick={() => setSelectedIdx(isSelected ? null : i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 8px',
                borderRadius: '5px',
                border: `1px solid ${isSelected ? primaryColor : 'rgba(0,0,0,0.06)'}`,
                background: isSelected ? `${primaryColor}10` : (i % 2 === 0 ? '#fff' : '#f5f5f5'),
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'Epilogue, system-ui, sans-serif',
                transition: 'all 0.1s ease',
              }}
            >
              {number !== undefined && (
                <span style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: primaryColor,
                  fontFamily: 'monospace',
                  flexShrink: 0,
                  minWidth: '18px',
                }}>
                  #{number}
                </span>
              )}
              <span style={{
                fontSize: '10px',
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? primaryColor : '#333',
                textTransform: 'capitalize',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail panel for the selected item */}
      {selectedItem && (
        <div style={{
          marginTop: '8px',
          padding: '10px',
          borderRadius: '6px',
          background: `${primaryColor}06`,
          border: `1px solid ${primaryColor}20`,
        }}>
          <CompactItemDetail item={selectedItem} primaryColor={primaryColor} />
        </div>
      )}
    </div>
  );
}

/** Detail view shown below the compact grid when an item is selected */
function CompactItemDetail({ item, primaryColor }: { item: Record<string, unknown>; primaryColor: string }) {
  const name = item.name as string;
  const number = item.number as number | undefined;
  const styling = item.styling as string | undefined;
  const protein = item.protein as string[] | undefined;
  const bread = item.bread as string | undefined;
  const cheese = item.cheese as string[] | null | undefined;
  const vegsSauce = item.vegs_sauce as string[] | undefined;
  const description = item.description as string | undefined;
  const itemsList = item.items as string[] | undefined;
  const types = item.types as string[] | undefined;
  const brands = item.brands as string[] | undefined;

  return (
    <div style={{ fontSize: '10px', lineHeight: 1.5, color: '#6b7280' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1f2937', marginBottom: '4px', textTransform: 'capitalize' }}>
        {number !== undefined && <span style={{ color: primaryColor, marginRight: '4px' }}>#{number}</span>}
        {name}
      </div>
      {description && <div style={{ marginBottom: '4px' }}>{description}</div>}
      {bread && <div><strong style={{ color: '#1f2937' }}>Bread:</strong> {bread}</div>}
      {protein && <div><strong style={{ color: '#1f2937' }}>Protein:</strong> {protein.join(', ')}</div>}
      {cheese && <div><strong style={{ color: '#1f2937' }}>Cheese:</strong> {cheese.join(', ')}</div>}
      {vegsSauce && <div><strong style={{ color: '#1f2937' }}>Toppings:</strong> {vegsSauce.join(', ')}</div>}
      {styling && (
        <div style={{
          marginTop: '4px',
          padding: '4px 8px',
          borderRadius: '4px',
          background: `${primaryColor}08`,
          borderLeft: `2px solid ${primaryColor}`,
          fontSize: '9px',
          color: '#555',
          fontStyle: 'italic',
        }}>
          {styling}
        </div>
      )}
      {(itemsList || types || brands) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
          {(itemsList || types || brands)!.map((t, i) => (
            <span key={i} style={{
              fontSize: '9px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(0,0,0,0.03)',
              border: '1px solid rgba(0,0,0,0.06)',
              color: '#1f2937',
            }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductItem({ item, primaryColor }: { item: Record<string, unknown>; primaryColor: string }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const name = item.name as string;
  const number = item.number as number | undefined;
  const styling = item.styling as string | undefined;
  const protein = item.protein as string[] | undefined;
  const bread = item.bread as string | undefined;
  const cheese = item.cheese as string[] | null | undefined;
  const vegsSauce = item.vegs_sauce as string[] | undefined;
  const description = item.description as string | undefined;
  const itemsList = item.items as string[] | undefined;
  const types = item.types as string[] | undefined;
  const brands = item.brands as string[] | undefined;

  const hasDetail = styling || protein || bread || description || itemsList || types || brands;

  return (
    <div
      style={{
        borderRadius: '6px',
        border: `1px solid ${detailOpen ? `${primaryColor}30` : 'rgba(0,0,0,0.08)'}`,
        background: detailOpen ? `${primaryColor}04` : '#fff',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
      }}
    >
      <button
        onClick={() => hasDetail && setDetailOpen(!detailOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '8px 10px',
          background: 'none',
          border: 'none',
          cursor: hasDetail ? 'pointer' : 'default',
          textAlign: 'left',
          fontFamily: 'Epilogue, system-ui, sans-serif',
          gap: '8px',
        }}
      >
        {number !== undefined && (
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            color: primaryColor,
            background: `${primaryColor}12`,
            padding: '1px 6px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            flexShrink: 0,
          }}>
            #{number}
          </span>
        )}
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#1f2937',
          flex: 1,
          textTransform: 'capitalize',
        }}>
          {name}
        </span>
        {hasDetail && (
          <ChevronDown
            size={10}
            style={{
              color: '#9ca3af',
              transform: detailOpen ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.15s ease',
              flexShrink: 0,
            }}
          />
        )}
      </button>

      {detailOpen && hasDetail && (
        <div style={{
          padding: '0 10px 8px',
          fontSize: '10px',
          lineHeight: 1.5,
          color: '#6b7280',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          {description && <div>{description}</div>}
          {bread && <div><strong style={{ color: '#1f2937' }}>Bread:</strong> {bread}</div>}
          {protein && <div><strong style={{ color: '#1f2937' }}>Protein:</strong> {protein.join(', ')}</div>}
          {cheese && <div><strong style={{ color: '#1f2937' }}>Cheese:</strong> {cheese.join(', ')}</div>}
          {vegsSauce && <div><strong style={{ color: '#1f2937' }}>Toppings:</strong> {vegsSauce.join(', ')}</div>}
          {styling && (
            <div style={{
              marginTop: '2px',
              padding: '4px 8px',
              borderRadius: '4px',
              background: `${primaryColor}08`,
              borderLeft: `2px solid ${primaryColor}`,
              fontSize: '9px',
              color: '#555',
              fontStyle: 'italic',
            }}>
              {styling}
            </div>
          )}
          {(itemsList || types || brands) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
              {(itemsList || types || brands)!.map((t, i) => (
                <span key={i} style={{
                  fontSize: '9px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(0,0,0,0.03)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  color: '#1f2937',
                }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WriterGuidelinesSection({ data }: DynamicBrandKitProps) {
  const wg = data.profile?.brand_standards?.writer_guidelines;
  const primaryColor = data.brand.primary_color || '#8b5cf6';
  if (!wg || (!wg.principles?.length && !wg.litmus_test)) return null;

  return (
    <section style={{ padding: '28px 22px' }}>
      <SectionHeader icon={PenTool} label="Writing Guidelines" accent={primaryColor} />

      {wg.litmus_test && (
        <Card style={{ marginBottom: '12px', background: `${primaryColor}08`, border: `1px solid ${primaryColor}20` }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: primaryColor, marginBottom: '4px' }}>Litmus Test</div>
          <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: 0, fontStyle: 'italic' }}>{wg.litmus_test}</p>
        </Card>
      )}

      {wg.principles && wg.principles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {wg.principles.map((p) => (
            <Card key={p.name}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: primaryColor, marginBottom: '4px' }}>{p.name}</div>
              <p style={{ fontSize: '12px', lineHeight: 1.4, color: '#1f2937', margin: '0 0 6px' }}>{p.description}</p>
              {(p.example_try || p.example_instead_of) && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {p.example_try && (
                    <div style={{ flex: 1, background: 'rgba(34,197,94,0.06)', borderRadius: '4px', padding: '4px 6px' }}>
                      <div style={{ fontSize: '8px', fontWeight: 700, color: '#22c55e', marginBottom: '1px' }}>✓ DO</div>
                      <div style={{ fontSize: '10px', color: '#1f2937' }}>{p.example_try}</div>
                    </div>
                  )}
                  {p.example_instead_of && (
                    <div style={{ flex: 1, background: 'rgba(239,68,68,0.06)', borderRadius: '4px', padding: '4px 6px' }}>
                      <div style={{ fontSize: '8px', fontWeight: 700, color: '#ef4444', marginBottom: '1px' }}>✗ NOT</div>
                      <div style={{ fontSize: '10px', color: '#1f2937' }}>{p.example_instead_of}</div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function BrandStorySection({ data }: DynamicBrandKitProps) {
  const story = data.profile?.brand_story;
  const primaryColor = data.brand.primary_color || '#8b5cf6';
  if (!story) return null;

  const hasContent = story.heritage?.founding_story || story.heritage?.legacy ||
    story.customer_focus?.promise || story.innovation?.approach ||
    story.sustainability?.goals?.length || story.culture ||
    story.community?.partnerships?.length ||
    (story.heritage?.milestones && story.heritage.milestones.length > 0);
  if (!hasContent) return null;

  // Glassmorphic card style for all story cards
  const glass: React.CSSProperties = {
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.9)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    borderRadius: '12px',
    padding: '14px 16px',
  };

  return (
    <section style={{ padding: '28px 22px' }}>
      <SectionHeader icon={BookOpen} label="Brand Story" accent={primaryColor} />

      {/* Brand Promise — featured full-width gradient callout */}
      {story.customer_focus?.promise && (
        <div style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, 30)} 100%)`,
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-20px', right: '-20px',
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }} />
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
            Brand Promise
          </div>
          <p style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.5, color: '#ffffff', margin: 0 }}>
            {story.customer_focus.promise}
          </p>
        </div>
      )}

      {/* Customer Experience */}
      {story.customer_focus?.experience && (
        <div style={{ ...glass, marginBottom: '10px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>Customer Experience</div>
          <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{story.customer_focus.experience}</p>
        </div>
      )}

      {/* Origin + Legacy — side-by-side when both present */}
      {(story.heritage?.founding_story || story.heritage?.legacy) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: story.heritage?.founding_story && story.heritage?.legacy ? '1fr 1fr' : '1fr',
          gap: '8px',
          marginBottom: '10px',
        }}>
          {story.heritage?.founding_story && (
            <div style={{ ...glass }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: primaryColor, marginBottom: '4px' }}>Origin</div>
              <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{story.heritage.founding_story}</p>
            </div>
          )}
          {story.heritage?.legacy && (
            <div style={{ ...glass }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>Legacy</div>
              <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{story.heritage.legacy}</p>
            </div>
          )}
        </div>
      )}

      {/* Innovation Approach + Technology — side-by-side when both present */}
      {(story.innovation?.approach || story.innovation?.technology) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: story.innovation?.approach && story.innovation?.technology ? '1fr 1fr' : '1fr',
          gap: '8px',
          marginBottom: '10px',
        }}>
          {story.innovation?.approach && (
            <div style={{ ...glass }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: primaryColor, marginBottom: '4px' }}>Innovation</div>
              <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{story.innovation.approach}</p>
            </div>
          )}
          {story.innovation?.technology && (
            <div style={{ ...glass }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>Technology</div>
              <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{story.innovation.technology}</p>
            </div>
          )}
        </div>
      )}

      {/* Innovation Differentiators — numbered glass cards */}
      {story.innovation?.differentiators && story.innovation.differentiators.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: primaryColor, marginBottom: '8px' }}>
            Innovation Differentiators
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {story.innovation.differentiators.map((d, i) => (
              <div key={i} style={{ ...glass, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  fontSize: '20px', fontWeight: 800,
                  color: hexToRgba(primaryColor, 0.25),
                  lineHeight: 1, fontFamily: 'Epilogue, system-ui, sans-serif',
                  minWidth: '30px', letterSpacing: '-0.03em', flexShrink: 0,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#1f2937', margin: 0, flex: 1 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Culture — glassmorphic cards */}
      {story.culture && (story.culture.dei || story.culture.values_in_practice || story.culture.employee_experience) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: primaryColor, marginBottom: '8px' }}>
            Culture & Values
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {story.culture.dei && (
              <div style={{ ...glass }}>
                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '3px' }}>Diversity & Inclusion</div>
                <p style={{ fontSize: '10px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{story.culture.dei}</p>
              </div>
            )}
            {story.culture.values_in_practice && (
              <div style={{ ...glass }}>
                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '3px' }}>Values in Practice</div>
                <p style={{ fontSize: '10px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{story.culture.values_in_practice}</p>
              </div>
            )}
            {story.culture.employee_experience && (
              <div style={{ ...glass }}>
                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '3px' }}>Employee Experience</div>
                <p style={{ fontSize: '10px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{story.culture.employee_experience}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sustainability — glassmorphic cards + green goal chips */}
      {story.sustainability && (story.sustainability.goals?.length || story.sustainability.environmental || story.sustainability.social || story.sustainability.governance) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#16a34a', marginBottom: '8px' }}>
            Sustainability
          </div>
          {story.sustainability.environmental && (
            <div style={{ ...glass, marginBottom: '6px', borderLeft: '3px solid #22c55e' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#16a34a', marginBottom: '3px' }}>Environmental</div>
              <p style={{ fontSize: '10px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{story.sustainability.environmental}</p>
            </div>
          )}
          {story.sustainability.social && (
            <div style={{ ...glass, marginBottom: '6px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '3px' }}>Social</div>
              <p style={{ fontSize: '10px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{story.sustainability.social}</p>
            </div>
          )}
          {story.sustainability.governance && (
            <div style={{ ...glass, marginBottom: '6px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '3px' }}>Governance</div>
              <p style={{ fontSize: '10px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{story.sustainability.governance}</p>
            </div>
          )}
          {story.sustainability.goals && story.sustainability.goals.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {story.sustainability.goals.map((g, i) => (
                <span key={i} style={{
                  fontSize: '10px', fontWeight: 600,
                  background: 'rgba(34,197,94,0.12)',
                  color: '#16a34a',
                  padding: '4px 10px', borderRadius: '999px',
                  border: '1px solid rgba(34,197,94,0.25)',
                }}>
                  ✓ {g}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Community — glass cards + brand-color partnership chips */}
      {story.community && (story.community.programs || story.community.impact_metrics || story.community.partnerships?.length) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: primaryColor, marginBottom: '8px' }}>
            Community & Partnerships
          </div>
          {story.community.programs && (
            <div style={{ ...glass, marginBottom: '6px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '3px' }}>Programs</div>
              <p style={{ fontSize: '10px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{story.community.programs}</p>
            </div>
          )}
          {story.community.impact_metrics && (
            <div style={{ ...glass, marginBottom: '6px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '3px' }}>Impact</div>
              <p style={{ fontSize: '10px', lineHeight: 1.5, color: '#1f2937', margin: 0 }}>{story.community.impact_metrics}</p>
            </div>
          )}
          {story.community.partnerships && story.community.partnerships.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {story.community.partnerships.map((p, i) => (
                <span key={i} style={{
                  fontSize: '10px', fontWeight: 600,
                  background: hexToRgba(primaryColor, 0.08),
                  color: primaryColor,
                  padding: '4px 10px', borderRadius: '999px',
                  border: `1px solid ${hexToRgba(primaryColor, 0.2)}`,
                }}>
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Key Milestones — vertical timeline with connector line */}
      {story.heritage?.milestones && story.heritage.milestones.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: primaryColor, marginBottom: '8px' }}>
            Key Milestones
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {story.heritage.milestones.slice(-10).map((m, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: '0', alignItems: 'stretch' }}>
                {/* Timeline track */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? primaryColor : hexToRgba(primaryColor, 0.4),
                    border: `2px solid ${primaryColor}`,
                    marginTop: '3px',
                  }} />
                  {i < arr.length - 1 && (
                    <div style={{
                      width: '2px', flex: 1, minHeight: '16px',
                      background: hexToRgba(primaryColor, 0.2),
                      margin: '2px 0',
                    }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ flex: 1, paddingLeft: '10px', paddingBottom: i < arr.length - 1 ? '12px' : '0' }}>
                  <span style={{ fontSize: '12px', lineHeight: 1.5, color: '#1f2937' }}>{m}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function GlossarySection({ data }: DynamicBrandKitProps) {
  const glossary = data.profile?.brand_standards?.glossary;
  const primaryColor = data.brand.primary_color || '#8b5cf6';
  if (!glossary || glossary.length === 0) return null;

  return (
    <section style={{ padding: '28px 22px' }}>
      <SectionHeader icon={PenTool} label="Brand Terminology" accent={primaryColor} />
      <Card>
        <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '8px' }}>Preferred terms and approved replacements</div>
        {glossary.map((term, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', ...(i > 0 ? { marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(0,0,0,0.05)' } : {}) }}>
            <span style={{ fontWeight: 700, color: '#22c55e', flexShrink: 0 }}>✓</span>
            <span style={{ fontWeight: 600, color: '#1f2937', flex: 1 }}>{term.preferred}</span>
            <span style={{ color: '#9ca3af', flexShrink: 0 }}>replaces</span>
            <span style={{ color: '#ef4444', textDecoration: 'line-through', flex: 1, textAlign: 'right' }}>{term.replaces}</span>
          </div>
        ))}
      </Card>
    </section>
  );
}

function ProfileFooter({ data }: DynamicBrandKitProps) {
  return (
    <div style={{ padding: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: '9px', color: '#9ca3af' }}>
        Powered by Creative Studio Brand Intelligence
      </div>
    </div>
  );
}

// ── Color utilities ──

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
  return `rgba(${(num >> 16) & 0xff}, ${(num >> 8) & 0xff}, ${num & 0xff}, ${alpha})`;
}

function adjustColor(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function getContrastText(hex: string): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#111111' : '#ffffff';
}

// ── Loading & empty states ──

export function DynamicBrandKitLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: '14px', background: '#f4f1ec', minHeight: '100vh' }}>
      <Loader2 size={24} style={{ color: '#9ca3af', animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '13px', color: '#9ca3af', letterSpacing: '0.01em' }}>Loading brand guidelines...</span>
    </div>
  );
}

export function DynamicBrandKitEmpty({ brandName }: { brandName?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center', background: '#f4f1ec', minHeight: '100vh' }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '14px',
        background: 'rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
      }}>
        <Eye size={24} style={{ color: '#9ca3af' }} />
      </div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
        No brand guidelines yet
      </div>
      <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, maxWidth: '240px', margin: 0 }}>
        {brandName || 'This brand'} hasn't been profiled yet. Use Creative Studio to analyze brand assets and build a visual profile.
      </p>
    </div>
  );
}

// ── Main component ──

export function DynamicBrandKit({ data }: DynamicBrandKitProps) {
  const p = data.brand.primary_color || '#8b5cf6';
  const tint = hexToRgba(p, 0.05);
  // Odd sections: white. Even sections: brand tint. Both have full-bleed section header bands.
  return (
    <div style={{ fontFamily: 'Epilogue, system-ui, sans-serif', background: '#efefed', minHeight: '100vh' }}>
      <HeroSection data={data} />
      <div style={{ background: '#ffffff', overflow: 'hidden' }}><CorporateProfileSection data={data} /></div>
      <div style={{ background: tint, overflow: 'hidden' }}><BrandIdentitySection data={data} /></div>
      <div style={{ background: '#ffffff', overflow: 'hidden' }}><BrandVoiceSection data={data} /></div>
      <div style={{ background: tint, overflow: 'hidden' }}><WriterGuidelinesSection data={data} /></div>
      <div style={{ background: '#ffffff', overflow: 'hidden' }}><GlossarySection data={data} /></div>
      <div style={{ background: tint, overflow: 'hidden' }}><VisualDNASection data={data} /></div>
      <div style={{ background: '#ffffff', overflow: 'hidden' }}><ColorsSection data={data} /></div>
      <div style={{ background: tint, overflow: 'hidden' }}><LogosSection data={data} /></div>
      <div style={{ background: '#ffffff', overflow: 'hidden' }}><TypographySection data={data} /></div>
      <div style={{ background: tint, overflow: 'hidden' }}><PhotographySection data={data} /><CompositionSection data={data} /></div>
      <div style={{ background: '#ffffff', backgroundImage: `radial-gradient(ellipse at top right, ${hexToRgba(p, 0.08)}, transparent 60%)`, overflow: 'hidden' }}><BrandStorySection data={data} /></div>
      <ProfileFooter data={data} />
    </div>
  );
}
