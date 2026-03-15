// ABOUTME: Full CRUD admin panel for brand prompt templates with category filtering
// ABOUTME: Create, edit, delete templates with camera presets and variable fields

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookMarked, Plus, Pencil, Trash2, Camera, Sparkles, X, Copy, Search, ArrowUpDown, Loader2, Wand2, Check, Images,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  useBrandPrompts,
  useCreateBrandPrompt,
  useUpdateBrandPrompt,
  useDeleteBrandPrompt,
  useGenerateBrandStarters,
  type CreatePromptInput,
  type UpdatePromptInput,
  type GeneratedStarter,
} from '@/hooks/useCreativeStudioPrompts';
import type { BrandPromptTemplate, CameraPreset } from '@/types/creative-studio';
import { useCameraOptions } from '@/hooks/useCreativeStudioCameraOptions';
import { useBrandReferenceCollections } from '@/hooks/useBrandReferences';

interface PromptTemplateAdminProps {
  brandId: string;
}

const CATEGORIES = [
  { value: 'product', label: 'Product' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'social', label: 'Social' },
  { value: 'hero', label: 'Hero Shot' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'cinematography', label: 'Cinematography' },
];

const PILL_BTN = 'rounded-full border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50 transition-all duration-150';

const STARTER_PRESETS: Array<{
  name: string;
  category: string;
  prompt_template: string;
  description: string;
  camera_preset: CameraPreset;
}> = [
  {
    name: 'Dramatic Product Hero',
    category: 'hero',
    description: 'Studio three-point lighting with shallow depth of field for product features',
    prompt_template: 'A dramatic hero shot of {{product}} on a clean studio backdrop, cinematic three-point lighting emphasizing texture and form, shallow depth of field with bokeh background, product fills frame at eye level',
    camera_preset: {
      aperture: 1.8,
      focal_length: 85,
      lighting_setup: 'three_point',
      depth_of_field: 'shallow',
      film_stock: 'kodak_portra_400',
    },
  },
  {
    name: 'Lifestyle Editorial',
    category: 'editorial',
    description: 'Natural golden hour light with warm tones for lifestyle content',
    prompt_template: 'An editorial lifestyle shot of {{subject}} in a natural setting, golden hour warm light, environmental context with intentional negative space, authentic and aspirational mood',
    camera_preset: {
      aperture: 4,
      focal_length: 35,
      lighting_setup: 'natural_golden_hour',
      depth_of_field: 'medium',
      film_stock: 'kodak_portra_400',
      color_temperature: 5500,
    },
  },
  {
    name: 'Social Media Flat Lay',
    category: 'social',
    description: 'Overhead flat lay with even lighting for social content',
    prompt_template: 'A carefully styled flat lay arrangement of {{items}} on {{background}}, overhead camera angle, soft even diffused lighting, organized grid with intentional spacing',
    camera_preset: {
      aperture: 8,
      focal_length: 50,
      lighting_setup: 'overcast_soft',
      composition: 'overhead_flat_lay',
    },
  },
];

export function PromptTemplateAdmin({ brandId }: PromptTemplateAdminProps) {
  const { data: prompts, isLoading } = useBrandPrompts(brandId);
  const createMutation = useCreateBrandPrompt();
  const updateMutation = useUpdateBrandPrompt();
  const deleteMutation = useDeleteBrandPrompt();
  const generateMutation = useGenerateBrandStarters();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<BrandPromptTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [previewStarters, setPreviewStarters] = useState<GeneratedStarter[] | null>(null);

  const filtered = (prompts || [])
    .filter(p => !selectedCategory || p.category === selectedCategory)
    .filter(p => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        p.prompt_template.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'most-used': return (b.usage_count || 0) - (a.usage_count || 0);
        case 'newest': return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        default: return a.name.localeCompare(b.name);
      }
    });

  // Get category counts for filter badges
  const categoryCounts = (prompts || []).reduce<Record<string, number>>((acc, p) => {
    const cat = p.category || 'uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const handleEdit = (prompt: BrandPromptTemplate) => {
    setEditingPrompt(prompt);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingPrompt(null);
    setEditorOpen(true);
  };

  const handleClone = (prompt: BrandPromptTemplate) => {
    setEditingPrompt({
      ...prompt,
      id: '', // signal to create, not update
      name: `${prompt.name} (copy)`,
    });
    setEditorOpen(true);
  };

  const handleSave = async (data: CreatePromptInput | UpdatePromptInput, isNew: boolean) => {
    try {
      if (isNew) {
        await createMutation.mutateAsync(data as CreatePromptInput);
        toast.success('Template created');
      } else if (editingPrompt) {
        await updateMutation.mutateAsync({ id: editingPrompt.id, updates: data as UpdatePromptInput });
        toast.success('Template updated');
      }
      setEditorOpen(false);
      setEditingPrompt(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteConfirm, brandId });
      setDeleteConfirm(null);
      toast.success('Template deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleSeedStarters = async () => {
    try {
      for (const starter of STARTER_PRESETS) {
        await createMutation.mutateAsync({
          brand_id: brandId,
          ...starter,
        });
      }
      toast.success(`Seeded ${STARTER_PRESETS.length} starter templates`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to seed templates');
    }
  };

  const handleGenerateStarters = async () => {
    try {
      const starters = await generateMutation.mutateAsync(brandId);
      setPreviewStarters(starters);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate starters');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-purple-500" />
              Prompt Templates
            </CardTitle>
            <CardDescription>
              {prompts?.length || 0} template{(prompts?.length || 0) !== 1 ? 's' : ''} in the library · Reusable creative recipes that layer on top of the brand's generation prompt. Define camera angles, lighting setups, and variable fields once — teams start from a proven template instead of a blank prompt, ensuring brand consistency while allowing creative variation per campaign.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {(!prompts || prompts.length === 0) && (
              <Button
                variant="outline"
                size="sm"
                className={PILL_BTN}
                onClick={handleSeedStarters}
                disabled={createMutation.isPending}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Seed Starters
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={PILL_BTN}
              onClick={handleGenerateStarters}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-3 w-3 mr-1" />
                  Generate with Gemini
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" className={PILL_BTN} onClick={handleCreate}>
              <Plus className="h-3 w-3 mr-1" />
              Add Template
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Category filter */}
        {Object.keys(categoryCounts).length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            <Badge
              variant={!selectedCategory ? 'default' : 'outline'}
              className="cursor-pointer text-[10px] h-5"
              onClick={() => setSelectedCategory(null)}
            >
              All ({prompts?.length || 0})
            </Badge>
            {CATEGORIES.filter(c => categoryCounts[c.value]).map(c => (
              <Badge
                key={c.value}
                variant={selectedCategory === c.value ? 'default' : 'outline'}
                className="cursor-pointer text-[10px] h-5"
                onClick={() => setSelectedCategory(c.value)}
              >
                {c.label} ({categoryCounts[c.value]})
              </Badge>
            ))}
            {categoryCounts['uncategorized'] && (
              <Badge
                variant={selectedCategory === 'uncategorized' ? 'default' : 'outline'}
                className="cursor-pointer text-[10px] h-5"
                onClick={() => setSelectedCategory('uncategorized')}
              >
                Uncategorized ({categoryCounts['uncategorized']})
              </Badge>
            )}
          </div>
        )}

        {/* Search + Sort */}
        {prompts && prompts.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="h-8 text-xs pl-8"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 text-xs w-[140px] shrink-0">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A–Z</SelectItem>
                <SelectItem value="name-desc">Name Z–A</SelectItem>
                <SelectItem value="most-used">Most Used</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {!prompts || prompts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No prompt templates yet. Create one or seed starter presets.
          </p>
        ) : (
          <>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {filtered.map(pt => (
                  <div key={pt.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{pt.name}</span>
                        {pt.is_auto_generated && (
                          <Badge variant="outline" className="text-[8px] h-4 px-1 bg-purple-500/10 text-purple-600">
                            AI
                          </Badge>
                        )}
                      </div>
                      {pt.description && (
                        <p className="text-[10px] text-muted-foreground truncate">{pt.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 truncate font-mono mt-0.5">
                        {pt.prompt_template.slice(0, 100)}{pt.prompt_template.length > 100 ? '...' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {pt.category && (
                        <Badge variant="outline" className="text-[8px] h-4 px-1 capitalize">
                          {pt.category}
                        </Badge>
                      )}
                      {pt.camera_preset && (
                        <Badge variant="outline" className="text-[8px] h-4 px-1">
                          <Camera className="h-2 w-2 mr-0.5" />
                          Camera
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground w-10 text-right">
                        {pt.usage_count} uses
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleClone(pt)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(pt)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setDeleteConfirm(pt.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {(searchQuery || selectedCategory) && filtered.length !== (prompts?.length ?? 0) && (
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Showing {filtered.length} of {prompts?.length ?? 0} templates
              </p>
            )}
          </>
        )}
      </CardContent>

      {/* Editor Dialog */}
      <PromptEditorDialog
        open={editorOpen}
        prompt={editingPrompt}
        brandId={brandId}
        onClose={() => { setEditorOpen(false); setEditingPrompt(null); }}
        onSave={handleSave}
        saving={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              This template will be permanently removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI-Generated Starters Preview */}
      <StarterPreviewDialog
        starters={previewStarters}
        brandId={brandId}
        onClose={() => setPreviewStarters(null)}
        createMutation={createMutation}
      />
    </Card>
  );
}

// ── Template Editor Dialog ───────────────────────────────────────────────────

interface PromptEditorDialogProps {
  open: boolean;
  prompt: BrandPromptTemplate | null;
  brandId: string;
  onClose: () => void;
  onSave: (data: CreatePromptInput | UpdatePromptInput, isNew: boolean) => Promise<void>;
  saving: boolean;
}

function PromptEditorDialog({ open, prompt, brandId, onClose, onSave, saving }: PromptEditorDialogProps) {
  const { data: filmStockOptions } = useCameraOptions('film_stock');
  const { data: cameraBodyOptions } = useCameraOptions('camera_body');
  const { data: lightingOptions } = useCameraOptions('lighting');
  const { data: compositionOptions } = useCameraOptions('composition');
  const { data: depthOfFieldOptions } = useCameraOptions('depth_of_field');
  const { data: printProcessOptions } = useCameraOptions('print_process');
  const { data: colorGradeOptions } = useCameraOptions('color_grade');
  const { data: filmEffectOptions } = useCameraOptions('film_effect');
  const { data: shotTypeOptions } = useCameraOptions('shot_type');
  const { data: availableCollections } = useBrandReferenceCollections(brandId);

  // id='' means we're cloning
  const isNew = !prompt || prompt.id === '';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [templateText, setTemplateText] = useState('');
  const [recommendedModel, setRecommendedModel] = useState('');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>({});
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [variableFields, setVariableFields] = useState<Array<{
    key: string;
    label: string;
    type: 'text' | 'select' | 'number';
    default_value?: string;
    options?: string[];
    required?: boolean;
  }>>([]);

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && prompt) {
      setName(prompt.name);
      setDescription(prompt.description || '');
      setCategory(prompt.category || '');
      setTemplateText(prompt.prompt_template);
      setRecommendedModel(prompt.recommended_model || '');
      setCameraPreset(prompt.camera_preset || {});
      setSelectedCollections(prompt.reference_collections || []);
      setVariableFields(prompt.variable_fields?.map(f => ({ ...f })) || []);
    } else if (isOpen) {
      setName('');
      setDescription('');
      setCategory('');
      setTemplateText('');
      setRecommendedModel('');
      setCameraPreset({});
      setSelectedCollections([]);
      setVariableFields([]);
    }
    if (!isOpen) onClose();
  };

  // Trigger on open
  if (open && name === '' && prompt?.name) {
    handleOpenChange(true);
  }

  const hasCameraPreset = Object.values(cameraPreset).some(v => v !== undefined && v !== '');

  const handleSave = () => {
    if (!name.trim() || !templateText.trim()) return;

    const preset = hasCameraPreset ? cameraPreset : undefined;

    // Only include valid variable fields (must have label)
    const validVars = variableFields.filter(v => v.label.trim());

    if (isNew) {
      onSave({
        brand_id: brandId,
        name: name.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        prompt_template: templateText.trim(),
        variable_fields: validVars,
        camera_preset: preset,
        reference_collections: selectedCollections.length > 0 ? selectedCollections : undefined,
        recommended_model: recommendedModel.trim() || undefined,
      }, true);
    } else {
      onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        prompt_template: templateText.trim(),
        variable_fields: validVars,
        camera_preset: preset || null,
        reference_collections: selectedCollections.length > 0 ? selectedCollections : null,
        recommended_model: recommendedModel.trim() || null,
      }, false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BookMarked className="w-4 h-4 text-primary" />
            {isNew ? 'Create Template' : 'Edit Template'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Hero Sandwich Shot"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="When to use this template..."
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Recommended Model</Label>
              <Input
                value={recommendedModel}
                onChange={(e) => setRecommendedModel(e.target.value)}
                placeholder="e.g., gemini-2.0-flash"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Prompt Template
              <span className="text-muted-foreground ml-1 font-normal">
                (use {"{{variable}}"} for placeholders)
              </span>
            </Label>
            <Textarea
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
              className="min-h-[8rem] text-xs font-mono resize-y"
              placeholder="A dramatic hero shot of {{product}} on a clean studio backdrop..."
            />
          </div>

          {/* Variable Fields */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Variable Fields</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const key = `var_${variableFields.length + 1}`;
                  setVariableFields(prev => [...prev, { key, label: '', type: 'text', required: false }]);
                }}
                className="h-6 text-[10px] gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Variable
              </Button>
            </div>

            {variableFields.length === 0 && (
              <p className="text-[10px] text-muted-foreground">
                No variables defined. Add variables to create dropdown/input fields for {'{{placeholders}}'} in the template.
              </p>
            )}

            {variableFields.map((v, i) => (
              <div key={i} className="p-2 border rounded bg-muted/30 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Input
                    value={v.key}
                    onChange={(e) => {
                      const updated = [...variableFields];
                      updated[i] = { ...v, key: e.target.value.replace(/\s/g, '_') };
                      setVariableFields(updated);
                    }}
                    placeholder="key (e.g. product_line)"
                    className="h-7 text-[10px] font-mono w-32"
                  />
                  <Input
                    value={v.label}
                    onChange={(e) => {
                      const updated = [...variableFields];
                      updated[i] = { ...v, label: e.target.value };
                      setVariableFields(updated);
                    }}
                    placeholder="Display label"
                    className="h-7 text-[10px] flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVariableFields(prev => prev.filter((_, idx) => idx !== i))}
                    className="h-6 w-6 p-0 shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={v.type}
                    onValueChange={(val: 'text' | 'select' | 'number') => {
                      const updated = [...variableFields];
                      updated[i] = { ...v, type: val, options: val === 'select' ? (v.options || []) : undefined };
                      setVariableFields(updated);
                    }}
                  >
                    <SelectTrigger className="h-6 text-[10px] w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={v.default_value || ''}
                    onChange={(e) => {
                      const updated = [...variableFields];
                      updated[i] = { ...v, default_value: e.target.value };
                      setVariableFields(updated);
                    }}
                    placeholder="Default value"
                    className="h-6 text-[10px] flex-1"
                  />
                  <label className="flex items-center gap-1 text-[9px] text-muted-foreground whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={v.required || false}
                      onChange={(e) => {
                        const updated = [...variableFields];
                        updated[i] = { ...v, required: e.target.checked };
                        setVariableFields(updated);
                      }}
                      className="w-3 h-3"
                    />
                    Required
                  </label>
                </div>
                {v.type === 'select' && (
                  <div className="space-y-1 pt-1 border-t border-dashed">
                    <Label className="text-[9px] text-muted-foreground">Options (one per line)</Label>
                    <textarea
                      value={(v.options || []).join('\n')}
                      onChange={(e) => {
                        const updated = [...variableFields];
                        updated[i] = { ...v, options: e.target.value.split('\n').filter(line => line.trim()) };
                        setVariableFields(updated);
                      }}
                      placeholder={"Option 1\nOption 2\nOption 3"}
                      className="w-full min-h-[48px] px-2 py-1 text-[10px] bg-background border rounded resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Reference Collections */}
          {availableCollections && availableCollections.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Images className="h-3 w-3" />
                Reference Collections
              </Label>
              <p className="text-[10px] text-muted-foreground">
                Attach collections to auto-inject their images when this template is used.
                {selectedCollections.length > 0 && (() => {
                  const totalImages = selectedCollections.reduce((sum, name) => {
                    const col = availableCollections.find(c => c.name === name);
                    return sum + (col?.images.length ?? 0);
                  }, 0);
                  return ` (${totalImages} image${totalImages !== 1 ? 's' : ''} total)`;
                })()}
              </p>
              <div className="space-y-3">
                {(['product', 'character', 'style', 'environment'] as const).map(type => {
                  const typeCols = availableCollections.filter(c => c.reference_type === type);
                  if (typeCols.length === 0) return null;
                  const typeColors: Record<string, string> = {
                    product: 'bg-blue-100 text-blue-700',
                    character: 'bg-purple-100 text-purple-700',
                    style: 'bg-amber-100 text-amber-700',
                    environment: 'bg-green-100 text-green-700',
                  };
                  return (
                    <div key={type} className="space-y-1.5">
                      <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 ${typeColors[type]}`}>
                        {type}
                      </Badge>
                      {typeCols.map(col => {
                        const isSelected = selectedCollections.includes(col.name);
                        return (
                          <label
                            key={col.name}
                            className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                              isSelected ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 hover:bg-muted/50'
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                setSelectedCollections(prev =>
                                  checked
                                    ? [...prev, col.name]
                                    : prev.filter(n => n !== col.name)
                                );
                              }}
                            />
                            {col.primaryImage && (
                              <img
                                src={col.primaryImage.url}
                                alt=""
                                className="w-8 h-8 rounded object-cover shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium">{col.name}</span>
                              <span className="text-[10px] text-muted-foreground ml-1.5">
                                {col.images.length} image{col.images.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Camera Preset */}
          <div className="space-y-3">
            <Label className="text-xs flex items-center gap-1">
              <Camera className="h-3 w-3" />
              Camera Preset
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Aperture (f/)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={cameraPreset.aperture || ''}
                  onChange={(e) => setCameraPreset(prev => ({ ...prev, aperture: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="h-7 text-[10px]"
                  placeholder="1.8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Focal Length (mm)</Label>
                <Input
                  type="number"
                  value={cameraPreset.focal_length || ''}
                  onChange={(e) => setCameraPreset(prev => ({ ...prev, focal_length: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="h-7 text-[10px]"
                  placeholder="85"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Color Temp (K)</Label>
                <Input
                  type="number"
                  value={cameraPreset.color_temperature || ''}
                  onChange={(e) => setCameraPreset(prev => ({ ...prev, color_temperature: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="h-7 text-[10px]"
                  placeholder="5500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Camera Body</Label>
                <Select
                  value={cameraPreset.camera_body || ''}
                  onValueChange={(v) => setCameraPreset(prev => ({ ...prev, camera_body: v || undefined }))}
                >
                  <SelectTrigger className="h-7 text-[10px]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cameraBodyOptions?.map(opt => (
                      <SelectItem key={opt.slug} value={opt.slug}>{opt.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Lighting Setup</Label>
                <Select
                  value={cameraPreset.lighting_setup || ''}
                  onValueChange={(v) => setCameraPreset(prev => ({ ...prev, lighting_setup: v || undefined }))}
                >
                  <SelectTrigger className="h-7 text-[10px]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lightingOptions?.map(opt => (
                      <SelectItem key={opt.slug} value={opt.slug}>{opt.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Film Stock</Label>
                <Select
                  value={cameraPreset.film_stock || ''}
                  onValueChange={(v) => setCameraPreset(prev => ({ ...prev, film_stock: v || undefined }))}
                >
                  <SelectTrigger className="h-7 text-[10px]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filmStockOptions?.map(opt => (
                      <SelectItem key={opt.slug} value={opt.slug}>{opt.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Depth of Field</Label>
                <Select
                  value={cameraPreset.depth_of_field || ''}
                  onValueChange={(v) => setCameraPreset(prev => ({ ...prev, depth_of_field: v || undefined }))}
                >
                  <SelectTrigger className="h-7 text-[10px]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {depthOfFieldOptions?.map(opt => (
                      <SelectItem key={opt.slug} value={opt.slug}>{opt.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Composition</Label>
                <Select
                  value={cameraPreset.composition || ''}
                  onValueChange={(v) => setCameraPreset(prev => ({ ...prev, composition: v || undefined }))}
                >
                  <SelectTrigger className="h-7 text-[10px]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {compositionOptions?.map(opt => (
                      <SelectItem key={opt.slug} value={opt.slug}>{opt.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Shot Type</Label>
                <Select
                  value={cameraPreset.shot_type || ''}
                  onValueChange={(v) => setCameraPreset(prev => ({ ...prev, shot_type: v || undefined }))}
                >
                  <SelectTrigger className="h-7 text-[10px]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {shotTypeOptions?.map(opt => (
                      <SelectItem key={opt.slug} value={opt.slug}>{opt.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Print Process</Label>
                <Select
                  value={cameraPreset.print_process || ''}
                  onValueChange={(v) => setCameraPreset(prev => ({ ...prev, print_process: v || undefined }))}
                >
                  <SelectTrigger className="h-7 text-[10px]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {printProcessOptions?.map(opt => (
                      <SelectItem key={opt.slug} value={opt.slug}>{opt.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Color Grade</Label>
                <Select
                  value={cameraPreset.color_grade || ''}
                  onValueChange={(v) => setCameraPreset(prev => ({ ...prev, color_grade: v || undefined }))}
                >
                  <SelectTrigger className="h-7 text-[10px]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {colorGradeOptions?.map(opt => (
                      <SelectItem key={opt.slug} value={opt.slug}>{opt.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Film Effect</Label>
                <Select
                  value={cameraPreset.film_effect || ''}
                  onValueChange={(v) => setCameraPreset(prev => ({ ...prev, film_effect: v || undefined }))}
                >
                  <SelectTrigger className="h-7 text-[10px]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filmEffectOptions?.map(opt => (
                      <SelectItem key={opt.slug} value={opt.slug}>{opt.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !name.trim() || !templateText.trim()}
            className="gap-1"
          >
            <BookMarked className="w-3 h-3" />
            {saving ? 'Saving...' : isNew ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── AI-Generated Starters Preview Dialog ─────────────────────────────────────

interface StarterPreviewDialogProps {
  starters: GeneratedStarter[] | null;
  brandId: string;
  onClose: () => void;
  createMutation: ReturnType<typeof useCreateBrandPrompt>;
}

function StarterPreviewDialog({ starters, brandId, onClose, createMutation }: StarterPreviewDialogProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  // Select all when starters first arrive
  const starterCount = starters?.length ?? 0;
  useState(() => {
    if (starterCount > 0) {
      setSelected(new Set(Array.from({ length: starterCount }, (_, i) => i)));
    }
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setSelected(new Set());
    }
  };

  // Reset selection when starters change
  if (starters && selected.size === 0 && starters.length > 0) {
    setSelected(new Set(starters.map((_, i) => i)));
  }

  const toggleStarter = (index: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    if (!starters) return;
    if (selected.size === starters.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(starters.map((_, i) => i)));
    }
  };

  const handleSaveSelected = async () => {
    if (!starters) return;
    setSaving(true);
    try {
      let savedCount = 0;
      for (const index of selected) {
        const starter = starters[index];
        if (!starter) continue;
        await createMutation.mutateAsync({
          brand_id: brandId,
          name: starter.name,
          description: starter.description || undefined,
          category: starter.category || undefined,
          prompt_template: starter.prompt_template,
          camera_preset: starter.camera_preset || undefined,
          is_auto_generated: true,
        });
        savedCount++;
      }
      toast.success(`Saved ${savedCount} AI-generated starters`);
      onClose();
      setSelected(new Set());
    } catch (err: any) {
      toast.error(err.message || 'Failed to save starters');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!starters && starters.length > 0} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Wand2 className="w-4 h-4 text-purple-500" />
            AI-Generated Quick Starters
          </DialogTitle>
          <DialogDescription>
            {starters?.length} starters generated from Brand DNA. Uncheck any you don't want to keep.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-1">
          <button
            onClick={toggleAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {selected.size === (starters?.length ?? 0) ? 'Deselect all' : 'Select all'}
          </button>
          <span className="text-xs text-muted-foreground">
            {selected.size} of {starters?.length ?? 0} selected
          </span>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 pb-2">
            {starters?.map((starter, index) => (
              <div
                key={index}
                className={`flex gap-3 p-3 border rounded-lg transition-colors cursor-pointer ${
                  selected.has(index) ? 'bg-purple-500/5 border-purple-500/20' : 'opacity-50'
                }`}
                onClick={() => toggleStarter(index)}
              >
                <Checkbox
                  checked={selected.has(index)}
                  onCheckedChange={() => toggleStarter(index)}
                  className="mt-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{starter.name}</span>
                    <Badge variant="outline" className="text-[8px] h-4 px-1 capitalize">
                      {starter.category}
                    </Badge>
                    {starter.camera_preset && (
                      <Badge variant="outline" className="text-[8px] h-4 px-1">
                        <Camera className="h-2 w-2 mr-0.5" />
                        Camera
                      </Badge>
                    )}
                  </div>
                  {starter.description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{starter.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/70 font-mono mt-1 line-clamp-2">
                    {starter.prompt_template}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSaveSelected}
            disabled={saving || selected.size === 0}
            className="gap-1"
          >
            {saving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                Save {selected.size} Starter{selected.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
