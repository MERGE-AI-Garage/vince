// ABOUTME: Hero, manifesto, overview, and brand positioning for the sidebar
// ABOUTME: Compact version of the full-width hero with CSS gradient background

import { mergeBrandGuidelines } from '@/data/brandGuidelinesComplete';
import { SectionHeading } from '../components/SectionHeading';

export function BrandOverviewSection() {
  const { hero, manifesto, overview, brandPositioning } = mergeBrandGuidelines;

  return (
    <section id="brand-overview">
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #133B34 0%, #00524F 100%)',
          padding: '32px 16px 24px',
          textAlign: 'center',
          color: '#EAE8E3',
        }}
      >
        <div
          style={{
            fontFamily: 'Fraunces, serif',
            fontSize: '28px',
            fontWeight: 400,
            lineHeight: 1.2,
            marginBottom: '12px',
            letterSpacing: '-0.02em',
          }}
        >
          {hero.tagline}
        </div>
        <img src="./mergelogos/Merge_Logo_Primary_E-Green_RGB.png" alt="MERGE" style={{ height: '40px', marginBottom: '20px' }} />
        <div style={{ fontSize: '11px', lineHeight: 1.6, opacity: 0.8 }}>
          {manifesto.lines.map((line, i) => (
            <p key={i} style={{ margin: line === '' ? '6px 0' : '2px 0' }}>{line}</p>
          ))}
        </div>
      </div>

      {/* Overview */}
      <div style={{ padding: '16px' }}>
        <div
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(19,59,52,0.1)',
            background: '#fff',
            marginBottom: '16px',
          }}
        >
          <SectionHeading sub>{overview.title}</SectionHeading>
          <p style={{ fontSize: '12px', color: '#8fa89e', marginTop: '6px', lineHeight: 1.5 }}>
            {overview.intro}
          </p>
        </div>

        {/* Brand Positioning */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#00856C',
              color: '#fff',
              fontFamily: 'Fraunces, serif',
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            M
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8fa89e', marginBottom: '6px' }}>
            Brand Positioning
          </div>
          <p style={{ fontFamily: 'Fraunces, serif', fontSize: '14px', fontWeight: 500, lineHeight: 1.4, marginBottom: '8px' }}>
            {brandPositioning.statement}
          </p>
          <p style={{ fontSize: '12px', color: '#8fa89e', lineHeight: 1.5 }}>
            {brandPositioning.description}
          </p>
        </div>
      </div>
    </section>
  );
}
