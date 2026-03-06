// ABOUTME: Displays the generated on-brand prompt with copy, regenerate, and save actions
// ABOUTME: Premium card with loading animation, error state, and prompt history integration

import { useState } from 'react';
import { Copy, Check, RefreshCw, Bookmark } from 'lucide-react';

interface PromptOutputProps {
  prompt: string | null;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
  onSave?: (prompt: string) => void;
  detectedPlatform: string | null;
}

export function PromptOutput({ prompt, isLoading, error, onRegenerate, onSave, detectedPlatform }: PromptOutputProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (isLoading) {
    return (
      <div style={{
        padding: '24px 16px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #133B34 0%, #00524F 100%)',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          width: '28px',
          height: '28px',
          border: '2.5px solid rgba(30, 215, 95, 0.2)',
          borderTopColor: '#1ED75F',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '12px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{
          fontSize: '13px',
          color: '#1ED75F',
          fontWeight: 600,
          margin: 0,
          fontFamily: 'Epilogue, system-ui, sans-serif',
        }}>
          Generating on-brand prompt
        </p>
        <p style={{
          fontSize: '10px',
          color: 'rgba(234, 232, 227, 0.5)',
          margin: '6px 0 0',
          fontFamily: 'Epilogue, system-ui, sans-serif',
        }}>
          Powered by Gemini + Brand DNA
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '14px',
        borderRadius: '12px',
        border: '1px solid rgba(239, 68, 68, 0.15)',
        background: 'rgba(239, 68, 68, 0.04)',
      }}>
        <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600, margin: '0 0 4px', fontFamily: 'Epilogue, system-ui, sans-serif' }}>
          Generation failed
        </p>
        <p style={{ fontSize: '11px', color: '#636466', margin: '0 0 10px', lineHeight: 1.4, fontFamily: 'Epilogue, system-ui, sans-serif' }}>
          {error}
        </p>
        <button
          onClick={onRegenerate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(19, 59, 52, 0.1)',
            background: '#fff',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'Epilogue, system-ui, sans-serif',
            color: '#133B34',
          }}
        >
          <RefreshCw size={12} />
          Try again
        </button>
      </div>
    );
  }

  if (!prompt) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSave?.(prompt);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{
      borderRadius: '12px',
      border: '1px solid rgba(0, 133, 108, 0.15)',
      background: '#fff',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(19, 59, 52, 0.06)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'linear-gradient(135deg, rgba(0, 133, 108, 0.06) 0%, rgba(30, 215, 95, 0.04) 100%)',
        borderBottom: '1px solid rgba(0, 133, 108, 0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#1ED75F',
          }} />
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#00856C',
          }}>
            On-brand prompt
          </span>
        </div>
        {detectedPlatform && (
          <span style={{
            fontSize: '9px',
            fontWeight: 600,
            color: '#636466',
            padding: '2px 8px',
            borderRadius: '10px',
            background: 'rgba(19, 59, 52, 0.05)',
          }}>
            {detectedPlatform}
          </span>
        )}
      </div>

      {/* Prompt content */}
      <div style={{
        padding: '14px',
        fontSize: '12px',
        lineHeight: 1.7,
        color: '#133B34',
        whiteSpace: 'pre-wrap',
        maxHeight: '300px',
        overflowY: 'auto',
        fontFamily: 'Epilogue, system-ui, sans-serif',
      }}>
        {prompt}
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '6px',
        padding: '10px 14px',
        borderTop: '1px solid rgba(19, 59, 52, 0.06)',
        background: 'rgba(19, 59, 52, 0.015)',
      }}>
        <button
          onClick={handleCopy}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '9px',
            borderRadius: '8px',
            border: 'none',
            background: copied ? '#1ED75F' : 'linear-gradient(135deg, #133B34 0%, #00524F 100%)',
            color: copied ? '#133B34' : '#EAE8E3',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'Epilogue, system-ui, sans-serif',
            transition: 'all 0.2s ease',
            letterSpacing: '0.01em',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </button>
        {onSave && (
          <button
            onClick={handleSave}
            title="Save to history"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(19, 59, 52, 0.08)',
              background: saved ? 'rgba(30, 215, 95, 0.08)' : '#fff',
              cursor: 'pointer',
              color: saved ? '#1ED75F' : '#636466',
              transition: 'all 0.2s ease',
            }}
          >
            {saved ? <Check size={13} /> : <Bookmark size={13} />}
          </button>
        )}
        <button
          onClick={onRegenerate}
          title="Regenerate"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '9px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(19, 59, 52, 0.08)',
            background: '#fff',
            cursor: 'pointer',
            color: '#636466',
            transition: 'all 0.2s ease',
          }}
        >
          <RefreshCw size={13} />
        </button>
      </div>
    </div>
  );
}
