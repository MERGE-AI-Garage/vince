// ABOUTME: Displays generated video results in the extension chat.
// ABOUTME: Renders video players with purple border; opens full size on click.

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface Props {
  videoUrls: string[];
}

export function VideoResultCard({ videoUrls }: Props) {
  if (!videoUrls.length) return null;

  return (
    <div style={{ fontFamily: 'Epilogue, system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {videoUrls.map((url, i) => (
        <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(0,0,0,0.2)', position: 'relative' }}>
          <video
            src={url}
            controls
            autoPlay
            loop
            muted
            style={{ width: '100%', display: 'block' }}
          />
          <button
            onClick={() => window.open(url, '_blank')}
            title="Open full size"
            style={{ position: 'absolute', top: '6px', right: '6px', padding: '3px 8px', fontSize: '9px', fontWeight: 600, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#e0ded9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'Epilogue, system-ui, sans-serif' }}
          >
            <ExternalLink size={9} /> Open
          </button>
        </div>
      ))}
    </div>
  );
}
