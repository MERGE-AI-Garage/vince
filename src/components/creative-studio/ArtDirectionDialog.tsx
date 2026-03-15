// ABOUTME: Art Direction showcase dialog — photography style, composition rules, and product catalog
// ABOUTME: 4th brand intelligence view; surfaces data captured from product scans and image analyses

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Camera, LayoutGrid, Package, X, Globe, ScanLine, BarChart3,
  Sparkles, Eye, CheckCircle, XCircle,
} from 'lucide-react';
import { useBrandProfile } from '@/hooks/useCreativeStudioBrandIntelligence';
import type { BrandVisualProfile, CreativeStudioBrand } from '@/types/creative-studio';
import type { LucideIcon } from 'lucide-react';
import { BrandDialogNav, type BrandDialogView } from './BrandDialogNav';

// ── Helpers ─────────────────────────────────────────────────────────────────

function darkenHex(hex: string | null | undefined, amount: number): string {
  if (!hex) return `rgb(51, 51, 51)`;
  const clean = hex.replace('#', '');
  const r = Math.round(parseInt(clean.slice(0, 2), 16) * (1 - amount));
  const g = Math.round(parseInt(clean.slice(2, 4), 16) * (1 - amount));
  const b = Math.round(parseInt(clean.slice(4, 6), 16) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function isLightColor(hex: string | null | undefined): boolean {
  if (!hex) return false;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

function hexToRgba(hex: string | null | undefined, alpha: number): string {
  if (!hex) return `rgba(51, 51, 51, ${alpha})`;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Reusable card components ────────────────────────────────────────────────

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

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">{value}</p>
    </div>
  );
}

function BadgeList({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary" className="text-[10px]">{item}</Badge>
        ))}
      </div>
    </div>
  );
}

// ── Photography section ──────────────────────────────────────────────────────

function PhotographySection({ data }: { data: BrandVisualProfile['photography_style'] }) {
  if (!data) return null;
  const specs = [
    { label: 'Aperture', value: data.preferred_aperture },
    { label: 'Focal Length', value: data.preferred_focal_length },
    { label: 'Color Temp', value: data.preferred_color_temperature },
    { label: 'Film Stock', value: data.film_stock_feel },
  ].filter(s => s.value);
  const wide = [
    { label: 'Lighting', value: data.preferred_lighting },
    { label: 'Depth of Field', value: data.depth_of_field_preference },
  ].filter(s => s.value);
  return (
    <div className="space-y-3">
      {specs.length > 0 && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          {specs.map(spec => (
            <div key={spec.label} className="space-y-0.5">
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">{spec.label}</span>
              <p className="text-[11px] font-semibold text-foreground leading-snug font-product-sans">{spec.value}</p>
            </div>
          ))}
        </div>
      )}
      {wide.length > 0 && (
        <div
          className="rounded-lg px-3 py-2 space-y-2"
          style={{ backgroundColor: 'hsl(var(--cs-surface-2))', border: '1px solid hsl(var(--cs-border-subtle))' }}
        >
          {wide.map(spec => (
            <div key={spec.label}>
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">{spec.label}</span>
              <p className="text-[11px] text-foreground/85 leading-snug mt-0.5">{spec.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Composition section ──────────────────────────────────────────────────────

function CompositionSection({ data }: { data: BrandVisualProfile['composition_rules'] }) {
  if (!data) return null;
  return (
    <div className="space-y-3">
      {data.aspect_ratio_preference && (
        <div
          className="flex items-center justify-between rounded-lg px-3 py-2"
          style={{ backgroundColor: 'hsl(var(--cs-surface-2))', border: '1px solid hsl(var(--cs-border-subtle))' }}
        >
          <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">Aspect Ratio</span>
          <span className="text-sm font-bold text-foreground font-product-sans">{data.aspect_ratio_preference}</span>
        </div>
      )}
      <BadgeList label="Preferred Layouts" items={data.preferred_layouts} />
      <BadgeList label="Framing Conventions" items={data.framing_conventions} />
    </div>
  );
}

// ── Product catalog section ──────────────────────────────────────────────────

function ProductCatalogSection({ data }: { data: BrandVisualProfile['product_catalog'] }) {
  const entries = data ? Object.values(data) : [];

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
        <ScanLine className="w-8 h-8 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground/60 italic">
          Scan a product page to populate the catalog
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {entries.map((product, i) => (
        <div
          key={i}
          className="rounded-lg p-2.5 space-y-2"
          style={{
            backgroundColor: 'hsl(var(--cs-surface-2))',
            border: '1px solid hsl(var(--cs-border-subtle))',
          }}
        >
          <p className="text-xs font-semibold text-foreground font-product-sans">{product.name}</p>

          {product.styling_rules?.length > 0 && (
            <div>
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                Styling Rules
              </span>
              <ul className="space-y-0.5">
                {product.styling_rules.map((rule, j) => (
                  <li key={j} className="text-[10px] text-foreground/70 leading-snug flex gap-1.5">
                    <span className="text-muted-foreground/50 shrink-0">·</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.required_elements?.length > 0 && (
            <div>
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                Required
              </span>
              <div className="flex flex-wrap gap-1">
                {product.required_elements.map((el, j) => (
                  <Badge key={j} variant="secondary" className="text-[9px] bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                    {el}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {product.forbidden_elements?.length > 0 && (
            <div>
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                Avoid
              </span>
              <div className="flex flex-wrap gap-1">
                {product.forbidden_elements.map((el, j) => (
                  <Badge key={j} variant="secondary" className="text-[9px] bg-red-500/10 text-red-700 border-red-500/20">
                    {el}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Overview prose ───────────────────────────────────────────────────────────

function ArtDirectionOverview({ profile }: { profile: BrandVisualProfile }) {
  const dna = profile.visual_dna as Record<string, unknown>;
  const signatureStyle = dna?.signature_style as string | undefined;
  const brandAesthetic = profile.brand_identity?.brand_aesthetic;
  if (!signatureStyle && !brandAesthetic) return null;
  return (
    <BentoCard title="Overview" icon={Sparkles} iconColor="text-amber-500">
      <div className="space-y-2.5">
        {brandAesthetic && (
          <p className="text-xs text-foreground/90 leading-relaxed font-medium italic border-l-2 border-amber-400/60 pl-3">
            {brandAesthetic}
          </p>
        )}
        {signatureStyle && (
          <p className="text-xs text-foreground/70 leading-relaxed">{signatureStyle}</p>
        )}
      </div>
    </BentoCard>
  );
}

// ── Visual principles ────────────────────────────────────────────────────────

function VisualPrinciples({ profile }: { profile: BrandVisualProfile }) {
  const dna = profile.visual_dna as Record<string, unknown>;
  const principles = dna?.visual_principles as string[] | undefined;
  if (!principles?.length) return null;
  return (
    <BentoCard title="Visual Principles" icon={Eye} iconColor="text-violet-500">
      <ul className="space-y-1.5">
        {principles.map((p, i) => (
          <li key={i} className="flex gap-2 text-xs text-foreground/80 leading-snug">
            <span className="text-violet-400 shrink-0 mt-px font-bold">·</span>
            {p}
          </li>
        ))}
      </ul>
    </BentoCard>
  );
}

// ── Do's and Don'ts ──────────────────────────────────────────────────────────

function VisualDosDonts({ profile }: { profile: BrandVisualProfile }) {
  const dna = profile.visual_dna as Record<string, unknown>;
  const dos = dna?.dos as string[] | undefined;
  const donts = dna?.donts as string[] | undefined;
  if (!dos?.length && !donts?.length) return null;
  return (
    <BentoCard title="Do's & Don'ts" icon={CheckCircle} iconColor="text-emerald-500">
      <div className="space-y-3">
        {dos && dos.length > 0 && (
          <div>
            <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-widest block mb-1.5">Do</span>
            <ul className="space-y-1.5">
              {dos.map((item, i) => (
                <li key={i} className="flex gap-1.5 text-[11px] text-foreground/75 leading-snug">
                  <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {donts && donts.length > 0 && (
          <div>
            <span className="text-[9px] font-semibold text-red-500 uppercase tracking-widest block mb-1.5">Don't</span>
            <ul className="space-y-1.5">
              {donts.map((item, i) => (
                <li key={i} className="flex gap-1.5 text-[11px] text-foreground/75 leading-snug">
                  <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </BentoCard>
  );
}

// ── Snapshot sidebar ─────────────────────────────────────────────────────────

function ArtDirectionSnapshot({
  profile,
}: {
  profile: BrandVisualProfile;
}) {
  const productCount = profile.product_catalog ? Object.keys(profile.product_catalog).length : 0;
  const hasPhotography = !!profile.photography_style && Object.values(profile.photography_style).some(Boolean);
  const hasComposition = !!profile.composition_rules && Object.values(profile.composition_rules).some(v =>
    Array.isArray(v) ? v.length > 0 : !!v
  );
  const sectionsPopulated = [hasPhotography, hasComposition, productCount > 0].filter(Boolean).length;

  const sourceMeta = profile.source_metadata as Record<string, unknown> | undefined;
  const lastRun = sourceMeta?.analyzed_at as string | undefined;

  return (
    <BentoCard title="Art Direction Snapshot" icon={BarChart3} iconColor="text-sky-500">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Sections Populated</span>
          <span className="font-medium text-foreground">{sectionsPopulated} of 3</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Products</span>
          <span className="font-medium text-foreground">{productCount}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Photography</span>
          <span className={`font-medium text-xs ${hasPhotography ? 'text-emerald-600' : 'text-muted-foreground/50'}`}>
            {hasPhotography ? 'Populated' : 'Empty'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Composition</span>
          <span className={`font-medium text-xs ${hasComposition ? 'text-emerald-600' : 'text-muted-foreground/50'}`}>
            {hasComposition ? 'Populated' : 'Empty'}
          </span>
        </div>
        {lastRun && (
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Last Analysis</span>
              <span>{new Date(lastRun).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        )}
      </div>
    </BentoCard>
  );
}

// ── Main dialog ──────────────────────────────────────────────────────────────

interface ArtDirectionDialogProps {
  brand: CreativeStudioBrand;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (view: BrandDialogView) => void;
}

export function ArtDirectionDialog({ brand, open, onOpenChange, onNavigate }: ArtDirectionDialogProps) {
  const { data: profile, isLoading } = useBrandProfile(brand.id);
  const headerTextLight = !isLightColor(brand.primary_color);

  const headerImageUrl = (profile?.source_metadata as Record<string, unknown>)?.header_image_url as string | undefined;

  const hasPhotography = !!profile?.photography_style && Object.values(profile.photography_style).some(Boolean);
  const hasComposition = !!profile?.composition_rules && Object.values(profile.composition_rules).some(v =>
    Array.isArray(v) ? v.length > 0 : !!v
  );

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
        <DialogTitle className="sr-only">{brand.name} Art Direction</DialogTitle>
        <DialogDescription className="sr-only">
          Art direction profile for {brand.name} — photography style, composition, and product catalog
        </DialogDescription>

        {/* ── Branded Header ── */}
        <div
          className="relative shrink-0 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${brand.primary_color} 0%, ${darkenHex(brand.primary_color, 0.35)} 100%)`,
            minHeight: '130px',
          }}
        >
          {headerImageUrl && (
            <img
              src={headerImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-contain p-4"
              style={{ opacity: 0.10, mixBlendMode: 'luminosity' }}
            />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.15) 100%)' }} />

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
                {profile?.brand_identity?.tagline && (
                  <p
                    className="text-sm italic leading-relaxed mt-1.5 truncate"
                    style={{ color: headerTextLight ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.5)' }}
                  >
                    &ldquo;{profile.brand_identity.tagline}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <p
                  className="text-2xl font-bold tracking-tight font-product-sans"
                  style={{ color: headerTextLight ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.75)' }}
                >
                  Art Direction
                </p>
                {onNavigate && (
                  <BrandDialogNav
                    activeView="art-direction"
                    onNavigate={onNavigate}
                    headerTextLight={headerTextLight}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <ScrollArea
          className="h-[calc(88vh-130px)]"
          style={{ backgroundColor: hexToRgba(brand.primary_color, 0.04) }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div
                className="animate-spin rounded-full h-6 w-6 border-b-2"
                style={{ borderColor: brand.primary_color }}
              />
            </div>
          ) : !profile ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground px-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'hsl(var(--cs-surface-1))', border: '1px solid hsl(var(--cs-border-subtle))' }}
              >
                <Camera className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-foreground">No art direction profile yet</p>
              <p className="text-sm mt-1 text-muted-foreground text-center max-w-md">
                Analyze brand imagery or scan a product page to build the art direction profile.
              </p>
            </div>
          ) : (
            <div className="px-6 py-4">
              <div className="grid grid-cols-[2fr_1fr] gap-3 items-start">
                {/* Left: Photography, Composition, Product Catalog */}
                <div className="space-y-3">
                  {/* Photography + Composition side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    {hasPhotography && (
                      <BentoCard title="Photography" icon={Camera} iconColor="text-sky-500">
                        <PhotographySection data={profile.photography_style} />
                      </BentoCard>
                    )}
                    {hasComposition && (
                      <BentoCard title="Composition" icon={LayoutGrid} iconColor="text-violet-500">
                        <CompositionSection data={profile.composition_rules} />
                      </BentoCard>
                    )}
                  </div>

                  {/* Product Catalog — always shown so user knows to scan */}
                  <BentoCard title="Product Catalog" icon={Package} iconColor="text-emerald-500">
                    <ProductCatalogSection data={profile.product_catalog} />
                  </BentoCard>
                </div>

                {/* Right: Overview, Principles, Do/Don'ts, Snapshot */}
                <div className="space-y-3">
                  <ArtDirectionOverview profile={profile} />
                  <VisualPrinciples profile={profile} />
                  <VisualDosDonts profile={profile} />
                  <ArtDirectionSnapshot profile={profile} />
                </div>
              </div>

              {profile.updated_at && (
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
