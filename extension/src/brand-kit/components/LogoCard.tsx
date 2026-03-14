// ABOUTME: Logo display card with colored background and label for the sidebar
// ABOUTME: Shows logo on brand-colored background with label and download link below

import { Download } from 'lucide-react';

interface LogoCardProps {
  src: string;
  alt: string;
  label: string;
  bgColor: string;
  downloadUrl?: string;
}

export function LogoCard({ src, alt, label, bgColor, downloadUrl }: LogoCardProps) {
  return (
    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.04)' }}>
      <div style={{ backgroundColor: bgColor, padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={src} alt={alt} style={{ height: '36px', maxWidth: '100%', objectFit: 'contain' }} />
      </div>
      <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ext-text-muted)', borderTop: '1px solid rgba(0,0,0,0.06)', background: '#f9f9f9' }}>
        <span>{label}</span>
        <a
          href={downloadUrl || src}
          download
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', color: 'var(--ext-text-muted)', opacity: 0.6, textDecoration: 'none' }}
          title="Download logo"
        >
          <Download size={11} />
        </a>
      </div>
    </div>
  );
}
