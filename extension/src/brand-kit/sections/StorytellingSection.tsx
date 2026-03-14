// ABOUTME: Storytelling through Technology — 4 pillars on dark gradient background
// ABOUTME: Compact single-column layout for the sidebar

import { Sparkles, Users, Cpu, Heart } from 'lucide-react';

const pillars = [
  { icon: Users, title: 'Human Insight', description: 'We start with understanding — deep research into human behavior, motivations, and needs that inform every decision.' },
  { icon: Sparkles, title: 'Creativity', description: 'Ideas that surprise, delight, and connect. We craft narratives that resonate emotionally while driving action.' },
  { icon: Cpu, title: 'AI & Technology', description: 'We leverage the latest in AI and technology to personalize experiences at scale, turning complexity into clarity.' },
  { icon: Heart, title: 'Health & Wellness', description: 'Our focus on health, wellness, and happiness means every story we tell has the potential to improve lives.' },
];

export function StorytellingSection() {
  return (
    <section
      id="storytelling"
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.03) 100%)',
        padding: '20px 16px',
        color: '#111111',
      }}
    >
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 600, textAlign: 'center', marginBottom: '6px' }}>
        Storytelling through Technology
      </h2>
      <p style={{ fontSize: '11px', textAlign: 'center', opacity: 0.8, lineHeight: 1.5, marginBottom: '14px' }}>
        We weave storytelling through technology to turn complexity into clarity and shape personalized experiences that strengthen relationships between people and brands.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {pillars.map((pillar) => (
          <div
            key={pillar.title}
            style={{
              padding: '10px',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ padding: '4px', borderRadius: '50%', background: 'rgba(30, 215, 95, 0.2)', display: 'flex' }}>
                <pillar.icon size={16} color="#8b5cf6" />
              </div>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '14px', fontWeight: 600 }}>
                {pillar.title}
              </span>
            </div>
            <p style={{ fontSize: '11px', opacity: 0.7, lineHeight: 1.5 }}>{pillar.description}</p>
          </div>
        ))}
      </div>

      <blockquote
        style={{
          fontFamily: 'Fraunces, serif',
          fontSize: '15px',
          fontStyle: 'italic',
          textAlign: 'center',
          marginTop: '16px',
          opacity: 0.9,
          lineHeight: 1.4,
        }}
      >
        "Even when we talk about technology, we're talking about people."
      </blockquote>
    </section>
  );
}
