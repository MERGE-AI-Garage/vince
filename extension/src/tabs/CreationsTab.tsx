// ABOUTME: Media gallery for Creative Studio generations — images, campaigns, videos
// ABOUTME: Filter by type, lazy-loaded grid, rich detail view with provenance and copy support

import { useState, useRef } from 'react';
import { Download, Sparkles, ChevronLeft, Copy, Check, Info, Clock, Cpu } from 'lucide-react';
import { useCreations, type Generation } from '../hooks/useCreations';

// ─── Utilities ───────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

type FilterType = 'all' | 'text_to_image' | 'creative_package' | 'text_to_video' | 'brand_card';

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  text_to_image:    { label: 'Image',      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  creative_package: { label: 'Campaign',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
  text_to_video:    { label: 'Video',      color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  brand_card:       { label: 'Brand Card', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
};

function typeConfig(type: string) {
  return TYPE_CONFIG[type] ?? {
    label: type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    color: '#6b7280', bg: 'rgba(0,0,0,0.06)',
  };
}

// ─── Lazy image ───────────────────────────────────────────────────────────────

function LazyImg({ src, alt, style }: { src: string; alt: string; style?: React.CSSProperties }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#e8e8e6' }}>
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #e8e8e6 25%, #f0f0ee 50%, #e8e8e6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease infinite' }} />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{ ...style, opacity: loaded ? 1 : 0, transition: 'opacity 0.2s ease' }}
      />
    </div>
  );
}

// ─── Video thumbnail ──────────────────────────────────────────────────────────

function VideoThumb({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasThumb, setHasThumb] = useState(false);

  return (
    <div style={{ width: '100%', height: '100%', background: '#111', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        muted
        playsInline
        onLoadedMetadata={() => setHasThumb(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: hasThumb ? 'block' : 'none' }}
      />
      {!hasThumb && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '5px 0 5px 9px', borderColor: 'transparent transparent transparent rgba(255,255,255,0.5)', marginLeft: '2px' }} />
          </div>
          <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>VIDEO</span>
        </div>
      )}
      {/* Play overlay indicator */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '6px 0 6px 10px', borderColor: 'transparent transparent transparent rgba(255,255,255,0.85)', marginLeft: '2px' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Campaign thumbnail grid ──────────────────────────────────────────────────

function CampaignGrid({ urls }: { urls: string[] }) {
  const shown = urls.slice(0, 4);
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: shown.length === 1 ? '1fr' : '1fr 1fr',
      gap: '2px', width: '100%', aspectRatio: '1',
      borderRadius: '8px 8px 0 0', overflow: 'hidden', background: '#1a1a1a',
    }}>
      {shown.map((url, i) => (
        <div key={i} style={{ overflow: 'hidden', background: '#222', position: 'relative' }}>
          <LazyImg src={url} alt={`Asset ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ))}
      {urls.length > 4 && (
        <div style={{ position: 'absolute', bottom: '7px', right: '7px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', borderRadius: '999px', padding: '2px 8px', fontSize: '9px', fontWeight: 700, color: '#ffffff' }}>
          +{urls.length - 4}
        </div>
      )}
    </div>
  );
}

// ─── Generation card ──────────────────────────────────────────────────────────

function GenerationCard({ item, brandColor, onOpen }: { item: Generation; brandColor: string; onOpen: () => void }) {
  const urls = item.output_urls ?? [];
  const isVideo = item.generation_type === 'text_to_video';
  const isCampaign = item.generation_type === 'creative_package';
  const cfg = typeConfig(item.generation_type);
  const deliverableNames = (item.metadata?.deliverable_names as string[] | undefined) ?? [];

  return (
    <button
      onClick={onOpen}
      style={{ background: '#ffffff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', width: '100%' }}
    >
      {/* Thumbnail */}
      <div style={{ width: '100%', aspectRatio: '1', borderRadius: '8px 8px 0 0', overflow: 'hidden', position: 'relative' }}>
        {isCampaign && urls.length > 1 ? (
          <CampaignGrid urls={urls} />
        ) : isVideo && urls[0] ? (
          <VideoThumb src={urls[0]} />
        ) : urls[0] ? (
          <LazyImg src={urls[0]} alt="Generated image" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#f0f0ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={22} style={{ color: '#d1d5db' }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '8px 10px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
          <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: cfg.color, background: cfg.bg, padding: '2px 6px', borderRadius: '999px' }}>
            {cfg.label}
          </span>
          {isCampaign && urls.length > 0 && (
            <span style={{ fontSize: '8px', fontWeight: 600, color: '#9ca3af' }}>{urls.length} assets</span>
          )}
          <span style={{ fontSize: '8px', color: '#c8c8c4', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{formatRelative(item.created_at)}</span>
        </div>

        {item.prompt_text && (
          <p style={{ fontSize: '10px', lineHeight: 1.45, color: '#6b7280', margin: '0 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.prompt_text}
          </p>
        )}

        {/* Deliverable name chips */}
        {isCampaign && deliverableNames.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '4px' }}>
            {deliverableNames.slice(0, 3).map((name, i) => (
              <span key={i} style={{ fontSize: '8px', fontWeight: 600, background: 'rgba(0,0,0,0.04)', color: '#6b7280', padding: '1px 5px', borderRadius: '3px', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name}
              </span>
            ))}
            {deliverableNames.length > 3 && (
              <span style={{ fontSize: '8px', color: '#9ca3af' }}>+{deliverableNames.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ url, dark = false }: { url: string; dark?: boolean }) {
  const [state, setState] = useState<'idle' | 'copied'>('idle');

  async function handleCopy() {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      if (blob.type === 'image/png') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } else {
        // Rasterize to PNG via canvas
        const imgEl = new Image();
        const objectUrl = URL.createObjectURL(blob);
        await new Promise<void>((res, rej) => { imgEl.onload = () => res(); imgEl.onerror = rej; imgEl.src = objectUrl; });
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        canvas.width = imgEl.naturalWidth || 512;
        canvas.height = imgEl.naturalHeight || 512;
        canvas.getContext('2d')!.drawImage(imgEl, 0, 0);
        const pngBlob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(), 'image/png'));
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      }
    } catch {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
    setState('copied');
    setTimeout(() => setState('idle'), 1800);
  }

  const iconColor = dark ? 'rgba(255,255,255,0.6)' : '#374151';
  const bg = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  return (
    <button onClick={handleCopy} title="Copy image to clipboard"
      style={{ width: '30px', height: '30px', borderRadius: '7px', background: bg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
    >
      {state === 'copied' ? <Check size={13} style={{ color: '#22c55e' }} /> : <Copy size={13} style={{ color: iconColor }} />}
    </button>
  );
}

// ─── Detail view ──────────────────────────────────────────────────────────────

function DetailView({ item, brandColor, onClose }: { item: Generation; brandColor: string; onClose: () => void }) {
  const urls = item.output_urls ?? [];
  const [idx, setIdx] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const cfg = typeConfig(item.generation_type);
  const deliverableNames = (item.metadata?.deliverable_names as string[] | undefined) ?? [];
  const deliverableTypes = (item.metadata?.deliverable_types as string[] | undefined) ?? [];
  const deliverablePlatforms = (item.metadata?.platforms as string[] | undefined) ?? [];
  const isVideo = item.generation_type === 'text_to_video';
  const currentUrl = urls[idx];
  const currentName = deliverableNames[idx];
  const currentType = deliverableTypes[idx];
  const currentPlatform = deliverablePlatforms[idx];

  // Extract useful parameters
  const params = item.parameters ?? {};
  const aspectRatio = params.aspect_ratio as string | undefined;
  const resolution = params.resolution as string | undefined;
  const duration = params.duration as string | undefined;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 30, background: '#0d0d0d', display: 'flex', flexDirection: 'column', fontFamily: 'Epilogue, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', gap: '8px', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ChevronLeft size={15} style={{ color: 'rgba(255,255,255,0.6)' }} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: cfg.color, background: cfg.bg, padding: '2px 7px', borderRadius: '999px' }}>
              {cfg.label}
            </span>
            {currentName && (
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentName}
              </span>
            )}
          </div>
          {(currentType || currentPlatform) && (
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
              {[currentType, currentPlatform].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{formatRelative(item.created_at)}</span>
        {/* Info toggle */}
        <button onClick={() => setShowInfo(!showInfo)} title="Show provenance"
          style={{ width: '30px', height: '30px', borderRadius: '7px', background: showInfo ? `${brandColor}30` : 'rgba(255,255,255,0.08)', border: `1px solid ${showInfo ? brandColor : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <Info size={13} style={{ color: showInfo ? brandColor : 'rgba(255,255,255,0.5)' }} />
        </button>
        {currentUrl && <CopyBtn url={currentUrl} dark />}
        {currentUrl && (
          <a href={currentUrl} download target="_blank" rel="noreferrer"
            style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}
            title="Download"
          >
            <Download size={13} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </a>
        )}
      </div>

      {/* Main image */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        {currentUrl && !isVideo && (
          <img src={currentUrl} alt={currentName || ''} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '10px' }} />
        )}
        {currentUrl && isVideo && (
          <video src={currentUrl} controls style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '10px' }} />
        )}
        {!currentUrl && (
          <Sparkles size={32} style={{ color: 'rgba(255,255,255,0.15)' }} />
        )}
      </div>

      {/* Thumbnail strip — multi-image generations */}
      {urls.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', padding: '0 12px 10px', overflowX: 'auto', flexShrink: 0 }}>
          {urls.map((url, i) => (
            <button key={i} onClick={() => setIdx(i)}
              style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: '7px', overflow: 'hidden', border: `2px solid ${i === idx ? brandColor : 'transparent'}`, transition: 'border-color 0.1s ease', background: '#222' }}>
                {item.generation_type === 'text_to_video'
                  ? <div style={{ width: '100%', height: '100%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '5px 0 5px 9px', borderColor: 'transparent transparent transparent rgba(255,255,255,0.4)' }} /></div>
                  : <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                }
              </div>
              {deliverableNames[i] && (
                <span style={{ fontSize: '8px', color: i === idx ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', maxWidth: '52px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  {deliverableNames[i]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Provenance panel */}
      {showInfo && (
        <div style={{ background: '#111', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 14px', flexShrink: 0, maxHeight: '45%', overflowY: 'auto' }}>
          {/* Prompt */}
          {item.prompt_text && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>Prompt</div>
              <p style={{ fontSize: '11px', lineHeight: 1.55, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{item.prompt_text}</p>
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: item.model_used ? '10px' : '0' }}>
            {item.model_used && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '4px 8px' }}>
                <Cpu size={10} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{item.model_used}</span>
              </div>
            )}
            {item.generation_time_ms && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '4px 8px' }}>
                <Clock size={10} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{formatMs(item.generation_time_ms)}</span>
              </div>
            )}
            {aspectRatio && (
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '4px 8px' }}>
                <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{aspectRatio}</span>
              </div>
            )}
            {resolution && (
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '4px 8px' }}>
                <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{resolution}</span>
              </div>
            )}
            {duration && (
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '4px 8px' }}>
                <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{duration}s</span>
              </div>
            )}
          </div>

          {/* All deliverables list for campaigns */}
          {deliverableNames.length > 0 && (
            <div>
              <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>
                Deliverables ({deliverableNames.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {deliverableNames.map((name, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '6px', background: i === idx ? `${brandColor}20` : 'rgba(255,255,255,0.04)', cursor: 'pointer' }} onClick={() => setIdx(i)}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, background: '#333' }}>
                      {urls[i] && <img src={urls[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: i === idx ? '#ffffff' : 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      {(deliverableTypes[i] || deliverablePlatforms[i]) && (
                        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)' }}>
                          {[deliverableTypes[i], deliverablePlatforms[i]].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                    {urls[i] && <CopyBtn url={urls[i]} dark />}
                    {urls[i] && (
                      <a href={urls[i]} download target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                        style={{ width: '26px', height: '26px', borderRadius: '5px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}
                      >
                        <Download size={11} style={{ color: 'rgba(255,255,255,0.4)' }} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Created at */}
          <div style={{ marginTop: '10px', fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>
            Generated {formatDate(item.created_at)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab ──────────────────────────────────────────────────────────────────────

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'text_to_image', label: 'Images' },
  { id: 'creative_package', label: 'Campaigns' },
  { id: 'text_to_video', label: 'Videos' },
];

interface CreationsTabProps {
  brandId: string | null;
  brandColor?: string;
}

export function CreationsTab({ brandId, brandColor = '#8b5cf6' }: CreationsTabProps) {
  const { items, isLoading } = useCreations(brandId);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selected, setSelected] = useState<Generation | null>(null);

  const visibleFilters = FILTERS.filter(
    f => f.id === 'all' || items.some(i => i.generation_type === f.id)
  );

  const filtered = items.filter(item => filter === 'all' || item.generation_type === filter);

  if (!brandId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '48px 24px', color: '#9ca3af', fontSize: '13px', fontFamily: 'Epilogue, system-ui, sans-serif' }}>
        Select a brand to view creations
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Filter strip */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.07)', padding: '10px 14px', display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
        {visibleFilters.map(f => {
          const count = f.id === 'all' ? items.length : items.filter(i => i.generation_type === f.id).length;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ fontSize: '10px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', border: `1px solid ${filter === f.id ? brandColor : 'rgba(0,0,0,0.09)'}`, background: filter === f.id ? brandColor : 'transparent', color: filter === f.id ? '#ffffff' : '#6b7280', cursor: 'pointer', fontFamily: 'Epilogue, system-ui, sans-serif', transition: 'all 0.1s ease' }}
            >
              {f.label} <span style={{ opacity: 0.65 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f5f5f3' }}>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ background: '#e8e8e6', borderRadius: '14px', height: '190px', animation: `createpulse 1.5s ease ${i * 0.08}s infinite` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: '12px' }}>
            <Sparkles size={32} style={{ color: '#d8d8d5' }} />
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', fontFamily: 'Epilogue, system-ui, sans-serif' }}>No creations yet</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', maxWidth: '200px', fontFamily: 'Epilogue, system-ui, sans-serif', lineHeight: 1.5 }}>
              Generate images and campaigns in Creative Studio to see them here
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px' }}>
            {filtered.map(item => (
              <GenerationCard key={item.id} item={item} brandColor={brandColor} onOpen={() => setSelected(item)} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <DetailView item={selected} brandColor={brandColor} onClose={() => setSelected(null)} />
      )}

      <style>{`
        @keyframes createpulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </div>
  );
}
