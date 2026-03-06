// ABOUTME: Dynamic brand guidelines renderer for non-MERGE brands
// ABOUTME: Renders sections adaptively based on available profile data from Creative Studio

import { useState } from 'react';
import { Loader2, ExternalLink, Globe, Palette, Type, Eye, Camera, Layout, Package, MessageSquare, Heart, Building2, Copy, Check, ChevronDown } from 'lucide-react';
import type { BrandGuidelinesData } from '../hooks/useBrandGuidelines';

interface DynamicBrandKitProps {
  data: BrandGuidelinesData;
}

/** Reusable section heading */
function Heading({ children, sub }: { children: React.ReactNode; sub?: boolean }) {
  return (
    <h2 style={{
      fontFamily: 'Epilogue, system-ui, sans-serif',
      fontSize: sub ? '14px' : '18px',
      fontWeight: sub ? 600 : 700,
      color: sub ? '#333' : '#133B34',
      margin: 0,
      lineHeight: 1.3,
    }}>
      {children}
    </h2>
  );
}

/** Card wrapper */
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid rgba(0,0,0,0.08)',
      background: '#fff',
      ...style,
    }}>
      {children}
    </div>
  );
}

/** Pill badge */
function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '999px',
      backgroundColor: color,
      color: '#fff',
      fontSize: '11px',
      fontWeight: 600,
    }}>
      {children}
    </span>
  );
}

function Divider() {
  return <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }} />;
}

/** Section icon + label header */
function SectionHeader({ icon: Icon, label }: { icon: typeof Palette; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        background: 'rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={14} style={{ color: '#636466' }} />
      </div>
      <Heading>{label}</Heading>
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
        <div style={{ fontSize: '10px', color: '#636466', textAlign: 'center' }}>
          {label}
        </div>
      )}
      <div style={{ fontFamily: 'monospace', fontSize: isLarge ? '9px' : '8px', color: '#999' }}>{hex}</div>
    </button>
  );
}

// ── Section renderers ──

function HeroSection({ data }: DynamicBrandKitProps) {
  const { brand, profile } = data;
  const identity = profile?.brand_identity;
  const primaryColor = brand.primary_color || '#133B34';
  const secondaryColor = brand.secondary_color || '#EAE8E3';

  return (
    <section style={{
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, 20)} 100%)`,
      padding: '32px 16px 24px',
      textAlign: 'center',
      color: getContrastText(primaryColor),
    }}>
      {/* Logo with white pill backdrop for visibility */}
      {brand.logo_url && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 24px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.95)',
          marginBottom: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <img
            src={brand.logo_url}
            alt={brand.name}
            style={{ height: '36px', maxWidth: '180px', objectFit: 'contain' }}
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
          />
        </div>
      )}

      {/* Tagline */}
      {identity?.tagline && (
        <div style={{
          fontFamily: 'Epilogue, system-ui, sans-serif',
          fontSize: '24px',
          fontWeight: 700,
          lineHeight: 1.2,
          marginBottom: '8px',
          letterSpacing: '-0.02em',
          color: secondaryColor,
        }}>
          {identity.tagline}
        </div>
      )}

      {/* Description */}
      {brand.description && (
        <div style={{ fontSize: '11px', lineHeight: 1.6, opacity: 0.85, maxWidth: '320px', margin: '0 auto' }}>
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
            color: secondaryColor,
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

function CorporateProfileSection({ data }: DynamicBrandKitProps) {
  const { brand, profile } = data;
  const sourceMeta = profile?.source_metadata as Record<string, unknown> | undefined;
  const confidence = profile?.confidence_score ?? 0;
  const totalAnalyses = (sourceMeta?.total_analyses as number) || 0;
  const websiteAnalyses = (sourceMeta?.website_analyses as number) || 0;
  const documentAnalyses = (sourceMeta?.document_analyses as number) || 0;
  const imageAnalyses = (sourceMeta?.image_analyses as number) || (profile?.total_images_analyzed ?? 0);
  const confidenceLabel = confidence >= 0.8 ? 'High' : confidence >= 0.5 ? 'Moderate' : 'Building';
  const confidenceColor = confidence >= 0.8 ? '#22c55e' : confidence >= 0.5 ? '#f59e0b' : '#636466';
  const categoryLabel = brand.brand_category
    ? brand.brand_category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null;

  return (
    <section style={{ padding: '16px' }}>
      <SectionHeader icon={Building2} label="Corporate Profile" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {categoryLabel && (
          <Card>
            <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: '#636466', marginBottom: '3px' }}>Category</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#133B34' }}>{categoryLabel}</div>
          </Card>
        )}
        <Card>
          <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: '#636466', marginBottom: '3px' }}>Confidence</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: confidenceColor }}>{confidenceLabel}</div>
        </Card>
        {totalAnalyses > 0 && (
          <Card>
            <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: '#636466', marginBottom: '3px' }}>Sources</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#133B34' }}>{totalAnalyses} analyzed</div>
          </Card>
        )}
        {(websiteAnalyses > 0 || documentAnalyses > 0 || imageAnalyses > 0) && (
          <Card>
            <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: '#636466', marginBottom: '3px' }}>Source Types</div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {websiteAnalyses > 0 && (
                <span style={{ fontSize: '9px', fontWeight: 600, background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', color: '#333' }}>
                  {websiteAnalyses} web
                </span>
              )}
              {documentAnalyses > 0 && (
                <span style={{ fontSize: '9px', fontWeight: 600, background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', color: '#333' }}>
                  {documentAnalyses} doc
                </span>
              )}
              {imageAnalyses > 0 && (
                <span style={{ fontSize: '9px', fontWeight: 600, background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', color: '#333' }}>
                  {imageAnalyses} img
                </span>
              )}
            </div>
          </Card>
        )}
      </div>
    </section>
  );
}

function BrandIdentitySection({ data }: DynamicBrandKitProps) {
  const identity = data.profile?.brand_identity;
  if (!identity) return null;
  const primaryColor = data.brand.primary_color || '#00856C';

  const hasValues = identity.brand_values && identity.brand_values.length > 0;
  const hasMessaging = identity.messaging && identity.messaging.length > 0;

  return (
    <section style={{ padding: '20px 16px' }}>
      <SectionHeader icon={Heart} label="Brand Identity" />

      {/* Positioning */}
      {identity.positioning && (
        <Card style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#636466', marginBottom: '4px' }}>
            Positioning
          </div>
          <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#133B34', margin: 0 }}>
            {identity.positioning}
          </p>
        </Card>
      )}

      {/* Brand Aesthetic */}
      {identity.brand_aesthetic && (
        <Card style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#636466', marginBottom: '4px' }}>
            Aesthetic
          </div>
          <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#133B34', margin: 0 }}>
            {identity.brand_aesthetic}
          </p>
        </Card>
      )}

      {/* Brand Values */}
      {hasValues && (
        <div style={{ marginTop: '12px' }}>
          <Heading sub>Brand Values</Heading>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {identity.brand_values!.map((value) => (
              <Badge key={value} color={primaryColor}>{value}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Target Audience */}
      {identity.target_audience && (
        <Card style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#636466', marginBottom: '4px' }}>
            Target Audience
          </div>
          <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#133B34', margin: 0 }}>
            {identity.target_audience}
          </p>
        </Card>
      )}

      {/* Key Messaging */}
      {hasMessaging && (
        <div style={{ marginTop: '12px' }}>
          <Heading sub>Key Messaging</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            {identity.messaging!.map((msg, i) => (
              <Card key={i} style={{ borderLeft: `3px solid ${primaryColor}`, padding: '10px 12px' }}>
                <p style={{ fontSize: '11px', lineHeight: 1.5, color: '#333', margin: 0 }}>{msg}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Logo Description */}
      {identity.logo_description && (
        <Card style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#636466', marginBottom: '4px' }}>
            Logo
          </div>
          <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#133B34', margin: 0 }}>
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
  if (!tov && !voiceText) return null;

  return (
    <section style={{ padding: '20px 16px' }}>
      <SectionHeader icon={MessageSquare} label="Brand Voice" />

      {/* Voice personality summary */}
      {voiceText && (
        <Card style={{ marginBottom: '10px' }}>
          <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#333', margin: 0 }}>
            {voiceText}
          </p>
        </Card>
      )}

      {/* Tone dimensions */}
      {tov && (tov.formality || tov.personality || tov.energy) && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {tov.personality && (
            <Card style={{ flex: '1 1 100px' }}>
              <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: '#636466', marginBottom: '3px' }}>Personality</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#133B34' }}>{tov.personality}</div>
            </Card>
          )}
          {tov.formality && (
            <Card style={{ flex: '1 1 80px' }}>
              <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: '#636466', marginBottom: '3px' }}>Formality</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#133B34', textTransform: 'capitalize' }}>{tov.formality}</div>
            </Card>
          )}
          {tov.energy && (
            <Card style={{ flex: '1 1 80px' }}>
              <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: '#636466', marginBottom: '3px' }}>Energy</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#133B34', textTransform: 'capitalize' }}>{tov.energy}</div>
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
                <p key={i} style={{ fontSize: '11px', lineHeight: 1.5, color: '#333', margin: i > 0 ? '4px 0 0' : 0 }}>{d}</p>
              ))}
            </Card>
          )}
          {tov.donts && tov.donts.length > 0 && (
            <Card style={{ borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: '6px' }}>Don't</div>
              {tov.donts.map((d, i) => (
                <p key={i} style={{ fontSize: '11px', lineHeight: 1.5, color: '#333', margin: i > 0 ? '4px 0 0' : 0 }}>{d}</p>
              ))}
            </Card>
          )}
        </div>
      )}
    </section>
  );
}

function VisualDNASection({ data }: DynamicBrandKitProps) {
  const dna = data.profile?.visual_dna;
  if (!dna || Object.keys(dna).length === 0) return null;
  const primaryColor = data.brand.primary_color || '#00856C';

  const signatureStyle = dna.signature_style as string | undefined;
  const visualPrinciples = dna.visual_principles as string[] | undefined;
  const keyDifferentiators = dna.key_differentiators as string[] | undefined;
  const dos = dna.dos as string[] | undefined;
  const donts = dna.donts as string[] | undefined;

  return (
    <section style={{ padding: '20px 16px' }}>
      <SectionHeader icon={Eye} label="Visual DNA" />

      {/* Signature Style */}
      {signatureStyle && (
        <Card style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#636466', marginBottom: '4px' }}>
            Signature Style
          </div>
          <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#333', margin: 0 }}>
            {signatureStyle}
          </p>
        </Card>
      )}

      {/* Visual Principles */}
      {visualPrinciples && visualPrinciples.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <Heading sub>Visual Principles</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            {visualPrinciples.map((p, i) => (
              <Card key={i} style={{ borderLeft: `3px solid ${primaryColor}`, padding: '10px 12px' }}>
                <p style={{ fontSize: '11px', lineHeight: 1.5, color: '#333', margin: 0 }}>{p}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Key Differentiators */}
      {keyDifferentiators && keyDifferentiators.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <Heading sub>Key Differentiators</Heading>
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
                <p style={{ fontSize: '11px', lineHeight: 1.5, color: '#333', margin: 0 }}>{d}</p>
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
                <p key={i} style={{ fontSize: '11px', lineHeight: 1.5, color: '#333', margin: i > 0 ? '4px 0 0' : 0 }}>{d}</p>
              ))}
            </Card>
          )}
          {donts && donts.length > 0 && (
            <Card style={{ borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: '6px' }}>Don't</div>
              {donts.map((d, i) => (
                <p key={i} style={{ fontSize: '11px', lineHeight: 1.5, color: '#333', margin: i > 0 ? '4px 0 0' : 0 }}>{d}</p>
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
  if (!cp) return null;
  const primaryColor = data.brand.primary_color;
  const secondaryColor = data.brand.secondary_color;

  return (
    <section style={{ padding: '20px 16px' }}>
      <SectionHeader icon={Palette} label="Colors" />
      <p style={{ fontSize: '10px', color: '#999', marginTop: '-8px', marginBottom: '12px' }}>Tap a swatch to copy its hex code</p>

      {/* Brand colors */}
      {(primaryColor || secondaryColor) && (
        <div style={{ marginBottom: '12px' }}>
          <Heading sub>Brand Colors</Heading>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            {primaryColor && <ColorSwatch hex={primaryColor} label="Primary" size="large" />}
            {secondaryColor && <ColorSwatch hex={secondaryColor} label="Secondary" size="large" />}
          </div>
        </div>
      )}

      {/* Mandatory colors */}
      {cp.mandatory_colors && cp.mandatory_colors.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <Heading sub>Required Colors</Heading>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            {cp.mandatory_colors.map((hex) => (
              <ColorSwatch key={hex} hex={hex} />
            ))}
          </div>
        </div>
      )}

      {/* Palette Relationships */}
      {cp.palette_relationships && (
        <Card style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#636466', marginBottom: '4px' }}>
            Palette Relationships
          </div>
          <p style={{ fontSize: '11px', lineHeight: 1.5, color: '#333', margin: 0 }}>
            {cp.palette_relationships}
          </p>
        </Card>
      )}

      {/* Overall Tone */}
      {cp.overall_tone && (
        <Card style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#636466', marginBottom: '4px' }}>
            Overall Tone
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#133B34', textTransform: 'capitalize' }}>
            {cp.overall_tone}
          </div>
        </Card>
      )}

      {/* Forbidden Colors */}
      {cp.forbidden_colors && cp.forbidden_colors.length > 0 && (
        <Card style={{ borderLeft: '3px solid #ef4444' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: '6px' }}>
            Forbidden Colors
          </div>
          {cp.forbidden_colors.map((c, i) => (
            <p key={i} style={{ fontSize: '11px', lineHeight: 1.5, color: '#333', margin: i > 0 ? '4px 0 0' : 0 }}>{c}</p>
          ))}
        </Card>
      )}
    </section>
  );
}

function TypographySection({ data }: DynamicBrandKitProps) {
  const typo = data.profile?.typography;
  if (!typo) return null;

  return (
    <section style={{ padding: '20px 16px', background: '#f8f8f6' }}>
      <SectionHeader icon={Type} label="Typography" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {typo.heading_font && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: data.brand.primary_color || '#636466', color: '#fff' }}>
                Heading
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#333', letterSpacing: '0.01em' }}>
                {typo.heading_font}
              </span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 600, marginTop: '8px', fontFamily: `${typo.heading_font}, system-ui, sans-serif`, color: '#222', lineHeight: 1.1 }}>
              Aa Bb Cc
            </div>
            <div style={{ fontSize: '11px', marginTop: '6px', fontFamily: `${typo.heading_font}, system-ui, sans-serif`, color: '#666', lineHeight: 1.4 }}>
              ABCDEFGHIJKLMNOPQRSTUVWXYZ
            </div>
          </Card>
        )}

        {typo.body_font && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: '#636466', color: '#fff' }}>
                Body
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#333', letterSpacing: '0.01em' }}>
                {typo.body_font}
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 400, marginTop: '8px', fontFamily: `${typo.body_font}, system-ui, sans-serif`, color: '#222', lineHeight: 1.1 }}>
              Aa Bb Cc
            </div>
            <div style={{ fontSize: '11px', marginTop: '6px', fontFamily: `${typo.body_font}, system-ui, sans-serif`, color: '#666', lineHeight: 1.4 }}>
              abcdefghijklmnopqrstuvwxyz 0123456789
            </div>
          </Card>
        )}
      </div>

      {typo.style_description && (
        <Card style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#636466', marginBottom: '4px' }}>
            Style Notes
          </div>
          <p style={{ fontSize: '11px', lineHeight: 1.5, color: '#333', margin: 0 }}>
            {typo.style_description}
          </p>
        </Card>
      )}
    </section>
  );
}

function PhotographySection({ data }: DynamicBrandKitProps) {
  const photo = data.profile?.photography_style;
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
    <section style={{ padding: '20px 16px' }}>
      <SectionHeader icon={Camera} label="Photography Style" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {specs.map(({ label, value }) => (
          <Card key={label}>
            <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#636466', marginBottom: '3px' }}>
              {label}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#133B34', textTransform: 'capitalize' }}>
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
  if (!comp) return null;

  return (
    <section style={{ padding: '20px 16px' }}>
      <SectionHeader icon={Layout} label="Composition" />

      {comp.aspect_ratio_preference && (
        <Card style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#636466', marginBottom: '3px' }}>
            Preferred Aspect Ratio
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#133B34' }}>{comp.aspect_ratio_preference}</div>
        </Card>
      )}

      {comp.preferred_layouts && comp.preferred_layouts.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <Heading sub>Layouts</Heading>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
            {comp.preferred_layouts.map((l) => (
              <span key={l} style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.08)',
                fontSize: '11px',
                fontWeight: 500,
                color: '#333',
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
          <Heading sub>Framing</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
            {comp.framing_conventions.map((f, i) => (
              <div key={i} style={{ fontSize: '11px', color: '#333', lineHeight: 1.5, paddingLeft: '8px', borderLeft: '2px solid rgba(0,0,0,0.08)' }}>
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
  const primaryColor = data.brand.primary_color || '#00856C';

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
    <section style={{ padding: '20px 16px', background: '#f8f8f6' }}>
      <SectionHeader icon={Package} label="Product Catalog" />

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
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#133B34', textTransform: 'capitalize' }}>
            {name}
          </div>
          {description && (
            <p style={{ fontSize: '10px', lineHeight: 1.4, color: '#636466', margin: '3px 0 0' }}>
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
                color: '#636466',
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

/** Compact 2-column grid for categories with many products (e.g., 25 Subway Series sandwiches) */
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
                background: isSelected ? `${primaryColor}10` : (i % 2 === 0 ? '#fff' : '#fafaf8'),
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
    <div style={{ fontSize: '10px', lineHeight: 1.5, color: '#636466' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', marginBottom: '4px', textTransform: 'capitalize' }}>
        {number !== undefined && <span style={{ color: primaryColor, marginRight: '4px' }}>#{number}</span>}
        {name}
      </div>
      {description && <div style={{ marginBottom: '4px' }}>{description}</div>}
      {bread && <div><strong style={{ color: '#333' }}>Bread:</strong> {bread}</div>}
      {protein && <div><strong style={{ color: '#333' }}>Protein:</strong> {protein.join(', ')}</div>}
      {cheese && <div><strong style={{ color: '#333' }}>Cheese:</strong> {cheese.join(', ')}</div>}
      {vegsSauce && <div><strong style={{ color: '#333' }}>Toppings:</strong> {vegsSauce.join(', ')}</div>}
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
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)',
              color: '#333',
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
          fontSize: '11px',
          fontWeight: 600,
          color: '#133B34',
          flex: 1,
          textTransform: 'capitalize',
        }}>
          {name}
        </span>
        {hasDetail && (
          <ChevronDown
            size={10}
            style={{
              color: '#999',
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
          color: '#636466',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          {description && <div>{description}</div>}
          {bread && <div><strong style={{ color: '#333' }}>Bread:</strong> {bread}</div>}
          {protein && <div><strong style={{ color: '#333' }}>Protein:</strong> {protein.join(', ')}</div>}
          {cheese && <div><strong style={{ color: '#333' }}>Cheese:</strong> {cheese.join(', ')}</div>}
          {vegsSauce && <div><strong style={{ color: '#333' }}>Toppings:</strong> {vegsSauce.join(', ')}</div>}
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
                  background: 'rgba(0,0,0,0.04)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  color: '#333',
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

function ProfileFooter({ data }: DynamicBrandKitProps) {
  return (
    <div style={{ padding: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: '9px', color: '#999' }}>
        Powered by Creative Studio Brand Intelligence
      </div>
    </div>
  );
}

// ── Color utilities ──

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
  return luminance > 0.5 ? '#133B34' : '#EAE8E3';
}

// ── Loading & empty states ──

export function DynamicBrandKitLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: '12px' }}>
      <Loader2 size={20} style={{ color: '#636466', animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '12px', color: '#636466' }}>Loading brand guidelines...</span>
    </div>
  );
}

export function DynamicBrandKitEmpty({ brandName }: { brandName?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
      }}>
        <Eye size={20} style={{ color: '#636466' }} />
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#133B34', marginBottom: '6px' }}>
        No brand guidelines yet
      </div>
      <p style={{ fontSize: '12px', color: '#636466', lineHeight: 1.5, maxWidth: '260px' }}>
        {brandName || 'This brand'} hasn't been profiled yet. Use Creative Studio to analyze brand assets and build a visual profile.
      </p>
    </div>
  );
}

// ── Main component ──

export function DynamicBrandKit({ data }: DynamicBrandKitProps) {
  return (
    <div style={{ fontFamily: 'Epilogue, system-ui, sans-serif' }}>
      <HeroSection data={data} />
      <CorporateProfileSection data={data} />
      <Divider />
      <BrandIdentitySection data={data} />
      <Divider />
      <BrandVoiceSection data={data} />
      <Divider />
      <VisualDNASection data={data} />
      <Divider />
      <ColorsSection data={data} />
      <Divider />
      <TypographySection data={data} />
      <Divider />
      <PhotographySection data={data} />
      <CompositionSection data={data} />
      <Divider />
      <ProductCatalogSection data={data} />
      <Divider />
      <ProfileFooter data={data} />
    </div>
  );
}
