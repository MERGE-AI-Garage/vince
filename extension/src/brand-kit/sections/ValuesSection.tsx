// ABOUTME: Core values (Ability, Agility, Humility) and personality traits for the sidebar
// ABOUTME: Compact single-column card layout with personality badges

import { mergeBrandGuidelines } from '@/data/brandGuidelinesComplete';
import { SectionHeading } from '../components/SectionHeading';

export function ValuesSection() {
  const { values, personality } = mergeBrandGuidelines;

  return (
    <section id="values" style={{ padding: '20px 16px', borderTop: '1px solid rgba(19,59,52,0.1)' }}>
      <SectionHeading>Our Values</SectionHeading>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
        {values.map((value) => (
          <div
            key={value.number}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(19,59,52,0.1)',
              background: '#fff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 600, color: '#00856C' }}>
                {value.number}
              </span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 600 }}>
                {value.title}
              </span>
            </div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#133B34', marginBottom: '4px' }}>
              {value.tagline}
            </p>
            <p style={{ fontSize: '11px', color: '#636466', lineHeight: 1.5 }}>
              {value.description}
            </p>
          </div>
        ))}
      </div>

      {/* Personality */}
      <div style={{ marginTop: '20px' }}>
        <SectionHeading sub>Brand Personality</SectionHeading>
        <p style={{ fontSize: '12px', color: '#636466', marginTop: '6px', lineHeight: 1.5 }}>
          {personality.description}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
          {personality.traits.map((trait) => (
            <span
              key={trait}
              style={{
                padding: '4px 12px',
                borderRadius: '999px',
                backgroundColor: '#00856C',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {trait}
            </span>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: '#636466', marginTop: '8px', lineHeight: 1.5 }}>
          {personality.note}
        </p>
      </div>
    </section>
  );
}
