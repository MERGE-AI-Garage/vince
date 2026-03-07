// ABOUTME: Card & display settings — hero image, card images, and quick prompts
// ABOUTME: Manages the visual presentation of brands in the Creative Studio interface

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, X, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { BRAND_CATEGORIES } from '@/types/creative-studio';
import type { CreativeStudioBrand, QuickPrompt, CreateBrandInput } from '@/types/creative-studio';
import type { BrandFormProps } from './BrandEditorDialog';
import { BrandCardImagesSection } from './BrandCardImagesSection';
import { BrandLogoLibrary } from './BrandLogoLibrary';

interface Props extends BrandFormProps {
  brand: CreativeStudioBrand | null;
  onSave: (data: Partial<CreateBrandInput>) => Promise<void>;
}

export function BrandEditorDisplaySection({ form, updateField, brand, onSave }: Props) {
  const [generatingHero, setGeneratingHero] = useState(false);

  const handleGenerateHero = async () => {
    setGeneratingHero(true);
    try {
      const { data: template } = await supabase
        .from('ai_prompt_templates')
        .select('prompt_text')
        .eq('slug', 'brand-hero-image')
        .eq('is_active', true)
        .single();

      if (!template) throw new Error('Brand hero image prompt template not found');

      const paletteExtra = form.color_palette.length > 0
        ? `, with supporting colors: ${form.color_palette.join(', ')}`
        : '';
      const categoryLabel = BRAND_CATEGORIES.find(c => c.value === form.brand_category)?.label
        || form.brand_category || 'general';

      const vars: Record<string, string> = {
        brand_name: form.name,
        brand_category: categoryLabel,
        visual_identity: form.visual_identity || 'Modern, professional brand aesthetic',
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        palette_extra: paletteExtra,
      };

      let prompt = template.prompt_text;
      for (const [key, val] of Object.entries(vars)) {
        prompt = prompt.split(`{{${key}}}`).join(val);
      }

      const { data, error } = await supabase.functions.invoke('generate-header-image', {
        body: { prompt, aspectRatio: '16:9', style: 'cinematic', contentType: 'custom', brand_id: brand?.id },
      });

      if (error || !data?.imageUrl) throw error || new Error('No image returned');

      updateField('hero_image_url', data.imageUrl);
      toast.success('Hero image generated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate hero image');
    } finally {
      setGeneratingHero(false);
    }
  };

  const addQuickPrompt = () => {
    updateField('quick_prompts', [...form.quick_prompts, { name: '', prompt: '' }]);
  };

  const removeQuickPrompt = (index: number) => {
    updateField('quick_prompts', form.quick_prompts.filter((_, i) => i !== index));
  };

  const updateQuickPrompt = (index: number, field: keyof QuickPrompt, value: string) => {
    updateField(
      'quick_prompts',
      form.quick_prompts.map((qp, i) => i === index ? { ...qp, [field]: value } : qp)
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Card & Display
      </h3>

      {/* Hero Image */}
      <div className="space-y-3">
        <Label>Hero Image</Label>
        <p className="text-xs text-muted-foreground">
          Full-bleed background for the brand card. Generated from brand colors and visual identity.
        </p>

        {form.hero_image_url && (
          <div className="relative rounded-lg overflow-hidden aspect-video border border-border/40">
            <img src={form.hero_image_url} alt="Brand hero" className="w-full h-full object-cover" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-7 w-7 p-0 bg-black/50 text-white hover:bg-black/70"
              onClick={() => updateField('hero_image_url', undefined)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerateHero}
          disabled={generatingHero || !form.name}
          className="gap-2"
        >
          {generatingHero ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              {form.hero_image_url ? 'Regenerate Hero Image' : 'Generate Hero Image'}
            </>
          )}
        </Button>
      </div>

      {/* Card Images */}
      {brand && (
        <BrandCardImagesSection
          brand={brand}
          onUpdate={async (data) => {
            await onSave(data as Partial<CreateBrandInput>);
          }}
        />
      )}

      {/* Logo Variants */}
      {brand && (
        <BrandLogoLibrary brandId={brand.id} brandSlug={brand.slug} />
      )}

      {/* Quick Prompts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Quick Prompts</Label>
          <Button type="button" variant="outline" size="sm" onClick={addQuickPrompt}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        {form.quick_prompts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No quick prompts yet. Add one to give users pre-built templates.
          </p>
        ) : (
          <div className="space-y-3">
            {form.quick_prompts.map((qp, i) => (
              <div key={i} className="border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Input
                    value={qp.name}
                    onChange={(e) => updateQuickPrompt(i, 'name', e.target.value)}
                    placeholder="Prompt name"
                    className="flex-1 mr-2"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuickPrompt(i)}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Textarea
                  value={qp.prompt}
                  onChange={(e) => updateQuickPrompt(i, 'prompt', e.target.value)}
                  placeholder="The prompt template text..."
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
