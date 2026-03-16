// ABOUTME: Mobile brand DNA viewer — shows tone, voice, colors, identity for the selected brand
// ABOUTME: Pulls from the same brand profile data as the extension's brand kit tab

import React, { useState } from 'react';
import { useBrandGuidelines } from '@/hooks/useBrandGuidelines';

interface BrandDNATabProps {
  brandId: string | null;
  brandColor?: string;
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent }}>
          {title}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Pill chip ────────────────────────────────────────────────────────────────

function Chip({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: color ? `${color}22` : 'rgba(255,255,255,0.08)', color: color || 'rgba(255,255,255,0.7)', border: `1px solid ${color ? `${color}44` : 'rgba(255,255,255,0.1)'}`, marginRight: 5, marginBottom: 5 }}>
      {label}
    </span>
  );
}

// ─── Color swatch ─────────────────────────────────────────────────────────────

function ColorSwatch({ hex, name, role }: { hex: string; name?: string; role?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: hex, flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace' }}>{hex.toUpperCase()}</div>
        {(name || role) && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
            {[name, role].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Row label/value ──────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, lineHeight: 1.55, color: 'rgba(255,255,255,0.75)' }}>{value}</div>
    </div>
  );
}

// ─── Do / Don't list ──────────────────────────────────────────────────────────

function DoList({ items, positive }: { items: string[]; positive: boolean }) {
  const color = positive ? '#10b981' : '#ef4444';
  const mark = positive ? '✓' : '✗';
  return (
    <div style={{ marginBottom: positive ? 10 : 0 }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color, marginBottom: 6 }}>
        {positive ? 'Do' : "Don't"}
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
          <span style={{ fontSize: 11, color, flexShrink: 0, marginTop: 1 }}>{mark}</span>
          <span style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(255,255,255,0.65)' }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BrandDNATab({ brandId, brandColor = '#a855f7' }: BrandDNATabProps) {
  const { data, isLoading } = useBrandGuidelines(brandId);

  if (!brandId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'system-ui, sans-serif' }}>
        Select a brand to view guidelines
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
        <style>{`@keyframes dnapin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: brandColor, borderRadius: '50%', animation: 'dnapin 0.7s linear infinite' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'system-ui, sans-serif' }}>Loading guidelines…</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'system-ui, sans-serif' }}>
        No brand data found
      </div>
    );
  }

  const { brand, profile } = data;
  const identity = profile?.brand_identity;
  const tone = profile?.tone_of_voice;
  const colors = profile?.color_profile;
  const typo = profile?.typography;
  const story = profile?.brand_story;
  const standards = profile?.brand_standards;

  const primaryLogo = data.brand_logos.find(l => l.is_default) ?? data.brand_logos[0];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#0d0d0d', fontFamily: 'system-ui, sans-serif', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}>

      {/* Brand header */}
      <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {(primaryLogo?.url || brand.logo_url) && (
          <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={primaryLogo?.url || brand.logo_url!} alt={brand.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>{brand.name}</div>
          {identity?.tagline && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>{identity.tagline}</div>
          )}
          {brand.brand_category && (
            <div style={{ marginTop: 4 }}><Chip label={brand.brand_category} color={brandColor} /></div>
          )}
        </div>
      </div>

      {!profile && (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1.6 }}>
          No brand profile yet.{'\n'}Analyze this brand in the web app to generate guidelines.
        </div>
      )}

      {/* Brand Identity */}
      {identity && (
        <Section title="Brand Identity" accent={brandColor}>
          {identity.positioning && <Row label="Positioning" value={identity.positioning} />}
          {identity.brand_aesthetic && <Row label="Aesthetic" value={identity.brand_aesthetic} />}
          {identity.target_audience && <Row label="Audience" value={identity.target_audience} />}
          {identity.visual_language && <Row label="Visual Language" value={identity.visual_language} />}
          {identity.brand_values && identity.brand_values.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Values</div>
              <div>{identity.brand_values.map((v, i) => <Chip key={i} label={v} />)}</div>
            </div>
          )}
          {identity.messaging && identity.messaging.length > 0 && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Key Messages</div>
              {identity.messaging.map((m, i) => (
                <div key={i} style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(255,255,255,0.6)', marginBottom: 5, paddingLeft: 10, borderLeft: `2px solid ${brandColor}66` }}>{m}</div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Tone of Voice */}
      {tone && (
        <Section title="Tone of Voice" accent={brandColor}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {tone.formality && <Chip label={tone.formality} />}
            {tone.personality && <Chip label={tone.personality} />}
            {tone.energy && <Chip label={tone.energy} />}
          </div>
          {tone.dos && tone.dos.length > 0 && <DoList items={tone.dos} positive={true} />}
          {tone.donts && tone.donts.length > 0 && <DoList items={tone.donts} positive={false} />}
        </Section>
      )}

      {/* Writer Guidelines from brand standards */}
      {standards?.writer_guidelines?.principles && standards.writer_guidelines.principles.length > 0 && (
        <Section title="Writing Principles" accent={brandColor}>
          {standards.writer_guidelines.litmus_test && (
            <div style={{ marginBottom: 12, padding: '10px 12px', background: `${brandColor}15`, borderRadius: 8, borderLeft: `3px solid ${brandColor}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: brandColor, marginBottom: 4 }}>Litmus Test</div>
              <div style={{ fontSize: 11, lineHeight: 1.55, color: 'rgba(255,255,255,0.7)' }}>{standards.writer_guidelines.litmus_test}</div>
            </div>
          )}
          {standards.writer_guidelines.principles.map((p, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 3 }}>{p.name}</div>
              <div style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(255,255,255,0.55)', marginBottom: p.example_try ? 6 : 0 }}>{p.description}</div>
              {p.example_try && (
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <div style={{ flex: 1, padding: '5px 8px', background: 'rgba(16,185,129,0.08)', borderRadius: 5, borderLeft: '2px solid #10b981' }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#10b981', marginBottom: 2 }}>TRY</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{p.example_try}</div>
                  </div>
                  {p.example_instead_of && (
                    <div style={{ flex: 1, padding: '5px 8px', background: 'rgba(239,68,68,0.08)', borderRadius: 5, borderLeft: '2px solid #ef4444' }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: '#ef4444', marginBottom: 2 }}>NOT</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{p.example_instead_of}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Colors */}
      {(colors?.brand_colors?.length || standards?.color_system?.color_groups?.length) && (
        <Section title="Color Palette" accent={brandColor}>
          {/* Prefer brand_standards color groups if available */}
          {standards?.color_system?.color_groups?.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>{group.name}</div>
              {group.colors.map((c, ci) => <ColorSwatch key={ci} hex={c.hex} name={c.name} />)}
            </div>
          )) ?? colors?.brand_colors?.map((c, i) => (
            <ColorSwatch key={i} hex={c.hex} name={c.name} role={c.role} />
          ))}
          {colors?.overall_tone && (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Overall Tone</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{colors.overall_tone}</div>
            </div>
          )}
        </Section>
      )}

      {/* Typography */}
      {(typo || standards?.typography_system) && (
        <Section title="Typography" accent={brandColor}>
          {standards?.typography_system?.primary_font && (
            <Row label="Primary Font" value={[standards.typography_system.primary_font.name, standards.typography_system.primary_font.usage].filter(Boolean).join(' — ')} />
          )}
          {standards?.typography_system?.secondary_font && (
            <Row label="Secondary Font" value={[standards.typography_system.secondary_font.name, standards.typography_system.secondary_font.usage].filter(Boolean).join(' — ')} />
          )}
          {typo?.heading_font && !standards?.typography_system?.primary_font && <Row label="Heading Font" value={typo.heading_font} />}
          {typo?.body_font && !standards?.typography_system?.secondary_font && <Row label="Body Font" value={typo.body_font} />}
          {typo?.style_description && <Row label="Style" value={typo.style_description} />}
          {standards?.typography_system?.rules && standards.typography_system.rules.length > 0 && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Rules</div>
              {standards.typography_system.rules.map((r, i) => (
                <div key={i} style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(255,255,255,0.6)', marginBottom: 4, paddingLeft: 10, borderLeft: `2px solid ${brandColor}44` }}>{r.text}</div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Social Voice */}
      {standards?.social_media_voice && (
        <Section title="Social Media Voice" accent={brandColor}>
          {standards.social_media_voice.persona && <Row label="Persona" value={standards.social_media_voice.persona} />}
          {standards.social_media_voice.voice_traits && standards.social_media_voice.voice_traits.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              {standards.social_media_voice.voice_traits.map((t, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{t.description}</div>
                </div>
              ))}
            </div>
          )}
          {standards.social_media_voice.hashtags && standards.social_media_voice.hashtags.length > 0 && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Hashtags</div>
              <div>{standards.social_media_voice.hashtags.map((h, i) => <Chip key={i} label={h} color={brandColor} />)}</div>
            </div>
          )}
        </Section>
      )}

      {/* Brand Story */}
      {story?.narrative_summary && (
        <Section title="Brand Story" accent={brandColor}>
          <div style={{ fontSize: 12, lineHeight: 1.65, color: 'rgba(255,255,255,0.65)' }}>{story.narrative_summary}</div>
          {story.mission_vision?.mission && (
            <div style={{ marginTop: 12 }}>
              <Row label="Mission" value={story.mission_vision.mission} />
            </div>
          )}
          {story.mission_vision?.vision && <Row label="Vision" value={story.mission_vision.vision} />}
        </Section>
      )}

      {/* Logos */}
      {data.brand_logos.length > 1 && (
        <Section title="Logos" accent={brandColor}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.brand_logos.map(logo => (
              <div key={logo.id} style={{ width: 72, height: 72, borderRadius: 10, background: logo.background === 'dark' ? '#111' : 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 6 }}>
                <img src={logo.url} alt={logo.variant || 'Logo'} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Bottom padding for tab bar */}
      <div style={{ height: 16 }} />
    </div>
  );
}
