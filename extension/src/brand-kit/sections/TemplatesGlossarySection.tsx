// ABOUTME: Google Slides templates, LinkedIn headers, and glossary for the sidebar
// ABOUTME: Includes LinkedIn banner previews and old-to-new terminology mappings

import { ArrowRight } from 'lucide-react';
import { mergeBrandGuidelines } from '@/data/brandGuidelinesComplete';
import { SectionHeading } from '../components/SectionHeading';

export function TemplatesGlossarySection() {
  const { googleSlides, linkedInHeaders, glossary } = mergeBrandGuidelines;

  return (
    <section id="templates-glossary" style={{ padding: '20px 16px', background: '#142e28', borderTop: '1px solid rgba(19,59,52,0.1)' }}>
      {/* Google Slides */}
      <SectionHeading>{googleSlides.title}</SectionHeading>

      <div
        style={{
          marginTop: '10px',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid rgba(19,59,52,0.1)',
          background: '#fff',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>{googleSlides.access.title}</div>
        <p style={{ fontSize: '11px', color: '#8fa89e', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
          {googleSlides.access.steps}
        </p>
      </div>

      <div
        style={{
          marginTop: '8px',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid rgba(19,59,52,0.1)',
          background: '#fff',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>{googleSlides.apply.title}</div>
        <p style={{ fontSize: '11px', color: '#8fa89e', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
          {googleSlides.apply.steps}
        </p>
        <p style={{ fontSize: '10px', color: '#8fa89e', fontStyle: 'italic', marginTop: '6px' }}>
          {googleSlides.apply.note}
        </p>
      </div>

      <p style={{ fontSize: '11px', color: '#8fa89e', marginTop: '8px', textAlign: 'center' }}>
        {googleSlides.feedback}
      </p>

      {/* LinkedIn Headers */}
      <div style={{ marginTop: '20px' }}>
        <SectionHeading sub>{linkedInHeaders.title}</SectionHeading>
        <p style={{ fontSize: '11px', marginTop: '4px', marginBottom: '10px' }}>{linkedInHeaders.intro}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {linkedInHeaders.images.map((image, i) => (
            <div key={i} style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(19,59,52,0.1)' }}>
              <img src={`.${image}`} alt={`LinkedIn Header Option ${i + 1}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Glossary */}
      <div style={{ marginTop: '20px' }}>
        <SectionHeading>{glossary.title}</SectionHeading>
        <p style={{ fontSize: '11px', color: '#8fa89e', marginTop: '4px', lineHeight: 1.5, marginBottom: '12px' }}>
          {glossary.intro}
        </p>

        {/* Old to New */}
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Something Old is Something New</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {glossary.oldToNew.map((item, i) => (
            <div
              key={i}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(19,59,52,0.1)',
                background: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#8fa89e', textDecoration: 'line-through' }}>
                  {item.old}
                </span>
                <ArrowRight size={12} color="#00856C" />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.new}</span>
              </div>
              {item.note && (
                <p style={{ fontSize: '10px', color: '#8fa89e', marginTop: '4px', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {item.note}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Terms */}
        <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>Words We Love or Live By</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {glossary.terms.map((item, i) => (
            <div
              key={i}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(19,59,52,0.1)',
                background: '#fff',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>{item.term}</div>
              <p style={{ fontSize: '11px', color: '#8fa89e', lineHeight: 1.5 }}>{item.definition}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
