// ABOUTME: Brand Standards showcase dialog — prescriptive specs from official style guides
// ABOUTME: 8-section bento layout with color swatches, typography, logo system, vertical positioning, writer guidelines

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Palette, Type, ImageIcon, Globe, Pencil, Share2, Target, BookOpen,
  X, BarChart3, FileText, ChevronDown,
} from 'lucide-react';
import { useBrandProfile } from '@/hooks/useCreativeStudioBrandIntelligence';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BrandLogo } from '@/types/creative-studio';
import type { CreativeStudioBrand } from '@/types/creative-studio';
import type { LucideIcon } from 'lucide-react';
import { BrandDialogNav, type BrandDialogView } from './BrandDialogNav';

// ── Helpers ─────────────────────────────────────────────────────────────────

function darkenHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const r = Math.round(parseInt(clean.slice(0, 2), 16) * (1 - amount));
  const g = Math.round(parseInt(clean.slice(2, 4), 16) * (1 - amount));
  const b = Math.round(parseInt(clean.slice(4, 6), 16) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function isLightColor(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Reusable card component ───────────────────────────────────────────────

function BentoCard({
  title,
  icon: Icon,
  iconColor,
  className = '',
  children,
}: {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl p-3 ${className}`}
      style={{
        backgroundColor: 'hsl(var(--cs-surface-1))',
        border: '1px solid hsl(var(--cs-border-subtle))',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        <h3 className="text-sm font-semibold font-product-sans text-muted-foreground uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="text-[11px] text-muted-foreground/50 italic">{text}</p>
  );
}

// ── Types ───────────────────────────────────────────────────────────────────

interface BrandStandardsDialogProps {
  brand: CreativeStudioBrand;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (view: BrandDialogView) => void;
}

interface ColorEntry {
  name?: string;
  hex?: string;
  pms?: string;
}

interface ColorGroup {
  name?: string;
  colors?: ColorEntry[];
}

interface AdaEntry {
  foreground?: string;
  background?: string;
  ratio?: string;
  level?: string;
}

interface ColorSystem {
  color_groups?: ColorGroup[];
  gradients?: string[];
  ada_compliance?: AdaEntry[];
}

interface FontSpec {
  name?: string;
  category?: string;
  weights?: string[];
  usage?: string;
}

interface TypographyRule {
  text?: string;
}

interface LayoutHierarchyEntry {
  element?: string;
  font?: string;
  color?: string;
}

interface TypographySystem {
  primary_font?: FontSpec;
  secondary_font?: FontSpec;
  rules?: TypographyRule[];
  layout_hierarchy?: LayoutHierarchyEntry[];
}

interface LogoSystem {
  primary?: {
    description?: string;
    files?: Record<string, string>;
    clear_space?: string;
    minimum_size?: { digital?: string; print?: string } | string;
  };
  monogram?: {
    description?: string;
    variants?: string[];
    usage?: string;
  };
  collage_personas?: {
    description?: string;
    files?: string[];
  };
}

interface SubVertical {
  name?: string;
  headline?: string;
  description?: string;
}

interface Vertical {
  name?: string;
  sub_verticals?: SubVertical[];
}

interface VerticalPositioning {
  verticals?: Vertical[];
}

interface WriterPrinciple {
  name?: string;
  description?: string;
  example_instead_of?: string;
  example_try?: string;
}

interface WriterGuidelines {
  principles?: WriterPrinciple[];
  litmus_test?: string;
}

interface VoiceTrait {
  name?: string;
  description?: string;
}

interface SocialMediaVoice {
  persona?: string;
  voice_traits?: VoiceTrait[];
  content_types?: string[];
  hashtags?: string[];
}

interface VerticalCompetitors {
  vertical?: string;
  competitors?: string[];
}

interface CompetitiveLandscape {
  per_vertical?: VerticalCompetitors[];
  market_position_summary?: string;
}

interface GlossaryEntry {
  preferred?: string;
  replaces?: string;
}

interface BrandStandards {
  color_system?: ColorSystem;
  typography_system?: TypographySystem;
  logo_system?: LogoSystem;
  vertical_positioning?: VerticalPositioning;
  writer_guidelines?: WriterGuidelines;
  social_media_voice?: SocialMediaVoice;
  competitive_landscape?: CompetitiveLandscape;
  glossary?: GlossaryEntry[];
}

function hasSectionData(obj?: Record<string, unknown> | unknown[] | null): boolean {
  if (!obj) return false;
  if (Array.isArray(obj)) return obj.length > 0;
  return Object.values(obj).some(v =>
    v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
  );
}

// ── Color swatch with copy-to-clipboard ─────────────────────────────────────

function ColorSwatch({ color }: { color: ColorEntry }) {
  if (!color.hex) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(color.hex!);
    toast.success(`Copied ${color.hex}`);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleCopy}
        className="w-10 h-10 rounded-full cursor-pointer hover:scale-110 transition border border-border shadow-sm"
        style={{ backgroundColor: color.hex }}
        title={`Click to copy ${color.hex}`}
      />
      {color.name && <span className="text-[9px] text-foreground/70 font-medium text-center leading-tight">{color.name}</span>}
      {color.hex && <span className="text-[9px] text-muted-foreground font-mono">{color.hex}</span>}
      {color.pms && <span className="text-[9px] text-muted-foreground">{color.pms}</span>}
    </div>
  );
}

// ── Section cards ───────────────────────────────────────────────────────────

function ColorSystemCard({ data }: { data: ColorSystem }) {
  return (
    <BentoCard title="Color System" icon={Palette} iconColor="text-emerald-500">
      {data.color_groups?.map((group, gi) => (
        <div key={gi} className="mb-3 last:mb-0">
          {group.name && (
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">{group.name}</span>
          )}
          <div className="flex flex-wrap gap-3">
            {group.colors?.map((c, ci) => <ColorSwatch key={ci} color={c} />)}
          </div>
        </div>
      ))}

      {data.gradients && data.gradients.length > 0 && (
        <div className="mt-3">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Gradients</span>
          <div className="flex flex-wrap gap-1.5">
            {data.gradients.map((g, i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">{g}</Badge>
            ))}
          </div>
        </div>
      )}

      {data.ada_compliance && data.ada_compliance.length > 0 && (
        <div className="mt-3">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">ADA Compliance</span>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border" style={{ backgroundColor: 'hsl(var(--cs-surface-2))' }}>
                  <th className="px-2 py-1 text-left text-muted-foreground font-medium">FG</th>
                  <th className="px-2 py-1 text-left text-muted-foreground font-medium">BG</th>
                  <th className="px-2 py-1 text-left text-muted-foreground font-medium">Ratio</th>
                  <th className="px-2 py-1 text-left text-muted-foreground font-medium">Level</th>
                </tr>
              </thead>
              <tbody>
                {data.ada_compliance.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-b-0">
                    <td className="px-2 py-1 text-foreground/70">{row.foreground || '—'}</td>
                    <td className="px-2 py-1 text-foreground/70">{row.background || '—'}</td>
                    <td className="px-2 py-1 text-foreground/70">{row.ratio || '—'}</td>
                    <td className="px-2 py-1 text-foreground/70">{row.level || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </BentoCard>
  );
}

function TypographySystemCard({ data }: { data: TypographySystem }) {
  const renderFont = (font: FontSpec | undefined, label: string) => {
    if (!font?.name) return null;
    return (
      <div
        className="flex-1 rounded-lg p-2.5"
        style={{ backgroundColor: 'hsl(var(--cs-surface-2))', border: '1px solid hsl(var(--cs-border-subtle))' }}
      >
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-foreground/80 mb-1">Aa</p>
        <p className="text-xs font-semibold text-foreground">{font.name}</p>
        {font.category && <p className="text-[10px] text-muted-foreground">{font.category}</p>}
        {font.weights && font.weights.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {font.weights.map((w, i) => (
              <Badge key={i} variant="secondary" className="text-[9px]">{w}</Badge>
            ))}
          </div>
        )}
        {font.usage && <p className="text-[10px] text-foreground/60 mt-1.5 leading-relaxed">{font.usage}</p>}
      </div>
    );
  };

  return (
    <BentoCard title="Typography System" icon={Type} iconColor="text-cyan-500">
      <div className="flex gap-2">
        {renderFont(data.primary_font, 'Primary')}
        {renderFont(data.secondary_font, 'Secondary')}
      </div>

      {data.rules && data.rules.length > 0 && (
        <div className="mt-3">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Rules</span>
          <div className="flex flex-wrap gap-1.5">
            {data.rules.map((r, i) => (
              <Badge key={i} variant="destructive" className="text-[10px] font-normal">{r.text || String(r)}</Badge>
            ))}
          </div>
        </div>
      )}

      {data.layout_hierarchy && data.layout_hierarchy.length > 0 && (
        <div className="mt-3">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Layout Hierarchy</span>
          <div className="space-y-1">
            {data.layout_hierarchy.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <span className="text-foreground/70 font-medium">{entry.element}</span>
                <span className="text-muted-foreground/50">&rarr;</span>
                <span className="text-foreground/60">{entry.font}</span>
                {entry.color && (
                  <>
                    <span className="text-muted-foreground/50">&middot;</span>
                    <span className="text-foreground/60">{entry.color}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </BentoCard>
  );
}

const VARIANT_LABELS: Record<string, string> = {
  full_color: 'Full Color',
  reversed: 'Reversed',
  mono_dark: 'Mono Dark',
  mono_light: 'Mono Light',
};

const LOCKUP_LABELS: Record<string, string> = {
  horizontal: 'Horizontal',
  vertical: 'Vertical',
  stacked: 'Stacked',
  mark_only: 'Mark Only',
  wordmark: 'Wordmark',
};

function LogoSystemCard({ data, brandId }: { data: LogoSystem; brandId: string }) {
  const [logos, setLogos] = useState<BrandLogo[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    supabase
      .from('creative_studio_brand_logos')
      .select('*')
      .eq('brand_id', brandId)
      .order('is_default', { ascending: false })
      .order('sort_order', { ascending: true })
      .then(({ data: rows }) => {
        if (rows) setLogos(rows as BrandLogo[]);
      });
  }, [brandId]);

  const minSize = data.primary?.minimum_size;
  const minSizeText = typeof minSize === 'string'
    ? minSize
    : minSize ? `${minSize.digital || ''} / ${minSize.print || ''}`.replace(/^ \/ | \/ $/g, '') : null;

  const previewLogos = logos.slice(0, 3);
  const remainingLogos = logos.slice(3);

  return (
    <BentoCard title="Logo System" icon={ImageIcon} iconColor="text-pink-500">
      <div className="space-y-2">
        {/* Logo thumbnails from library */}
        {logos.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-2">
              {previewLogos.map((logo) => (
                <div
                  key={logo.id}
                  className="relative group"
                  title={`${VARIANT_LABELS[logo.variant] || logo.variant} · ${LOCKUP_LABELS[logo.lockup] || logo.lockup}`}
                >
                  <div
                    className="w-14 h-14 rounded-lg border flex items-center justify-center overflow-hidden"
                    style={{
                      backgroundColor: logo.background === 'dark' ? '#1a1a1a' : 'hsl(var(--cs-surface-2))',
                      borderColor: 'hsl(var(--cs-border-subtle))',
                    }}
                  >
                    <img src={logo.url} alt="" className="max-w-full max-h-full object-contain p-1" />
                  </div>
                  {logo.is_default && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-pink-500 border border-background" title="Default" />
                  )}
                </div>
              ))}
            </div>

            {remainingLogos.length > 0 && (
              <div className="mt-1.5">
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground/70 transition-colors"
                >
                  <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  {expanded ? 'Hide' : `View all ${logos.length} logos`}
                </button>
                {expanded && (
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {remainingLogos.map((logo) => (
                      <div
                        key={logo.id}
                        className="relative"
                        title={`${VARIANT_LABELS[logo.variant] || logo.variant} · ${LOCKUP_LABELS[logo.lockup] || logo.lockup}`}
                      >
                        <div
                          className="w-14 h-14 rounded-lg border flex items-center justify-center overflow-hidden"
                          style={{
                            backgroundColor: logo.background === 'dark' ? '#1a1a1a' : 'hsl(var(--cs-surface-2))',
                            borderColor: 'hsl(var(--cs-border-subtle))',
                          }}
                        >
                          <img src={logo.url} alt="" className="max-w-full max-h-full object-contain p-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {data.primary?.description && (
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Primary Logo</span>
            <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">{data.primary.description}</p>
          </div>
        )}
        {data.primary?.clear_space && (
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Clear Space</span>
            <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">{data.primary.clear_space}</p>
          </div>
        )}
        {minSizeText && (
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Minimum Size</span>
            <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">{minSizeText}</p>
          </div>
        )}
        {data.monogram?.variants && data.monogram.variants.length > 0 && (
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Monogram Variants</span>
            <div className="flex flex-wrap gap-1.5">
              {data.monogram.variants.map((v, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">{v}</Badge>
              ))}
            </div>
            {data.monogram.usage && (
              <p className="text-[10px] text-muted-foreground mt-1">{data.monogram.usage}</p>
            )}
          </div>
        )}
        {data.collage_personas?.description && (
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Collage Personas</span>
            <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">{data.collage_personas.description}</p>
          </div>
        )}
      </div>
    </BentoCard>
  );
}

function VerticalPositioningCard({ data }: { data: VerticalPositioning }) {
  return (
    <BentoCard title="Vertical Positioning" icon={Globe} iconColor="text-blue-500">
      <div className="space-y-3">
        {data.verticals?.map((vertical, vi) => (
          <div key={vi}>
            {vertical.name && (
              <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wide block mb-1.5">{vertical.name}</span>
            )}
            <div className="space-y-1.5">
              {vertical.sub_verticals?.map((sv, si) => (
                <div
                  key={si}
                  className="rounded-lg p-2"
                  style={{ backgroundColor: 'hsl(var(--cs-surface-2))' }}
                >
                  {sv.name && <p className="text-[10px] font-semibold text-foreground/70">{sv.name}</p>}
                  {sv.headline && <p className="text-xs font-medium text-foreground/80 mt-0.5">{sv.headline}</p>}
                  {sv.description && <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{sv.description}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}

function WriterGuidelinesCard({ data }: { data: WriterGuidelines }) {
  return (
    <BentoCard title="Writer Guidelines" icon={Pencil} iconColor="text-orange-500">
      <div className="space-y-2.5">
        {data.principles?.map((p, i) => (
          <div key={i}>
            <p className="text-xs text-foreground/80">
              <span className="font-semibold">{p.name}</span>
              {p.description && <span className="text-foreground/60"> — {p.description}</span>}
            </p>
            {(p.example_instead_of || p.example_try) && (
              <div className="mt-1 pl-2 border-l-2 border-border">
                {p.example_instead_of && (
                  <p className="text-[10px] text-muted-foreground italic">Instead of: {p.example_instead_of}</p>
                )}
                {p.example_try && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 italic">Try: {p.example_try}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {data.litmus_test && (
        <div
          className="mt-3 rounded-lg p-2.5"
          style={{ backgroundColor: 'hsl(var(--cs-surface-2))', border: '1px solid hsl(var(--cs-border-subtle))' }}
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">Litmus Test</span>
          <p className="text-xs text-foreground/80 leading-relaxed italic">{data.litmus_test}</p>
        </div>
      )}
    </BentoCard>
  );
}

function SocialMediaVoiceCard({ data }: { data: SocialMediaVoice }) {
  return (
    <BentoCard title="Social Media Voice" icon={Share2} iconColor="text-purple-500">
      <div className="space-y-2.5">
        {data.persona && (
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Persona</span>
            <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">{data.persona}</p>
          </div>
        )}

        {data.voice_traits && data.voice_traits.length > 0 && (
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Voice Traits</span>
            <div className="grid grid-cols-2 gap-1.5">
              {data.voice_traits.map((trait, i) => (
                <div
                  key={i}
                  className="rounded-lg p-2"
                  style={{ backgroundColor: 'hsl(var(--cs-surface-2))' }}
                >
                  <p className="text-[10px] font-semibold text-foreground/70">{trait.name}</p>
                  {trait.description && <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{trait.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.content_types && data.content_types.length > 0 && (
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Content Types</span>
            <div className="flex flex-wrap gap-1.5">
              {data.content_types.map((ct, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">{ct}</Badge>
              ))}
            </div>
          </div>
        )}

        {data.hashtags && data.hashtags.length > 0 && (
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Hashtags</span>
            <div className="flex flex-wrap gap-1">
              {data.hashtags.map((ht, i) => (
                <Badge key={i} variant="outline" className="text-[9px]">{ht}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </BentoCard>
  );
}

function CompetitiveLandscapeCard({ data }: { data: CompetitiveLandscape }) {
  return (
    <BentoCard title="Competitive Landscape" icon={Target} iconColor="text-red-500">
      <div className="space-y-2.5">
        {data.per_vertical?.map((vc, i) => (
          <div key={i}>
            {vc.vertical && (
              <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wide block mb-1">{vc.vertical}</span>
            )}
            <div className="flex flex-wrap gap-1.5">
              {vc.competitors?.map((comp, ci) => (
                <Badge key={ci} variant="outline" className="text-[10px]">{comp}</Badge>
              ))}
            </div>
          </div>
        ))}

        {data.market_position_summary && (
          <div className="mt-2 pt-2 border-t border-border">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Market Position</span>
            <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">{data.market_position_summary}</p>
          </div>
        )}
      </div>
    </BentoCard>
  );
}

function GlossaryCard({ data }: { data: GlossaryEntry[] }) {
  return (
    <BentoCard title="Glossary" icon={BookOpen} iconColor="text-amber-500">
      <div className="space-y-1.5">
        {data.map((entry, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
            style={{ backgroundColor: 'hsl(var(--cs-surface-2))' }}
          >
            <span className="text-xs font-semibold text-foreground/80">{entry.preferred}</span>
            {entry.replaces && (
              <span className="text-[10px] text-muted-foreground italic">replaces {entry.replaces}</span>
            )}
          </div>
        ))}
      </div>
    </BentoCard>
  );
}

// ── Sidebar snapshot ────────────────────────────────────────────────────────

function StandardsSnapshotCard({
  brand,
  populatedCount,
  profile,
}: {
  brand: CreativeStudioBrand;
  populatedCount: number;
  profile: Record<string, unknown> | undefined;
}) {
  const sourceMeta = profile?.source_metadata as Record<string, unknown> | undefined;
  const manualSources = (sourceMeta?.manual_sources as string[]) || [];

  const categoryLabel = brand.brand_category
    ? brand.brand_category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null;

  return (
    <BentoCard title="Standards Snapshot" icon={BarChart3} iconColor="text-indigo-500">
      <div className="space-y-2.5">
        {categoryLabel && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Industry</span>
            <span className="font-medium text-foreground">{categoryLabel}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Sections Populated</span>
          <span className="font-medium text-foreground">{populatedCount} of 8</span>
        </div>

        {manualSources.length > 0 && (
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <FileText className="w-3 h-3" />
              <span>Standards Source</span>
            </div>
            <div className="space-y-1.5">
              {manualSources.map((src, i) => (
                <div key={i} className="flex items-start gap-2">
                  <FileText className="w-3 h-3 text-muted-foreground/50 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-foreground/70 truncate">{src}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile?.updated_at && (
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Last Updated</span>
              <span>{new Date(profile.updated_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        )}
      </div>
    </BentoCard>
  );
}

// ── Main dialog ─────────────────────────────────────────────────────────────

export function BrandStandardsDialog({ brand, open, onOpenChange, onNavigate }: BrandStandardsDialogProps) {
  const { data: profile, isLoading } = useBrandProfile(brand.id);
  const standards = profile?.brand_standards as BrandStandards | null | undefined;
  const headerTextLight = !isLightColor(brand.primary_color);

  // Header image from source_metadata
  const headerImageUrl = (profile?.source_metadata as Record<string, unknown>)?.header_image_url as string | undefined;

  // Count populated sections
  const populatedCount = standards
    ? [
        standards.color_system,
        standards.typography_system,
        standards.logo_system,
        standards.vertical_positioning,
        standards.writer_guidelines,
        standards.social_media_voice,
        standards.competitive_landscape,
        standards.glossary,
      ].filter(s => hasSectionData(s as Record<string, unknown> | unknown[] | null)).length
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[1400px] max-h-[88vh] p-0 gap-0 rounded-2xl sm:rounded-2xl overflow-hidden font-product-sans [&>button:last-child]:hidden"
        style={{
          backgroundColor: 'hsl(var(--cs-surface-2))',
          borderColor: 'hsl(var(--cs-border-mid))',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.15), 0 10px 30px -10px rgba(0,0,0,0.08)',
        }}
      >
        <DialogTitle className="sr-only">{brand.name} Brand Standards</DialogTitle>
        <DialogDescription className="sr-only">
          Prescriptive brand specifications for {brand.name}
        </DialogDescription>

        {/* ── Branded Header ── */}
        <div
          className="relative shrink-0 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${brand.primary_color} 0%, ${darkenHex(brand.primary_color, 0.35)} 100%)`,
            minHeight: '130px',
          }}
        >
          {/* Hero image overlay */}
          {headerImageUrl && (
            <img
              src={headerImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-contain p-4"
              style={{ opacity: 0.10, mixBlendMode: 'luminosity' }}
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.15) 100%)' }} />

          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-20 p-1.5 rounded-full transition-colors hover:bg-white/20"
            style={{
              backgroundColor: headerTextLight ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
              color: headerTextLight ? 'white' : '#1a1a1a',
            }}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-10 px-6 pt-6 pb-5 flex flex-col justify-center" style={{ minHeight: '130px' }}>
            <div className="flex items-center gap-5">
              {/* Logo */}
              {brand.logo_url ? (
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="h-16 max-w-[220px] rounded-xl object-contain bg-white/95 backdrop-blur-sm shadow-lg p-2.5 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm shadow-lg shrink-0">
                  <span className="text-white text-2xl font-bold">{brand.name.charAt(0)}</span>
                </div>
              )}

              {/* Brand name + URL */}
              <div className="flex-1 min-w-0">
                <h2
                  className="text-2xl font-bold truncate font-product-sans"
                  style={{ color: headerTextLight ? 'white' : '#1a1a1a' }}
                >
                  {brand.name}
                </h2>
                {brand.website_url && (
                  <a
                    href={brand.website_url.startsWith('http') ? brand.website_url : `https://${brand.website_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs transition-colors mt-1"
                    style={{ color: headerTextLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="underline underline-offset-2">{brand.website_url}</span>
                  </a>
                )}
                {/* Tagline */}
                {profile?.brand_identity?.tagline && (
                  <p
                    className="text-sm italic leading-relaxed mt-1.5 truncate"
                    style={{ color: headerTextLight ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.5)' }}
                  >
                    &ldquo;{profile.brand_identity.tagline}&rdquo;
                  </p>
                )}
              </div>

              {/* Right side: Brand Standards label + section count + nav */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <p
                  className="text-2xl font-bold tracking-tight font-product-sans"
                  style={{ color: headerTextLight ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.75)' }}
                >
                  Brand Standards
                </p>
                {populatedCount > 0 && (
                  <p
                    className="text-xs font-product-sans"
                    style={{ color: headerTextLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}
                  >
                    {populatedCount} of 8 sections populated
                  </p>
                )}
                {onNavigate && (
                  <BrandDialogNav
                    activeView="brand-standards"
                    onNavigate={onNavigate}
                    headerTextLight={headerTextLight}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Content with brand-tinted background ── */}
        <ScrollArea
          className="max-h-[calc(88vh-160px)]"
          style={{ backgroundColor: hexToRgba(brand.primary_color, 0.04) }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div
                className="animate-spin rounded-full h-6 w-6 border-b-2"
                style={{ borderColor: brand.primary_color }}
              />
            </div>
          ) : !standards ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground px-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'hsl(var(--cs-surface-1))', border: '1px solid hsl(var(--cs-border-subtle))' }}
              >
                <BookOpen className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-foreground">No brand standards yet</p>
              <p className="text-sm mt-1 text-muted-foreground text-center max-w-md">
                Import official brand style guides and standards manuals
                to build the prescriptive standards profile.
              </p>
            </div>
          ) : (
            <div className="px-6 py-4">
              {/* Two-zone layout: sections + sidebar */}
              <div className="grid grid-cols-[2fr_1fr] gap-3 items-start">
                {/* Left: sections grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Logo System */}
                  {hasSectionData(standards.logo_system as Record<string, unknown> | null) ? (
                    <LogoSystemCard data={standards.logo_system!} brandId={brand.id} />
                  ) : (
                    <BentoCard title="Logo System" icon={ImageIcon} iconColor="text-pink-500">
                      <EmptyHint text="Import brand identity guide to populate logo specifications." />
                    </BentoCard>
                  )}

                  {/* Vertical Positioning */}
                  {hasSectionData(standards.vertical_positioning as Record<string, unknown> | null) ? (
                    <VerticalPositioningCard data={standards.vertical_positioning!} />
                  ) : (
                    <BentoCard title="Vertical Positioning" icon={Globe} iconColor="text-blue-500">
                      <EmptyHint text="Import brand positioning documents to populate vertical strategy." />
                    </BentoCard>
                  )}

                  {/* Writer Guidelines */}
                  {hasSectionData(standards.writer_guidelines as Record<string, unknown> | null) ? (
                    <WriterGuidelinesCard data={standards.writer_guidelines!} />
                  ) : (
                    <BentoCard title="Writer Guidelines" icon={Pencil} iconColor="text-orange-500">
                      <EmptyHint text="Import brand voice or editorial guidelines to populate." />
                    </BentoCard>
                  )}

                  {/* Social Media Voice */}
                  {hasSectionData(standards.social_media_voice as Record<string, unknown> | null) ? (
                    <SocialMediaVoiceCard data={standards.social_media_voice!} />
                  ) : (
                    <BentoCard title="Social Media Voice" icon={Share2} iconColor="text-purple-500">
                      <EmptyHint text="Import social media guidelines to populate voice and tone." />
                    </BentoCard>
                  )}

                  {/* Competitive Landscape */}
                  {hasSectionData(standards.competitive_landscape as Record<string, unknown> | null) ? (
                    <CompetitiveLandscapeCard data={standards.competitive_landscape!} />
                  ) : (
                    <BentoCard title="Competitive Landscape" icon={Target} iconColor="text-red-500">
                      <EmptyHint text="Import competitive analysis or brand positioning docs to populate." />
                    </BentoCard>
                  )}

                  {/* Glossary */}
                  {standards.glossary && standards.glossary.length > 0 ? (
                    <GlossaryCard data={standards.glossary} />
                  ) : (
                    <BentoCard title="Glossary" icon={BookOpen} iconColor="text-amber-500">
                      <EmptyHint text="Import brand style guide to populate preferred terminology." />
                    </BentoCard>
                  )}
                </div>

                {/* Right: Visual identity sidebar */}
                <div className="sticky top-0 space-y-3">
                  {/* Color System */}
                  {hasSectionData(standards.color_system as Record<string, unknown> | null) ? (
                    <ColorSystemCard data={standards.color_system!} />
                  ) : (
                    <BentoCard title="Color System" icon={Palette} iconColor="text-emerald-500">
                      <EmptyHint text="Import brand style guide to populate color specifications." />
                    </BentoCard>
                  )}

                  {/* Typography System */}
                  {hasSectionData(standards.typography_system as Record<string, unknown> | null) ? (
                    <TypographySystemCard data={standards.typography_system!} />
                  ) : (
                    <BentoCard title="Typography System" icon={Type} iconColor="text-cyan-500">
                      <EmptyHint text="Import brand style guide to populate typography specifications." />
                    </BentoCard>
                  )}

                  <StandardsSnapshotCard
                    brand={brand}
                    populatedCount={populatedCount}
                    profile={profile}
                  />
                </div>
              </div>

              {/* Footer meta */}
              {profile?.updated_at && (
                <div className="mt-4 pt-2 border-t border-border">
                  <p className="text-[10px] text-muted-foreground text-center">
                    Last updated {new Date(profile.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
