// ABOUTME: Typography system with Fraunces and Epilogue specimens for the sidebar
// ABOUTME: Compact font displays with weight samples and usage guidelines

import { mergeBrandGuidelines } from '@/data/brandGuidelinesComplete';
import { SectionHeading } from '../components/SectionHeading';

export function TypographySection() {
  const { typography } = mergeBrandGuidelines;

  return (
    <section id="typography" style={{ padding: '20px 16px', background: '#f5f4f0', borderTop: '1px solid rgba(19,59,52,0.1)' }}>
      <SectionHeading>Typography</SectionHeading>
      <p style={{ fontSize: '12px', color: '#636466', marginTop: '6px', lineHeight: 1.5 }}>
        {typography.intro}
      </p>

      {/* Fraunces */}
      <div
        style={{
          marginTop: '14px',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid rgba(19,59,52,0.1)',
          background: '#fff',
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: '#00856C', color: '#fff' }}>
          {typography.primary.category}
        </span>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 600, marginTop: '8px' }}>
          {typography.primary.name}
        </div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: '36px', marginTop: '4px', marginBottom: '8px' }}>Aa</div>
        <p style={{ fontSize: '11px', color: '#636466', lineHeight: 1.5, marginBottom: '8px' }}>
          {typography.primary.description}
        </p>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: '13px', letterSpacing: '-0.02em', wordBreak: 'break-all' }}>
          ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '8px' }}>
          {typography.primary.weights.map((w) => (
            <div key={w} style={{ fontFamily: 'Fraunces, serif', fontSize: '12px' }}>
              Fraunces {w}
            </div>
          ))}
        </div>
      </div>

      {/* Epilogue */}
      <div
        style={{
          marginTop: '10px',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid rgba(19,59,52,0.1)',
          background: '#fff',
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: '#00856C', color: '#fff' }}>
          {typography.secondary.category}
        </span>
        <div style={{ fontFamily: 'Epilogue, sans-serif', fontSize: '24px', fontWeight: 600, marginTop: '8px' }}>
          {typography.secondary.name}
        </div>
        <div style={{ fontFamily: 'Epilogue, sans-serif', fontSize: '36px', marginTop: '4px', marginBottom: '8px' }}>Bb</div>
        <p style={{ fontSize: '11px', color: '#636466', lineHeight: 1.5, marginBottom: '8px' }}>
          {typography.secondary.description}
        </p>
        <div style={{ fontFamily: 'Epilogue, sans-serif', fontSize: '12px', wordBreak: 'break-all' }}>
          ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '8px' }}>
          {typography.secondary.weights.map((w) => (
            <div key={w} style={{ fontFamily: 'Epilogue, sans-serif', fontSize: '12px' }}>
              Epilogue {w}
            </div>
          ))}
        </div>
      </div>

      {/* Using Fraunces */}
      <div style={{ marginTop: '16px' }}>
        <SectionHeading sub>{typography.usage.fraunces.title}</SectionHeading>
        {typography.usage.fraunces.guidelines.map((g, i) => (
          <p key={i} style={{ fontSize: '11px', color: '#636466', lineHeight: 1.5, marginTop: '6px' }}>
            {g}
          </p>
        ))}
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Do Nots</div>
          {typography.usage.fraunces.donts.map((d, i) => (
            <div
              key={i}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                marginBottom: '6px',
                background: '#fff',
              }}
            >
              <p style={{ fontSize: '11px', marginBottom: '4px' }}>{d.rule}</p>
              <p style={{ fontFamily: 'Fraunces, serif', fontSize: '14px', color: '#ef4444' }}>
                x {d.example}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Using Epilogue */}
      <div style={{ marginTop: '16px' }}>
        <SectionHeading sub>{typography.usage.epilogue.title}</SectionHeading>
        {typography.usage.epilogue.guidelines.map((g, i) => (
          <p key={i} style={{ fontSize: '11px', color: '#636466', lineHeight: 1.5, marginTop: '6px' }}>
            {g}
          </p>
        ))}
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Small Caps Access:</div>
          {typography.usage.epilogue.smallCapsAccess.map((s, i) => (
            <p key={i} style={{ fontSize: '10px', color: '#636466', lineHeight: 1.5, marginBottom: '2px', paddingLeft: '8px' }}>
              {s}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
