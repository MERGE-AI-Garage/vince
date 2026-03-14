// ABOUTME: Compact expandable color swatch for the sidebar
// ABOUTME: Shows color name + HEX collapsed; expands to show PMS/CMYK/RGB/HEX with copy

import { useState } from 'react';
import { Copy, Check, ChevronDown } from 'lucide-react';

interface ColorInfo {
  name: string;
  pms: string;
  cmyk: string;
  rgb: string;
  hex: string;
  uses: string[];
}

interface ColorCardProps {
  color: ColorInfo;
}

export function ColorCard({ color }: ColorCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedValue(text);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const values = [
    { label: 'PMS', value: color.pms },
    { label: 'CMYK', value: color.cmyk },
    { label: 'RGB', value: color.rgb },
    { label: 'HEX', value: color.hex },
  ];

  return (
    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)', background: '#ffffff' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
          padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', fontFamily: 'Epilogue, system-ui, sans-serif',
        }}
      >
        <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: color.hex, flexShrink: 0, border: '1px solid rgba(0,0,0,0.08)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111111' }}>{color.name}</div>
          <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>{color.hex}</div>
        </div>
        <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', color: '#6b7280', flexShrink: 0 }} />
      </button>
      {expanded && (
        <div style={{ padding: '0 10px 10px', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '8px' }}>
            {values.map(({ label, value }) => (
              <button
                key={label}
                onClick={(e) => copyToClipboard(value, e)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '4px 6px', borderRadius: '4px', border: 'none',
                  background: copiedValue === value ? 'rgba(139,92,246,0.07)' : 'rgba(0,0,0,0.02)',
                  cursor: 'pointer', width: '100%', fontSize: '12px',
                  fontFamily: 'Epilogue, system-ui, sans-serif', color: '#111111',
                }}
              >
                <span><span style={{ fontWeight: 600, marginRight: '6px' }}>{label}</span>{value}</span>
                {copiedValue === value ? <Check size={12} color="#8b5cf6" /> : <Copy size={12} style={{ opacity: 0.4 }} />}
              </button>
            ))}
          </div>
          {color.uses.length > 0 && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#8b5cf6', marginBottom: '2px' }}>Uses</div>
              {color.uses.map((use, i) => (<div key={i} style={{ fontSize: '11px', color: '#6b7280' }}>{use}</div>))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
