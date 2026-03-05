// ABOUTME: Logo variant library for brands — upload, tag, and manage multiple logo versions.
// ABOUTME: Each logo gets variant/lockup/background metadata for scene-aware selection during generation.

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ImageUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Star, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { BrandLogo, LogoVariant, LogoLockup, LogoBackground } from '@/types/creative-studio';

interface BrandLogoLibraryProps {
  brandId: string;
  brandSlug: string;
}

const VARIANT_OPTIONS: { value: LogoVariant; label: string }[] = [
  { value: 'full_color', label: 'Full Color' },
  { value: 'reversed', label: 'Reversed (White)' },
  { value: 'mono_dark', label: 'Mono Dark' },
  { value: 'mono_light', label: 'Mono Light' },
];

const LOCKUP_OPTIONS: { value: LogoLockup; label: string }[] = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
  { value: 'stacked', label: 'Stacked' },
  { value: 'mark_only', label: 'Mark Only' },
  { value: 'wordmark', label: 'Wordmark' },
];

const BACKGROUND_OPTIONS: { value: LogoBackground; label: string }[] = [
  { value: 'transparent', label: 'Transparent' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'any', label: 'Any' },
];

export function BrandLogoLibrary({ brandId, brandSlug }: BrandLogoLibraryProps) {
  const { user } = useAuth();
  const [logos, setLogos] = useState<BrandLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchLogos = async () => {
    const { data, error } = await supabase
      .from('creative_studio_brand_logos')
      .select('*')
      .eq('brand_id', brandId)
      .order('is_default', { ascending: false })
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch logos:', error);
      return;
    }
    setLogos((data || []) as BrandLogo[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogos();
  }, [brandId]);

  const handleLogoUploaded = async (url: string) => {
    const isFirst = logos.length === 0;
    const { error } = await supabase
      .from('creative_studio_brand_logos')
      .insert({
        brand_id: brandId,
        url,
        variant: 'full_color',
        lockup: 'horizontal',
        background: 'transparent',
        is_default: isFirst,
        sort_order: logos.length,
        created_by: user?.id,
      });

    if (error) {
      toast.error('Failed to save logo');
      console.error(error);
      return;
    }

    toast.success('Logo uploaded');
    setAdding(false);
    fetchLogos();
  };

  const updateLogo = async (logoId: string, updates: Partial<BrandLogo>) => {
    // If setting as default, unset other defaults first
    if (updates.is_default) {
      await supabase
        .from('creative_studio_brand_logos')
        .update({ is_default: false })
        .eq('brand_id', brandId);
    }

    const { error } = await supabase
      .from('creative_studio_brand_logos')
      .update(updates)
      .eq('id', logoId);

    if (error) {
      toast.error('Failed to update logo');
      console.error(error);
      return;
    }
    fetchLogos();
  };

  const deleteLogo = async (logoId: string) => {
    const { error } = await supabase
      .from('creative_studio_brand_logos')
      .delete()
      .eq('id', logoId);

    if (error) {
      toast.error('Failed to delete logo');
      console.error(error);
      return;
    }

    toast.success('Logo removed');
    fetchLogos();
  };

  if (loading) {
    return <p className="text-xs text-muted-foreground text-center py-4">Loading logos...</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label>Logo Library</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload logo variants for scene-aware generation. PNG or WebP only — SVG not supported by image models.
          </p>
        </div>
        {!adding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Add Logo
          </Button>
        )}
      </div>

      {/* Upload zone */}
      {adding && (
        <div className="border rounded-md p-3 bg-muted/30 space-y-2">
          <Label className="text-xs">Upload new logo variant</Label>
          <ImageUpload
            currentImageUrl={undefined}
            onImageUploaded={handleLogoUploaded}
            onImageRemoved={() => setAdding(false)}
            folder={`brands/${brandSlug}/logos`}
            maxSizeMB={2}
            acceptedTypes={['image/png', 'image/webp']}
            mediaFolderPath={`/brands/${brandSlug}/logos`}
            mediaTitle={`${brandSlug} logo`}
            className="border-0 p-0 shadow-none"
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)} className="text-xs">
            Cancel
          </Button>
        </div>
      )}

      {/* Logo list */}
      {logos.length === 0 && !adding ? (
        <div className="text-center py-6 border rounded-md border-dashed">
          <Image className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-xs text-muted-foreground">No logos uploaded yet.</p>
          <p className="text-xs text-muted-foreground">Add your full-color, reversed, and mark-only versions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logos.map((logo) => (
            <div key={logo.id} className="border rounded-md p-3 space-y-2">
              <div className="flex items-start gap-3">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded border bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={logo.url}
                    alt="Logo variant"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                {/* Metadata */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {logo.is_default && (
                      <Badge variant="default" className="text-[10px] h-5">
                        <Star className="h-2.5 w-2.5 mr-0.5" /> Default
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] h-5">
                      {VARIANT_OPTIONS.find(v => v.value === logo.variant)?.label || logo.variant}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {LOCKUP_OPTIONS.find(l => l.value === logo.lockup)?.label || logo.lockup}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {BACKGROUND_OPTIONS.find(b => b.value === logo.background)?.label || logo.background}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Select
                      value={logo.variant}
                      onValueChange={(val) => updateLogo(logo.id, { variant: val as LogoVariant })}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VARIANT_OPTIONS.map((v) => (
                          <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={logo.lockup}
                      onValueChange={(val) => updateLogo(logo.id, { lockup: val as LogoLockup })}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCKUP_OPTIONS.map((l) => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={logo.background}
                      onValueChange={(val) => updateLogo(logo.id, { background: val as LogoBackground })}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BACKGROUND_OPTIONS.map((b) => (
                          <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3">
                    <Input
                      value={logo.notes || ''}
                      onChange={(e) => updateLogo(logo.id, { notes: e.target.value })}
                      placeholder="Notes (e.g., use on green backgrounds only)"
                      className="h-7 text-xs flex-1"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 shrink-0">
                  {!logo.is_default && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => updateLogo(logo.id, { is_default: true })}
                      className="h-7 text-xs"
                      title="Set as default"
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteLogo(logo.id)}
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    title="Remove logo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
