// ABOUTME: Admin controls for brand editor — sort order, toggles, animated border, showcase colors
// ABOUTME: Controls brand card display behavior and ordering in the Creative Studio grid

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Plus, Dna, BookOpen, Lightbulb } from 'lucide-react';
import type { BrandFormProps } from './BrandEditorDialog';

export function BrandEditorAdminControls({ form, updateField }: BrandFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Admin Controls
      </h3>

      <div className="space-y-2">
        <Label>Sort Order</Label>
        <Input
          type="number"
          value={form.sort_order}
          onChange={(e) => updateField('sort_order', parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Active</Label>
        <Switch
          checked={form.is_active}
          onCheckedChange={(checked) => updateField('is_active', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Set as Default</Label>
        <Switch
          checked={form.is_default}
          onCheckedChange={(checked) => updateField('is_default', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Animated Border</Label>
        <Switch
          checked={form.show_animated_border}
          onCheckedChange={(checked) => updateField('show_animated_border', checked)}
        />
      </div>

      {form.show_animated_border && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Border Speed</Label>
              <span className="text-xs text-muted-foreground">{form.animated_border_speed}s</span>
            </div>
            <Slider
              value={[form.animated_border_speed]}
              onValueChange={([val]) => updateField('animated_border_speed', val)}
              min={10}
              max={30}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Faster</span>
              <span>Slower</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Border Colors</Label>
              {form.animated_border_colors.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground"
                  onClick={() => updateField('animated_border_colors', [])}
                >
                  Reset to auto
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {form.animated_border_colors.length === 0
                ? 'Using first 5 palette colors. Tap colors below to customize.'
                : `${form.animated_border_colors.length} color${form.animated_border_colors.length !== 1 ? 's' : ''} selected`}
            </p>
            <div className="flex flex-wrap gap-2">
              {(form.color_palette.length > 0
                ? form.color_palette
                : [form.primary_color, form.secondary_color]
              ).map((color, i) => {
                const isSelected = form.animated_border_colors.includes(color);
                return (
                  <button
                    key={i}
                    type="button"
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-foreground scale-110 shadow-md'
                        : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      if (isSelected) {
                        updateField('animated_border_colors', form.animated_border_colors.filter(c => c !== color));
                      } else if (form.animated_border_colors.length < 5) {
                        updateField('animated_border_colors', [...form.animated_border_colors, color]);
                      }
                    }}
                    title={`${color.toUpperCase()}${isSelected ? ' (selected)' : ''}`}
                  />
                );
              })}
              {form.animated_border_colors.length < 5 && (
                <label className="w-8 h-8 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-foreground/50 transition-colors">
                  <Plus className="h-3 w-3 text-muted-foreground" />
                  <input
                    type="color"
                    className="sr-only"
                    onChange={(e) => {
                      const newColor = e.target.value;
                      if (!form.animated_border_colors.includes(newColor)) {
                        updateField(
                          'animated_border_colors',
                          [...form.animated_border_colors, newColor].slice(0, 5)
                        );
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        </>
      )}

      {/* Showcase Button Colors */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Showcase Button Colors</Label>
          {form.showcase_button_colors.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground"
              onClick={() => updateField('showcase_button_colors', [])}
            >
              Reset to auto
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {form.showcase_button_colors.length === 0
            ? 'Using first 3 palette colors. Pick custom colors below.'
            : `${form.showcase_button_colors.length} of 3 customized`}
        </p>
        <div className="space-y-1.5">
          {[
            { label: 'Brand DNA', icon: Dna },
            { label: 'Corporate DNA', icon: BookOpen },
            { label: 'Brand Guidelines', icon: Lightbulb },
          ].map(({ label, icon: Icon }, idx) => {
            const autoColors = form.color_palette.length >= 3
              ? form.color_palette.slice(0, 3)
              : [form.primary_color, form.secondary_color, form.primary_color];
            const color = form.showcase_button_colors[idx] || autoColors[idx];
            return (
              <div key={label} className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const colors = [...(form.showcase_button_colors.length >= 3
                      ? form.showcase_button_colors
                      : autoColors)];
                    colors[idx] = e.target.value;
                    updateField('showcase_button_colors', colors);
                  }}
                  className="w-7 h-7 rounded border cursor-pointer"
                />
                <span className="text-[10px] text-muted-foreground font-mono">{color.toUpperCase()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
