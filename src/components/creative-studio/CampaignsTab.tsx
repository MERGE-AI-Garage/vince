// ABOUTME: Campaign archive tab — browsable list of all Vince creative packages.
// ABOUTME: List view shows thumbnail strips + deliverable chips; detail view renders full copy+images.

import { useState } from 'react';
import JSZip from 'jszip';
import { formatDistanceToNow, format } from 'date-fns';
import { ArrowLeft, Download, Layers, Archive, FileText, Loader2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useMyGenerations } from '@/hooks/useCreativeStudioGenerations';
import { CreativePackageDisplay, PackagePart } from './CreativePackageDisplay';
import type { GenerationWithDetails } from '@/types/creative-studio';

// ── Helpers ─────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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

async function downloadCampaignZip(gen: GenerationWithDetails) {
  const deliverableNames = (gen.metadata?.deliverable_names as string[] | undefined) || [];
  const copyBlocks = (gen.copy_blocks as PackagePart[] | undefined) || [];
  const brandName = gen.brand?.name || 'Campaign';
  const dateStr = gen.created_at.slice(0, 10);
  const brief = gen.prompt_text || '';

  const zip = new JSZip();
  const folderName = `${slugify(brandName)}-campaign-${dateStr}`;
  const folder = zip.folder(folderName)!;

  const briefLines = [
    'Campaign Brief',
    '==============',
    `Brand: ${brandName}`,
    `Date: ${format(new Date(gen.created_at), 'MMMM d, yyyy')}`,
    `Deliverables: ${deliverableNames.join(', ')}`,
    '',
    brief,
  ];
  folder.file('campaign-brief.txt', briefLines.join('\n'));

  const groups = groupPartsForExport(copyBlocks, deliverableNames);
  for (const [i, group] of groups.entries()) {
    const num = String(i + 1).padStart(2, '0');
    const slug = slugify(group.name);
    if (group.text) {
      folder.file(`${num}-${slug}.txt`, group.text.replace(/\*{1,3}/g, '').trim());
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

// ── Campaign Card (list view) ────────────────────────────────────────────────

function CampaignCard({
  gen,
  onOpen,
}: {
  gen: GenerationWithDetails;
  onOpen: () => void;
}) {
  const [zipping, setZipping] = useState(false);
  const deliverableNames = (gen.metadata?.deliverable_names as string[] | undefined) || [];
  const hasCopy = !!(gen.copy_blocks && (gen.copy_blocks as PackagePart[]).some(p => p.type === 'text'));
  const thumbnails = (gen.output_urls || []).slice(0, 3);
  const brandName = gen.brand?.name || 'Unknown Brand';
  const brief = gen.prompt_text || '';

  const handleZip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasCopy) return;
    setZipping(true);
    try {
      await downloadCampaignZip(gen);
      toast.success('Campaign downloaded');
    } catch {
      toast.error('ZIP download failed');
    } finally {
      setZipping(false);
    }
  };

  return (
    <div
      className="group relative bg-card border border-border/50 rounded-xl p-4 hover:border-purple-500/40 hover:bg-card/80 transition-all cursor-pointer"
      onClick={onOpen}
    >
      <div className="flex gap-4">
        {/* Thumbnail strip */}
        <div className="flex flex-col gap-1 shrink-0">
          {thumbnails.length > 0 ? (
            thumbnails.map((url, i) => (
              <div
                key={i}
                className="w-16 h-16 rounded-lg overflow-hidden border border-border/30 bg-muted/20"
              >
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))
          ) : (
            <div className="w-16 h-16 rounded-lg border border-border/30 bg-muted/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-muted-foreground/30" />
            </div>
          )}
          {(gen.output_urls || []).length > 3 && (
            <div className="w-16 h-6 rounded-md bg-muted/20 border border-border/20 flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground/60">+{gen.output_urls.length - 3}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{brandName}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                {brief || 'No brief recorded'}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] text-muted-foreground/60">
                {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true })}
              </p>
              {!hasCopy && (
                <Badge variant="outline" className="text-[9px] mt-1 text-muted-foreground/50 border-border/30">
                  Images only
                </Badge>
              )}
            </div>
          </div>

          {/* Deliverable chips */}
          {deliverableNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {deliverableNames.map((name, i) => (
                <span
                  key={i}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20"
                >
                  {name}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={(e) => { e.stopPropagation(); onOpen(); }}
            >
              <FolderOpen className="w-3 h-3" />
              Open
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleZip}
              disabled={!hasCopy || zipping}
              title={hasCopy ? 'Download campaign as ZIP' : 'Copy not available for this campaign'}
            >
              {zipping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              ZIP
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Campaign Detail ──────────────────────────────────────────────────────────

function CampaignDetail({
  gen,
  onBack,
}: {
  gen: GenerationWithDetails;
  onBack: () => void;
}) {
  const [zipping, setZipping] = useState(false);
  const deliverableNames = (gen.metadata?.deliverable_names as string[] | undefined) || [];
  const copyBlocks = (gen.copy_blocks as PackagePart[] | undefined) || [];
  const hasCopy = copyBlocks.some(p => p.type === 'text');
  const brandName = gen.brand?.name || 'Campaign';

  const handleZip = async () => {
    setZipping(true);
    try {
      await downloadCampaignZip(gen);
      toast.success('Campaign downloaded');
    } catch {
      toast.error('ZIP download failed');
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 shrink-0">
            <ArrowLeft className="w-4 h-4" />
            Campaigns
          </Button>
          <div className="h-4 w-px bg-border/50" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{brandName}</p>
            <p className="text-[11px] text-muted-foreground">
              {format(new Date(gen.created_at), 'MMMM d, yyyy · h:mm a')}
              {gen.generation_time_ms ? ` · ${(gen.generation_time_ms / 1000).toFixed(1)}s` : ''}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 shrink-0"
          onClick={handleZip}
          disabled={!hasCopy || zipping}
          title={hasCopy ? 'Download entire campaign as ZIP' : 'Copy not available — ZIP requires copy data'}
        >
          {zipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
          Download All
        </Button>
      </div>

      {/* Package display */}
      {hasCopy ? (
        <CreativePackageDisplay
          parts={copyBlocks}
          imageUrls={gen.output_urls || []}
          latencyMs={gen.generation_time_ms || 0}
          brandName={brandName}
          model={gen.model_used}
          brief={gen.prompt_text || undefined}
          deliverableNames={deliverableNames}
        />
      ) : (
        /* Historical campaign — images only */
        <div className="space-y-6">
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300/80">
                Copy text is stored for campaigns generated from this point forward. Images are available below.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {(gen.output_urls || []).map((url, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 shrink-0">
                    {deliverableNames[i] || `Deliverable ${i + 1}`}
                  </span>
                  <div className="flex-1 h-px bg-purple-500/20" />
                </div>
                <div className="relative group/image rounded-lg overflow-hidden border border-border/30">
                  <img src={url} alt={deliverableNames[i] || `Deliverable ${i + 1}`} className="w-full h-auto block" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity">
                    <div className="absolute bottom-3 right-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 gap-1.5 text-xs"
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${slugify(brandName)}-${slugify(deliverableNames[i] || `deliverable-${i + 1}`)}.jpg`;
                          a.click();
                        }}
                      >
                        <Download className="w-3 h-3" />
                        Save
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
  );
}

// ── Main Tab ─────────────────────────────────────────────────────────────────

export function CampaignsTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<string>('all');

  const { data: allGenerations = [], isLoading } = useMyGenerations(200);

  const campaigns = allGenerations.filter(g => g.generation_type === 'creative_package');

  // Unique brands for filter dropdown
  const brands = Array.from(
    new Map(
      campaigns
        .filter(g => g.brand)
        .map(g => [g.brand!.id, g.brand!] as const)
    ).values()
  );

  const filtered = brandFilter === 'all'
    ? campaigns
    : campaigns.filter(g => g.brand?.id === brandFilter);

  const selectedCampaign = selectedId ? campaigns.find(g => g.id === selectedId) : null;

  if (selectedCampaign) {
    return (
      <div className="p-6">
        <CampaignDetail gen={selectedCampaign} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-purple-400">Campaigns</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {campaigns.length} creative package{campaigns.length !== 1 ? 's' : ''} — full copy and images
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

      {/* Content */}
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
          {filtered.map(gen => (
            <CampaignCard
              key={gen.id}
              gen={gen}
              onOpen={() => setSelectedId(gen.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
