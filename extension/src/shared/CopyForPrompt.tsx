// ABOUTME: Reusable "Copy for prompt" button with clipboard integration and toast feedback
// ABOUTME: Used across all Brand Kit sections to copy brand content for AI prompts

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyForPromptProps {
  text: string;
  label?: string;
  compact?: boolean;
}

export function CopyForPrompt({ text, label = 'Copy for prompt', compact = false }: CopyForPromptProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  if (compact) {
    return (
      <button
        onClick={handleCopy}
        title={label}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 6px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: copied ? '#8b5cf6' : '#8b5cf6',
          fontSize: '11px',
          fontFamily: 'Epilogue, system-ui, sans-serif',
          borderRadius: '4px',
          transition: 'all 0.15s ease',
        }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: copied ? 'rgba(30, 215, 95, 0.1)' : 'rgba(0, 133, 108, 0.08)',
        border: `1px solid ${copied ? 'rgba(30, 215, 95, 0.3)' : 'rgba(0, 133, 108, 0.15)'}`,
        borderRadius: '6px',
        cursor: 'pointer',
        color: copied ? '#8b5cf6' : '#8b5cf6',
        fontSize: '11px',
        fontWeight: 600,
        fontFamily: 'Epilogue, system-ui, sans-serif',
        letterSpacing: '0.02em',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

export function useCopyToClipboard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = useCallback((text: string, key?: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key ?? text);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  return { copiedKey, copy };
}
