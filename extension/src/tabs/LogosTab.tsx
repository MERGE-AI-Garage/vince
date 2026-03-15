// ABOUTME: Full logo library browser for the selected brand
// ABOUTME: Searchable, filterable grid/list with inline rename, background preview, copy and download

import { useState, useRef } from 'react';
import { Download, Search, Check, Pencil, ImageOff, Copy, LayoutGrid, List } from 'lucide-react';
import { useBrandLogos, type BrandLogo } from '../hooks/useBrandLogos';

const BG_PRESETS = [
  { key: 'white', color: '#ffffff', ringColor: 'rgba(0,0,0,0.15)', label: 'White' },
  { key: 'light', color: '#f0f0ee', ringColor: 'rgba(0,0,0,0.1)', label: 'Light' },
  { key: 'dark', color: '#111111', ringColor: 'rgba(255,255,255,0.15)', label: 'Dark' },
];

function logoLabel(logo: BrandLogo): string {
  if (logo.notes) return logo.notes;
  if (logo.is_default) return 'Primary Wordmark';
  if (logo.lockup === 'monogram') return 'Monogram / Lettermark';
  if (logo.lockup === 'stacked') return 'Stacked Lockup';
  if (logo.lockup === 'horizontal') return 'Horizontal Lockup';
  if (logo.lockup === 'wordmark') return 'Wordmark';
  const parts: string[] = [];
  if (logo.lockup) parts.push(logo.lockup.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
  if (logo.variant) parts.push(logo.variant.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
  return parts.length > 0 ? parts.join(' · ') : 'Untitled';
}

// Only show the lockup badge when the logo hasn't been given a custom name
function lockupBadge(logo: BrandLogo): string {
  if (logo.notes) return ''; // Custom name takes over — hide the raw lockup
  const src = logo.lockup || logo.variant || '';
  return src.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function copyImageToClipboard(url: string): Promise<'copied' | 'url'> {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    // Clipboard API only accepts image/png directly; convert other types via canvas
    if (blob.type === 'image/png') {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return 'copied';
    }
    // For SVG/JPEG/WebP: render to canvas → PNG blob
    const imgEl = new Image();
    const objectUrl = URL.createObjectURL(blob);
    await new Promise<void>((resolve, reject) => {
      imgEl.onload = () => resolve();
      imgEl.onerror = reject;
      imgEl.src = objectUrl;
    });
    URL.revokeObjectURL(objectUrl);
    const canvas = document.createElement('canvas');
    canvas.width = imgEl.naturalWidth || 512;
    canvas.height = imgEl.naturalHeight || 512;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(imgEl, 0, 0);
    const pngBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('canvas empty')), 'image/png')
    );
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
    return 'copied';
  } catch {
    // Fallback: copy URL as text
    await navigator.clipboard.writeText(url).catch(() => {});
    return 'url';
  }
}

// ─── Logo Card (grid view) ────────────────────────────────────────────────────

interface CardProps {
  logo: BrandLogo;
  brandColor: string;
  onRename: (id: string, notes: string) => Promise<boolean>;
  compact?: boolean;
}

function LogoCard({ logo, brandColor, onRename, compact = false }: CardProps) {
  const [bgIdx, setBgIdx] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<'saved' | 'copied' | 'url' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bg = BG_PRESETS[bgIdx];

  function startEdit() {
    setDraft(logoLabel(logo));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  async function commit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === logoLabel(logo)) { setEditing(false); return; }
    setSaving(true);
    const ok = await onRename(logo.id, trimmed);
    setSaving(false);
    setEditing(false);
    if (ok) { setFeedback('saved'); setTimeout(() => setFeedback(null), 1800); }
  }

  async function handleCopy() {
    const result = await copyImageToClipboard(logo.url);
    setFeedback(result);
    setTimeout(() => setFeedback(null), 1800);
  }

  const badge = lockupBadge(logo);
  const iconColor = bg.key === 'dark' ? 'rgba(255,255,255,0.65)' : '#374151';
  const btnBg = bg.key === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)';

  return (
    <div style={{
      background: '#ffffff', borderRadius: '14px', overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.06)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Preview */}
      <div style={{
        background: bg.color, height: compact ? '68px' : '120px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: compact ? '8px' : '16px', position: 'relative', transition: 'background 0.2s ease',
      }}>
        <img src={logo.url} alt={logoLabel(logo)} style={{ maxHeight: compact ? '44px' : '72px', maxWidth: '100%', objectFit: 'contain' }} />
        {logo.is_default && (
          <div style={{
            position: 'absolute', top: '5px', left: '5px',
            fontSize: '6px', fontWeight: 800, letterSpacing: '0.06em',
            background: brandColor, color: '#ffffff',
            padding: '1px 5px', borderRadius: '999px', textTransform: 'uppercase',
          }}>PRIMARY</div>
        )}
        {/* Action buttons top-right */}
        <div style={{ position: 'absolute', top: compact ? '4px' : '8px', right: compact ? '4px' : '8px', display: 'flex', gap: '4px' }}>
          <button
            onClick={handleCopy}
            title="Copy image to clipboard"
            style={{ width: compact ? '22px' : '26px', height: compact ? '22px' : '26px', borderRadius: '6px', background: btnBg, backdropFilter: 'blur(4px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {feedback === 'copied' || feedback === 'url'
              ? <Check size={compact ? 9 : 11} style={{ color: '#22c55e' }} />
              : <Copy size={compact ? 9 : 11} style={{ color: iconColor }} />
            }
          </button>
          {!compact && (
            <a href={logo.url} download target="_blank" rel="noreferrer" title="Download"
              style={{ width: '26px', height: '26px', borderRadius: '6px', background: btnBg, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
            >
              <Download size={11} style={{ color: iconColor }} />
            </a>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: compact ? '5px 7px 7px' : '9px 11px 11px' }}>
        {editing ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
            <input
              ref={inputRef} value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
              style={{ flex: 1, fontSize: compact ? '9px' : '11px', fontWeight: 600, border: `1.5px solid ${brandColor}`, borderRadius: '5px', padding: '2px 5px', outline: 'none', fontFamily: 'Epilogue, system-ui, sans-serif', color: '#111', background: '#fff' }}
              autoFocus
            />
            {saving && <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: `1.5px solid ${brandColor}`, borderTopColor: 'transparent', animation: 'logospin 0.6s linear infinite', flexShrink: 0 }} />}
          </div>
        ) : (
          <button onClick={startEdit} title="Click to rename"
            style={{ background: 'none', border: 'none', padding: '0 0 3px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', width: '100%', textAlign: 'left' }}
          >
            <span style={{ fontSize: compact ? '9px' : '11px', fontWeight: 700, color: '#111', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
              {feedback === 'saved' ? <><Check size={8} style={{ color: '#22c55e', verticalAlign: 'middle', marginRight: '2px' }} />Saved</> : logoLabel(logo)}
            </span>
            <Pencil size={8} style={{ color: '#d1d5db', flexShrink: 0 }} />
          </button>
        )}

        {/* Lockup badge — hidden when logo has a custom name or in compact mode */}
        {badge && !compact && (
          <div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            {badge}
          </div>
        )}

        {/* Background toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '4px' : '5px' }}>
          {BG_PRESETS.map((opt, i) => (
            <button key={opt.key} onClick={() => setBgIdx(i)} title={`${opt.label} background`}
              style={{ width: compact ? '10px' : '14px', height: compact ? '10px' : '14px', borderRadius: '50%', background: opt.color, border: i === bgIdx ? `2px solid ${brandColor}` : `1px solid ${opt.ringColor}`, cursor: 'pointer', padding: 0, transition: 'border 0.1s ease', flexShrink: 0 }}
            />
          ))}
          {!compact && <span style={{ fontSize: '9px', color: '#c4c4c0', marginLeft: '1px' }}>{BG_PRESETS[bgIdx].label}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Logo Row (list view) ─────────────────────────────────────────────────────

function LogoRow({ logo, brandColor, onRename }: CardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<'saved' | 'copied' | 'url' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setDraft(logoLabel(logo));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  async function commit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === logoLabel(logo)) { setEditing(false); return; }
    setSaving(true);
    const ok = await onRename(logo.id, trimmed);
    setSaving(false);
    setEditing(false);
    if (ok) { setFeedback('saved'); setTimeout(() => setFeedback(null), 1800); }
  }

  async function handleCopy() {
    const result = await copyImageToClipboard(logo.url);
    setFeedback(result);
    setTimeout(() => setFeedback(null), 1800);
  }

  const badge = lockupBadge(logo);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 14px',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
      background: '#ffffff',
    }}>
      {/* Thumbnail */}
      <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#f5f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <img src={logo.url} alt={logoLabel(logo)} style={{ maxWidth: '38px', maxHeight: '38px', objectFit: 'contain' }} />
      </div>

      {/* Name + badge */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <input
              ref={inputRef} value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
              style={{ flex: 1, fontSize: '12px', fontWeight: 600, border: `1.5px solid ${brandColor}`, borderRadius: '5px', padding: '3px 7px', outline: 'none', fontFamily: 'Epilogue, system-ui, sans-serif', color: '#111', background: '#fff' }}
              autoFocus
            />
            {saving && <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: `1.5px solid ${brandColor}`, borderTopColor: 'transparent', animation: 'logospin 0.6s linear infinite', flexShrink: 0 }} />}
          </div>
        ) : (
          <button onClick={startEdit} title="Rename"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', maxWidth: '100%', textAlign: 'left' }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {feedback === 'saved' ? <><Check size={10} style={{ color: '#22c55e', verticalAlign: 'middle', marginRight: '3px' }} />Saved</> : logoLabel(logo)}
            </span>
            <Pencil size={9} style={{ color: '#d1d5db', flexShrink: 0 }} />
          </button>
        )}
        {badge && <div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>{badge}</div>}
        {logo.is_default && (
          <div style={{ display: 'inline-block', fontSize: '7px', fontWeight: 800, background: brandColor, color: '#fff', padding: '1px 5px', borderRadius: '3px', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PRIMARY</div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <button onClick={handleCopy} title="Copy image"
          style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(0,0,0,0.05)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          {feedback === 'copied' || feedback === 'url'
            ? <Check size={12} style={{ color: '#22c55e' }} />
            : <Copy size={12} style={{ color: '#6b7280' }} />
          }
        </button>
        <a href={logo.url} download target="_blank" rel="noreferrer" title="Download"
          style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
        >
          <Download size={12} style={{ color: '#6b7280' }} />
        </a>
      </div>
    </div>
  );
}

// ─── Tab ─────────────────────────────────────────────────────────────────────

interface LogosTabProps {
  brandId: string | null;
  brandColor?: string;
}

export function LogosTab({ brandId, brandColor = '#8b5cf6' }: LogosTabProps) {
  const { logos, isLoading, rename } = useBrandLogos(brandId);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [gridSize, setGridSize] = useState<'sm' | 'lg'>('sm');

  const lockupTypes = Array.from(
    new Set(logos.map(l => l.lockup).filter((l): l is string => !!l))
  );

  const filtered = logos.filter(logo => {
    const label = logoLabel(logo).toLowerCase();
    const matchSearch = !search
      || label.includes(search.toLowerCase())
      || (logo.variant || '').toLowerCase().includes(search.toLowerCase())
      || (logo.lockup || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || logo.lockup === filter;
    return matchSearch && matchFilter;
  });

  if (!brandId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '48px 24px', color: '#9ca3af', fontSize: '13px', fontFamily: 'Epilogue, system-ui, sans-serif' }}>
        Select a brand to view logos
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.07)', padding: '12px 14px' }}>
        {/* Search + view toggle */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: lockupTypes.length > 1 ? '9px' : '0' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#b0b0ac', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search logos..."
              style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '30px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', fontSize: '12px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', outline: 'none', fontFamily: 'Epilogue, system-ui, sans-serif', background: '#f9f9f8', color: '#111' }}
            />
          </div>
          {/* Grid / List toggle */}
          <div style={{ display: 'flex', borderRadius: '7px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }}>
            {(['grid', 'list'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                title={mode === 'grid' ? 'Grid view' : 'List view'}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', background: viewMode === mode ? brandColor : 'transparent', transition: 'background 0.1s ease' }}
              >
                {mode === 'grid'
                  ? <LayoutGrid size={13} style={{ color: viewMode === mode ? '#fff' : '#9ca3af' }} />
                  : <List size={13} style={{ color: viewMode === mode ? '#fff' : '#9ca3af' }} />
                }
              </button>
            ))}
          </div>
          {/* Grid size toggle — only shown in grid view */}
          {viewMode === 'grid' && (
            <div style={{ display: 'flex', borderRadius: '7px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }}>
              {(['sm', 'lg'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setGridSize(size)}
                  title={size === 'sm' ? 'Compact grid' : 'Large grid'}
                  style={{ width: '28px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', background: gridSize === size ? brandColor : 'transparent', transition: 'background 0.1s ease', fontSize: '9px', fontWeight: 700, color: gridSize === size ? '#fff' : '#9ca3af', fontFamily: 'Epilogue, system-ui, sans-serif', letterSpacing: '0.02em' }}
                >
                  {size === 'sm' ? 'S' : 'L'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter chips — only when multiple lockup types exist */}
        {lockupTypes.length > 1 && (
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {(['all', ...lockupTypes] as string[]).map(type => {
              const count = type === 'all' ? logos.length : logos.filter(l => l.lockup === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  style={{ fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '999px', border: `1px solid ${filter === type ? brandColor : 'rgba(0,0,0,0.09)'}`, background: filter === type ? brandColor : 'transparent', color: filter === type ? '#ffffff' : '#6b7280', cursor: 'pointer', fontFamily: 'Epilogue, system-ui, sans-serif', textTransform: 'capitalize', transition: 'all 0.1s ease' }}
                >
                  {type === 'all' ? 'All' : type.replace(/_/g, ' ')}
                  <span style={{ opacity: 0.65, marginLeft: '3px' }}>({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', background: viewMode === 'grid' ? '#f5f5f3' : '#ffffff' }}>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: gridSize === 'sm' ? '1fr 1fr 1fr' : '1fr 1fr', gap: gridSize === 'sm' ? '8px' : '12px', padding: gridSize === 'sm' ? '10px' : '14px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ background: '#e8e8e6', borderRadius: '10px', height: gridSize === 'sm' ? '100px' : '180px', animation: `logopulse 1.5s ease ${i * 0.1}s infinite` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: '10px' }}>
            <ImageOff size={28} style={{ color: '#d1d5db' }} />
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', fontFamily: 'Epilogue, system-ui, sans-serif' }}>
              {search ? 'No logos match your search' : 'No logos in library'}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: gridSize === 'sm' ? '1fr 1fr 1fr' : '1fr 1fr', gap: gridSize === 'sm' ? '8px' : '12px', padding: gridSize === 'sm' ? '10px' : '14px' }}>
            {filtered.map(logo => (
              <LogoCard key={logo.id} logo={logo} brandColor={brandColor} onRename={rename} compact={gridSize === 'sm'} />
            ))}
          </div>
        ) : (
          <div>
            {filtered.map(logo => (
              <LogoRow key={logo.id} logo={logo} brandColor={brandColor} onRename={rename} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes logopulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
        @keyframes logospin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
