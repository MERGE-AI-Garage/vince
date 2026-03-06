// ABOUTME: Structured video prompt builder for Veo "Director Mode"
// ABOUTME: Visual controls for scene, camera, lighting, lens, subject, and dialogue with brand-aware AI enhancement

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Clapperboard, ChevronDown, ChevronUp, ChevronRight, Eye, Sparkles, Loader2, Wand2, RefreshCw, X, Images,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { QuickPrompt, BrandPromptTemplate } from '@/types/creative-studio';
import { useBrandReferenceCollections } from '@/hooks/useBrandReferences';

export interface DirectorPrompt {
  scene_description: string;
  camera_movement: string;
  lighting: string;
  lens: string;
  subject_attributes: string;
  dialogue: string;
}

interface DirectorModePanelProps {
  value: DirectorPrompt;
  onChange: (prompt: DirectorPrompt) => void;
  mediaType?: 'image' | 'video';
  brandId?: string | null;
  brandName?: string;
  brandQuickPrompts?: QuickPrompt[];
  brandTemplates?: BrandPromptTemplate[];
  onApplyTemplate?: (info: { id: string; name: string; variables?: Record<string, string>; reference_collections?: string[] }) => void;
  onApplyReferenceImages?: (templateId: string) => void;
}

export const CAMERA_MOVEMENTS = [
  { value: '', label: 'None' },
  { value: 'crane_down', label: 'Crane Down' },
  { value: 'crane_up', label: 'Crane Up' },
  { value: 'dolly_in', label: 'Dolly In (push in)' },
  { value: 'dolly_out', label: 'Dolly Out (pull back)' },
  { value: 'handheld', label: 'Handheld (natural shake)' },
  { value: 'orbit', label: 'Orbit / Arc' },
  { value: 'pan_left', label: 'Pan Left' },
  { value: 'pan_right', label: 'Pan Right' },
  { value: 'static', label: 'Static (locked off)' },
  { value: 'steadicam', label: 'Steadicam (smooth glide)' },
  { value: 'tilt_down', label: 'Tilt Down' },
  { value: 'tilt_up', label: 'Tilt Up' },
  { value: 'tracking_left', label: 'Tracking Shot Left' },
  { value: 'tracking_right', label: 'Tracking Shot Right' },
];

export const LIGHTING_PRESETS = [
  { value: '', label: 'Auto' },
  { value: 'blue_hour', label: 'Blue Hour' },
  { value: 'candlelight', label: 'Candlelight / Warm Ambient' },
  { value: 'dramatic_side', label: 'Dramatic Side Light' },
  { value: 'golden_hour', label: 'Golden Hour' },
  { value: 'high_key', label: 'High Key (bright, minimal shadows)' },
  { value: 'low_key', label: 'Low Key (dark, moody)' },
  { value: 'natural_daylight', label: 'Natural Daylight' },
  { value: 'neon_glow', label: 'Neon / Urban Glow' },
  { value: 'overcast', label: 'Overcast / Diffused' },
  { value: 'studio_three_point', label: 'Studio 3-Point' },
];

export const LENS_PRESETS = [
  { value: '', label: 'Auto' },
  { value: 'wide_angle_16mm', label: '16mm Ultra Wide' },
  { value: 'wide_24mm', label: '24mm Wide' },
  { value: 'standard_35mm', label: '35mm Standard' },
  { value: 'normal_50mm', label: '50mm Normal' },
  { value: 'portrait_85mm', label: '85mm Portrait' },
  { value: 'telephoto_135mm', label: '135mm Telephoto' },
  { value: 'macro', label: 'Macro (extreme close-up)' },
  { value: 'anamorphic', label: 'Anamorphic (cinematic widescreen)' },
  { value: 'tilt_shift', label: 'Tilt-Shift (miniature effect)' },
  { value: 'fisheye', label: 'Fisheye' },
];

// Valid dropdown slugs for the edge function (video mode default)
const VIDEO_AVAILABLE_OPTIONS = {
  camera_movements: CAMERA_MOVEMENTS.map((m) => m.value),
  lighting_presets: LIGHTING_PRESETS.map((l) => l.value),
  lens_presets: LENS_PRESETS.map((l) => l.value),
};

const IMAGE_AVAILABLE_OPTIONS = {
  camera_movements: [] as string[],
  lighting_presets: LIGHTING_PRESETS.map((l) => l.value),
  lens_presets: LENS_PRESETS.map((l) => l.value),
};

export function DirectorModePanel({
  value,
  onChange,
  mediaType = 'video',
  brandId,
  brandName,
  brandQuickPrompts,
  brandTemplates,
  onApplyTemplate,
  onApplyReferenceImages,
}: DirectorModePanelProps) {
  const isImage = mediaType === 'image';
  const availableOptions = isImage ? IMAGE_AVAILABLE_OPTIONS : VIDEO_AVAILABLE_OPTIONS;
  const [showPreview, setShowPreview] = useState(false);
  const [enhanceOpen, setEnhanceOpen] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [appliedPreset, setAppliedPreset] = useState<string | null>(null);
  const [expandedStarterIdx, setExpandedStarterIdx] = useState<number | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  const hasBrand = !!brandId;
  const { data: allCollections } = useBrandReferenceCollections(brandId ?? undefined);

  // Combine quick prompts and templates into a single list of starters
  type Starter = {
    id?: string;
    name: string;
    prompt: string;
    source: 'quick' | 'template';
    variable_fields: BrandPromptTemplate['variable_fields'];
    reference_collections?: string[];
  };
  const starters: Starter[] = useMemo(() => {
    const result: Starter[] = [];
    if (brandQuickPrompts) {
      for (const qp of brandQuickPrompts) {
        result.push({ name: qp.name, prompt: qp.prompt, source: 'quick', variable_fields: [] });
      }
    }
    if (brandTemplates) {
      for (const t of brandTemplates) {
        if (!result.some((s) => s.name === t.name)) {
          result.push({ id: t.id, name: t.name, prompt: t.prompt_template, source: 'template', variable_fields: t.variable_fields || [], reference_collections: t.reference_collections });
        }
      }
    }
    return result;
  }, [brandQuickPrompts, brandTemplates]);

  const interpolateTemplate = (template: string, fields: Starter['variable_fields']): string => {
    let prompt = template;
    for (const field of fields) {
      const val = variableValues[field.key] || field.default_value || '';
      prompt = prompt.replace(new RegExp(`\\{\\{${field.key}\\}\\}`, 'g'), val);
    }
    return prompt;
  };

  const update = (field: keyof DirectorPrompt, val: string) => {
    onChange({ ...value, [field]: val });
  };

  const callEnhance = async (mode: 'quick' | 'full', starterPrompt?: string, starterName?: string, starterId?: string, starterVars?: Record<string, string>) => {
    if (!brandId) return;
    setEnhancing(true);
    setEnhanceOpen(false);

    try {
      const { data, error } = await supabase.functions.invoke('enhance-director-prompt', {
        body: {
          brand_id: brandId,
          current_fields: value,
          mode,
          media_type: mediaType,
          starter_prompt: starterPrompt,
          starter_name: starterName,
          available_options: availableOptions,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Enhancement failed');

      const enhanced = data.fields as DirectorPrompt;
      onChange(enhanced);
      setAppliedPreset(starterName || (mode === 'quick' ? 'Fill empty fields' : mode === 'full' ? 'Full rewrite' : null));
      if (starterId && starterName) {
        onApplyTemplate?.({ id: starterId, name: starterName, variables: starterVars });
        // Load template reference images if the starter has them
        if (onApplyReferenceImages) {
          onApplyReferenceImages(starterId);
        }
      }
      toast.success(starterName
        ? `Applied "${starterName}" with ${brandName || 'brand'} DNA`
        : `Enhanced with ${brandName || 'brand'} DNA`
      );
    } catch (err) {
      console.error('Enhancement failed:', err);
      toast.error('Enhancement failed — try again');
    } finally {
      setEnhancing(false);
    }
  };

  const buildPromptPreview = (): string => {
    const parts: string[] = [];
    if (value.scene_description) parts.push(value.scene_description);
    if (value.camera_movement) parts.push(`Camera: ${value.camera_movement.replace(/_/g, ' ')}`);
    if (value.lighting) parts.push(`Lighting: ${value.lighting.replace(/_/g, ' ')}`);
    if (value.lens) parts.push(`Lens: ${value.lens.replace(/_/g, ' ')}`);
    if (value.subject_attributes) parts.push(`Subject: ${value.subject_attributes}`);
    if (value.dialogue) parts.push(`Dialogue: "${value.dialogue}"`);
    return parts.join('. ') || '(empty — fill in fields above)';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clapperboard className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Director Mode</h3>
        <Badge variant="outline" className="text-[9px]">Structured</Badge>
      </div>

      {/* Brand Enhance Button */}
      <Popover open={enhanceOpen} onOpenChange={(open) => {
        setEnhanceOpen(open);
        if (!open) {
          setExpandedStarterIdx(null);
          setVariableValues({});
        }
      }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasBrand || enhancing}
                className="w-full h-8 text-[10px] border-primary/30 hover:border-primary/60 hover:bg-primary/5"
              >
                {enhancing ? (
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 mr-1.5" />
                )}
                {enhancing ? 'Enhancing...' : `Enhance with ${brandName || 'Brand'} DNA`}
                {!enhancing && <ChevronDown className="w-3 h-3 ml-auto" />}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          {!hasBrand && (
            <TooltipContent side="left" className="text-[10px]">
              Select a brand first to use AI enhancement
            </TooltipContent>
          )}
        </Tooltip>

        <PopoverContent side="left" align="start" className="w-72 p-0" onInteractOutside={(e) => e.preventDefault()}>
          <ScrollArea className="max-h-[400px]">
            {/* Quick Starters */}
            {starters.length > 0 && (
              <div className="p-2">
                <div className="text-[10px] font-medium text-muted-foreground px-1 mb-1.5">Quick Starters</div>
                <div className="space-y-0.5">
                  {starters.map((s, i) => {
                    const hasVars = s.variable_fields.length > 0;
                    const isExpanded = expandedStarterIdx === i;
                    return (
                      <div key={`${s.source}-${s.name}`}>
                        <button
                          onClick={() => {
                            if (hasVars) {
                              if (isExpanded) {
                                setExpandedStarterIdx(null);
                                setVariableValues({});
                              } else {
                                setExpandedStarterIdx(i);
                                const defaults: Record<string, string> = {};
                                for (const f of s.variable_fields) {
                                  if (f.default_value) defaults[f.key] = f.default_value;
                                }
                                setVariableValues(defaults);
                              }
                            } else {
                              callEnhance('full', s.prompt, s.name, s.id);
                            }
                          }}
                          className="w-full text-left px-2 py-1.5 rounded text-[11px] hover:bg-muted/80 transition-colors flex items-start gap-1.5"
                        >
                          {hasVars ? (
                            isExpanded
                              ? <ChevronDown className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                              : <ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                          ) : (
                            <Sparkles className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                          )}
                          <span className="leading-tight flex-1">{s.name}</span>
                          {s.reference_collections && s.reference_collections.length > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="shrink-0 ml-auto">
                                  <Images className="w-3 h-3 text-blue-500" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="text-[10px]">
                                {s.reference_collections.length} reference collection{s.reference_collections.length > 1 ? 's' : ''} attached
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </button>

                        {/* Variable fields for templates with placeholders */}
                        {isExpanded && (
                          <div className="mx-2 mt-1 mb-2 p-2 bg-muted/30 rounded border space-y-2">
                            {s.variable_fields.map((field) => (
                              <div key={field.key} className="space-y-0.5">
                                <div className="text-[10px] text-muted-foreground">
                                  {field.label}
                                  {field.required && <span className="text-destructive ml-0.5">*</span>}
                                </div>
                                {field.type === 'select' && field.options ? (
                                  <Select
                                    value={variableValues[field.key] ?? field.default_value ?? ''}
                                    onValueChange={(val) => setVariableValues((prev) => ({ ...prev, [field.key]: val }))}
                                  >
                                    <SelectTrigger className="h-7 text-[11px]">
                                      <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[...field.options].sort((a, b) => a.localeCompare(b)).map((opt) => (
                                        <SelectItem key={opt} value={opt} className="focus:bg-primary focus:text-primary-foreground">{opt}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <input
                                    type={field.type === 'number' ? 'number' : 'text'}
                                    value={variableValues[field.key] ?? ''}
                                    onChange={(e) => setVariableValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                                    placeholder={field.default_value || `Enter ${field.label.toLowerCase()}...`}
                                    className="w-full h-7 px-2 text-[11px] bg-background border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                )}
                              </div>
                            ))}
                            {/* Reference collection details */}
                            {s.reference_collections && s.reference_collections.length > 0 && allCollections && (() => {
                              const TYPE_COLORS: Record<string, string> = {
                                product: 'text-blue-600 bg-blue-500/10',
                                character: 'text-purple-600 bg-purple-500/10',
                                style: 'text-amber-600 bg-amber-500/10',
                                environment: 'text-green-600 bg-green-500/10',
                              };
                              const matched = allCollections.filter(c => s.reference_collections!.includes(c.name));
                              if (matched.length === 0) return null;
                              return (
                                <div className="rounded bg-blue-500/5 border border-blue-500/15 p-1.5 space-y-1">
                                  <div className="text-[9px] font-medium text-muted-foreground flex items-center gap-1">
                                    <Images className="w-2.5 h-2.5" />
                                    Reference Collections
                                  </div>
                                  {matched.map(c => (
                                    <div key={c.name} className="flex items-center gap-1.5">
                                      {c.primaryImage && (
                                        <img src={c.primaryImage.url} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
                                      )}
                                      <span className="text-[10px] truncate flex-1">{c.name}</span>
                                      <Badge variant="outline" className={`text-[7px] h-3.5 px-1 ${TYPE_COLORS[c.reference_type] || ''}`}>
                                        {c.reference_type}
                                      </Badge>
                                      <span className="text-[9px] text-muted-foreground shrink-0">{c.images.length} img</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                            <button
                              onClick={() => {
                                const missing = s.variable_fields
                                  .filter((f) => f.required)
                                  .filter((f) => !variableValues[f.key] && !f.default_value);
                                if (missing.length > 0) {
                                  toast.error(`Fill in required fields: ${missing.map((f) => f.label).join(', ')}`);
                                  return;
                                }
                                const currentVars = { ...variableValues };
                                const resolved = interpolateTemplate(s.prompt, s.variable_fields);
                                callEnhance('full', resolved, s.name, s.id, currentVars);
                                setExpandedStarterIdx(null);
                                setVariableValues({});
                              }}
                              className="w-full h-7 rounded bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              Generate with {brandName || 'Brand'} DNA
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {starters.length > 0 && <Separator />}

            {/* Enhance Current */}
            <div className="p-2">
              <div className="text-[10px] font-medium text-muted-foreground px-1 mb-1.5">Enhance Current</div>
              <div className="space-y-0.5">
                <button
                  onClick={() => callEnhance('quick')}
                  className="w-full text-left px-2 py-1.5 rounded text-[11px] hover:bg-muted/80 transition-colors flex items-start gap-1.5"
                >
                  <Wand2 className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                  <div>
                    <div className="font-medium">Fill empty fields</div>
                    <div className="text-[9px] text-muted-foreground">Keep your text, fill in the rest with brand DNA</div>
                  </div>
                </button>
                <button
                  onClick={() => callEnhance('full')}
                  className="w-full text-left px-2 py-1.5 rounded text-[11px] hover:bg-muted/80 transition-colors flex items-start gap-1.5"
                >
                  <RefreshCw className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                  <div>
                    <div className="font-medium">Full rewrite</div>
                    <div className="text-[9px] text-muted-foreground">Rewrite everything for maximum brand alignment</div>
                  </div>
                </button>
              </div>
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Applied Preset Indicator */}
      {appliedPreset && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 border border-primary/20 rounded text-[10px] text-primary">
          <Sparkles className="w-3 h-3 shrink-0" />
          <span className="truncate">{appliedPreset}</span>
          <button
            onClick={() => setAppliedPreset(null)}
            className="ml-auto shrink-0 hover:text-primary/70 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Scene description */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Scene</label>
        <textarea
          value={value.scene_description}
          onChange={(e) => update('scene_description', e.target.value)}
          placeholder="A sunlit rooftop terrace overlooking a city skyline..."
          className="w-full min-h-[56px] px-2.5 py-1.5 bg-background border rounded-lg resize-y focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-xs"
          disabled={enhancing}
        />
      </div>

      {/* Camera movement — video only */}
      {!isImage && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Camera Movement</label>
          <Select value={value.camera_movement} onValueChange={(v) => update('camera_movement', v)} disabled={enhancing}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select camera movement" />
            </SelectTrigger>
            <SelectContent>
              {CAMERA_MOVEMENTS.map((m) => (
                <SelectItem key={m.value} value={m.value || 'none'}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Lighting */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Lighting</label>
        <Select value={value.lighting} onValueChange={(v) => update('lighting', v)} disabled={enhancing}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select lighting" />
          </SelectTrigger>
          <SelectContent>
            {LIGHTING_PRESETS.map((l) => (
              <SelectItem key={l.value} value={l.value || 'none'}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lens */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Lens</label>
        <Select value={value.lens} onValueChange={(v) => update('lens', v)} disabled={enhancing}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select lens" />
          </SelectTrigger>
          <SelectContent>
            {LENS_PRESETS.map((l) => (
              <SelectItem key={l.value} value={l.value || 'none'}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subject attributes */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Subject / Characters</label>
        <textarea
          value={value.subject_attributes}
          onChange={(e) => update('subject_attributes', e.target.value)}
          placeholder="A confident woman mid-stride, tailored blazer, warm smile..."
          rows={2}
          className="w-full min-h-[32px] px-2.5 py-1.5 bg-background border rounded-lg resize-y focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-xs"
          disabled={enhancing}
        />
      </div>

      {/* Dialogue — video only */}
      {!isImage && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Dialogue (for lip-sync)</label>
          <textarea
            value={value.dialogue}
            onChange={(e) => update('dialogue', e.target.value)}
            placeholder="Welcome to our kitchen, let me show you..."
            rows={2}
            className="w-full min-h-[32px] px-2.5 py-1.5 bg-background border rounded-lg resize-y focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-xs"
            disabled={enhancing}
          />
        </div>
      )}

      {/* Prompt preview */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <Eye className="w-3 h-3" />
        {showPreview ? 'Hide' : 'Show'} Generated Prompt
        {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {showPreview && (
        <div className="p-2 bg-muted/50 rounded-lg text-[11px] text-muted-foreground font-mono leading-relaxed min-h-[3rem] max-h-48 overflow-y-auto resize-y">
          {buildPromptPreview()}
        </div>
      )}
    </div>
  );
}
