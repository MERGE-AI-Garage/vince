// ABOUTME: Complete color system with expandable swatches, gradients, and ADA compliance
// ABOUTME: Compact layout with ColorCard and ContrastRow components for the sidebar

import { mergeBrandGuidelines } from '@/data/brandGuidelinesComplete';
import { SectionHeading } from '../components/SectionHeading';
import { ColorCard } from '../components/ColorCard';
import { ContrastRow } from '../components/ContrastRow';

export function ColorsSection() {
  const { colors, adaCompliance } = mergeBrandGuidelines;

  return (
    <section id="colors" style={{ padding: '20px 16px', borderTop: '1px solid rgba(19,59,52,0.1)' }}>
      <SectionHeading>Color</SectionHeading>
      <p style={{ fontSize: '11px', color: '#8fa89e', marginTop: '6px', lineHeight: 1.5, marginBottom: '14px' }}>
        {colors.intro}
      </p>

      {/* Primary Colors */}
      <SectionHeading sub>Primary Colors</SectionHeading>
      <p style={{ fontSize: '11px', color: '#8fa89e', marginTop: '4px', marginBottom: '8px', lineHeight: 1.5 }}>
        Main brand colors that should dominate all brand designs.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {colors.primary.map((c) => <ColorCard key={c.name} color={c} />)}
      </div>

      {/* Secondary Colors */}
      <div style={{ marginTop: '16px' }}>
        <SectionHeading sub>Secondary Colors</SectionHeading>
        <p style={{ fontSize: '11px', color: '#8fa89e', marginTop: '4px', marginBottom: '8px', lineHeight: 1.5 }}>
          Used sparingly when more colors are necessary. Electrolight Green fails WCAG on white but passes on Dark Green.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {colors.secondary.map((c) => <ColorCard key={c.name} color={c} />)}
        </div>
      </div>

      {/* Tertiary Colors */}
      <div style={{ marginTop: '16px' }}>
        <SectionHeading sub>Tertiary Colors</SectionHeading>
        <p style={{ fontSize: '11px', color: '#8fa89e', marginTop: '4px', marginBottom: '8px', lineHeight: 1.5 }}>
          Reserved for charts, graphs, and illustrations. Never by themselves as a palette.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {colors.tertiary.map((c) => <ColorCard key={c.name} color={c} />)}
        </div>
      </div>

      {/* Color Usage */}
      <div style={{ marginTop: '20px' }}>
        <SectionHeading sub>Color Usage</SectionHeading>
        <div style={{ marginTop: '8px' }}>
          {colors.usage.breakdown.map((item) => (
            <div key={item.number} style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#00856C' }}>
                {item.number}. {item.title}
              </div>
              <p style={{ fontSize: '11px', color: '#8fa89e', lineHeight: 1.5 }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
        <img
          src="./images/brand-guidelines/Color_Usage.png"
          alt="Color Usage Wheel"
          style={{ width: '100%', maxWidth: '280px', margin: '8px auto', display: 'block' }}
        />
      </div>

      {/* Gradients */}
      <div style={{ marginTop: '20px' }}>
        <SectionHeading sub>Gradients</SectionHeading>
        <p style={{ fontSize: '11px', color: '#8fa89e', marginTop: '4px', lineHeight: 1.5, marginBottom: '10px' }}>
          {colors.gradients.description}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <div style={{ height: '48px', borderRadius: '6px', background: 'linear-gradient(135deg, rgba(19,59,52,0.15) 0%, rgba(19,59,52,0.25) 100%), #EAE8E3' }} />
            <p style={{ fontSize: '10px', color: '#8fa89e', textAlign: 'center', marginTop: '4px' }}>
              Dark Green Vignette (15-25%) on Warm Gray
            </p>
          </div>
          <div>
            <div style={{ height: '48px', borderRadius: '6px', background: 'linear-gradient(135deg, #133B34 0%, #00524F 100%)' }} />
            <p style={{ fontSize: '10px', color: '#8fa89e', textAlign: 'center', marginTop: '4px' }}>
              Dark Green to Forest Green
            </p>
          </div>
          <div>
            <div style={{ height: '48px', borderRadius: '6px', background: 'linear-gradient(135deg, #133B34 0%, #00524F 50%, #00856C 100%)' }} />
            <p style={{ fontSize: '10px', color: '#8fa89e', textAlign: 'center', marginTop: '4px' }}>
              Dark Green to Forest Green to Viridian
            </p>
          </div>
        </div>
      </div>

      {/* ADA Compliance */}
      <div style={{ marginTop: '20px' }}>
        <SectionHeading sub>{adaCompliance.title}</SectionHeading>
        <p style={{ fontSize: '11px', color: '#8fa89e', marginTop: '6px', lineHeight: 1.5, marginBottom: '10px' }}>
          WCAG 2.0 minimum contrast: 4.5:1 for normal text, 3:1 for larger text (18px+).
        </p>
        <div>
          {adaCompliance.ratios.map((ratio, i) => (
            <ContrastRow key={i} {...ratio} />
          ))}
        </div>
      </div>
    </section>
  );
}
