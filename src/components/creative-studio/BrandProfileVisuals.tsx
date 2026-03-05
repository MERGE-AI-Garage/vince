// ABOUTME: Shared visual renderers and editors for brand profile sections (colors, typography, identity, tone, visual DNA)
// ABOUTME: Presentation components and inline editors — typed props to JSX, no data-fetching hooks

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, CheckCircle, XCircle, Plus, Trash2, Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import type { BrandVisualProfile, BrandColor } from '@/types/creative-studio';

const SWATCH_LABELS = ['Primary', 'Secondary', 'Accent'] as const;
const COLOR_ROLES = ['primary', 'secondary', 'accent', 'background', 'text'] as const;

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return isNaN(r) ? '' : `${r}, ${g}, ${b}`;
}

/** Resolve brand_colors (enriched) or fall back to mandatory_colors (hex-only) */
function resolveBrandColors(data: BrandVisualProfile['color_profile']): BrandColor[] {
  if (!data) return [];
  if (data.brand_colors?.length) return data.brand_colors;
  return (data.mandatory_colors || []).map((hex, i) => ({
    hex,
    role: i < SWATCH_LABELS.length ? SWATCH_LABELS[i].toLowerCase() : undefined,
    source: 'manual',
  }));
}

// ── Color Profile ────────────────────────────────────────────────────────────

interface ColorProfileDisplayProps {
  data: BrandVisualProfile['color_profile'];
}

export function ColorProfileDisplay({ data }: ColorProfileDisplayProps) {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  if (!data) return null;
  const brandColors = resolveBrandColors(data);
  const forbidden = data.forbidden_colors || [];

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    toast.success(`${hex} copied to clipboard`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Interactive color swatches */}
      {brandColors.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {brandColors.map((bc, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleCopyColor(bc.hex)}
              className="group flex flex-col items-center gap-1.5 cursor-pointer"
              title={`Click to copy ${bc.hex}`}
            >
              <div
                className="w-14 h-14 rounded-full border border-[hsl(var(--cs-border-subtle))] transition-all duration-200 group-hover:scale-105 relative"
                style={{
                  backgroundColor: bc.hex,
                  boxShadow: copiedColor === bc.hex
                    ? `0 4px 12px ${bc.hex}50`
                    : `0 2px 8px ${bc.hex}35`,
                }}
              >
                {copiedColor === bc.hex && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                    <Check className="w-5 h-5 text-white drop-shadow-lg" />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-medium text-muted-foreground capitalize">
                {bc.name || bc.role || (i < SWATCH_LABELS.length ? SWATCH_LABELS[i] : '')}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors -mt-1">
                {bc.hex}
              </span>
              {bc.pms && (
                <span className="text-[9px] font-mono text-muted-foreground -mt-1">
                  {bc.pms}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Overall tone */}
      {data.overall_tone && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Tone:</span> {data.overall_tone}
        </p>
      )}

      {/* Palette relationships */}
      {data.palette_relationships && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {data.palette_relationships}
        </p>
      )}

      {/* Forbidden colors */}
      {forbidden.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[10px] text-muted-foreground font-medium">Avoid:</span>
          {forbidden.map((color, i) => (
            <div key={i} className="flex items-center gap-0.5">
              <div
                className="w-3 h-3 rounded-full border border-border"
                style={{ backgroundColor: color }}
              />
              <span className="text-[9px] font-mono text-muted-foreground">{color}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Typography ───────────────────────────────────────────────────────────────

interface TypographyDisplayProps {
  data: BrandVisualProfile['typography'];
}

export function TypographyDisplay({ data }: TypographyDisplayProps) {
  if (!data) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Heading font card */}
        {data.heading_font && (
          <div className="flex-1 border border-[hsl(var(--cs-border-subtle))] rounded-lg p-3 bg-[hsl(var(--cs-surface-3))]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div className="text-4xl font-bold leading-none mb-2 text-foreground" style={{ fontFamily: data.heading_font }}>
              Aa
            </div>
            <p className="text-[10px] font-medium text-foreground/80">{data.heading_font}</p>
            <p className="text-[9px] text-muted-foreground">Headings</p>
          </div>
        )}

        {/* Body font card */}
        {data.body_font && (
          <div className="flex-1 border border-[hsl(var(--cs-border-subtle))] rounded-lg p-3 bg-[hsl(var(--cs-surface-3))]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div className="text-4xl leading-none mb-2 text-foreground" style={{ fontFamily: data.body_font }}>
              Aa
            </div>
            <p className="text-[10px] font-medium text-foreground/80">{data.body_font}</p>
            <p className="text-[9px] text-muted-foreground">Body</p>
          </div>
        )}
      </div>

      {/* Style description */}
      {data.style_description && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {data.style_description}
        </p>
      )}
    </div>
  );
}

// ── Brand Identity ───────────────────────────────────────────────────────────

interface BrandIdentityDisplayProps {
  data: BrandVisualProfile['brand_identity'];
  hideTagline?: boolean;
}

export function BrandIdentityDisplay({ data, hideTagline }: BrandIdentityDisplayProps) {
  if (!data) return null;

  return (
    <div className="space-y-3">
      {/* Tagline */}
      {!hideTagline && data.tagline && (
        <p className="text-sm italic text-foreground leading-relaxed border-l-2 border-primary/40 pl-3">
          &ldquo;{data.tagline}&rdquo;
        </p>
      )}

      {/* Brand aesthetic */}
      {data.brand_aesthetic && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {data.brand_aesthetic}
        </p>
      )}

      {/* Positioning */}
      {data.positioning && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {data.positioning}
        </p>
      )}

      {/* Brand values */}
      {data.brand_values && data.brand_values.length > 0 && (
        <div>
          <span className="text-[10px] font-medium text-muted-foreground block mb-1.5">Values</span>
          <div className="flex flex-wrap gap-1.5">
            {data.brand_values.map((value, i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">
                {value}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Target audience */}
      {data.target_audience && (
        <p className="text-[10px] text-muted-foreground">
          <span className="font-medium">Audience:</span> {data.target_audience}
        </p>
      )}

      {/* Key messaging */}
      {data.messaging && data.messaging.length > 0 && (
        <div>
          <span className="text-[10px] font-medium text-muted-foreground block mb-1.5">Key Messaging</span>
          <ul className="space-y-1">
            {data.messaging.map((msg, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                <span className="text-primary/60 shrink-0">&#8226;</span>
                {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Manifesto */}
      {data.manifesto && (
        <div>
          <span className="text-[10px] font-medium text-muted-foreground block mb-1.5">Manifesto</span>
          <p className="text-xs italic text-foreground/70 leading-relaxed border-l-2 border-primary/30 pl-3">
            {data.manifesto}
          </p>
        </div>
      )}

      {/* Logo description */}
      {data.logo_description && (
        <p className="text-[10px] text-muted-foreground">
          <span className="font-medium">Logo:</span> {data.logo_description}
        </p>
      )}
    </div>
  );
}

// ── Tone of Voice ────────────────────────────────────────────────────────────

interface ToneOfVoiceDisplayProps {
  data: BrandVisualProfile['tone_of_voice'];
}

export function ToneOfVoiceDisplay({ data }: ToneOfVoiceDisplayProps) {
  if (!data) return null;

  const labels = [
    data.formality && { label: 'Formality', value: data.formality },
    data.personality && { label: 'Personality', value: data.personality },
    data.energy && { label: 'Energy', value: data.energy },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="space-y-2.5">
      {/* Tone dimensions */}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {labels.map(({ label, value }) => (
            <div key={label} className="text-xs">
              <span className="text-muted-foreground">{label}:</span>{' '}
              <span className="font-medium capitalize text-foreground">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Dos */}
      {data.dos && data.dos.length > 0 && (
        <div>
          <span className="text-[10px] font-medium text-muted-foreground block mb-1.5">Do</span>
          <div className="flex flex-wrap gap-1.5">
            {data.dos.map((item, i) => (
              <Badge key={i} variant="outline" className="text-[10px] border-green-500/30 text-green-700 dark:text-green-400">
                <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Donts */}
      {data.donts && data.donts.length > 0 && (
        <div>
          <span className="text-[10px] font-medium text-muted-foreground block mb-1.5">Don&apos;t</span>
          <div className="flex flex-wrap gap-1.5">
            {data.donts.map((item, i) => (
              <Badge key={i} variant="outline" className="text-[10px] border-red-500/30 text-red-700 dark:text-red-400">
                <XCircle className="w-2.5 h-2.5 mr-0.5" />
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Color Profile Editor ─────────────────────────────────────────────────────

interface ColorProfileEditorProps {
  data: BrandVisualProfile['color_profile'] | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function ensureHex(color: string): string {
  if (!color) return '#000000';
  return color.startsWith('#') ? color : `#${color}`;
}

export function ColorProfileEditor({ data, onSave, onCancel, saving }: ColorProfileEditorProps) {
  const [colors, setColors] = useState<BrandColor[]>(() => resolveBrandColors(data));
  const [forbidden, setForbidden] = useState<string[]>(data?.forbidden_colors || []);
  const [overallTone, setOverallTone] = useState(data?.overall_tone || '');
  const [paletteRelationships, setPaletteRelationships] = useState(data?.palette_relationships || '');

  const updateColor = (index: number, patch: Partial<BrandColor>) => {
    setColors(prev => prev.map((c, i) => {
      if (i !== index) return c;
      const updated = { ...c, ...patch };
      // Auto-compute RGB when hex changes
      if (patch.hex) updated.rgb = hexToRgb(patch.hex);
      return updated;
    }));
  };

  const removeColor = (index: number) => {
    setColors(prev => prev.filter((_, i) => i !== index));
  };

  const addColor = () => {
    setColors(prev => [...prev, { hex: '#000000', rgb: '0, 0, 0', source: 'manual' }]);
  };

  const updateForbidden = (index: number, value: string) => {
    setForbidden(prev => prev.map((c, i) => i === index ? value : c));
  };

  const removeForbidden = (index: number) => {
    setForbidden(prev => prev.filter((_, i) => i !== index));
  };

  const addForbidden = () => {
    setForbidden(prev => [...prev, '#000000']);
  };

  const handleSave = () => {
    const validColors = colors.filter(c => c.hex);
    onSave({
      brand_colors: validColors,
      mandatory_colors: validColors.map(c => c.hex),
      forbidden_colors: forbidden.filter(Boolean),
      overall_tone: overallTone,
      palette_relationships: paletteRelationships,
    });
  };

  return (
    <div className="mt-2 space-y-4 p-3 border rounded-lg bg-muted/20">
      {/* Brand colors */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-muted-foreground">Brand Colors</span>
          <Button variant="ghost" size="sm" onClick={addColor} className="h-6 text-[10px] px-2">
            <Plus className="w-3 h-3 mr-0.5" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {colors.map((bc, i) => (
            <Collapsible key={i}>
              <div className="flex items-center gap-1.5 border rounded-lg px-2 py-1.5 bg-background">
                <input
                  type="color"
                  value={ensureHex(bc.hex)}
                  onChange={(e) => updateColor(i, { hex: e.target.value })}
                  className="w-8 h-8 rounded border border-input cursor-pointer shrink-0"
                />
                <Input
                  value={bc.name || ''}
                  onChange={(e) => updateColor(i, { name: e.target.value })}
                  className="w-28 h-7 text-[10px] px-1.5"
                  placeholder="Color name"
                />
                <Input
                  value={bc.hex}
                  onChange={(e) => updateColor(i, { hex: e.target.value })}
                  className="w-20 h-7 text-[10px] font-mono px-1.5"
                  placeholder="#000000"
                />
                <Select
                  value={bc.role || ''}
                  onValueChange={(v) => updateColor(i, { role: v })}
                >
                  <SelectTrigger className="w-24 h-7 text-[10px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_ROLES.map(role => (
                      <SelectItem key={role} value={role} className="text-[10px] capitalize">
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {bc.source && (
                  <Badge variant="outline" className="text-[8px] shrink-0 capitalize">
                    {bc.source}
                  </Badge>
                )}
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </CollapsibleTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removeColor(i)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <CollapsibleContent>
                <div className="flex flex-wrap gap-2 pl-10 pt-1.5 pb-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-muted-foreground w-8">RGB</span>
                    <Input
                      value={bc.rgb || hexToRgb(bc.hex)}
                      onChange={(e) => updateColor(i, { rgb: e.target.value })}
                      className="w-28 h-6 text-[10px] font-mono px-1.5"
                      placeholder="R, G, B"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-muted-foreground w-8">CMYK</span>
                    <Input
                      value={bc.cmyk || ''}
                      onChange={(e) => updateColor(i, { cmyk: e.target.value })}
                      className="w-28 h-6 text-[10px] font-mono px-1.5"
                      placeholder="C, M, Y, K"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-muted-foreground w-8">PMS</span>
                    <Input
                      value={bc.pms || ''}
                      onChange={(e) => updateColor(i, { pms: e.target.value })}
                      className="w-28 h-6 text-[10px] font-mono px-1.5"
                      placeholder="PMS 123 C"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
          {colors.length === 0 && (
            <p className="text-[10px] text-muted-foreground italic">No colors — click Add to start</p>
          )}
        </div>
      </div>

      {/* Forbidden colors */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-muted-foreground">Forbidden Colors</span>
          <Button variant="ghost" size="sm" onClick={addForbidden} className="h-6 text-[10px] px-2">
            <Plus className="w-3 h-3 mr-0.5" />
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {forbidden.map((color, i) => (
            <div key={i} className="flex items-center gap-1.5 border rounded-lg px-2 py-1.5 bg-background border-red-500/20">
              <input
                type="color"
                value={ensureHex(color)}
                onChange={(e) => updateForbidden(i, e.target.value)}
                className="w-8 h-8 rounded border border-input cursor-pointer"
              />
              <Input
                value={color}
                onChange={(e) => updateForbidden(i, e.target.value)}
                className="w-20 h-7 text-[10px] font-mono px-1.5"
                placeholder="#000000"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => removeForbidden(i)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Overall tone */}
      <div>
        <span className="text-[10px] font-medium text-muted-foreground block mb-1">Overall Tone</span>
        <Input
          value={overallTone}
          onChange={(e) => setOverallTone(e.target.value)}
          className="h-8 text-xs"
          placeholder="e.g. vibrant, muted, earthy..."
        />
      </div>

      {/* Palette relationships */}
      <div>
        <span className="text-[10px] font-medium text-muted-foreground block mb-1">Palette Relationships</span>
        <Textarea
          value={paletteRelationships}
          onChange={(e) => setPaletteRelationships(e.target.value)}
          className="text-xs min-h-[60px]"
          rows={3}
          placeholder="Describe how the colors relate to each other..."
        />
      </div>

      {/* Save / Cancel */}
      <div className="flex items-center gap-2 justify-end pt-1">
        <Button variant="outline" size="sm" onClick={onCancel} className="h-7 text-xs">
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs">
          {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
          Save
        </Button>
      </div>
    </div>
  );
}

// ── Visual DNA ───────────────────────────────────────────────────────────────

interface VisualDNADisplayProps {
  data: Record<string, unknown>;
}

// ── Brand Story ───────────────────────────────────────────────────────────────

interface BrandStoryDisplayProps {
  data: BrandVisualProfile['brand_story'];
  compact?: boolean;
}

function StoryField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{value}</p>
    </div>
  );
}

function StoryBadges({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <span className="text-[10px] font-medium text-muted-foreground block mb-1.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary" className="text-[10px]">{item}</Badge>
        ))}
      </div>
    </div>
  );
}

function StorySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-semibold text-foreground/80">{title}</span>
      <div className="space-y-1.5 pl-2 border-l border-indigo-400/20">{children}</div>
    </div>
  );
}

// Detect legacy flat schema (pre-expansion) by checking if heritage is a plain string
function isLegacyFlatSchema(data: Record<string, unknown>): boolean {
  return typeof data.heritage === 'string' || typeof data.mission === 'string';
}

export function BrandStoryDisplay({ data, compact }: BrandStoryDisplayProps) {
  if (!data) return null;

  const d = data as Record<string, unknown>;

  // Backward compat: render legacy flat schema
  if (isLegacyFlatSchema(d)) {
    const flat = d as { mission?: string; vision?: string; heritage?: string; sustainability?: string; culture?: string; community_involvement?: string; differentiators?: string[]; narrative_summary?: string };
    const sections = [
      flat.mission && { label: 'Mission', value: flat.mission },
      flat.vision && { label: 'Vision', value: flat.vision },
      flat.heritage && { label: 'Heritage', value: flat.heritage },
      flat.sustainability && { label: 'Sustainability', value: flat.sustainability },
      flat.culture && { label: 'Culture', value: flat.culture },
      flat.community_involvement && { label: 'Community', value: flat.community_involvement },
    ].filter(Boolean) as { label: string; value: string }[];

    return (
      <div className="space-y-3">
        {flat.narrative_summary && (
          <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-indigo-400/40 pl-3">
            {flat.narrative_summary}
          </p>
        )}
        {sections.length > 0 && (
          <div className="space-y-2">
            {sections.map(({ label, value }) => (
              <div key={label}>
                <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        )}
        <StoryBadges label="Differentiators" items={flat.differentiators} />
      </div>
    );
  }

  // Expanded structured schema
  const { narrative_summary, mission_vision, heritage, sustainability, innovation, culture, community, customer_focus, competitive_position } = data;

  // In compact mode (used in CollapsibleSection), show summary + first few populated sections
  if (compact) {
    return (
      <div className="space-y-3">
        {narrative_summary && (
          <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-indigo-400/40 pl-3">
            {narrative_summary}
          </p>
        )}
        {mission_vision?.mission && <StoryField label="Mission" value={mission_vision.mission} />}
        {mission_vision?.vision && <StoryField label="Vision" value={mission_vision.vision} />}
        <StoryBadges label="Differentiators" items={innovation?.differentiators} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {narrative_summary && (
        <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-indigo-400/40 pl-3">
          {narrative_summary}
        </p>
      )}

      {mission_vision && (mission_vision.mission || mission_vision.vision || mission_vision.purpose) && (
        <StorySection title="Mission & Vision">
          <StoryField label="Mission" value={mission_vision.mission} />
          <StoryField label="Vision" value={mission_vision.vision} />
          <StoryField label="Purpose" value={mission_vision.purpose} />
        </StorySection>
      )}

      {heritage && (heritage.founding_story || heritage.legacy || heritage.milestones?.length) && (
        <StorySection title="Heritage">
          <StoryField label="Founding Story" value={heritage.founding_story} />
          <StoryField label="Legacy" value={heritage.legacy} />
          <StoryBadges label="Milestones" items={heritage.milestones} />
        </StorySection>
      )}

      {sustainability && (sustainability.environmental || sustainability.social || sustainability.governance || sustainability.goals?.length) && (
        <StorySection title="Sustainability">
          <StoryField label="Environmental" value={sustainability.environmental} />
          <StoryField label="Social" value={sustainability.social} />
          <StoryField label="Governance" value={sustainability.governance} />
          <StoryBadges label="Goals" items={sustainability.goals} />
        </StorySection>
      )}

      {innovation && (innovation.approach || innovation.technology || innovation.differentiators?.length) && (
        <StorySection title="Innovation">
          <StoryField label="Approach" value={innovation.approach} />
          <StoryField label="Technology" value={innovation.technology} />
          <StoryBadges label="Differentiators" items={innovation.differentiators} />
        </StorySection>
      )}

      {culture && (culture.values_in_practice || culture.employee_experience || culture.dei) && (
        <StorySection title="Culture">
          <StoryField label="Values in Practice" value={culture.values_in_practice} />
          <StoryField label="Employee Experience" value={culture.employee_experience} />
          <StoryField label="DEI" value={culture.dei} />
        </StorySection>
      )}

      {community && (community.programs || community.impact_metrics || community.partnerships?.length) && (
        <StorySection title="Community">
          <StoryField label="Programs" value={community.programs} />
          <StoryField label="Impact" value={community.impact_metrics} />
          <StoryBadges label="Partnerships" items={community.partnerships} />
        </StorySection>
      )}

      {customer_focus && (customer_focus.promise || customer_focus.experience || customer_focus.testimonial_themes?.length) && (
        <StorySection title="Customer Focus">
          <StoryField label="Promise" value={customer_focus.promise} />
          <StoryField label="Experience" value={customer_focus.experience} />
          <StoryBadges label="Themes" items={customer_focus.testimonial_themes} />
        </StorySection>
      )}

      {competitive_position && (competitive_position.market_position || competitive_position.key_differentiators?.length || competitive_position.awards?.length) && (
        <StorySection title="Competitive Position">
          <StoryField label="Market Position" value={competitive_position.market_position} />
          <StoryBadges label="Key Differentiators" items={competitive_position.key_differentiators} />
          <StoryBadges label="Awards" items={competitive_position.awards} />
        </StorySection>
      )}
    </div>
  );
}

// ── Photography Style ────────────────────────────────────────────────────────

interface PhotographyStyleDisplayProps {
  data: BrandVisualProfile['photography_style'];
}

export function PhotographyStyleDisplay({ data }: PhotographyStyleDisplayProps) {
  if (!data) return null;

  const fields = [
    data.preferred_lighting && { label: 'Lighting', value: data.preferred_lighting },
    data.preferred_aperture && { label: 'Aperture', value: data.preferred_aperture },
    data.preferred_focal_length && { label: 'Focal Length', value: data.preferred_focal_length },
    data.preferred_color_temperature && { label: 'Color Temperature', value: data.preferred_color_temperature },
    data.depth_of_field_preference && { label: 'Depth of Field', value: data.depth_of_field_preference },
    data.film_stock_feel && { label: 'Film Stock Feel', value: data.film_stock_feel },
  ].filter(Boolean) as { label: string; value: string }[];

  if (fields.length === 0) return null;

  return (
    <div className="space-y-2">
      {fields.map(({ label, value }) => (
        <div key={label} className="flex items-baseline gap-2">
          <span className="text-[10px] font-medium text-muted-foreground shrink-0 w-28">{label}</span>
          <span className="text-xs text-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Composition Rules ────────────────────────────────────────────────────────

interface CompositionRulesDisplayProps {
  data: BrandVisualProfile['composition_rules'];
}

export function CompositionRulesDisplay({ data }: CompositionRulesDisplayProps) {
  if (!data) return null;

  return (
    <div className="space-y-3">
      {data.aspect_ratio_preference && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Aspect Ratio:</span> {data.aspect_ratio_preference}
        </p>
      )}

      {data.preferred_layouts && data.preferred_layouts.length > 0 && (
        <div>
          <span className="text-[10px] font-medium text-muted-foreground block mb-1.5">Preferred Layouts</span>
          <div className="flex flex-wrap gap-1.5">
            {data.preferred_layouts.map((layout, i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">
                {layout}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {data.framing_conventions && data.framing_conventions.length > 0 && (
        <div>
          <span className="text-[10px] font-medium text-muted-foreground block mb-1.5">Framing Conventions</span>
          <div className="flex flex-wrap gap-1.5">
            {data.framing_conventions.map((convention, i) => (
              <Badge key={i} variant="outline" className="text-[10px]">
                {convention}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function VisualDNADisplay({ data }: VisualDNADisplayProps) {
  if (!data) return null;

  const signatureStyle = data.signature_style as string | undefined;
  const principles = (data.visual_principles as string[]) || [];
  const differentiators = (data.key_differentiators as string[]) || [];
  const dos = (data.dos as string[]) || [];
  const donts = (data.donts as string[]) || [];

  return (
    <div className="space-y-3">
      {/* Signature style */}
      {signatureStyle && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {signatureStyle}
        </p>
      )}

      {/* Visual principles */}
      {principles.length > 0 && (
        <div>
          <span className="text-[10px] font-medium text-muted-foreground block mb-1.5">Visual Principles</span>
          <div className="flex flex-wrap gap-1.5">
            {principles.map((p, i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">
                {p}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Key differentiators */}
      {differentiators.length > 0 && (
        <div>
          <span className="text-[10px] font-medium text-muted-foreground block mb-1.5">Differentiators</span>
          <div className="flex flex-wrap gap-1.5">
            {differentiators.map((d, i) => (
              <Badge key={i} variant="outline" className="text-[10px]">
                {d}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Dos/Donts */}
      {dos.length > 0 && (
        <div>
          <span className="text-[10px] font-medium text-muted-foreground block mb-1.5">Do</span>
          <div className="flex flex-wrap gap-1.5">
            {dos.map((item, i) => (
              <Badge key={i} variant="outline" className="text-[10px] border-green-500/30 text-green-700 dark:text-green-400">
                <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {donts.length > 0 && (
        <div>
          <span className="text-[10px] font-medium text-muted-foreground block mb-1.5">Don&apos;t</span>
          <div className="flex flex-wrap gap-1.5">
            {donts.map((item, i) => (
              <Badge key={i} variant="outline" className="text-[10px] border-red-500/30 text-red-700 dark:text-red-400">
                <XCircle className="w-2.5 h-2.5 mr-0.5" />
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
