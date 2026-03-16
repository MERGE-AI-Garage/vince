// ABOUTME: Mobile prompts browser — shows brand prompt templates organized by category
// ABOUTME: Tap a prompt to fill variables, generate a Gemini-crafted prompt, then copy

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VariableField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number';
  options?: string[];
  default_value?: string;
  required?: boolean;
}

interface BrandPrompt {
  name: string;
  category: string | null;
  prompt_template: string;
  variable_fields: unknown;
}

interface PromptsTabProps {
  brandId: string | null;
  brandName?: string;
  brandColor?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  'brand-overview': 'Brand',
  social:           'Social',
  hero:             'Hero',
  product:          'Product',
  lifestyle:        'Lifestyle',
  campaign:         'Campaign',
  editorial:        'Editorial',
  cinematography:   'Cinematic',
  email:            'Email',
  blog:             'Blog',
  presentation:     'Deck',
  general:          'General',
};

function categoryLabel(key: string) {
  return CATEGORY_LABELS[key] ?? key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function parseVariableFields(raw: unknown): VariableField[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return (raw as Record<string, unknown>[])
    .map(f => ({
      key: (f.key as string) || (f.name as string) || '',
      label: (f.label as string) || '',
      type: (f.type as VariableField['type']) || 'text',
      options: Array.isArray(f.options) ? f.options as string[] : undefined,
      default_value: (f.default_value as string) || undefined,
      required: f.required as boolean | undefined,
    }))
    .filter(f => f.key && f.label);
}

function detectVariableFields(template: string, existing: VariableField[]): VariableField[] {
  const tokens = [...template.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);
  if (tokens.length === 0) return existing;
  const existingKeys = new Set(existing.map(f => f.key));
  const extra = [...new Set(tokens)]
    .filter(t => !existingKeys.has(t))
    .map(key => ({
      key,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      type: 'text' as const,
    }));
  return [...existing, ...extra];
}

function getFields(prompt: BrandPrompt): VariableField[] {
  const base = parseVariableFields(prompt.variable_fields);
  return detectVariableFields(prompt.prompt_template, base);
}

function substituteVars(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] || `{{${key}}}`);
}

async function generateBrandPrompt(description: string, category: string, brandId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-brand-prompt', {
    body: { description, category: category || 'general', brand_id: brandId },
  });
  if (error) throw new Error(error.message || 'Generation failed');
  if (!data?.prompt) throw new Error(data?.error || 'No prompt returned');
  return data.prompt as string;
}

// ─── Variables form sheet ─────────────────────────────────────────────────────

interface VariablesSheetProps {
  prompt: BrandPrompt;
  fields: VariableField[];
  brandColor: string;
  onSubmit: (filled: string) => void;
  onClose: () => void;
}

function VariablesSheet({ prompt, fields, brandColor, onSubmit, onClose }: VariablesSheetProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of fields) init[f.key] = f.default_value || '';
    return init;
  });

  function setValue(key: string, val: string) {
    setValues(prev => ({ ...prev, [key]: val }));
  }

  function handleGenerate() {
    const filled = substituteVars(prompt.prompt_template, values);
    onSubmit(filled);
  }

  const allRequiredFilled = fields
    .filter(f => f.required)
    .every(f => (values[f.key] || '').trim().length > 0);

  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', background: '#141414', borderRadius: '20px 20px 0 0', padding: '20px 16px 32px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Handle + header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{prompt.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Fill in the details, then generate</div>
            </div>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Fields */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}>
          {fields.map(field => (
            <div key={field.key}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: field.required ? brandColor : 'rgba(255,255,255,0.4)', marginBottom: 7 }}>
                {field.label}{field.required && <span style={{ color: brandColor }}> *</span>}
              </div>

              {field.type === 'select' && field.options ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {field.options.map(opt => {
                    const active = values[field.key] === opt;
                    return (
                      <button key={opt} onClick={() => setValue(field.key, opt)}
                        style={{ fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 8, border: `1px solid ${active ? brandColor : 'rgba(255,255,255,0.12)'}`, background: active ? `${brandColor}25` : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.55)', cursor: 'pointer' }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : field.type === 'number' ? (
                <input
                  type="number"
                  value={values[field.key] || ''}
                  onChange={e => setValue(field.key, e.target.value)}
                  placeholder={field.default_value || '0'}
                  style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: `1px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', WebkitAppearance: 'none' as any }}
                />
              ) : (
                <input
                  type="text"
                  value={values[field.key] || ''}
                  onChange={e => setValue(field.key, e.target.value)}
                  placeholder={field.default_value || `Enter ${field.label.toLowerCase()}…`}
                  style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: `1px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!allRequiredFilled}
          style={{ padding: '14px', borderRadius: 12, border: 'none', background: allRequiredFilled ? brandColor : 'rgba(255,255,255,0.08)', color: allRequiredFilled ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700, cursor: allRequiredFilled ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          Generate with Gemini
        </button>
      </div>
    </div>
  );
}

// ─── Generated result sheet ───────────────────────────────────────────────────

interface GeneratedSheetProps {
  prompt: BrandPrompt;
  filledTemplate: string;
  brandId: string;
  brandColor: string;
  onBack: () => void;
  onClose: () => void;
}

function GeneratedSheet({ prompt, filledTemplate, brandId, brandColor, onBack, onClose }: GeneratedSheetProps) {
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  const [result, setResult] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  function run() {
    setState('loading');
    setErrorMsg('');
    generateBrandPrompt(filledTemplate, prompt.category || 'general', brandId)
      .then(r => { setResult(r); setState('done'); })
      .catch(e => { setErrorMsg(e.message); setState('error'); });
  }

  useEffect(() => { run(); }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result);
    } catch {
      const el = document.createElement('textarea');
      el.value = result;
      el.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 30, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', background: '#141414', borderRadius: '20px 20px 0 0', padding: '20px 16px 32px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Handle + header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={onBack} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{prompt.name}</div>
                {prompt.category && (
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: brandColor, marginTop: 1 }}>
                    {categoryLabel(prompt.category)}
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {state === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 12 }}>
            <style>{`@keyframes genspin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ width: 32, height: 32, border: `3px solid rgba(255,255,255,0.08)`, borderTopColor: brandColor, borderRadius: '50%', animation: 'genspin 0.7s linear infinite' }} />
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'system-ui' }}>Crafting with Gemini…</div>
          </div>
        )}

        {state === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 12, color: '#f87171', textAlign: 'center' }}>{errorMsg}</div>
            <button onClick={run} style={{ fontSize: 12, fontWeight: 600, padding: '8px 20px', borderRadius: 8, background: brandColor, border: 'none', color: '#fff', cursor: 'pointer' }}>
              Try again
            </button>
          </div>
        )}

        {state === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}>
              <div style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)', fontFamily: 'system-ui, sans-serif' }}>
                {result}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={handleCopy}
                style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: copied ? '#10b981' : brandColor, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 0.15s' }}
              >
                {copied ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Copied!</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy Prompt</>
                )}
              </button>
              <button onClick={run} title="Regenerate"
                style={{ width: 48, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function PromptsTab({ brandId, brandName, brandColor = '#a855f7' }: PromptsTabProps) {
  const [prompts, setPrompts] = useState<BrandPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Sheet state: null = closed, 'vars' = variable form, 'result' = generated prompt
  const [selected, setSelected] = useState<BrandPrompt | null>(null);
  const [sheet, setSheet] = useState<'vars' | 'result' | null>(null);
  const [filledTemplate, setFilledTemplate] = useState('');

  useEffect(() => {
    if (!brandId) { setPrompts([]); return; }
    let cancelled = false;
    setIsLoading(true);
    supabase
      .from('creative_studio_brand_prompts')
      .select('name, category, prompt_template, variable_fields')
      .eq('brand_id', brandId)
      .order('usage_count', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setPrompts(data as BrandPrompt[]);
        setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [brandId]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const p of prompts) seen.add(p.category || 'general');
    const ordered = Object.keys(CATEGORY_LABELS).filter(k => seen.has(k));
    for (const k of seen) { if (!ordered.includes(k)) ordered.push(k); }
    return ordered;
  }, [prompts]);

  const visible = useMemo(() => {
    if (activeCategory === 'all') return prompts;
    return prompts.filter(p => (p.category || 'general') === activeCategory);
  }, [prompts, activeCategory]);

  function handleSelectPrompt(prompt: BrandPrompt) {
    setSelected(prompt);
    const fields = getFields(prompt);
    if (fields.length > 0) {
      setSheet('vars');
    } else {
      // No variables — go straight to generation
      setFilledTemplate(prompt.prompt_template);
      setSheet('result');
    }
  }

  function handleVarsSubmit(filled: string) {
    setFilledTemplate(filled);
    setSheet('result');
  }

  function handleClose() {
    setSelected(null);
    setSheet(null);
    setFilledTemplate('');
  }

  if (!brandId) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'system-ui, sans-serif' }}>Select a brand to view prompts</div>;
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
        <style>{`@keyframes promptspin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: brandColor, borderRadius: '50%', animation: 'promptspin 0.7s linear infinite' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'system-ui, sans-serif' }}>Loading prompts…</span>
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '32px 24px', gap: 10 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
        </svg>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.25)', fontFamily: 'system-ui, sans-serif' }}>No prompts yet</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', textAlign: 'center', maxWidth: 220, lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' }}>
          Add prompt templates for {brandName || 'this brand'} in the web app's Director mode
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', background: '#0d0d0d', fontFamily: 'system-ui, sans-serif' }}>

      {/* Category filter strip */}
      <div style={{ flexShrink: 0, padding: '10px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}>
        <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
          {(['all', ...categories]).map(cat => {
            const active = activeCategory === cat;
            const count = cat === 'all' ? prompts.length : prompts.filter(p => (p.category || 'general') === cat).length;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 999, border: `1px solid ${active ? brandColor : 'rgba(255,255,255,0.1)'}`, background: active ? brandColor : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.45)', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {cat === 'all' ? 'All' : categoryLabel(cat)}
                <span style={{ opacity: 0.65, marginLeft: 4 }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompt list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}>
        {visible.map((prompt, i) => {
          const fields = getFields(prompt);
          const hasVars = fields.length > 0;
          return (
            <button
              key={`${prompt.name}-${i}`}
              onClick={() => handleSelectPrompt(prompt)}
              style={{ width: '100%', marginBottom: 8, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6, WebkitTapHighlightColor: 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {prompt.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  {prompt.category && (
                    <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: brandColor, background: `${brandColor}22`, padding: '2px 6px', borderRadius: 999 }}>
                      {categoryLabel(prompt.category)}
                    </span>
                  )}
                  {/* Variables indicator */}
                  {hasVars && (
                    <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.07)', padding: '2px 5px', borderRadius: 4 }}>
                      {fields.length} var{fields.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={brandColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
              </div>
              <span style={{ fontSize: 11, lineHeight: 1.55, color: 'rgba(255,255,255,0.35)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {prompt.prompt_template}
              </span>
            </button>
          );
        })}
        <div style={{ height: 16 }} />
      </div>

      {/* Variable fields sheet */}
      {selected && sheet === 'vars' && (
        <VariablesSheet
          prompt={selected}
          fields={getFields(selected)}
          brandColor={brandColor}
          onSubmit={handleVarsSubmit}
          onClose={handleClose}
        />
      )}

      {/* Generated result sheet */}
      {selected && sheet === 'result' && brandId && (
        <GeneratedSheet
          prompt={selected}
          filledTemplate={filledTemplate}
          brandId={brandId}
          brandColor={brandColor}
          onBack={() => setSheet(getFields(selected).length > 0 ? 'vars' : null)}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
