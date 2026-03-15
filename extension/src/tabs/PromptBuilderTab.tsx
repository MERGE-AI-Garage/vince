// ABOUTME: Hero tab that generates on-brand prompts via Gemini + brand intelligence
// ABOUTME: Premium UI with welcome header, quick starters, form builder, output, and prompt history

import { useState, useCallback } from 'react';
import { Sparkles, Wand2, HelpCircle, X, RotateCcw } from 'lucide-react';
import { QuickStarters, type StarterConfig } from '../prompt-builder/QuickStarters';
import { PromptCategorySelect } from '../prompt-builder/PromptCategorySelect';
import { PromptInput } from '../prompt-builder/PromptInput';
import { PromptOutput } from '../prompt-builder/PromptOutput';
import { PromptHistory, usePromptHistory } from '../prompt-builder/PromptHistory';
import { ToneSelect } from '../prompt-builder/ToneSelect';
import { generateBrandPrompt, favoritePrompt, incrementPresetUsage, type PromptCategory } from '../services/promptService';
import { useQuickStarters } from '../hooks/useQuickStarters';

interface PromptBuilderTabProps {
  detectedPlatform: string | null;
  brandId?: string | null;
  brandName?: string | null;
  brandColor?: string | null;
  brandLogoUrl?: string | null;
  isDefaultBrand?: boolean;
}

export function PromptBuilderTab({ detectedPlatform, brandId, brandName, brandColor, brandLogoUrl, isDefaultBrand }: PromptBuilderTabProps) {
  const [category, setCategory] = useState<PromptCategory>('general');
  const [tone, setTone] = useState('balanced');
  const [description, setDescription] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const { history, savePrompt, removePrompt, clearHistory } = usePromptHistory();
  const { categories: quickStarterCategories, isLoading: quickStartersLoading } = useQuickStarters(brandId, brandName);

  const handleQuickStart = useCallback((starter: StarterConfig) => {
    setCategory(starter.category);
    setDescription(starter.description);
    setGeneratedPrompt(null);
    setHistoryId(null);
    setError(null);
    // Fire-and-forget: track that this preset was used
    if (brandId) {
      incrementPresetUsage(brandId, starter.label).catch(() => {});
    }
  }, [brandId]);

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return;

    setIsLoading(true);
    setError(null);
    setGeneratedPrompt(null);
    setHistoryId(null);

    try {
      const response = await generateBrandPrompt({
        description: description.trim(),
        category,
        platform: detectedPlatform ?? undefined,
        brand_id: brandId ?? undefined,
        tone: tone !== 'balanced' ? tone : undefined,
      });
      setGeneratedPrompt(response.prompt);
      setHistoryId(response.history_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate prompt');
    } finally {
      setIsLoading(false);
    }
  }, [description, category, detectedPlatform, brandId]);

  const handleSavePrompt = useCallback((prompt: string) => {
    savePrompt(prompt, category, description, historyId);
    // Mark as favorited in Supabase for admin visibility
    if (historyId) {
      favoritePrompt(historyId, true).catch(() => {});
    }
  }, [savePrompt, category, description, historyId]);

  const handleReusePrompt = useCallback((entry: { prompt: string; category: string; description: string }) => {
    setCategory(entry.category as PromptCategory);
    setDescription(entry.description);
    setGeneratedPrompt(entry.prompt);
    setError(null);
  }, []);

  const canGenerate = description.trim().length > 0 && !isLoading;

  // Brand-adaptive colors for the prompt builder UI (dark theme)
  const accentDark = '#111111';
  const accentLight = brandColor || '#8b5cf6';
  const accentMid = brandColor || '#8b5cf6';
  const accentGreen = '#8b5cf6';

  const displayName = brandName || 'Brand';
  const title = `${displayName} Prompt Studio`;
  const intro = brandName
    ? `Describe what you need for ${brandName}. Get a prompt grounded in the brand's voice, colors, and visual direction — consistent across every team and tool.`
    : "Describe what you need. Get a prompt grounded in your brand's voice, colors, and visual direction — consistent across every team and tool.";

  return (
    <div style={{ fontFamily: 'Epilogue, system-ui, sans-serif' }}>
      {/* Welcome hero */}
      <div style={{
        padding: '14px 14px 12px',
        margin: '14px 14px 0',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.95)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {brandLogoUrl ? (
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: '#fff',
                border: `1px solid ${hexToRgba(accentDark, 0.1)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <img src={brandLogoUrl} alt="" style={{ maxWidth: '18px', maxHeight: '18px', objectFit: 'contain' }} />
              </div>
            ) : (
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '7px',
                background: `linear-gradient(135deg, ${accentDark} 0%, ${accentLight} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Sparkles size={12} style={{ color: accentGreen }} />
              </div>
            )}
            <h2 style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 700,
              color: accentDark,
              fontFamily: 'Google Sans, Roboto, system-ui, sans-serif',
              lineHeight: 1.2,
            }}>
              {title}
            </h2>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: showHelp ? hexToRgba(accentMid, 0.08) : hexToRgba(accentDark, 0.04),
              border: `1px solid ${showHelp ? hexToRgba(accentMid, 0.2) : hexToRgba(accentDark, 0.08)}`,
              cursor: 'pointer',
              color: showHelp ? accentMid : '#6b7280',
              transition: 'all 0.15s ease',
              borderRadius: '12px',
              fontSize: '9px',
              fontWeight: 600,
              fontFamily: 'Epilogue, system-ui, sans-serif',
              letterSpacing: '0.02em',
            }}
          >
            {showHelp ? <X size={10} /> : <HelpCircle size={10} />}
            {showHelp ? 'Close' : 'How it works'}
          </button>
        </div>
        <p style={{
          margin: 0,
          fontSize: '11px',
          color: '#6b7280',
          lineHeight: 1.5,
        }}>
          {intro}
        </p>
      </div>

      {/* How it works panel */}
      {showHelp && (
        <div style={{
          margin: '0 16px 16px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: `1px solid ${hexToRgba(accentMid, 0.12)}`,
        }}>
          {/* Hero banner */}
          <div style={{
            padding: '16px 14px',
            background: `linear-gradient(135deg, ${accentDark} 0%, ${accentLight} 100%)`,
            color: '#ffffff',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'Fraunces, serif', marginBottom: '4px', color: '#ffffff' }}>
              AI Brand Intelligence
            </div>
            <div style={{ fontSize: '10px', lineHeight: 1.5, opacity: 0.8 }}>
              {isDefaultBrand
                ? 'Bridges the gap between brand guidelines and AI tools. Every prompt starts from structured Brand DNA — driving consistency across teams, tools, and output. Same brand, every time, no matter who\'s prompting.'
                : `Every prompt starts from ${brandName || 'your brand'}'s structured DNA — positioning, voice, colors, and visual direction. Consistent output across every tool and every team member.`}
            </div>
          </div>

          <div style={{ padding: '14px', background: `linear-gradient(135deg, ${hexToRgba(accentDark, 0.02)} 0%, ${hexToRgba(accentMid, 0.02)} 100%)` }}>
            {/* How to use */}
            <div style={{ fontSize: '10px', fontWeight: 700, color: accentDark, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              How to use
            </div>
            {[
              { step: '1', title: 'Describe what you\'re creating', desc: 'Pick a quick start or type your own brief — image, copy, deck, anything.' },
              { step: '2', title: 'Brand DNA is applied', desc: `Your request is enriched with curated ${brandName || 'brand'} intelligence — positioning, voice, visual identity, and more — before reaching the model.` },
              { step: '3', title: 'Paste into any AI tool', desc: isDefaultBrand
                ? 'Copy the generated prompt into Gemini, NotebookLM, Claude, Adobe Firefly, or any AI tool your team uses.'
                : 'Copy the generated prompt into Gemini, NotebookLM, Claude, Adobe Firefly, or any AI tool your team uses.' },
            ].map((item) => (
              <div key={item.step} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: accentLight,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '1px',
                }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: accentDark, lineHeight: 1.3 }}>{item.title}</div>
                  <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: 1.4, marginTop: '1px' }}>{item.desc}</div>
                </div>
              </div>
            ))}

            {/* Brand DNA */}
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${hexToRgba(accentDark, 0.06)}` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: accentDark, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                What's behind every prompt
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: 1.6, marginBottom: '10px' }}>
                Each prompt is generated by <strong style={{ color: accentDark }}>Gemini 3.1</strong>, grounded
                in structured {brandName && !isDefaultBrand ? `${brandName} ` : ''}brand intelligence curated from brand guidelines and positioning.
                The system ensures prompts are accurate, well-rounded, and consistently on-brand.
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
              }}>
                {[
                  { label: 'Positioning', detail: 'Brand promise, elevator pitch, market position' },
                  { label: 'Personality', detail: 'Core traits and brand character' },
                  { label: 'Voice', detail: 'Tone, formality, and copy guidelines' },
                  { label: 'Color System', detail: 'Palette with hex values and usage rules' },
                  { label: 'Typography', detail: 'Font families, weights, and specs' },
                  { label: 'Visual Direction', detail: 'Layout, photography, composition' },
                  { label: 'Storytelling', detail: 'Key narratives and messaging pillars' },
                  { label: 'Product Catalog', detail: 'Product lines and styling rules' },
                ].map((item) => (
                  <div key={item.label} style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: hexToRgba(accentDark, 0.03),
                    border: `1px solid ${hexToRgba(accentDark, 0.05)}`,
                  }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: accentMid }}>{item.label}</div>
                    <div style={{ fontSize: '8px', color: '#6b7280', lineHeight: 1.3, marginTop: '1px' }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category-aware */}
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${hexToRgba(accentDark, 0.06)}` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: accentDark, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Adapts to what you're making
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: 1.5 }}>
                <strong style={{ color: accentDark }}>Visual prompts</strong> emphasize
                color palette, gradients, and composition. <strong style={{ color: accentDark }}>Copy prompts</strong> lean into
                voice and tone. <strong style={{ color: accentDark }}>Presentations</strong> blend both. The right brand
                elements surface for the right type of work.
              </div>
            </div>

            {/* Multi-brand callout — agency context only */}
            {isDefaultBrand && (
              <div style={{
                marginTop: '14px',
                padding: '10px',
                borderRadius: '8px',
                background: hexToRgba(accentMid, 0.04),
                border: `1px solid ${hexToRgba(accentMid, 0.08)}`,
              }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: accentMid, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
                  Multi-brand support
                </div>
                <div style={{ fontSize: '9px', color: '#6b7280', lineHeight: 1.5 }}>
                  Select any client brand from the dropdown above. The system adapts automatically —
                  pulling that brand's DNA profile, photography direction, voice, and prompt
                  templates. Same tool, any brand.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New prompt button (visible after generation) */}
      {generatedPrompt && (
        <div style={{ padding: '0 16px 12px' }}>
          <button
            onClick={() => {
              setGeneratedPrompt(null);
              setHistoryId(null);
              setDescription('');
              setError(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: `1px solid ${hexToRgba(accentMid, 0.15)}`,
              background: hexToRgba(accentMid, 0.04),
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 600,
              fontFamily: 'Epilogue, system-ui, sans-serif',
              color: accentMid,
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={10} />
            New prompt
          </button>
        </div>
      )}

      {/* Quick starters */}
      {!generatedPrompt && !isLoading && (
        <div style={{ padding: '0 14px 16px' }}>
          <div style={{
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.9)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)',
            padding: '14px',
          }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px',
          }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#6b7280',
            }}>
              Quick start
            </span>
            <div style={{
              flex: 1,
              height: '1px',
              background: 'rgba(0,0,0,0.08)',
            }} />
          </div>
          <QuickStarters categories={quickStarterCategories} isLoading={quickStartersLoading} brandColor={brandColor} onSelect={handleQuickStart} />
          </div>
        </div>
      )}

      {/* Build prompt form */}
      <div style={{
        margin: '0 14px 14px',
        padding: '16px',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.95)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        {/* Category */}
        <PromptCategorySelect value={category} onChange={setCategory} />

        {/* Tone emphasis */}
        <ToneSelect value={tone} onChange={setTone} />

        {/* Description input */}
        <PromptInput value={description} onChange={setDescription} />

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '13px',
            borderRadius: '10px',
            border: 'none',
            background: canGenerate
              ? `linear-gradient(135deg, ${accentDark} 0%, ${accentLight} 100%)`
              : hexToRgba(accentDark, 0.1),
            color: canGenerate ? '#ffffff' : '#6b7280',
            cursor: canGenerate ? 'pointer' : 'not-allowed',
            fontSize: '13px',
            fontWeight: 700,
            fontFamily: 'Epilogue, system-ui, sans-serif',
            letterSpacing: '0.01em',
            transition: 'all 0.2s ease',
            boxShadow: canGenerate ? `0 2px 8px ${hexToRgba(accentDark, 0.15)}` : 'none',
          }}
        >
          <Wand2 size={15} />
          {isLoading ? 'Generating...' : 'Generate on-brand prompt'}
        </button>
      </div>

      {/* Output */}
      <div style={generatedPrompt || isLoading || error ? {
        margin: '0 14px',
        padding: '16px',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.95)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)',
      } : { padding: '0 16px' }}>
        <PromptOutput
          prompt={generatedPrompt}
          isLoading={isLoading}
          error={error}
          onRegenerate={handleGenerate}
          onSave={handleSavePrompt}
          detectedPlatform={detectedPlatform}
        />
      </div>

      {/* Prompt history */}
      <div style={{
        margin: '0 14px 14px',
        padding: '4px 0',
      }}>
        <PromptHistory
          history={history}
          onReuse={handleReusePrompt}
          onRemove={removePrompt}
          onClear={clearHistory}
        />
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px 16px 24px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginBottom: '4px',
        }}>
          <div style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: accentMid,
            opacity: 0.6,
          }} />
          <span style={{ fontSize: '9px', fontWeight: 600, color: '#6b7280', opacity: 0.6, letterSpacing: '0.04em' }}>
            Powered by Gemini 3.1
          </span>
          <div style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: accentMid,
            opacity: 0.6,
          }} />
        </div>
        <div style={{ fontSize: '9px', color: '#6b7280', opacity: 0.4 }}>
          Vince
        </div>
      </div>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function adjustColorSimple(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (n & 0xff) + amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
