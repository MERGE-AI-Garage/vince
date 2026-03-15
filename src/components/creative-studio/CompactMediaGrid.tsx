// ABOUTME: Compact media asset browser for narrow panel contexts (extension, mobile)
// ABOUTME: Thumbnail grid with search, type filter, copy and download — no folder management

import { useState, useEffect } from 'react';
import { Search, Download, Copy, Check, Film, Music, FileText, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MediaFile {
  id: string;
  filename: string;
  title: string | null;
  url: string;
  thumbnail_url: string | null;
  file_type: string;
  mime_type: string | null;
  size_bytes: number;
  created_at: string;
}

type FileFilter = 'all' | 'image' | 'video' | 'audio' | 'document';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function copyImageToClipboard(url: string): Promise<'copied' | 'url'> {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    if (blob.type === 'image/png') {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return 'copied';
    }
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
    return 'copied';
  } catch {
    await navigator.clipboard.writeText(url).catch(() => {});
    return 'url';
  }
}

function MediaCard({ file }: { file: MediaFile }) {
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'done'>('idle');
  const [expanded, setExpanded] = useState(false);
  const isImage = file.file_type === 'image';
  const isVideo = file.file_type === 'video';
  const thumb = file.thumbnail_url || (isImage ? file.url : null);
  const displayName = file.title || file.filename;

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isImage) {
      await navigator.clipboard.writeText(file.url).catch(() => {});
      setCopyState('done');
      setTimeout(() => setCopyState('idle'), 1600);
      return;
    }
    setCopyState('copying');
    await copyImageToClipboard(file.url);
    setCopyState('done');
    setTimeout(() => setCopyState('idle'), 1600);
  }

  if (expanded) {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 20, background: '#0d0d0d',
        display: 'flex', flexDirection: 'column', fontFamily: 'Epilogue, system-ui, sans-serif',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', gap: '8px', flexShrink: 0 }}>
          <button onClick={() => setExpanded(false)}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <X size={13} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </button>
          <span style={{ flex: 1, fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </span>
          <button onClick={handleCopy}
            style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(255,255,255,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            {copyState === 'done' ? <Check size={13} style={{ color: '#22c55e' }} /> : <Copy size={13} style={{ color: 'rgba(255,255,255,0.6)' }} />}
          </button>
          <a href={file.url} download target="_blank" rel="noreferrer"
            style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}
          >
            <Download size={13} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </a>
        </div>

        {/* Preview */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflow: 'hidden' }}>
          {isImage && <img src={file.url} alt={displayName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />}
          {isVideo && <video src={file.url} controls style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }} />}
          {!isImage && !isVideo && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
              <FileText size={48} />
              <p style={{ fontSize: '12px', marginTop: '8px' }}>{displayName}</p>
            </div>
          )}
        </div>

        {/* Meta */}
        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '9px', fontWeight: 600, background: 'rgba(255,255,255,0.08)', borderRadius: '5px', padding: '3px 7px', color: 'rgba(255,255,255,0.5)' }}>
              {file.file_type}
            </span>
            <span style={{ fontSize: '9px', fontWeight: 600, background: 'rgba(255,255,255,0.08)', borderRadius: '5px', padding: '3px 7px', color: 'rgba(255,255,255,0.5)' }}>
              {formatFileSize(file.size_bytes)}
            </span>
            <span style={{ fontSize: '9px', fontWeight: 600, background: 'rgba(255,255,255,0.08)', borderRadius: '5px', padding: '3px 7px', color: 'rgba(255,255,255,0.5)' }}>
              {new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setExpanded(true)}
      style={{
        background: '#ffffff',
        borderRadius: '10px',
        overflow: 'hidden',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.15s ease',
        width: '100%',
      }}
    >
      {/* Thumbnail */}
      <div style={{ width: '100%', aspectRatio: '1', background: '#f0f0ee', overflow: 'hidden', position: 'relative' }}>
        {thumb ? (
          <img src={thumb} alt={displayName} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : isVideo ? (
          <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Film size={20} style={{ color: 'rgba(255,255,255,0.4)' }} />
          </div>
        ) : file.file_type === 'audio' ? (
          <div style={{ width: '100%', height: '100%', background: '#f0e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Music size={20} style={{ color: '#8b5cf6' }} />
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#f5f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} style={{ color: '#9ca3af' }} />
          </div>
        )}
        {/* Copy button overlay on hover */}
        <div
          className="media-card-actions"
          style={{ position: 'absolute', bottom: '4px', right: '4px', display: 'flex', gap: '3px', opacity: 0, transition: 'opacity 0.15s ease' }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={handleCopy}
            style={{ width: '24px', height: '24px', borderRadius: '5px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {copyState === 'done' ? <Check size={11} style={{ color: '#22c55e' }} /> : <Copy size={11} style={{ color: '#fff' }} />}
          </button>
          <a href={file.url} download target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
            style={{ width: '24px', height: '24px', borderRadius: '5px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
          >
            <Download size={11} style={{ color: '#fff' }} />
          </a>
        </div>
      </div>

      {/* Name */}
      <div style={{ padding: '6px 8px 8px' }}>
        <p style={{ margin: 0, fontSize: '10px', fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
          {displayName}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '9px', color: '#9ca3af' }}>
          {formatFileSize(file.size_bytes)}
        </p>
      </div>
    </button>
  );
}

const FILTERS: { id: FileFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'image', label: 'Images' },
  { id: 'video', label: 'Videos' },
  { id: 'audio', label: 'Audio' },
  { id: 'document', label: 'Docs' },
];

export function CompactMediaGrid() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FileFilter>('all');

  useEffect(() => {
    supabase
      .from('media')
      .select('id, filename, title, url, thumbnail_url, file_type, mime_type, size_bytes, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (data) setFiles(data as MediaFile[]);
        setLoading(false);
      });
  }, []);

  const filtered = files.filter(f => {
    const matchesFilter = filter === 'all' || f.file_type === filter;
    const matchesSearch = !search || f.filename.toLowerCase().includes(search.toLowerCase()) || (f.title || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const typesPresent = new Set(files.map(f => f.file_type));
  const visibleFilters = FILTERS.filter(f => f.id === 'all' || typesPresent.has(f.id));

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Epilogue, system-ui, sans-serif' }}>
      {/* Search + filters */}
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid rgba(0,0,0,0.07)', flexShrink: 0, background: '#ffffff' }}>
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search media…"
            style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '7px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '11px', outline: 'none', background: '#f5f5f3', boxSizing: 'border-box', fontFamily: 'Epilogue, system-ui, sans-serif' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {visibleFilters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{
                fontSize: '9px', fontWeight: 600, padding: '3px 8px', borderRadius: '999px',
                border: `1px solid ${filter === f.id ? '#111' : 'rgba(0,0,0,0.1)'}`,
                background: filter === f.id ? '#111' : 'transparent',
                color: filter === f.id ? '#fff' : '#6b7280',
                cursor: 'pointer', fontFamily: 'Epilogue, system-ui, sans-serif',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f5f5f3', padding: '12px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ background: '#e8e8e6', borderRadius: '10px', aspectRatio: '1', animation: 'mediapulse 1.4s ease infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', color: '#9ca3af', fontSize: '12px', textAlign: 'center' }}>
            {search ? `No files matching "${search}"` : 'No media files yet'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {filtered.map(f => <MediaCard key={f.id} file={f} />)}
          </div>
        )}
      </div>

      <style>{`
        @keyframes mediapulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        button:hover .media-card-actions, a:hover .media-card-actions { opacity: 1 !important; }
        [data-media-card]:hover .media-card-actions { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
