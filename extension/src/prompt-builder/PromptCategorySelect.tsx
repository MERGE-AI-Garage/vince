// ABOUTME: Category picker for prompt generation (image, text, presentation, general)
// ABOUTME: Premium segmented control with icons and active state indicator

import { Image, FileText, Presentation, Zap } from 'lucide-react';
import type { PromptCategory } from '../services/promptService';

const CATEGORIES: { id: PromptCategory; label: string; icon: typeof Image }[] = [
  { id: 'image', label: 'Visual', icon: Image },
  { id: 'text', label: 'Copy', icon: FileText },
  { id: 'presentation', label: 'Deck', icon: Presentation },
  { id: 'general', label: 'General', icon: Zap },
];

interface PromptCategorySelectProps {
  value: PromptCategory;
  onChange: (category: PromptCategory) => void;
}

export function PromptCategorySelect({ value, onChange }: PromptCategorySelectProps) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '10px',
        fontWeight: 600,
        color: '#636466',
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        Output type
      </label>
      <div style={{
        display: 'flex',
        borderRadius: '10px',
        border: '1px solid rgba(19, 59, 52, 0.1)',
        background: '#f5f4f0',
        padding: '3px',
        gap: '2px',
      }}>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = value === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '7px 4px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#fff' : 'transparent',
                boxShadow: isActive ? '0 1px 3px rgba(19, 59, 52, 0.1)' : 'none',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: isActive ? 600 : 500,
                fontFamily: 'Epilogue, system-ui, sans-serif',
                color: isActive ? '#133B34' : '#636466',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={12} strokeWidth={isActive ? 2.5 : 2} />
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
