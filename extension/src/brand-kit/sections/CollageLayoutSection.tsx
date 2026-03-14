// ABOUTME: Collage personas, tagline usage, layout structure, and print guidelines
// ABOUTME: Text-focused section — large images omitted for sidebar size constraints

import { Download } from 'lucide-react';
import { mergeBrandGuidelines } from '@/data/brandGuidelinesComplete';
import { SectionHeading } from '../components/SectionHeading';

export function CollageLayoutSection() {
  const { collagePersonas, taglines, layoutStructure, printProduction } = mergeBrandGuidelines;

  return (
    <section id="collage-layout" style={{ padding: '20px 16px', borderTop: '1px solid rgba(19,59,52,0.1)' }}>
      {/* Collage Personas */}
      <SectionHeading>Built Different</SectionHeading>
      <div
        style={{
          marginTop: '10px',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid rgba(19,59,52,0.1)',
          background: '#fff',
        }}
      >
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: '14px', fontWeight: 600, color: '#8b5cf6', marginBottom: '6px' }}>
          {collagePersonas.title}
        </div>
        <p style={{ fontSize: '11px', lineHeight: 1.5, marginBottom: '4px' }}>{collagePersonas.description}</p>
        <p style={{ fontSize: '11px', lineHeight: 1.5, marginBottom: '4px' }}>{collagePersonas.purpose}</p>
        <p style={{ fontSize: '11px', color: '#8fa89e', lineHeight: 1.5, marginBottom: '4px' }}>{collagePersonas.details}</p>
        <p style={{ fontSize: '10px', color: '#8fa89e', fontStyle: 'italic' }}>{collagePersonas.note}</p>
      </div>

      {/* Taglines */}
      <div style={{ marginTop: '20px' }}>
        <SectionHeading sub>Taglines</SectionHeading>
        <p style={{ fontSize: '11px', color: '#8fa89e', marginTop: '4px', lineHeight: 1.5, marginBottom: '12px' }}>
          "Built Different" can be used as a featured message or as a tagline. When featured, use Fraunces. As support, use Epilogue Small Caps.
        </p>

        {/* Feature */}
        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #133B34, #00524F)',
            textAlign: 'center',
            marginBottom: '8px',
          }}
        >
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 500, color: '#EAE8E3', letterSpacing: '-0.02em' }}>
            Built Different
          </div>
          <p style={{ fontSize: '10px', color: 'rgba(234,232,227,0.6)', marginTop: '4px' }}>
            Feature | Fraunces Medium in Dark Green
          </p>
        </div>

        {/* Tagline Dyad */}
        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid rgba(19,59,52,0.1)',
            background: '#fff',
            textAlign: 'center',
            marginBottom: '10px',
          }}
        >
          <div style={{ fontFamily: 'Epilogue, sans-serif', fontSize: '18px', fontWeight: 600, fontVariant: 'small-caps', letterSpacing: '0.2em' }}>
            BUILT DIFFERENT
          </div>
          <p style={{ fontSize: '10px', color: '#8fa89e', marginTop: '4px' }}>
            Dyad | Epilogue SemiBold Small Caps
          </p>
        </div>

        <a
          href="https://drive.google.com/drive/folders/1Gp5-FdA9qVNONZPPzdGqrU_mn8eqeTto?usp=drive_link"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#8b5cf6', fontWeight: 600, textDecoration: 'none' }}
        >
          <Download size={14} />
          Download tagline lockups
        </a>
      </div>

      {/* Layout Structure */}
      <div style={{ marginTop: '20px' }}>
        <SectionHeading sub>{layoutStructure.title}</SectionHeading>
        <p style={{ fontSize: '11px', color: '#8fa89e', marginTop: '4px', lineHeight: 1.5, marginBottom: '10px' }}>
          {layoutStructure.intro}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {layoutStructure.elements.map((el) => (
            <div key={el.number}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#8b5cf6' }}>
                {el.number}. {el.title}
              </div>
              <p style={{ fontSize: '11px', color: '#8fa89e', lineHeight: 1.5 }}>
                {el.spec}
              </p>
              {el.note && (
                <p style={{ fontSize: '10px', color: '#8fa89e', fontStyle: 'italic', marginTop: '2px' }}>
                  Note: {el.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Print Production */}
      <div style={{ marginTop: '20px' }}>
        <SectionHeading sub>{printProduction.title}</SectionHeading>
        <p style={{ fontSize: '11px', color: '#8fa89e', marginTop: '4px', lineHeight: 1.5, marginBottom: '8px' }}>
          {printProduction.intro}
        </p>
        <div
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid rgba(19,59,52,0.1)',
            background: '#fff',
          }}
        >
          {printProduction.guidelines.map((g, i) => (
            <p key={i} style={{ fontSize: '11px', lineHeight: 1.5, marginBottom: i < printProduction.guidelines.length - 1 ? '8px' : 0 }}>
              {g}
            </p>
          ))}
        </div>
        <p style={{ fontSize: '10px', color: '#8fa89e', marginTop: '6px', textAlign: 'center' }}>
          {printProduction.contact}
        </p>
      </div>
    </section>
  );
}
