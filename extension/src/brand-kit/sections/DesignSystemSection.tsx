// ABOUTME: Design elements overview for the sidebar
// ABOUTME: Previews logo system, color palette, typography, and layout structure

import { Palette, Type, Image, Layout } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';

const elements = [
  { icon: Image, title: 'Logo System', description: 'Our logo merges the M and RGE to create an E in the negative space — a visual representation of emergence and connection.' },
  { icon: Palette, title: 'Color Palette', description: 'A sophisticated yet vibrant palette anchored by Viridian Green and Dark Green, with Electrolight Green as our distinctive accent.' },
  { icon: Type, title: 'Typography', description: 'Fraunces brings warmth to headlines while Epilogue delivers clarity in body copy — together they embody Built Different.' },
  { icon: Layout, title: 'Layout Structure', description: 'Clean, purposeful compositions that give content room to breathe while maintaining visual hierarchy and brand consistency.' },
];

export function DesignSystemSection() {
  return (
    <section id="design-system" style={{ padding: '20px 16px', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
      <SectionHeading>Design Elements</SectionHeading>
      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', lineHeight: 1.5, marginBottom: '12px' }}>
        Our visual identity system is built to be distinctive, flexible, and unmistakably MERGE.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {elements.map((el) => (
          <div
            key={el.title}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(0,0,0,0.07)',
              background: '#fff',
            }}
          >
            <div
              style={{
                padding: '6px',
                borderRadius: '6px',
                background: 'rgba(0, 133, 108, 0.1)',
                display: 'flex',
                flexShrink: 0,
              }}
            >
              <el.icon size={16} color="#8b5cf6" />
            </div>
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>
                {el.title}
              </div>
              <p style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.5 }}>
                {el.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
