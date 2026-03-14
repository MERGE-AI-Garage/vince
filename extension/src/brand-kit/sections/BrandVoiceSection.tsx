// ABOUTME: Brand voice principles, elevator pitch, and boilerplate for the sidebar
// ABOUTME: Compact card layout with copy-friendly text blocks

import { mergeBrandGuidelines } from '@/data/brandGuidelinesComplete';
import { SectionHeading } from '../components/SectionHeading';

export function BrandVoiceSection() {
  const { brandVoice, elevatorPitch, boilerplate } = mergeBrandGuidelines;

  return (
    <section id="brand-voice" style={{ padding: '20px 16px', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
      <SectionHeading>Brand Voice</SectionHeading>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
        {brandVoice.map((voice, i) => (
          <div
            key={i}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(0,0,0,0.07)',
              background: '#fff',
            }}
          >
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
              {voice.title}
            </div>
            <p style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.5 }}>
              {voice.description}
            </p>
          </div>
        ))}
      </div>

      {/* Elevator Pitch */}
      <div style={{ marginTop: '16px' }}>
        <SectionHeading sub>Elevator Pitch</SectionHeading>
        <div
          style={{
            marginTop: '8px',
            padding: '10px',
            borderRadius: '8px',
            background: 'rgba(0, 133, 108, 0.06)',
            border: '1px solid rgba(0,0,0,0.07)',
          }}
        >
          <p style={{ fontSize: '12px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{elevatorPitch}</p>
        </div>
      </div>

      {/* Boilerplate */}
      <div style={{ marginTop: '16px' }}>
        <SectionHeading sub>Boilerplate</SectionHeading>
        <div
          style={{
            marginTop: '8px',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid rgba(0,0,0,0.07)',
            background: '#fff',
          }}
        >
          <p style={{ fontSize: '12px', lineHeight: 1.6 }}>{boilerplate}</p>
        </div>
      </div>
    </section>
  );
}
