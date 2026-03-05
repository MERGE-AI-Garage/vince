// ABOUTME: Brand intelligence fields — colors, palette, visual identity, and brand voice
// ABOUTME: These are auto-populated by Brand DNA Recon but can be manually overridden

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Info } from 'lucide-react';
import type { BrandFormProps } from './BrandEditorDialog';

const MAX_PALETTE_COLORS = 8;

export function BrandEditorIntelligenceSection({ form, updateField }: BrandFormProps) {
  const addPaletteColor = () => {
    if (form.color_palette.length >= MAX_PALETTE_COLORS) return;
    updateField('color_palette', [...form.color_palette, '#888888']);
  };

  const removePaletteColor = (index: number) => {
    updateField('color_palette', form.color_palette.filter((_, i) => i !== index));
  };

  const updatePaletteColor = (index: number, color: string) => {
    updateField('color_palette', form.color_palette.map((c, i) => i === index ? color : c));
  };

  const initPaletteFromPrimary = () => {
    updateField('color_palette', [form.primary_color, form.secondary_color]);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Brand Intelligence
      </h3>

      {/* Info callout */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 flex gap-3">
        <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          These fields are populated by <span className="font-medium text-foreground">Brand DNA Recon</span>.
          You can edit them manually — manual changes are preserved unless you re-run recon.
        </p>
      </div>

      {/* Primary & Secondary Colors */}
      <div className="space-y-2">
        <Label>Primary & Secondary Colors</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.primary_color}
              onChange={(e) => updateField('primary_color', e.target.value)}
              className="w-10 h-10 rounded border cursor-pointer"
            />
            <Input
              value={form.primary_color}
              onChange={(e) => updateField('primary_color', e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.secondary_color}
              onChange={(e) => updateField('secondary_color', e.target.value)}
              className="w-10 h-10 rounded border cursor-pointer"
            />
            <Input
              value={form.secondary_color}
              onChange={(e) => updateField('secondary_color', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Color Palette */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Color Palette</Label>
          <div className="flex items-center gap-2">
            {form.color_palette.length === 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={initPaletteFromPrimary}
                className="text-xs h-7"
              >
                Start from primary/secondary
              </Button>
            )}
            {form.color_palette.length < MAX_PALETTE_COLORS && (
              <Button type="button" variant="outline" size="sm" onClick={addPaletteColor} className="h-7">
                <Plus className="h-3 w-3 mr-1" />
                Add Color
              </Button>
            )}
          </div>
        </div>

        {form.color_palette.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            No palette defined. The primary and secondary colors will be used.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {form.color_palette.map((color, i) => (
              <div key={i} className="flex items-center gap-1.5 group">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => updatePaletteColor(i, e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <Input
                  value={color}
                  onChange={(e) => updatePaletteColor(i, e.target.value)}
                  className="w-24 h-8 text-xs"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePaletteColor(i)}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Identity */}
      <div className="space-y-2">
        <Label>Visual Identity</Label>
        <Textarea
          value={form.visual_identity}
          onChange={(e) => updateField('visual_identity', e.target.value)}
          placeholder="Typography, imagery style, design principles, mood..."
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Used by the Brand Agent to enforce visual consistency in generated content.
        </p>
      </div>

      {/* Brand Voice */}
      <div className="space-y-2">
        <Label>Brand Voice</Label>
        <Textarea
          value={form.brand_voice}
          onChange={(e) => updateField('brand_voice', e.target.value)}
          placeholder="Tone and style for AI-generated content..."
          rows={3}
        />
      </div>
    </div>
  );
}
