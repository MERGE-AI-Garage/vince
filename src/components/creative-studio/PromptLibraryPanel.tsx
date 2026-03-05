// ABOUTME: Browsable brand prompt template library as a Sheet panel
// ABOUTME: Users select templates to auto-fill prompts, camera settings, and model selection

import { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen, Search, Sparkles, Camera, Tag, TrendingUp,
  ChevronRight, Lock, Layers, SlidersHorizontal, Images,
} from 'lucide-react';
import { useBrandPrompts, useIncrementPromptUsage } from '@/hooks/useCreativeStudioPrompts';
import { fetchImageAsBase64 } from '@/lib/image-utils';
import type { BrandPromptTemplate, CameraPreset } from '@/types/creative-studio';
import type { StagedImage } from './MultiImageStagingArea';
import { toast } from 'sonner';

interface PromptLibraryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string | null;
  brandName: string;
  onApplyPrompt: (prompt: string) => void;
  onApplyCameraPreset?: (preset: CameraPreset) => void;
  onApplyModel?: (modelId: string) => void;
  onApplyTemplate?: (info: { id: string; name: string; variables?: Record<string, string>; reference_collections?: string[] }) => void;
  onApplyReferenceImages?: (images: StagedImage[]) => void;
  onApplyLockedParameters?: (params: Record<string, unknown>) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  product: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  lifestyle: 'bg-green-500/10 text-green-600 border-green-500/20',
  campaign: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  social: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  hero: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  editorial: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  cinematography: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  digital: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  blog: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  email: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  presentation: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  'brand-overview': 'bg-violet-500/10 text-violet-600 border-violet-500/20',
};

export function PromptLibraryPanel({
  open,
  onOpenChange,
  brandId,
  brandName,
  onApplyPrompt,
  onApplyCameraPreset,
  onApplyModel,
  onApplyTemplate,
  onApplyReferenceImages,
  onApplyLockedParameters,
}: PromptLibraryPanelProps) {
  const { data: prompts, isLoading } = useBrandPrompts(brandId ?? undefined);
  const incrementUsage = useIncrementPromptUsage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [isApplying, setIsApplying] = useState(false);

  // Derive categories from prompts
  const categories = useMemo(() => {
    if (!prompts) return [];
    const cats = [...new Set(prompts.map(p => p.category).filter(Boolean))];
    return cats as string[];
  }, [prompts]);

  // Filter prompts
  const filteredPrompts = useMemo(() => {
    if (!prompts) return [];
    let filtered = prompts;

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.prompt_template.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [prompts, selectedCategory, searchQuery]);

  // Build final prompt from template + variable values
  const buildPrompt = (template: BrandPromptTemplate): string => {
    let prompt = template.prompt_template;
    for (const field of template.variable_fields) {
      const value = variableValues[field.key] || field.default_value || '';
      prompt = prompt.replace(new RegExp(`\\{\\{${field.key}\\}\\}`, 'g'), value);
    }
    return prompt;
  };

  const handleApplyPrompt = async (template: BrandPromptTemplate) => {
    const prompt = buildPrompt(template);

    // Check required variables are filled
    const missingRequired = template.variable_fields
      .filter(f => f.required)
      .filter(f => !variableValues[f.key] && !f.default_value);

    if (missingRequired.length > 0) {
      toast.error(`Please fill in: ${missingRequired.map(f => f.label).join(', ')}`);
      return;
    }

    setIsApplying(true);

    try {
      onApplyPrompt(prompt);
      const vars = Object.keys(variableValues).length > 0 ? { ...variableValues } : undefined;
      onApplyTemplate?.({ id: template.id, name: template.name, variables: vars, reference_collections: template.reference_collections?.length ? template.reference_collections : undefined });

      if (template.camera_preset && onApplyCameraPreset) {
        onApplyCameraPreset(template.camera_preset);
      }

      if (template.recommended_model && onApplyModel) {
        onApplyModel(template.recommended_model);
      }

      // Apply locked parameters (e.g., include_logo → toggle switch)
      if (onApplyLockedParameters && Object.keys(template.locked_parameters).length > 0) {
        onApplyLockedParameters(template.locked_parameters);
      }

      // Load template reference images into staging area
      if (onApplyReferenceImages && template.reference_images && template.reference_images.length > 0) {
        const stagedImages = await Promise.all(
          template.reference_images.map(async (ref) => {
            const base64 = await fetchImageAsBase64(ref.url);
            return {
              id: crypto.randomUUID(),
              src: base64,
              mediaResolution: ref.media_resolution,
              referenceIntent: ref.reference_intent,
            } as StagedImage;
          })
        );
        onApplyReferenceImages(stagedImages);
      }

      // Track usage
      if (brandId) {
        incrementUsage.mutate({ id: template.id, brandId });
      }

      // Reset state
      setVariableValues({});
      setExpandedPromptId(null);
      onOpenChange(false);
      toast.success(`Applied "${template.name}" template`);
    } catch (err) {
      console.error('Failed to apply template:', err);
      toast.error('Failed to load template reference images');
    } finally {
      setIsApplying(false);
    }
  };

  const handleExpandPrompt = (template: BrandPromptTemplate) => {
    if (expandedPromptId === template.id) {
      setExpandedPromptId(null);
      setVariableValues({});
      return;
    }

    setExpandedPromptId(template.id);

    // Pre-fill default values
    const defaults: Record<string, string> = {};
    for (const field of template.variable_fields) {
      if (field.default_value) {
        defaults[field.key] = field.default_value;
      }
    }
    setVariableValues(defaults);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[420px] flex flex-col p-0 shadow-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <SheetHeader className="px-5 pt-5 pb-4 border-b bg-muted/30">
          <SheetTitle className="flex items-center gap-2.5 text-base">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="block">AI Library</span>
              {brandName && brandName !== 'No Brand Selected' && (
                <Badge variant="secondary" className="text-[9px] mt-0.5">{brandName}</Badge>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Search + Filter */}
          <div className="px-5 py-3.5 space-y-2.5 border-b bg-card/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="pl-9 h-9 text-xs shadow-sm"
              />
            </div>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant={selectedCategory === null ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="h-7 text-[10px] px-2.5 shadow-sm"
                >
                  All ({prompts?.length || 0})
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="h-7 text-[10px] px-2.5 capitalize shadow-sm"
                  >
                    {cat} ({prompts?.filter(p => p.category === cat).length || 0})
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Prompt List */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {!brandId && (
              <div className="text-center py-8">
                <Layers className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Select a brand to browse its prompt library
                </p>
              </div>
            )}

            {brandId && isLoading && (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground animate-pulse">Loading templates...</p>
              </div>
            )}

            {brandId && !isLoading && filteredPrompts.length === 0 && (
              <div className="text-center py-8">
                <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  {searchQuery || selectedCategory
                    ? 'No templates match your filter'
                    : 'No prompt templates yet for this brand'}
                </p>
              </div>
            )}

            {filteredPrompts.map(template => (
              <PromptCard
                key={template.id}
                template={template}
                isExpanded={expandedPromptId === template.id}
                isApplying={isApplying}
                variableValues={variableValues}
                onVariableChange={(key, value) => setVariableValues(prev => ({ ...prev, [key]: value }))}
                onToggleExpand={() => handleExpandPrompt(template)}
                onApply={() => handleApplyPrompt(template)}
              />
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Prompt Card ──────────────────────────────────────────────────────────────

interface PromptCardProps {
  template: BrandPromptTemplate;
  isExpanded: boolean;
  isApplying: boolean;
  variableValues: Record<string, string>;
  onVariableChange: (key: string, value: string) => void;
  onToggleExpand: () => void;
  onApply: () => void;
}

function PromptCard({
  template,
  isExpanded,
  isApplying,
  variableValues,
  onVariableChange,
  onToggleExpand,
  onApply,
}: PromptCardProps) {
  const hasVariables = template.variable_fields.length > 0;
  const hasRefImages = (template.reference_images?.length ?? 0) > 0;
  const needsExpansion = hasVariables || hasRefImages;
  const categoryColor = CATEGORY_COLORS[template.category || ''] || 'bg-muted text-muted-foreground';

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow bg-card">
      {/* Card Header — always visible */}
      <button
        onClick={needsExpansion ? onToggleExpand : onApply}
        disabled={isApplying}
        className="w-full text-left px-3.5 py-3 hover:bg-muted/40 transition-all disabled:opacity-50"
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-medium truncate">{template.name}</span>
              {template.is_auto_generated && (
                <Sparkles className="w-2.5 h-2.5 text-primary shrink-0" />
              )}
            </div>

            {template.description && (
              <p className="text-[10px] text-muted-foreground line-clamp-2">
                {template.description}
              </p>
            )}

            <div className="flex items-center gap-1.5 mt-1.5">
              {template.category && (
                <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${categoryColor}`}>
                  <Tag className="w-2 h-2 mr-0.5" />
                  {template.category}
                </Badge>
              )}
              {hasVariables && (
                <Badge variant="outline" className="text-[8px] h-4 px-1.5 bg-violet-500/10 text-violet-600 border-violet-500/20">
                  <SlidersHorizontal className="w-2 h-2 mr-0.5" />
                  Customizable
                </Badge>
              )}
              {hasRefImages && (
                <Badge variant="outline" className="text-[8px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  <Images className="w-2 h-2 mr-0.5" />
                  {template.reference_images!.length} ref{template.reference_images!.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {template.reference_collections && template.reference_collections.length > 0 && (
                <Badge variant="outline" className="text-[8px] h-4 px-1.5 bg-blue-500/10 text-blue-600 border-blue-500/20">
                  <Images className="w-2 h-2 mr-0.5" />
                  {template.reference_collections.length} collection{template.reference_collections.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {template.camera_preset && (
                <Badge variant="outline" className="text-[8px] h-4 px-1.5">
                  <Camera className="w-2 h-2 mr-0.5" />
                  Camera
                </Badge>
              )}
              {template.recommended_model && (
                <Badge variant="outline" className="text-[8px] h-4 px-1.5">
                  {template.recommended_model.split('-').slice(0, 2).join(' ')}
                </Badge>
              )}
              {template.usage_count > 0 && (
                <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                  <TrendingUp className="w-2 h-2" />
                  {template.usage_count}
                </span>
              )}
            </div>
          </div>

          {needsExpansion ? (
            <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          )}
        </div>
      </button>

      {/* Expanded: Variable Fields + Preview */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t bg-muted/30 space-y-3">
          {/* Locked parameters indicator */}
          {Object.keys(template.locked_parameters).length > 0 && (
            <div className="flex items-center gap-1 pt-2 text-[9px] text-muted-foreground">
              <Lock className="w-2.5 h-2.5" />
              {Object.keys(template.locked_parameters).length} brand-locked parameters
            </div>
          )}

          {/* Variable fields */}
          {template.variable_fields.map(field => (
            <div key={field.key} className="space-y-1 pt-1">
              <Label className="text-[10px] text-muted-foreground">
                {field.label}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>
              {field.type === 'select' && field.options ? (
                <Select
                  value={variableValues[field.key] ?? field.default_value ?? ''}
                  onValueChange={(val) => onVariableChange(field.key, val)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[...field.options].sort((a, b) => a.localeCompare(b)).map(opt => (
                      <SelectItem key={opt} value={opt} className="focus:bg-primary focus:text-primary-foreground">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={variableValues[field.key] ?? ''}
                  onChange={(e) => onVariableChange(field.key, e.target.value)}
                  placeholder={field.default_value || `Enter ${field.label.toLowerCase()}...`}
                  className="h-7 text-xs"
                />
              )}
            </div>
          ))}

          {/* Prompt preview */}
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Preview</Label>
            <div className="p-2 bg-background border rounded text-[10px] font-mono leading-relaxed min-h-[4rem] max-h-48 overflow-y-auto resize-y">
              {template.prompt_template.replace(
                /\{\{(\w+)\}\}/g,
                (_, key) => variableValues[key] || `[${key}]`
              )}
            </div>
          </div>

          {/* Reference image thumbnails */}
          {hasRefImages && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <Images className="w-2.5 h-2.5" />
                Reference images
              </div>
              <div className="grid grid-cols-4 gap-1">
                {template.reference_images!.map((ref, i) => (
                  <div key={i} className="relative aspect-square bg-muted rounded overflow-hidden border">
                    <img src={ref.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    <Badge
                      variant="secondary"
                      className="absolute bottom-0.5 left-0.5 text-[7px] h-3 px-1 bg-black/60 text-white border-0 capitalize"
                    >
                      {ref.reference_intent}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Camera preset summary */}
          {template.camera_preset && (
            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
              <Camera className="w-2.5 h-2.5" />
              {template.camera_preset.aperture && `f/${template.camera_preset.aperture}`}
              {template.camera_preset.focal_length && ` | ${template.camera_preset.focal_length}mm`}
              {template.camera_preset.lighting_setup && ` | ${template.camera_preset.lighting_setup.replace(/_/g, ' ')}`}
            </div>
          )}

          <Button
            size="sm"
            onClick={onApply}
            disabled={isApplying}
            className="w-full h-7 text-xs gap-1"
          >
            <Sparkles className="w-3 h-3" />
            {isApplying ? 'Loading...' : 'Apply Template'}
          </Button>
        </div>
      )}
    </div>
  );
}
