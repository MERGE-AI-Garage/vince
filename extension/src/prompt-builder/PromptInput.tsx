// ABOUTME: Free text input for describing what the user wants to create
// ABOUTME: Premium textarea with character count, clear button, and focus ring

import { X } from 'lucide-react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PromptInput({ value, onChange, placeholder }: PromptInputProps) {
  const charCount = value.length;

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '6px',
      }}>
        <label style={{
          fontSize: '10px',
          fontWeight: 600,
          color: '#636466',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          Describe what you need
        </label>
        {charCount > 0 && (
          <span style={{
            fontSize: '9px',
            color: '#636466',
            opacity: 0.6,
            fontFamily: 'monospace',
          }}>
            {charCount}
          </span>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'e.g., "Hero image for a wellness campaign landing page"'}
          rows={3}
          style={{
            width: '100%',
            padding: '12px 32px 12px 12px',
            borderRadius: '10px',
            border: '1.5px solid rgba(19, 59, 52, 0.1)',
            background: '#fff',
            fontSize: '13px',
            fontFamily: 'Epilogue, system-ui, sans-serif',
            color: '#133B34',
            lineHeight: 1.6,
            resize: 'vertical',
            minHeight: '80px',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            boxShadow: '0 1px 2px rgba(19, 59, 52, 0.04)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#00856C';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 133, 108, 0.08)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(19, 59, 52, 0.1)';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(19, 59, 52, 0.04)';
          }}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              padding: '3px',
              background: 'rgba(19, 59, 52, 0.06)',
              border: 'none',
              cursor: 'pointer',
              color: '#636466',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(19, 59, 52, 0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(19, 59, 52, 0.06)'; }}
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
