// ABOUTME: Dialog for saving a generation's prompt as a reusable brand template
// ABOUTME: Captures name, category, variable fields, camera preset, and reference images from current generation

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookMarked, Sparkles, X, Plus } from 'lucide-react';
import { useCreateBrandPrompt, type CreatePromptInput } from '@/hooks/useCreativeStudioPrompts';
import { useCreativeStudioBrands } from '@/hooks/useCreativeStudioBrands';
import { MultiImageStagingArea, type StagedImage } from './MultiImageStagingArea';
import { supabase } from '@/integrations/supabase/client';
import type { CameraPreset, TemplateReferenceImage } from '@/types/creative-studio';
import { toast } from 'sonner';

const MAX_TEMPLATE_REFERENCE_IMAGES = 8;

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string | null;
  brandName?: string;
  prompt: string;
  model?: string;
  cameraPreset?: CameraPreset;
  stagedImages?: StagedImage[];
}

const CATEGORIES = [
  { value: 'product', label: 'Product' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'social', label: 'Social' },
  { value: 'hero', label: 'Hero Shot' },
  { value: 'editorial', label: 'Editorial' },
];

interface VariableField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number';
  default_value?: string;
  options?: string[];
  required?: boolean;
}

export function SaveAsTemplateDialog({
  open,
  onOpenChange,
  brandId: initialBrandId,
  brandName: initialBrandName,
  prompt,
  model,
  cameraPreset,
  stagedImages: initialStagedImages,
}: SaveAsTemplateDialogProps) {
  const createPrompt = useCreateBrandPrompt();
  const { data: brands } = useCreativeStudioBrands();

  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(initialBrandId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [templateText, setTemplateText] = useState(prompt);
  const [variables, setVariables] = useState<VariableField[]>([]);
  const [referenceImages, setReferenceImages] = useState<StagedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const activeBrandId = selectedBrandId;
  const activeBrandName = brands?.find(b => b.id === activeBrandId)?.name || initialBrandName || '';

  // Reset form when dialog opens with new prompt
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTemplateText(prompt);
      setName('');
      setDescription('');
      setCategory('');
      setVariables([]);
      setReferenceImages(initialStagedImages || []);
      setSelectedBrandId(initialBrandId);
    }
    onOpenChange(isOpen);
  };

  const addVariable = () => {
    const key = `var_${variables.length + 1}`;
    setVariables(prev => [
      ...prev,
      { key, label: '', type: 'text', required: false },
    ]);
  };

  const updateVariable = (index: number, updates: Partial<VariableField>) => {
    setVariables(prev => prev.map((v, i) => i === index ? { ...v, ...updates } : v));
  };

  const removeVariable = (index: number) => {
    setVariables(prev => prev.filter((_, i) => i !== index));
  };

  /** Upload base64 staged images to Supabase Storage, return structured references */
  const uploadReferenceImages = async (
    brandId: string,
    images: StagedImage[]
  ): Promise<TemplateReferenceImage[]> => {
    if (images.length === 0) return [];

    const results = await Promise.allSettled(
      images.map(async (img) => {
        const blob = await fetch(img.src).then(r => r.blob());
        const ext = blob.type.includes('png') ? 'png' : 'jpg';
        const filename = `${Date.now()}-${img.id}.${ext}`;
        const storagePath = `template-references/${brandId}/${filename}`;

        const { data: uploadData, error } = await supabase.storage
          .from('creative-studio')
          .upload(storagePath, blob, { contentType: blob.type, upsert: false });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('creative-studio')
          .getPublicUrl(uploadData.path);

        return {
          url: urlData.publicUrl,
          storage_path: storagePath,
          reference_intent: img.referenceIntent,
          media_resolution: img.mediaResolution,
          filename,
        } as TemplateReferenceImage;
      })
    );

    return results
      .filter((r): r is PromiseFulfilledResult<TemplateReferenceImage> => r.status === 'fulfilled')
      .map(r => r.value);
  };

  const handleSave = async () => {
    if (!activeBrandId) {
      toast.error('Select a brand first');
      return;
    }
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (!templateText.trim()) {
      toast.error('Prompt template is required');
      return;
    }

    // Validate variable labels
    const invalidVars = variables.filter(v => !v.label.trim());
    if (invalidVars.length > 0) {
      toast.error('All variables need a label');
      return;
    }

    try {
      setIsUploading(true);

      // Upload reference images to storage
      const templateRefImages = await uploadReferenceImages(activeBrandId, referenceImages);

      const input: CreatePromptInput = {
        brand_id: activeBrandId,
        name: name.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        prompt_template: templateText.trim(),
        variable_fields: variables.map(v => ({
          key: v.key,
          label: v.label,
          type: v.type,
          default_value: v.default_value,
          options: v.options,
          required: v.required,
        })),
        camera_preset: cameraPreset,
        reference_images: templateRefImages.length > 0 ? templateRefImages : undefined,
        recommended_model: model,
        is_auto_generated: false,
      };

      await createPrompt.mutateAsync(input);
      toast.success(`Saved "${name}" to ${activeBrandName} template library`);
      handleOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
    } finally {
      setIsUploading(false);
    }
  };

  // Extract potential variable placeholders from template
  const placeholders = templateText.match(/\{\{(\w+)\}\}/g) || [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BookMarked className="w-4 h-4 text-primary" />
            Save as Template
            {activeBrandName && (
              <Badge variant="secondary" className="text-[9px]">{activeBrandName}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Brand picker */}
          <div className="space-y-1.5">
            <Label className="text-xs">Brand *</Label>
            <Select
              value={activeBrandId || ''}
              onValueChange={(v) => setSelectedBrandId(v || null)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select a brand..." />
              </SelectTrigger>
              <SelectContent>
                {brands?.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs">Template Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Product Hero Shot"
              className="h-8 text-xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="When to use this template..."
              className="h-8 text-xs"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prompt Template */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              Prompt Template
              <span className="text-muted-foreground ml-1 font-normal">
                (use {"{{variable_name}}"} for user-editable fields)
              </span>
            </Label>
            <Textarea
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
              className="h-28 text-xs font-mono resize-none"
            />
            {placeholders.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[9px] text-muted-foreground">Variables found:</span>
                {placeholders.map((p, i) => (
                  <Badge key={i} variant="outline" className="text-[8px] h-4 px-1 font-mono">
                    {p}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Reference Images */}
          <div className="space-y-1.5">
            <Label className="text-xs">Reference Images</Label>
            <MultiImageStagingArea
              images={referenceImages}
              onChange={setReferenceImages}
              maxImages={MAX_TEMPLATE_REFERENCE_IMAGES}
            />
          </div>

          {/* Variable Fields */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Variable Fields</Label>
              <Button variant="ghost" size="sm" onClick={addVariable} className="h-6 text-[10px] gap-1">
                <Plus className="w-3 h-3" />
                Add Variable
              </Button>
            </div>

            {variables.map((v, i) => (
              <div key={i} className="flex items-start gap-2 p-2 border rounded bg-muted/30">
                <div className="flex-1 space-y-1.5">
                  <div className="flex gap-2">
                    <Input
                      value={v.key}
                      onChange={(e) => updateVariable(i, { key: e.target.value.replace(/\s/g, '_') })}
                      placeholder="key"
                      className="h-7 text-[10px] font-mono w-24"
                    />
                    <Input
                      value={v.label}
                      onChange={(e) => updateVariable(i, { label: e.target.value })}
                      placeholder="Display label"
                      className="h-7 text-[10px] flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={v.type} onValueChange={(val: 'text' | 'select' | 'number') => updateVariable(i, { type: val, options: val === 'select' ? (v.options || []) : undefined })}>
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
                      onChange={(e) => updateVariable(i, { default_value: e.target.value })}
                      placeholder="Default value"
                      className="h-6 text-[10px] flex-1"
                    />
                    <label className="flex items-center gap-1 text-[9px] text-muted-foreground whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={v.required || false}
                        onChange={(e) => updateVariable(i, { required: e.target.checked })}
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
                        onChange={(e) => updateVariable(i, { options: e.target.value.split('\n').filter(line => line.trim()) })}
                        placeholder={"Option 1\nOption 2\nOption 3"}
                        className="w-full min-h-[48px] px-2 py-1 text-[10px] bg-background border rounded resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeVariable(i)} className="h-6 w-6 p-0 shrink-0">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Camera preset + model info */}
          {(cameraPreset || model) && (
            <div className="flex items-center gap-2 flex-wrap text-[9px] text-muted-foreground">
              {model && (
                <Badge variant="outline" className="text-[8px] h-4 px-1.5">
                  <Sparkles className="w-2 h-2 mr-0.5" />
                  {model}
                </Badge>
              )}
              {cameraPreset?.aperture && (
                <span>f/{cameraPreset.aperture}</span>
              )}
              {cameraPreset?.focal_length && (
                <span>{cameraPreset.focal_length}mm</span>
              )}
              {cameraPreset?.lighting_setup && (
                <span>{cameraPreset.lighting_setup.replace(/_/g, ' ')}</span>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!activeBrandId || !name.trim() || createPrompt.isPending || isUploading}
            className="gap-1"
          >
            <BookMarked className="w-3 h-3" />
            {isUploading ? 'Uploading images...' : createPrompt.isPending ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
