// ABOUTME: Brand identity fields — name, slug, description, website URL, and category
// ABOUTME: Shared between create and edit modes of the brand editor dialog

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
import type { BrandCategory } from '@/types/creative-studio';
import { BRAND_CATEGORIES } from '@/types/creative-studio';
import type { BrandFormState, BrandFormProps } from './BrandEditorDialog';

interface Props extends BrandFormProps {
  isEditing: boolean;
}

export function BrandEditorIdentitySection({ form, updateField, isEditing }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Brand Identity
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Brand name"
          />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input
            value={form.slug}
            onChange={(e) => updateField('slug', e.target.value)}
            placeholder="brand-slug"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Brief brand description"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Website URL</Label>
        <Input
          value={form.website_url}
          onChange={(e) => updateField('website_url', e.target.value)}
          placeholder="https://www.example.com"
        />
        {isEditing && (
          <p className="text-xs text-muted-foreground">
            Used by Brand DNA Recon to analyze the brand's web presence.
          </p>
        )}
      </div>

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
          Determines which AI analysis prompt is used when analyzing brand images.
          {form.brand_category && ` Images will be analyzed using the ${BRAND_CATEGORIES.find(c => c.value === form.brand_category)?.label || form.brand_category} profile.`}
        </p>
      </div>
    </div>
  );
}
