// ABOUTME: Campaign archive tab — browsable list of all Vince creative packages.
// ABOUTME: List view with thumbnails + deliverable chips; detail view with full copy+images+metadata panel.

import { useState } from 'react';
import JSZip from 'jszip';
import { formatDistanceToNow, format } from 'date-fns';
import {
  ArrowLeft, Download, Layers, Archive, FileText, Loader2,
  FolderOpen, Clock, Cpu, Hash, Sparkles, Calendar, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useMyGenerations } from '@/hooks/useCreativeStudioGenerations';
import { CreativePackageDisplay, PackagePart } from './CreativePackageDisplay';
import type { GenerationWithDetails } from '@/types/creative-studio';

// ── Helpers ─────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Extract a human name from the copy text e.g. "## Deliverable 2: Full-Page Magazine Ad" */
function extractNameFromContent(text: string, fallback: string): string {
  const match = text.match(/##\s*Deliverable\s*\d+[:\-–]\s*([^\n]+)/i);
  if (match) return match[1].trim();
  // Also try "1. Hero Banner\n" at start
  const listMatch = text.match(/^\d+\.\s+([A-Z][^\n]{2,40})\n/m);
  if (listMatch) return listMatch[1].trim();
  return fallback;
}

/** Resolve deliverable names, falling back to names inferred from copy content */
function resolveDeliverableNames(copyBlocks: PackagePart[], storedNames: string[]): string[] {
  const names: string[] = [];
  let imageIndex = 0;
  let pendingText: string | undefined;

  for (const part of copyBlocks) {
    if (part.type === 'text' && part.content) {
      pendingText = part.content;
    } else if (part.type === 'image') {
      const stored = storedNames[imageIndex] || '';
      const isGeneric = !stored || /^deliverable\s*\d+$/i.test(stored.trim());
      const name = isGeneric && pendingText
        ? extractNameFromContent(pendingText, stored || `Deliverable ${imageIndex + 1}`)
        : stored || `Deliverable ${imageIndex + 1}`;
      names.push(name);
      pendingText = undefined;
      imageIndex++;
    }
  }

  // Any trailing text-only block
  if (pendingText !== undefined && names.length < storedNames.length) {
    names.push(storedNames[names.length] || 'Package Notes');
  }

  return names.length > 0 ? names : storedNames;
}

interface DeliverableGroup {
  name: string;
  text?: string;
  imageUrl?: string;
}

function groupPartsForExport(parts: PackagePart[], deliverableNames: string[]): DeliverableGroup[] {
  const groups: DeliverableGroup[] = [];
  let pendingText: string | undefined;
  let imageIndex = 0;

  for (const part of parts) {
    if (part.type === 'text' && part.content) {
      if (pendingText !== undefined) {
        groups.push({ name: deliverableNames[imageIndex] || `Deliverable ${imageIndex + 1}`, text: pendingText });
      }
      pendingText = part.content;
    } else if (part.type === 'image') {
      const imageUrl = part.content;
      groups.push({ name: deliverableNames[imageIndex] || `Deliverable ${imageIndex + 1}`, text: pendingText, imageUrl });
      pendingText = undefined;
      imageIndex++;
    }
  }

  if (pendingText !== undefined) {
    groups.push({ name: deliverableNames[imageIndex] || 'Package Notes', text: pendingText });
  }

  return groups;
}

async function downloadCampaignZip(gen: GenerationWithDetails, resolvedNames: string[]) {
  const copyBlocks = (gen.copy_blocks as PackagePart[] | undefined) || [];
  const brandName = gen.brand?.name || 'Campaign';
  const dateStr = gen.created_at.slice(0, 10);
  const brief = gen.prompt_text || '';
  const generatedAt = format(new Date(gen.created_at), 'MMMM d, yyyy \'at\' h:mm a');
  const genTimeSec = gen.generation_time_ms ? (gen.generation_time_ms / 1000).toFixed(1) : 'N/A';

  const zip = new JSZip();
  const folderName = `${slugify(brandName)}-campaign-${dateStr}`;
  const folder = zip.folder(folderName)!;

  // Comprehensive campaign info file
  const briefLines = [
    '╔══════════════════════════════════════════╗',
    '  VINCE CREATIVE CAMPAIGN ARCHIVE',
    '╚══════════════════════════════════════════╝',
    '',
    'CAMPAIGN DETAILS',
    '────────────────',
    `Brand:               ${brandName}`,
    `Generated:           ${generatedAt}`,
    `Generation Time:     ${genTimeSec}s`,
    `Model:               ${gen.model_used}`,
    `Package ID:          ${gen.id}`,
    `Deliverable Count:   ${resolvedNames.length}`,
    '',
    'DELIVERABLES',
    '────────────',
    ...resolvedNames.map((name, i) => `  ${i + 1}. ${name}`),
    '',
    'CREATIVE BRIEF',
    '──────────────',
    brief || '(no brief recorded)',
    '',
    'IMAGE URLS',
    '──────────',
    ...(gen.output_urls || []).map((url, i) => `  ${i + 1}. ${resolvedNames[i] || `Deliverable ${i + 1}`}\n     ${url}`),
  ];
  folder.file('_campaign-info.txt', briefLines.join('\n'));

  // Per-deliverable files
  const groups = groupPartsForExport(copyBlocks, resolvedNames);
  for (const [i, group] of groups.entries()) {
    const num = String(i + 1).padStart(2, '0');
    const slug = slugify(group.name);

    if (group.text || group.imageUrl) {
      const copyLines = [
        `DELIVERABLE ${i + 1}: ${group.name.toUpperCase()}`,
        '═'.repeat(Math.min(50, `DELIVERABLE ${i + 1}: ${group.name}`.length)),
        `Brand:     ${brandName}`,
        `Model:     ${gen.model_used}`,
        `Generated: ${generatedAt}`,
        ...(group.imageUrl ? [`Image URL: ${group.imageUrl}`] : []),
        '',
        'COPY',
        '────',
        group.text ? group.text.replace(/\*{1,3}/g, '') : '(no copy recorded)',
      ];
      folder.file(`${num}-${slug}.txt`, copyLines.join('\n'));
    }

    if (group.imageUrl) {
      try {
        const res = await fetch(group.imageUrl);
        if (res.ok) {
          const blob = await res.blob();
          const ext = blob.type.includes('png') ? 'png' : 'jpg';
          folder.file(`${num}-${slug}.${ext}`, blob);
        }
      } catch { /* skip failed image fetches */ }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = `${folderName}.zip`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Metadata Panel ───────────────────────────────────────────────────────────

function MetadataRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">{label}</span>
      <span className={`text-xs text-foreground/85 break-all ${mono ? 'font-mono text-[11px]' : ''}`}>{value}</span>
    </div>
  );
}

function CampaignMetadataPanel({ gen, resolvedNames }: { gen: GenerationWithDetails; resolvedNames: string[] }) {
  const hasCopy = !!(gen.copy_blocks && (gen.copy_blocks as PackagePart[]).some(p => p.type === 'text'));
  const brandAlignment = gen.metadata?.brand_alignment as { score: number } | undefined;

  return (
    <div className="space-y-4 text-sm">
      {/* Generation info */}
      <div className="rounded-lg border border-border/40 bg-muted/10 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Generation Info</span>
        </div>
        <div className="space-y-3">
          <MetadataRow label="Model" value={gen.model_used} mono />
          <MetadataRow
            label="Generated"
            value={format(new Date(gen.created_at), 'MMM d, yyyy · h:mm a')}
          />
          {gen.generation_time_ms && (
            <MetadataRow label="Generation Time" value={`${(gen.generation_time_ms / 1000).toFixed(2)}s`} />
          )}
          <MetadataRow label="Deliverables" value={`${resolvedNames.length} assets`} />
          <MetadataRow label="Images Generated" value={`${(gen.output_urls || []).length}`} />
          {hasCopy && <MetadataRow label="Copy Stored" value="Yes — full text available" />}
        </div>
      </div>

      {/* Brand */}
      {gen.brand && (
        <div className="rounded-lg border border-border/40 bg-muted/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Brand</span>
          </div>
          <div className="space-y-3">
            <MetadataRow label="Name" value={gen.brand.name} />
            {gen.brand.brand_category && (
              <MetadataRow label="Category" value={gen.brand.brand_category} />
            )}
            {gen.brand.primary_color && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Primary Color</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border border-border/30 shrink-0"
                    style={{ backgroundColor: gen.brand.primary_color }}
                  />
                  <span className="text-xs font-mono text-foreground/85">{gen.brand.primary_color}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deliverables */}
      <div className="rounded-lg border border-border/40 bg-muted/10 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Deliverables</span>
        </div>
        <div className="space-y-1.5">
          {resolvedNames.map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-muted-foreground/40 w-4 shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-xs text-foreground/80">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Brand alignment */}
      {brandAlignment && (
        <div className="rounded-lg border border-border/40 bg-muted/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Brand Alignment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${brandAlignment.score >= 75 ? 'bg-emerald-400' : brandAlignment.score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${brandAlignment.score}%` }}
              />
            </div>
            <span className={`text-sm font-bold tabular-nums ${brandAlignment.score >= 75 ? 'text-emerald-400' : brandAlignment.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {brandAlignment.score}%
            </span>
          </div>
        </div>
      )}

      {/* Record ID */}
      <div className="rounded-lg border border-border/40 bg-muted/10 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Hash className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Record</span>
        </div>
        <MetadataRow label="Package ID" value={gen.id} mono />
        {gen.completed_at && (
          <MetadataRow label="Completed" value={format(new Date(gen.completed_at), 'MMM d, yyyy · h:mm:ss a')} />
        )}
      </div>
    </div>
  );
}

// ── Campaign Card (list view) ────────────────────────────────────────────────

function CampaignCard({ gen, resolvedNames, onOpen }: {
  gen: GenerationWithDetails;
  resolvedNames: string[];
  onOpen: () => void;
}) {
  const [zipping, setZipping] = useState(false);
  const hasCopy = !!(gen.copy_blocks && (gen.copy_blocks as PackagePart[]).some(p => p.type === 'text'));
  const thumbnails = (gen.output_urls || []).slice(0, 3);
  const brandName = gen.brand?.name || 'Unknown Brand';
  const brief = gen.prompt_text || '';

  // Campaign subtitle: first ~80 chars of brief
  const subtitle = brief.length > 80 ? brief.slice(0, 80).replace(/\s+\S*$/, '') + '…' : brief;

  const handleZip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setZipping(true);
    try {
      await downloadCampaignZip(gen, resolvedNames);
      toast.success('Campaign downloaded');
    } catch {
      toast.error('ZIP download failed');
    } finally {
      setZipping(false);
    }
  };

  return (
    <div
      className="group bg-card border border-border/50 rounded-xl p-4 hover:border-purple-500/40 hover:bg-card/80 transition-all cursor-pointer"
      onClick={onOpen}
    >
      <div className="flex gap-4">
        {/* Thumbnail strip */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {thumbnails.length > 0 ? thumbnails.map((url, i) => (
            <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-border/30 bg-muted/20">
              <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
          )) : (
            <div className="w-16 h-16 rounded-lg border border-border/30 bg-muted/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-muted-foreground/30" />
            </div>
          )}
          {(gen.output_urls || []).length > 3 && (
            <div className="w-16 h-5 rounded bg-muted/20 flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground/50">+{gen.output_urls.length - 3} more</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{brandName}</p>
                {!hasCopy && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-muted-foreground/50 border-border/30">
                    Images only
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</p>
              )}
            </div>
            <div className="shrink-0 text-right space-y-1">
              <p className="text-[11px] text-muted-foreground/60">
                {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true })}
              </p>
              {gen.generation_time_ms && (
                <p className="text-[10px] text-muted-foreground/40 flex items-center justify-end gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {(gen.generation_time_ms / 1000).toFixed(1)}s
                </p>
              )}
            </div>
          </div>

          {/* Deliverable chips */}
          {resolvedNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {resolvedNames.map((name, i) => (
                <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {name}
                </span>
              ))}
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/40">
            <span className="flex items-center gap-1"><Cpu className="w-2.5 h-2.5" />{gen.model_used}</span>
            <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{format(new Date(gen.created_at), 'MMM d, yyyy')}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
              <FolderOpen className="w-3 h-3" />
              Open Campaign
            </Button>
            <Button
              size="sm" variant="ghost" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleZip}
              disabled={zipping}
              title="Download campaign as ZIP (copy + images)"
            >
              {zipping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              Download ZIP
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Campaign Detail ──────────────────────────────────────────────────────────

interface ImageInfoState {
  index: number;
  name: string;
  imageUrl: string;
}

function CampaignDetail({ gen, onBack }: { gen: GenerationWithDetails; onBack: () => void }) {
  const [zipping, setZipping] = useState(false);
  const [imageInfo, setImageInfo] = useState<ImageInfoState | null>(null);
  const storedNames = (gen.metadata?.deliverable_names as string[] | undefined) || [];
  const copyBlocks = (gen.copy_blocks as PackagePart[] | undefined) || [];
  const hasCopy = copyBlocks.some(p => p.type === 'text');
  const resolvedNames = hasCopy ? resolveDeliverableNames(copyBlocks, storedNames) : storedNames;
  const brandName = gen.brand?.name || 'Campaign';
  const brief = gen.prompt_text || '';
  const subtitle = brief.length > 100 ? brief.slice(0, 100).replace(/\s+\S*$/, '') + '…' : brief;

  // Extract copy text for a specific image index
  const getCopyForIndex = (idx: number): string | undefined => {
    let imageCount = 0;
    let pendingText: string | undefined;
    for (const part of copyBlocks) {
      if (part.type === 'text' && part.content) {
        pendingText = part.content;
      } else if (part.type === 'image') {
        if (imageCount === idx) return pendingText;
        pendingText = undefined;
        imageCount++;
      }
    }
    return undefined;
  };

  const handleZip = async () => {
    setZipping(true);
    try {
      await downloadCampaignZip(gen, resolvedNames);
      toast.success('Campaign downloaded');
    } catch {
      toast.error('ZIP download failed');
    } finally {
      setZipping(false);
    }
  };

  return (
    <>
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-border/30">
        <div className="flex items-start gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 shrink-0 mt-0.5">
            <ArrowLeft className="w-4 h-4" />
            Campaigns
          </Button>
          <div className="h-8 w-px bg-border/40 mt-0.5" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-foreground">{brandName}</h2>
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Layers className="w-2.5 h-2.5" />
                {resolvedNames.length} deliverables
              </Badge>
              {gen.generation_time_ms && (
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <Clock className="w-2.5 h-2.5" />
                  {(gen.generation_time_ms / 1000).toFixed(1)}s
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-2xl">{subtitle}</p>
            )}
          </div>
        </div>
        <Button
          size="sm" variant="outline" className="gap-1.5 shrink-0"
          onClick={handleZip}
          disabled={zipping}
          title="Download entire campaign as ZIP — copy text + images"
        >
          {zipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
          Download ZIP
        </Button>
      </div>

      {/* Body: two-column layout */}
      <div className="pt-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Left: Package display */}
        <div className="min-w-0">
          {hasCopy ? (
            <CreativePackageDisplay
              parts={copyBlocks}
              imageUrls={gen.output_urls || []}
              latencyMs={gen.generation_time_ms || 0}
              brandName={brandName}
              model={gen.model_used}
              brief={gen.prompt_text || undefined}
              deliverableNames={resolvedNames}
              onImageInfo={(index, name, imageUrl) => setImageInfo({ index, name, imageUrl })}
            />
          ) : (
            <div className="space-y-6">
              <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-300/80">
                    Copy is stored for campaigns generated after March 14, 2026. Images are available below.
                  </p>
                </div>
              </div>
              <div className="space-y-5">
                {(gen.output_urls || []).map((url, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 shrink-0">
                        {storedNames[i] || `Deliverable ${i + 1}`}
                      </span>
                      <div className="flex-1 h-px bg-purple-500/20" />
                    </div>
                    <div className="relative group/img rounded-lg overflow-hidden border border-border/30">
                      <img src={url} alt={storedNames[i]} className="w-full h-auto block" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity">
                        <div className="absolute bottom-3 right-3">
                          <Button size="sm" variant="secondary" className="h-7 gap-1.5 text-xs"
                            onClick={() => { const a = document.createElement('a'); a.href = url; a.download = `${slugify(brandName)}-${slugify(storedNames[i] || `deliverable-${i+1}`)}.jpg`; a.click(); }}>
                            <Download className="w-3 h-3" /> Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Metadata panel */}
        <div className="lg:sticky lg:top-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Campaign Info</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>
          <CampaignMetadataPanel gen={gen} resolvedNames={resolvedNames} />
        </div>
      </div>
    </div>

    {/* Per-image info dialog */}
    <Dialog open={!!imageInfo} onOpenChange={(open) => { if (!open) setImageInfo(null); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {imageInfo ? resolvedNames[imageInfo.index] || `Deliverable ${imageInfo.index + 1}` : ''}
          </DialogTitle>
        </DialogHeader>
        {imageInfo && (() => {
          const copyText = getCopyForIndex(imageInfo.index);
          const imageUrl = imageInfo.imageUrl;
          return (
            <div className="space-y-4">
              {/* Image preview */}
              <div className="rounded-lg overflow-hidden border border-border/30 bg-muted/10">
                <img src={imageUrl} alt={imageInfo.name} className="w-full h-auto block max-h-64 object-contain" />
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Deliverable</p>
                  <p className="text-xs text-foreground/85">{resolvedNames[imageInfo.index] || `Deliverable ${imageInfo.index + 1}`}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Index</p>
                  <p className="text-xs font-mono text-foreground/85">{String(imageInfo.index + 1).padStart(2, '0')} of {resolvedNames.length}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Model</p>
                  <p className="text-xs font-mono text-foreground/85">{gen.model_used}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Generated</p>
                  <p className="text-xs text-foreground/85">{format(new Date(gen.created_at), 'MMM d, yyyy · h:mm a')}</p>
                </div>
                {gen.generation_time_ms && (
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Generation Time</p>
                    <p className="text-xs text-foreground/85">{(gen.generation_time_ms / 1000).toFixed(2)}s</p>
                  </div>
                )}
                {gen.brand && (
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Brand</p>
                    <p className="text-xs text-foreground/85">{gen.brand.name}</p>
                  </div>
                )}
              </div>

              {/* Image URL */}
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Image URL</p>
                <p className="text-[10px] font-mono text-muted-foreground/60 break-all leading-relaxed bg-muted/20 rounded p-2">{imageUrl}</p>
              </div>

              {/* Copy text */}
              {copyText && (
                <div className="space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Copy</p>
                  <div className="bg-muted/10 rounded-md p-3 border border-border/20">
                    <p className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap">{copyText.replace(/\*{1,3}/g, '')}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm" variant="outline" className="gap-1.5 text-xs"
                  onClick={() => { const a = document.createElement('a'); a.href = imageUrl; a.download = `${slugify(brandName)}-${slugify(resolvedNames[imageInfo.index] || `deliverable-${imageInfo.index + 1}`)}.jpg`; a.click(); }}
                >
                  <Download className="w-3 h-3" />
                  Download Image
                </Button>
              </div>
            </div>
          );
        })()}
      </DialogContent>
    </Dialog>
    </>
  );
}

// ── Main Tab ─────────────────────────────────────────────────────────────────

export function CampaignsTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<string>('all');

  const { data: allGenerations = [], isLoading } = useMyGenerations(200);

  const campaigns = allGenerations.filter(g => g.generation_type === 'creative_package');

  const brands = Array.from(
    new Map(
      campaigns.filter(g => g.brand).map(g => [g.brand!.id, g.brand!] as const)
    ).values()
  );

  const filtered = brandFilter === 'all' ? campaigns : campaigns.filter(g => g.brand?.id === brandFilter);

  const selectedCampaign = selectedId ? campaigns.find(g => g.id === selectedId) : null;

  // Resolve deliverable names for selected campaign
  const selectedCopyBlocks = selectedCampaign
    ? (selectedCampaign.copy_blocks as PackagePart[] | undefined) || []
    : [];
  const selectedStoredNames = selectedCampaign
    ? (selectedCampaign.metadata?.deliverable_names as string[] | undefined) || []
    : [];
  const selectedResolvedNames = selectedCopyBlocks.some(p => p.type === 'text')
    ? resolveDeliverableNames(selectedCopyBlocks, selectedStoredNames)
    : selectedStoredNames;

  if (selectedCampaign) {
    return (
      <div className="p-6">
        <CampaignDetail gen={selectedCampaign} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Layers className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-purple-400">Campaigns</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {campaigns.length} creative package{campaigns.length !== 1 ? 's' : ''} · full copy and images
          </p>
        </div>
        {brands.length > 1 && (
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue placeholder="All brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {brands.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Separator />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/50" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Layers className="w-10 h-10 text-muted-foreground/20" />
          <p className="text-sm font-medium text-muted-foreground/60">No campaigns yet</p>
          <p className="text-xs text-muted-foreground/40 max-w-xs">
            Ask Vince to create a campaign and it will appear here with full copy and images.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(gen => {
            const copyBlocks = (gen.copy_blocks as PackagePart[] | undefined) || [];
            const storedNames = (gen.metadata?.deliverable_names as string[] | undefined) || [];
            const resolvedNames = copyBlocks.some(p => p.type === 'text')
              ? resolveDeliverableNames(copyBlocks, storedNames)
              : storedNames;
            return (
              <CampaignCard
                key={gen.id}
                gen={gen}
                resolvedNames={resolvedNames}
                onOpen={() => setSelectedId(gen.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
