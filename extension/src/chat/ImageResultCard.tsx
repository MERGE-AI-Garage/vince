// ABOUTME: Displays a grid of generated images in the extension chat.
// ABOUTME: Clicking an image opens it full size in a new tab.

import React from 'react';
import { Download } from 'lucide-react';

interface Props {
  imageUrls: string[];
  prompt?: string;
}

export function ImageResultCard({ imageUrls, prompt }: Props) {
  if (!imageUrls.length) return null;

  const handleDownload = (url: string, index: number) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-image-${index + 1}.png`;
    a.click();
  };

  return (
    <div style={{ fontFamily: 'Epilogue, system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {prompt && (
        <p style={{ margin: 0, fontSize: '10px', color: 'rgba(224,222,217,0.5)', lineHeight: 1.4, fontStyle: 'italic' }}>{prompt}</p>
      )}
      <div style={{
        display: 'grid',
        gridTemplateColumns: imageUrls.length === 1 ? '1fr' : '1fr 1fr',
        gap: '6px',
      }}>
        {imageUrls.map((url, i) => (
          <div
            key={i}
            style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(0,0,0,0.2)', cursor: 'pointer' }}
            onClick={() => window.open(url, '_blank')}
          >
            <img src={url} alt={`Generated ${i + 1}`} style={{ width: '100%', height: 'auto', display: 'block' }} loading="lazy" />
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(url, i); }}
              title="Download"
              style={{ position: 'absolute', bottom: '5px', right: '5px', padding: '3px 5px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: '#e0ded9', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Download size={9} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
