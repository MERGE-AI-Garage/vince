// ABOUTME: Renders a creative package result (text + images) in the extension.
// ABOUTME: Adapted from main app's CreativePackageDisplay — inline styles, "Open full size" instead of canvas.

import React, { useState } from 'react';
import { Download, Copy, Check, Layers, Clock, Sparkles, ShieldCheck } from 'lucide-react';

export interface PackagePart {
  type: 'text' | 'image';
  content?: string;
  image_base64?: string;
  mime_type?: string;
}

interface BrandAlignment {
  score: number;
  dimensions: {
    visual_identity: boolean;
    photography: boolean;
    color_system: boolean;
    brand_voice: boolean;
  };
}

interface DeliverableGroup {
  name: string;
  index: number;
  text?: string;
  imageUrl?: string;
}

interface Props {
  parts: PackagePart[];
  imageUrls: string[];
  latencyMs: number;
  brandName: string;
  model: string;
  brief?: string;
  deliverableNames?: string[];
  brandAlignment?: BrandAlignment;
}

function cleanCopyText(text: string): string {
  return text
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\*{2,3}\s*Deliverable\s*\d+[^*\n]*\*{0,3}\s*\n?/im, '')
    .replace(/^\d+\.\s+[A-Z][^\n]*\n/m, '')
    .replace(/^Here is the complete creative package[^\n]*\n?/im, '')
    .replace(/^\*{1,2}Copy:\*{1,2}\s*/i, '')
    .replace(/\s*\*{1,2}Image:\*{1,2}\s*$/i, '')
    .trim();
}

function renderCopyText(text: string): React.ReactNode {
  const hasStructuredFields = /\*{1,2}(Headline|Subheadline|CTA|Caption|Button|Body|Tagline)[^*]*\*{1,2}:/i.test(text);

  if (hasStructuredFields) {
    const lines = text.split(/(?=\*{1,2}(?:Headline|Subheadline|CTA|Caption|Button|Body|Tagline)[^*]*\*{1,2}:)/i);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {lines.map((line, i) => {
          const fieldMatch = line.match(/^\*{1,2}([\w\s]+)\*{1,2}:\s*([\s\S]*)/i);
          if (fieldMatch) {
            const label = fieldMatch[1].trim();
            const value = fieldMatch[2].trim().replace(/\*{1,2}/g, '');
            const isHeadline = /headline/i.test(label);
            const isCTA = /cta|button/i.test(label);
            return (
              <div key={i}>
                <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(139,92,246,0.6)', display: 'block', marginBottom: '2px' }}>{label}</span>
                <p style={{ margin: 0, fontSize: isHeadline ? '13px' : '11px', fontWeight: isHeadline ? 700 : isCTA ? 600 : 400, color: isCTA ? '#a78bfa' : '#e0ded9', lineHeight: 1.4 }}>{value}</p>
              </div>
            );
          }
          const stripped = line.replace(/\*{1,2}/g, '').trim();
          return stripped ? <p key={i} style={{ margin: 0, fontSize: '11px', color: 'rgba(224,222,217,0.85)', lineHeight: 1.5 }}>{stripped}</p> : null;
        })}
      </div>
    );
  }

  // Plain copy — handle bold spans
  const parts = text.split(/(\*{1,2}[^*]+\*{1,2})/g);
  return (
    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(224,222,217,0.85)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
      {parts.map((part, i) => {
        const bold = part.match(/^\*{1,2}([^*]+)\*{1,2}$/);
        return bold
          ? <strong key={i} style={{ fontWeight: 600, color: '#e0ded9' }}>{bold[1]}</strong>
          : <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </p>
  );
}

function groupParts(parts: PackagePart[], deliverableNames: string[]): DeliverableGroup[] {
  const groups: DeliverableGroup[] = [];
  let pendingText: string | undefined;
  let imageIndex = 0;

  for (const part of parts) {
    if (part.type === 'text' && part.content) {
      if (pendingText !== undefined) {
        groups.push({ name: deliverableNames[imageIndex] || `Deliverable ${imageIndex + 1}`, index: imageIndex, text: pendingText });
      }
      pendingText = cleanCopyText(part.content);
    } else if (part.type === 'image') {
      const imageUrl = part.content || (part.image_base64
        ? `data:${part.mime_type || 'image/png'};base64,${part.image_base64}`
        : undefined);
      groups.push({ name: deliverableNames[imageIndex] || `Deliverable ${imageIndex + 1}`, index: imageIndex, text: pendingText, imageUrl });
      pendingText = undefined;
      imageIndex++;
    }
  }

  if (pendingText !== undefined) {
    groups.push({ name: deliverableNames[imageIndex] || 'Package Notes', index: imageIndex, text: pendingText });
  }

  return groups;
}

export function CreativePackageCard({ parts, imageUrls, latencyMs, brandName, model, brief, deliverableNames = [], brandAlignment }: Props) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [alignmentExpanded, setAlignmentExpanded] = useState(false);
  const imageCount = parts.filter(p => p.type === 'image').length;
  const groups = groupParts(parts, deliverableNames);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownload = (url: string, name: string, index: number) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brandName.toLowerCase().replace(/\s+/g, '-')}-${name.toLowerCase().replace(/\s+/g, '-')}-${index + 1}.png`;
    a.click();
  };

  return (
    <div style={{ fontFamily: 'Epilogue, system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', paddingBottom: '10px', borderBottom: '1px solid rgba(139,92,246,0.2)' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
            <Layers size={11} style={{ color: '#a78bfa', flexShrink: 0 }} />
            <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a78bfa' }}>Creative Package</span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#e0ded9' }}>{brandName}</p>
          {brief && <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'rgba(224,222,217,0.55)', lineHeight: 1.4 }}>{brief}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, paddingTop: '2px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9px', color: 'rgba(224,222,217,0.5)', border: '1px solid rgba(224,222,217,0.15)', borderRadius: '4px', padding: '2px 5px' }}>
            <Sparkles size={9} />{imageCount}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9px', color: 'rgba(224,222,217,0.5)', border: '1px solid rgba(224,222,217,0.15)', borderRadius: '4px', padding: '2px 5px' }}>
            <Clock size={9} />{(latencyMs / 1000).toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Brand Alignment — collapsed by default, expand to see dimension breakdown */}
      {brandAlignment && (() => {
        const { score, dimensions } = brandAlignment;
        const tier = score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low';
        const color = tier === 'high' ? '#34d399' : tier === 'mid' ? '#fbbf24' : '#f87171';
        const bg = tier === 'high' ? 'rgba(52,211,153,0.05)' : tier === 'mid' ? 'rgba(251,191,36,0.05)' : 'rgba(248,113,113,0.05)';
        const border = tier === 'high' ? 'rgba(52,211,153,0.2)' : tier === 'mid' ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)';
        const dimLabels = [
          { key: 'visual_identity', label: 'Visual Identity', shortLabel: 'Visual' },
          { key: 'photography', label: 'Photography', shortLabel: 'Photo' },
          { key: 'color_system', label: 'Color System', shortLabel: 'Color' },
          { key: 'brand_voice', label: 'Brand Voice', shortLabel: 'Voice' },
        ];
        const passCount = dimLabels.filter(d => dimensions[d.key as keyof typeof dimensions]).length;
        return (
          <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '6px', overflow: 'hidden' }}>
            {/* Clickable summary row */}
            <button
              onClick={() => setAlignmentExpanded(e => !e)}
              style={{ width: '100%', padding: '7px 10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Epilogue, system-ui, sans-serif' }}
            >
              <ShieldCheck size={12} style={{ color, flexShrink: 0 }} />
              <span style={{ fontSize: '10px', color: 'rgba(224,222,217,0.7)', flex: 1, textAlign: 'left' }}>Brand Alignment</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color }}>{score}%</span>
              <span style={{ fontSize: '9px', color: 'rgba(224,222,217,0.35)', marginLeft: '2px' }}>{passCount}/4</span>
              <span style={{ fontSize: '9px', color: 'rgba(224,222,217,0.3)', marginLeft: '2px' }}>{alignmentExpanded ? '▲' : '▼'}</span>
            </button>
            {/* Score bar always visible */}
            <div style={{ height: '2px', background: 'rgba(224,222,217,0.08)', margin: '0 10px 0' }}>
              <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '1px' }} />
            </div>
            {/* Expanded dimension breakdown */}
            {alignmentExpanded && (
              <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {dimLabels.map(({ key, label }) => {
                  const active = dimensions[key as keyof typeof dimensions];
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '9px', color: active ? color : '#f87171', flexShrink: 0 }}>{active ? '✓' : '✗'}</span>
                      <span style={{ fontSize: '10px', color: active ? 'rgba(224,222,217,0.8)' : 'rgba(224,222,217,0.35)', flex: 1 }}>{label}</span>
                      <span style={{ fontSize: '8px', padding: '1px 6px', borderRadius: '10px', background: active ? `${color}18` : 'rgba(248,113,113,0.1)', color: active ? color : '#f87171' }}>
                        {active ? 'Pass' : 'Miss'}
                      </span>
                    </div>
                  );
                })}
                {score === 100 && (
                  <p style={{ margin: '4px 0 0', fontSize: '9px', color: 'rgba(224,222,217,0.4)', fontStyle: 'italic' }}>
                    All brand dimensions met — fully on-brand output
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Deliverables */}
      {groups.map((group, groupIdx) => (
        <div key={groupIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Section label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a78bfa', flexShrink: 0 }}>{group.name}</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(139,92,246,0.2)' }} />
            <span style={{ fontSize: '8px', color: 'rgba(224,222,217,0.3)', flexShrink: 0 }}>{groupIdx + 1}/{groups.length}</span>
          </div>

          {/* Copy block */}
          {group.text && (
            <div style={{ position: 'relative' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '8px 28px 8px 10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                {renderCopyText(group.text)}
              </div>
              <button
                onClick={() => handleCopy(group.text!, group.index)}
                title="Copy text"
                style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(224,222,217,0.4)', borderRadius: '4px' }}
              >
                {copiedIndex === group.index ? <Check size={11} style={{ color: '#34d399' }} /> : <Copy size={11} />}
              </button>
            </div>
          )}

          {/* Image */}
          {group.imageUrl && (
            <div
              style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', cursor: 'pointer' }}
              onClick={() => window.open(imageUrls[group.index] || group.imageUrl, '_blank')}
            >
              <img src={group.imageUrl} alt={group.name} style={{ width: '100%', height: 'auto', display: 'block' }} loading="lazy" />
              {/* Hover overlay on click */}
              <div style={{ position: 'absolute', bottom: '6px', right: '6px', display: 'flex', gap: '4px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); window.open(imageUrls[group.index] || group.imageUrl, '_blank'); }}
                  style={{ padding: '3px 8px', fontSize: '9px', fontWeight: 600, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#e0ded9', cursor: 'pointer', fontFamily: 'Epilogue, system-ui, sans-serif' }}
                >
                  Open
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownload(imageUrls[group.index] || group.imageUrl!, group.name, group.index); }}
                  title="Download"
                  style={{ padding: '3px 6px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#e0ded9', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Download size={9} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Footer */}
      <div style={{ fontSize: '9px', color: 'rgba(224,222,217,0.25)', textAlign: 'right', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {model} · {(latencyMs / 1000).toFixed(1)}s
      </div>
    </div>
  );
}
