// ABOUTME: Logo display card with colored background and label for the sidebar
// ABOUTME: Shows logo on brand-colored background with label below

interface LogoCardProps {
  src: string;
  alt: string;
  label: string;
  bgColor: string;
}

export function LogoCard({ src, alt, label, bgColor }: LogoCardProps) {
  return (
    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(19,59,52,0.1)' }}>
      <div style={{ backgroundColor: bgColor, padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={src} alt={alt} style={{ height: '36px', maxWidth: '100%', objectFit: 'contain' }} />
      </div>
      <div style={{ padding: '6px 10px', textAlign: 'center', fontSize: '11px', color: '#8fa89e', borderTop: '1px solid rgba(19,59,52,0.08)', background: '#1a3a32' }}>
        {label}
      </div>
    </div>
  );
}
