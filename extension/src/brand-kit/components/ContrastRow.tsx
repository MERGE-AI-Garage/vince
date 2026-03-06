// ABOUTME: Single ADA contrast ratio display row for the sidebar
// ABOUTME: Shows color combination preview with pass/fail indicator and ratio

import { Check, X } from 'lucide-react';

interface ContrastRowProps {
  combination: string;
  colors: string;
  ratio: string;
  passes: boolean;
}

export function ContrastRow({ combination, colors, ratio, passes }: ContrastRowProps) {
  const ratioNum = parseFloat(ratio);
  const [foreground, background] = colors.split(' / ');

  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ borderRadius: '6px', padding: '8px 10px', backgroundColor: background, color: foreground, fontSize: '11px', fontWeight: 500, lineHeight: 1.4 }}>
        {combination}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {!passes ? (
            <X size={12} style={{ color: '#ef4444' }} />
          ) : ratioNum >= 4.5 ? (
            <Check size={12} style={{ color: '#16a34a' }} />
          ) : (
            <Check size={12} style={{ color: '#f59e0b' }} />
          )}
          <span style={{ fontSize: '10px', color: '#636466' }}>{passes ? 'Pass' : 'Fail'}</span>
        </div>
        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#636466' }}>{ratio}</span>
      </div>
    </div>
  );
}
