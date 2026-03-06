// ABOUTME: Expandable category presets for the prompt builder
// ABOUTME: 2-column category grid with accordion sub-presets — renders from database or generic fallbacks

import { useState } from 'react';
import { Image, FileText, Presentation, MessageSquare, Camera, Zap, Sparkles, ChevronDown, Loader2, Wand2 } from 'lucide-react';
import type { PromptCategory } from '../services/promptService';
import type { QuickStarterCategory, QuickStarterPreset, VariableField } from '../hooks/useQuickStarters';

export interface StarterConfig {
  label: string;
  category: PromptCategory;
  description: string;
}

const CATEGORY_ICONS: Record<string, typeof Image> = {
  social: Image,
  hero: Camera,
  email: MessageSquare,
  blog: FileText,
  presentation: Presentation,
  'brand-overview': Zap,
};

function iconForCategory(key: string): typeof Image {
  return CATEGORY_ICONS[key] || Sparkles;
}

function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function darkenHex(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function lightenHex(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + amount);
  const g = Math.min(255, ((n >> 8) & 0xff) + amount);
  const b = Math.min(255, (n & 0xff) + amount);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Derive accent colors from a brand color, falling back to MERGE defaults */
function deriveAccents(brandColor?: string | null) {
  const primary = brandColor || '#00856C';
  const dark = brandColor ? darkenHex(brandColor, 40) : '#133B34';
  const darkAlt = brandColor ? darkenHex(brandColor, 20) : '#00524F';
  const highlight = brandColor ? lightenHex(brandColor, 80) : '#1ED75F';
  return { primary, dark, darkAlt, highlight };
}

/** Build the final description by substituting any {{key}} tokens and appending filled variable values */
function buildEnrichedDescription(
  template: string,
  fields: VariableField[],
  values: Record<string, string>,
): string {
  // Token substitution for templates that use {{key}} placeholders
  let desc = template.replace(/\{\{(\w+)\}\}/g, (match, key) => values[key] || match);

  // Append all non-empty variable values as explicit specifications
  const specs = fields
    .map(f => {
      const key = f.key || f.name || '';
      const val = values[key]?.trim();
      if (!val) return null;
      return `- ${f.label}: ${val}`;
    })
    .filter(Boolean);

  if (specs.length > 0) {
    desc += `\n\nSpecifications:\n${specs.join('\n')}`;
  }

  return desc;
}

/** Inline form for filling variable fields before selecting a preset */
function VariableForm({
  preset,
  accents,
  onSubmit,
  onCancel,
}: {
  preset: QuickStarterPreset;
  accents: ReturnType<typeof deriveAccents>;
  onSubmit: (filledDescription: string) => void;
  onCancel: () => void;
}) {
  const fields = preset.variableFields || [];
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      const key = field.key || field.name || '';
      initial[key] = field.default_value || (field.options?.[0] || '');
    }
    return initial;
  });

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const allFilled = fields.every(f => {
    const key = f.key || f.name || '';
    return !f.required || values[key]?.trim();
  });

  return (
    <div style={{
      padding: '12px',
      borderRadius: '8px',
      border: `1px solid ${hexToRgba(accents.primary, 0.2)}`,
      background: hexToRgba(accents.primary, 0.03),
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: accents.dark,
        marginBottom: '10px',
        lineHeight: 1.3,
      }}>
        {preset.label}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {fields.map((field) => {
          const key = field.key || field.name || '';
          return (
            <div key={key}>
              <label style={{
                display: 'block',
                fontSize: '9px',
                fontWeight: 600,
                color: '#8fa89e',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '3px',
              }}>
                {field.label}
              </label>
              {field.type === 'select' && field.options ? (
                <select
                  value={values[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${hexToRgba(accents.dark, 0.15)}`,
                    background: '#1a3a32',
                    fontSize: '11px',
                    fontFamily: 'Epilogue, system-ui, sans-serif',
                    color: accents.dark,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={values[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={field.label}
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${hexToRgba(accents.dark, 0.15)}`,
                    background: '#1a3a32',
                    fontSize: '11px',
                    fontFamily: 'Epilogue, system-ui, sans-serif',
                    color: accents.dark,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
        <button
          onClick={() => onSubmit(buildEnrichedDescription(preset.description, fields, values))}
          disabled={!allFilled}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            padding: '8px',
            borderRadius: '6px',
            border: 'none',
            background: allFilled
              ? `linear-gradient(135deg, ${accents.dark} 0%, ${accents.darkAlt} 100%)`
              : hexToRgba(accents.dark, 0.1),
            color: allFilled ? accents.highlight : '#636466',
            cursor: allFilled ? 'pointer' : 'not-allowed',
            fontSize: '10px',
            fontWeight: 700,
            fontFamily: 'Epilogue, system-ui, sans-serif',
            transition: 'all 0.15s ease',
          }}
        >
          <Wand2 size={10} />
          Use this preset
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: `1px solid ${hexToRgba(accents.dark, 0.1)}`,
            background: '#1a3a32',
            color: '#8fa89e',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 600,
            fontFamily: 'Epilogue, system-ui, sans-serif',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface QuickStartersProps {
  categories: QuickStarterCategory[];
  isLoading: boolean;
  brandColor?: string | null;
  onSelect: (starter: StarterConfig) => void;
}

export function QuickStarters({ categories, isLoading, brandColor, onSelect }: QuickStartersProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [editingPreset, setEditingPreset] = useState<{ catKey: string; presetLabel: string } | null>(null);

  const accents = deriveAccents(brandColor);

  const handleCategoryClick = (cat: QuickStarterCategory) => {
    setExpandedCategory(expandedCategory === cat.key ? null : cat.key);
    setEditingPreset(null);
  };

  const handlePresetClick = (cat: QuickStarterCategory, preset: QuickStarterPreset) => {
    // If preset has variables, show the fill-in form
    if (preset.variableFields && preset.variableFields.length > 0) {
      setEditingPreset({ catKey: cat.key, presetLabel: preset.label });
      return;
    }
    // No variables — select immediately
    onSelect({
      label: preset.label,
      category: cat.formCategory,
      description: preset.description,
    });
  };

  const handleVariableSubmit = (cat: QuickStarterCategory, filledDescription: string, presetLabel: string) => {
    setEditingPreset(null);
    onSelect({
      label: presetLabel,
      category: cat.formCategory,
      description: filledDescription,
    });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
        <Loader2 size={16} style={{ color: '#8fa89e', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '11px', color: '#8fa89e', marginLeft: '8px' }}>Loading presets...</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '6px',
      }}>
        {categories.map((cat) => {
          const Icon = iconForCategory(cat.key);
          const isExpanded = expandedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => handleCategoryClick(cat)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                border: `1px solid ${isExpanded ? hexToRgba(accents.primary, 0.3) : hexToRgba(accents.dark, 0.08)}`,
                background: isExpanded ? hexToRgba(accents.primary, 0.04) : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'Epilogue, system-ui, sans-serif',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isExpanded) {
                  e.currentTarget.style.borderColor = hexToRgba(accents.primary, 0.2);
                  e.currentTarget.style.background = hexToRgba(accents.primary, 0.02);
                }
              }}
              onMouseLeave={(e) => {
                if (!isExpanded) {
                  e.currentTarget.style.borderColor = hexToRgba(accents.dark, 0.08);
                  e.currentTarget.style.background = '#fff';
                }
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: isExpanded
                  ? `linear-gradient(135deg, ${accents.dark} 0%, ${accents.darkAlt} 100%)`
                  : `linear-gradient(135deg, ${hexToRgba(accents.primary, 0.08)} 0%, ${hexToRgba(accents.primary, 0.04)} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={12} style={{ color: isExpanded ? accents.highlight : accents.primary }} />
              </div>
              <div style={{ flex: 1, fontSize: '11px', fontWeight: 600, color: isExpanded ? accents.primary : accents.dark, lineHeight: 1.2 }}>
                {cat.label}
              </div>
              <ChevronDown size={10} style={{
                color: '#8fa89e',
                transition: 'transform 0.15s ease',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }} />
            </button>
          );
        })}
      </div>

      {/* Expanded presets */}
      {expandedCategory && (() => {
        const cat = categories.find(c => c.key === expandedCategory);
        if (!cat) return null;
        return (
          <div style={{
            marginTop: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
          }}>
            {cat.presets.map((preset) => {
              const isEditing = editingPreset?.catKey === cat.key && editingPreset?.presetLabel === preset.label;
              const hasVariables = preset.variableFields && preset.variableFields.length > 0;

              if (isEditing) {
                return (
                  <VariableForm
                    key={preset.label}
                    preset={preset}
                    accents={accents}
                    onSubmit={(filled) => handleVariableSubmit(cat, filled, preset.label)}
                    onCancel={() => setEditingPreset(null)}
                  />
                );
              }

              return (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(cat, preset)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${hexToRgba(accents.primary, 0.1)}`,
                    background: hexToRgba(accents.primary, 0.02),
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'Epilogue, system-ui, sans-serif',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = hexToRgba(accents.primary, 0.06);
                    e.currentTarget.style.borderColor = hexToRgba(accents.primary, 0.25);
                    e.currentTarget.style.boxShadow = `0 1px 3px ${hexToRgba(accents.primary, 0.08)}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = hexToRgba(accents.primary, 0.02);
                    e.currentTarget.style.borderColor = hexToRgba(accents.primary, 0.1);
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '3px',
                    minHeight: '28px',
                    borderRadius: '2px',
                    background: hasVariables
                      ? 'linear-gradient(180deg, #7C3AED 0%, rgba(124, 58, 237, 0.3) 100%)'
                      : `linear-gradient(180deg, ${accents.primary} 0%, ${hexToRgba(accents.primary, 0.3)} 100%)`,
                    flexShrink: 0,
                    marginTop: '1px',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: accents.dark, lineHeight: 1.3 }}>
                        {preset.label}
                      </span>
                      {hasVariables && (
                        <span style={{
                          fontSize: '8px',
                          fontWeight: 700,
                          color: '#7C3AED',
                          background: 'rgba(124, 58, 237, 0.1)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          flexShrink: 0,
                        }}>
                          Customize
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '10px', color: '#8fa89e', lineHeight: 1.4, marginTop: '2px' }}>
                      {preset.description.length > 120
                        ? preset.description.slice(0, 120) + '...'
                        : preset.description}
                    </div>
                  </div>
                  <div style={{
                    flexShrink: 0,
                    marginTop: '2px',
                    opacity: 0.4,
                  }}>
                    <ChevronDown size={10} style={{ transform: 'rotate(-90deg)', color: accents.primary }} />
                  </div>
                </button>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
