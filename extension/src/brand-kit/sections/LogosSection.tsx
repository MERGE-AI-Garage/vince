// ABOUTME: Primary and secondary logos with download links for the sidebar
// ABOUTME: Compact logo cards with colored backgrounds and Google Drive links

import { Download } from 'lucide-react';
import { mergeBrandGuidelines } from '@/data/brandGuidelinesComplete';
import { SectionHeading } from '../components/SectionHeading';
import { LogoCard } from '../components/LogoCard';

export function LogosSection() {
  const { logos } = mergeBrandGuidelines;

  return (
    <section id="logos" style={{ padding: '20px 16px', background: '#f5f4f0', borderTop: '1px solid rgba(19,59,52,0.1)' }}>
      <SectionHeading>Logos</SectionHeading>

      {/* Primary Logos */}
      <p style={{ fontSize: '12px', color: '#636466', marginTop: '8px', lineHeight: 1.5 }}>
        {logos.primary.description}
      </p>
      <p style={{ fontSize: '11px', color: '#636466', marginTop: '4px', lineHeight: 1.5 }}>
        {logos.primary.usage}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
        <LogoCard
          src="./mergelogos/Merge_Logo_Primary_Dark-Green_RGB.png"
          alt="MERGE Logo - Dark Green on Warm Gray"
          label="Dark Green on Warm Gray"
          bgColor="#EAE8E3"
        />
        <LogoCard
          src="./mergelogos/Merge_Logo_Primary_E-Green_RGB.png"
          alt="MERGE Logo - E-Green on Dark Green"
          label="E-Green on Dark Green"
          bgColor="#133B34"
        />
        <LogoCard
          src="./mergelogos/Merge_Logo_Primary_Dark-Green_RGB.png"
          alt="MERGE Logo - Dark Green on E-Green"
          label="Dark Green on E-Green"
          bgColor="#1ED75F"
        />
      </div>

      <a
        href="https://drive.google.com/drive/folders/1zZ4sc6rP5SJeh0SB10UZqaIgH7_Rm9uR?usp=drive_link"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '10px',
          fontSize: '12px',
          color: '#00856C',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        <Download size={14} />
        Download primary logos
      </a>

      {/* Logo Usage */}
      <div style={{ marginTop: '20px' }}>
        <SectionHeading sub>Logo Usage</SectionHeading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
          <div>
            <div
              style={{
                padding: '16px',
                background: '#fff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '6px',
              }}
            >
              <img src="./images/brand-guidelines/Merge_Logo_Clear_Space.png" alt="Clear Space Diagram" style={{ maxWidth: '100%', height: 'auto' }} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#00856C' }}>{logos.primary.clearSpace.title}</div>
            <p style={{ fontSize: '11px', color: '#636466', lineHeight: 1.5 }}>
              {logos.primary.clearSpace.description}
            </p>
          </div>
          <div>
            <div
              style={{
                padding: '20px',
                background: '#fff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '6px',
              }}
            >
              <img src="./images/brand-guidelines/Merge_Logo.png" alt="Minimum Size" style={{ height: '12px', maxWidth: '90px' }} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#00856C' }}>{logos.primary.minimumSize.title}</div>
            <p style={{ fontSize: '11px', color: '#636466', lineHeight: 1.5 }}>
              {logos.primary.minimumSize.description}
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Logos */}
      <div style={{ marginTop: '20px' }}>
        <SectionHeading sub>{logos.secondary.title}</SectionHeading>
        <p style={{ fontSize: '11px', color: '#636466', marginTop: '4px', lineHeight: 1.5 }}>
          {logos.secondary.description}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '12px' }}>
          {[
            { src: './mergelogos/Merge_Logo_Secondary_M_Circle_E-Green_RGB.png', alt: 'M Circle - E-Green' },
            { src: './mergelogos/Merge_Logo_Secondary_M_Circle_Dark-Green_RGB.png', alt: 'M Circle - Dark Green' },
            { src: './mergelogos/Merge_Logo_Secondary_M_Square_Viridian-Green_RGB.png', alt: 'M Square - Viridian' },
          ].map((logo) => (
            <div
              key={logo.alt}
              style={{
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid rgba(19,59,52,0.1)',
              }}
            >
              <img src={logo.src} alt={logo.alt} style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
            </div>
          ))}
        </div>

        <a
          href="https://drive.google.com/drive/folders/18vz8fsEfGZTzARCKgsrQJswXizUOz-qH?usp=drive_link"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '10px',
            fontSize: '12px',
            color: '#00856C',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <Download size={14} />
          Download secondary logos
        </a>
      </div>
    </section>
  );
}
