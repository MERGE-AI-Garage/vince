// ABOUTME: Brand create/edit dialog orchestrator with educational onboarding
// ABOUTME: Create mode is streamlined; edit mode uses a wide 2-column layout

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dna, ChevronDown, ChevronUp } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import type { CreativeStudioBrand, QuickPrompt, CreateBrandInput, BrandCategory } from '@/types/creative-studio';
import { BRAND_CATEGORIES } from '@/types/creative-studio';
import { BrandEditorIdentitySection } from './BrandEditorIdentitySection';
import { BrandEditorIntelligenceSection } from './BrandEditorIntelligenceSection';
import { BrandEditorDisplaySection } from './BrandEditorDisplaySection';
import { BrandEditorAdminControls } from './BrandEditorAdminControls';

// --- Shared types for sub-components ---

export interface BrandFormState {
  name: string;
  slug: string;
  description: string;
  logo_url: string | undefined;
  primary_color: string;
  secondary_color: string;
  color_palette: string[];
  visual_identity: string;
  brand_voice: string;
  website_url: string;
  brand_category: BrandCategory | '';
  hero_image_url: string | undefined;
  quick_prompts: QuickPrompt[];
  show_animated_border: boolean;
  animated_border_speed: number;
  animated_border_colors: string[];
  showcase_button_colors: string[];
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
}

export interface BrandFormProps {
  form: BrandFormState;
  updateField: <K extends keyof BrandFormState>(key: K, value: BrandFormState[K]) => void;
}

// --- Component ---

interface BrandEditorDialogProps {
  open: boolean;
  brand: CreativeStudioBrand | null;
  onClose: () => void;
  onSave: (data: Partial<CreateBrandInput>) => Promise<void>;
  saving: boolean;
}

const INITIAL_FORM: BrandFormState = {
  name: '',
  slug: '',
  description: '',
  logo_url: undefined,
  primary_color: '#3b82f6',
  secondary_color: '#1e40af',
  color_palette: [],
  visual_identity: '',
  brand_voice: '',
  website_url: '',
  brand_category: '',
  hero_image_url: undefined,
  quick_prompts: [],
  show_animated_border: true,
  animated_border_speed: 20,
  animated_border_colors: [],
  showcase_button_colors: [],
  is_active: true,
  is_default: false,
  sort_order: 0,
};

export function BrandEditorDialog({ open, brand, onClose, onSave, saving }: BrandEditorDialogProps) {
  const isEditing = !!brand;
  const [form, setForm] = useState<BrandFormState>(INITIAL_FORM);
  const [showOptional, setShowOptional] = useState(false);

  const updateField = useCallback(<K extends keyof BrandFormState>(key: K, value: BrandFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;

    if (brand) {
      setForm({
        name: brand.name,
        slug: brand.slug,
        description: brand.description || '',
        logo_url: brand.logo_url || undefined,
        primary_color: brand.primary_color,
        secondary_color: brand.secondary_color,
        color_palette: brand.color_palette || [],
        visual_identity: brand.visual_identity || '',
        brand_voice: brand.brand_voice || '',
        website_url: brand.website_url || '',
        brand_category: brand.brand_category || '',
        hero_image_url: brand.hero_image_url || undefined,
        quick_prompts: [...brand.quick_prompts],
        show_animated_border: brand.show_animated_border ?? true,
        animated_border_speed: brand.animated_border_speed ?? 20,
        animated_border_colors: brand.animated_border_colors || [],
        showcase_button_colors: brand.showcase_button_colors || [],
        is_active: brand.is_active,
        is_default: brand.is_default,
        sort_order: brand.sort_order,
      });
    } else {
      setForm(INITIAL_FORM);
      setShowOptional(false);
    }
  }, [open, brand]);

  // Auto-generate slug from name when creating
  useEffect(() => {
    if (!isEditing && form.name) {
      setForm(prev => ({
        ...prev,
        slug: prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      }));
    }
  }, [form.name, isEditing]);

  const handleSave = async () => {
    const data = {
      ...form,
      brand_category: form.brand_category || undefined,
    };
    await onSave(data);
  };

  if (isEditing) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
          {/* Sticky header */}
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription>
              Configure brand identity, display settings, and admin controls. Brand intelligence fields are
              auto-populated by Brand DNA Recon.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
              {/* Left column — Identity & Intelligence */}
              <div className="space-y-6">
                <BrandEditorIdentitySection form={form} updateField={updateField} isEditing />
                <BrandEditorIntelligenceSection form={form} updateField={updateField} />
              </div>

              {/* Right column — Display & Admin */}
              <div className="space-y-6">
                <BrandEditorDisplaySection form={form} updateField={updateField} brand={brand} onSave={onSave} />
                <BrandEditorAdminControls form={form} updateField={updateField} />
              </div>
            </div>
          </div>

          {/* Sticky footer */}
          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.slug}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // --- Create mode — streamlined with educational callout ---
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Brand</DialogTitle>
          <DialogDescription>
            Enter the basics — Brand DNA Recon will discover the rest
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Educational callout */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 flex gap-3">
            <Dna className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground text-sm">How it works</p>
              <p>
                Enter a brand name and website URL, then save. Open the brand's
                <span className="font-medium text-foreground"> DNA tab</span> and run
                <span className="font-medium text-foreground"> Brand DNA Recon</span> — it crawls
                the site and auto-discovers colors, typography, brand voice, visual identity, and more.
              </p>
              <p>
                You can continue adding documents and images to refine the brand's DNA over time. The more
                you feed it, the richer the synthesis becomes.
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>Brand Name <span className="text-destructive">*</span></Label>
            <Input
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g. Nike, Patagonia, Apple"
              autoFocus
            />
            {form.slug && (
              <p className="text-xs text-muted-foreground">
                Slug: <span className="font-mono">{form.slug}</span>
              </p>
            )}
          </div>

          {/* Website URL */}
          <div className="space-y-2">
            <Label>Website URL</Label>
            <Input
              value={form.website_url}
              onChange={(e) => updateField('website_url', e.target.value)}
              placeholder="https://www.example.com"
            />
            <p className="text-xs text-muted-foreground">
              Brand DNA Recon will crawl this URL to extract brand colors, typography, voice, and visual identity.
            </p>
          </div>

          {/* Brand Category */}
          <div className="space-y-2">
            <Label>Brand Category</Label>
            <Select
              value={form.brand_category || '_none'}
              onValueChange={(val) => updateField('brand_category', val === '_none' ? '' as any : val as BrandCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">None (use generic analysis)</SelectItem>
                {BRAND_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Helps Brand DNA Recon pick the right analysis profile for image and website analysis.
            </p>
          </div>

          {/* Optional fields disclosure */}
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {showOptional ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>{showOptional ? 'Hide' : 'Show'} optional fields (description, logo)</span>
          </button>

          {showOptional && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Brief brand description (can be auto-filled by recon)"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <ImageUpload
                  currentImageUrl={form.logo_url}
                  onImageUploaded={(url) => updateField('logo_url', url)}
                  onImageRemoved={() => updateField('logo_url', undefined)}
                  folder={`brands/${form.slug || 'new'}/logo`}
                  maxSizeMB={2}
                  acceptedTypes={['image/png', 'image/webp']}
                  mediaFolderPath={`/brands/${form.slug || 'new'}/logo`}
                  mediaTitle={`${form.name || 'Brand'} logo`}
                  className="border-0 p-0 shadow-none"
                />
                <p className="text-xs text-muted-foreground">
                  Optional — Brand DNA Recon can discover logos from the website.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name}>
            {saving ? 'Creating...' : 'Create Brand'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
