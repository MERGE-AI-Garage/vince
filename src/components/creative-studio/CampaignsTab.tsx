// ABOUTME: Campaign archive tab — browsable list of all Vince creative packages.
// ABOUTME: Sort/filter controls, provenance detail view, conversation transcript, Gemini analysis.

import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { formatDistanceToNow, format } from 'date-fns';
import {
  ArrowLeft, Download, Layers, Archive, ArchiveX, Trash2, FileText, Loader2,
  FolderOpen, Clock, Cpu, Hash, Sparkles, Calendar, ShieldCheck,
  Image, LayoutGrid, List, Search, User, MessageSquare, BarChart2,
  SortAsc, SortDesc, Bot, Link as LinkIcon, Play, Copy,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAllGenerations, useArchiveGeneration, useDeleteGeneration } from '@/hooks/useCreativeStudioGenerations';
import { CreativePackageDisplay, PackagePart } from './CreativePackageDisplay';
import { loadConversationMessages } from '@/services/vinceConversationHistory';
import { supabase } from '@/integrations/supabase/client';
import type { GenerationWithDetails } from '@/types/creative-studio';
import type { Message } from '@/components/shared-chat/types';

// ── Helpers ─────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Extract a human name from copy text — tries multiple heading patterns */
function extractNameFromContent(text: string, fallback: string): string {
  // "## Deliverable 2: Full-Page Magazine Ad"
  const deliverableMatch = text.match(/##\s*Deliverable\s*\d+[:\-–]\s*([^\n]+)/i);
  if (deliverableMatch) return deliverableMatch[1].trim();
  // "## LinkedIn Post" or "# Instagram Feed"
  const headingMatch = text.match(/^#{1,3}\s+([A-Z][^\n]{2,50})\n/m);
  if (headingMatch) return headingMatch[1].trim();
  // "**LinkedIn Post**" bold title
  const boldMatch = text.match(/^\*\*([A-Z][^*]{2,50})\*\*/m);
  if (boldMatch) return boldMatch[1].trim();
  // "1. Hero Banner\n" numbered list
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

  if (pendingText !== undefined && names.length < storedNames.length) {
    names.push(storedNames[names.length] || 'Package Notes');
  }

  return names.length > 0 ? names : storedNames;
}

// ── Deliverable format specs ─────────────────────────────────────────────────

interface FormatSpec { ratio: string; dims: string; category: string; }

const SPEC_BY_KEY: Record<string, FormatSpec> = {
  linkedin_post:           { ratio: '4:3',  dims: '1200×900',  category: 'Social' },
  product_shot_with_text:  { ratio: '1:1',  dims: '1080×1080', category: 'Social' },
  social_story:            { ratio: '9:16', dims: '1080×1920', category: 'Social' },
  display_banner:          { ratio: '16:9', dims: '1920×1080', category: 'Display' },
  email_header:            { ratio: '3:4',  dims: '600×800',   category: 'Email' },
  tiktok_reel:             { ratio: '9:16', dims: '1080×1920', category: 'Social' },
  instagram_feed_portrait: { ratio: '4:5',  dims: '1080×1350', category: 'Social' },
  print_full_page:         { ratio: '3:4',  dims: '1200×1600', category: 'Print' },
  print_ooh_billboard:     { ratio: '16:9', dims: '1920×1080', category: 'OOH' },
  print_ooh_transit:       { ratio: '2:3',  dims: '800×1200',  category: 'OOH' },
  print_direct_mail:       { ratio: '4:3',  dims: '1200×900',  category: 'Print' },
  print_collateral:        { ratio: '3:4',  dims: '1200×1600', category: 'Print' },
  banner_leaderboard:      { ratio: '8:1',  dims: '728×90',    category: 'Display' },
  banner_skyscraper:       { ratio: '1:4',  dims: '160×600',   category: 'Display' },
};

const SPEC_BY_NAME: Array<[string, FormatSpec]> = [
  ['linkedin',      { ratio: '4:3',  dims: '1200×900',  category: 'Social' }],
  ['product shot',  { ratio: '1:1',  dims: '1080×1080', category: 'Social' }],
  ['story',         { ratio: '9:16', dims: '1080×1920', category: 'Social' }],
  ['tiktok',        { ratio: '9:16', dims: '1080×1920', category: 'Social' }],
  ['reels',         { ratio: '9:16', dims: '1080×1920', category: 'Social' }],
  ['instagram',     { ratio: '4:5',  dims: '1080×1350', category: 'Social' }],
  ['email',         { ratio: '3:4',  dims: '600×800',   category: 'Email' }],
  ['billboard',     { ratio: '16:9', dims: '1920×1080', category: 'OOH' }],
  ['transit',       { ratio: '2:3',  dims: '800×1200',  category: 'OOH' }],
  ['direct mail',   { ratio: '4:3',  dims: '1200×900',  category: 'Print' }],
  ['sell sheet',    { ratio: '3:4',  dims: '1200×1600', category: 'Print' }],
  ['collateral',    { ratio: '3:4',  dims: '1200×1600', category: 'Print' }],
  ['leaderboard',   { ratio: '8:1',  dims: '728×90',    category: 'Display' }],
  ['skyscraper',    { ratio: '1:4',  dims: '160×600',   category: 'Display' }],
  ['display',       { ratio: '16:9', dims: '1920×1080', category: 'Display' }],
  ['print',         { ratio: '3:4',  dims: '1200×1600', category: 'Print' }],
];

function lookupFormatSpec(name: string, key?: string | null): FormatSpec | null {
  if (key && SPEC_BY_KEY[key]) return SPEC_BY_KEY[key];
  const lower = name.toLowerCase();
  for (const [fragment, spec] of SPEC_BY_NAME) {
    if (lower.includes(fragment)) return spec;
  }
  return null;
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
  const userName = gen.user?.full_name || 'Unknown';

  const zip = new JSZip();
  const folderName = `${slugify(brandName)}-campaign-${dateStr}`;
  const folder = zip.folder(folderName)!;

  const briefLines = [
    '╔══════════════════════════════════════════╗',
    '  VINCE CREATIVE CAMPAIGN ARCHIVE',
    '╚══════════════════════════════════════════╝',
    '',
    'CAMPAIGN DETAILS',
    '────────────────',
    `Brand:               ${brandName}`,
    `Created By:          ${userName}`,
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

// ── User Avatar Badge ─────────────────────────────────────────────────────────

function UserBadge({ name, avatarUrl, size = 'sm' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'xs' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const dim = size === 'xs' ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]';
  return (
    <div className="flex items-center gap-1.5">
      <div className={`${dim} rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center font-bold text-violet-300 shrink-0 overflow-hidden`}>
        {avatarUrl
          ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          : initials
        }
      </div>
      <span className={`${size === 'xs' ? 'text-[10px]' : 'text-xs'} text-muted-foreground/60 truncate max-w-[120px]`}>{name}</span>
    </div>
  );
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
  const userName = gen.user?.full_name;

  return (
    <div className="space-y-4 text-sm">
      {/* Who created this */}
      <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Created By</span>
        </div>
        {userName
          ? <UserBadge name={userName} avatarUrl={gen.user?.avatar_url} />
          : <span className="text-xs text-muted-foreground/50">Unknown user</span>
        }
      </div>

      {/* Generation info */}
      <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Generation Info</span>
        </div>
        <div className="space-y-3">
          <MetadataRow label="Model" value={gen.model_used} mono />
          <MetadataRow label="Generated" value={format(new Date(gen.created_at), 'MMM d, yyyy · h:mm a')} />
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
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Brand</span>
          </div>
          <div className="space-y-3">
            <MetadataRow label="Name" value={gen.brand.name} />
            {gen.brand.brand_category && <MetadataRow label="Category" value={gen.brand.brand_category} />}
            {gen.brand.primary_color && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Primary Color</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-border/30 shrink-0" style={{ backgroundColor: gen.brand.primary_color }} />
                  <span className="text-xs font-mono text-foreground/85">{gen.brand.primary_color}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deliverables */}
      <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Deliverables</span>
        </div>
        <div className="space-y-1.5">
          {resolvedNames.map((name, i) => {
            const storedSpecs = gen.metadata?.deliverable_specs as Array<{ key: string; name: string; aspect_ratio: string }> | undefined;
            const spec = lookupFormatSpec(name, storedSpecs?.[i]?.key);
            return (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[9px] font-mono text-muted-foreground/40 w-4 shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs text-foreground/80">{name}</span>
                  {spec && (
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono text-muted-foreground/50">{spec.ratio}</span>
                      <span className="text-[9px] text-muted-foreground/30">·</span>
                      <span className="text-[9px] font-mono text-muted-foreground/50">{spec.dims}</span>
                      <span className="text-[9px] text-muted-foreground/30">·</span>
                      <span className="text-[9px] text-muted-foreground/50">{spec.category}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Brand alignment */}
      {brandAlignment && (
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Brand Alignment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${brandAlignment.score >= 75 ? 'bg-purple-400' : brandAlignment.score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${brandAlignment.score}%` }}
              />
            </div>
            <span className={`text-sm font-bold tabular-nums ${brandAlignment.score >= 75 ? 'text-purple-400' : brandAlignment.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {brandAlignment.score}%
            </span>
          </div>
        </div>
      )}

      {/* Record ID */}
      <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Hash className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Record</span>
        </div>
        <MetadataRow label="Package ID" value={gen.id} mono />
        {gen.completed_at && (
          <MetadataRow label="Completed" value={format(new Date(gen.completed_at), 'MMM d, yyyy · h:mm:ss a')} />
        )}
        {gen.metadata?.conversation_id && (
          <MetadataRow label="Conversation ID" value={gen.metadata.conversation_id as string} mono />
        )}
      </div>
    </div>
  );
}

// ── Conversation Transcript ───────────────────────────────────────────────────

function ConversationTranscript({ conversationId, isNearby, nearbyDate }: {
  conversationId: string;
  isNearby?: boolean;
  nearbyDate?: string;
}) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversationMessages(conversationId).then(msgs => {
      setMessages(msgs);
      setLoading(false);
    });
  }, [conversationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <MessageSquare className="w-8 h-8 text-muted-foreground/20" />
        <p className="text-sm text-muted-foreground/50">Conversation was not recorded for this session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isNearby && nearbyDate && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20 border border-border/30 mb-1">
          <LinkIcon className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          <p className="text-[11px] text-muted-foreground/60">
            Nearest session — {format(new Date(nearbyDate), 'MMM d, h:mm a')}. Campaign was generated via voice mode and not directly linked.
          </p>
        </div>
      )}
      {messages.map(msg => (
        <div
          key={msg.id}
          className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5 ${
            msg.role === 'user'
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
              : 'bg-muted/30 text-muted-foreground border border-border/40'
          }`}>
            {msg.role === 'user' ? 'U' : <Bot className="w-3 h-3" />}
          </div>
          <div className={`flex-1 max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
            msg.role === 'user'
              ? 'bg-violet-500/10 text-foreground/90 border border-violet-500/20'
              : 'bg-muted/20 text-foreground/80 border border-border/30'
          }`}>
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Gemini Analysis Panel ─────────────────────────────────────────────────────

function AnalysisPanel({ gen, resolvedNames }: { gen: GenerationWithDetails; resolvedNames: string[] }) {
  const [brandAnalysis, setBrandAnalysis] = useState<string | null>(null);
  const [brandAnalysisLoading, setBrandAnalysisLoading] = useState(false);
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [competitorAnalysis, setCompetitorAnalysis] = useState<string | null>(null);
  const [competitorLoading, setCompetitorLoading] = useState(false);

  const runBrandAnalysis = async () => {
    if (!gen.brand_id) {
      toast.error('No brand associated with this campaign');
      return;
    }
    setBrandAnalysisLoading(true);
    try {
      const imageList = (gen.output_urls || [])
        .map((url, i) => `  ${i + 1}. ${resolvedNames[i] || `Deliverable ${i + 1}`}: ${url}`)
        .join('\n');
      const { data, error } = await supabase.functions.invoke('brand-prompt-agent', {
        body: {
          brand_id: gen.brand_id,
          user_message: `Please analyze these campaign deliverables for brand standards compliance. For each image, evaluate: brand color usage, visual consistency, messaging alignment, typography, and overall brand fit. Also flag any instance where text, overlays, or graphic elements cover or obscure a human face — this is always a brand violation.\n\nFor typography: flag headlines set entirely in all-caps or in title case (every word capitalized). Correct usage is sentence case — only the first word and proper nouns (brand names, acronyms like AI, API, URL) are capitalized. "AI enablement for your business" is correct. "AI ENABLEMENT" and "AI Enablement For Your Business" are violations.\n\nProvide a score out of 100 and specific actionable feedback for each deliverable.\n\nDeliverables:\n${imageList}\n\nBrief: ${gen.prompt_text || '(no brief)'}`,
        },
      });
      if (error) throw error;
      setBrandAnalysis(data?.message || data?.reasoning || 'Analysis complete. No detailed response returned.');
    } catch (err) {
      toast.error('Analysis failed — check console');
      console.error('[CampaignsTab] Brand analysis error:', err);
    } finally {
      setBrandAnalysisLoading(false);
    }
  };

  const runCompetitorAnalysis = async () => {
    if (!competitorUrl.trim()) {
      toast.error('Enter a competitor URL to analyze');
      return;
    }
    if (!gen.brand_id) {
      toast.error('No brand associated with this campaign');
      return;
    }
    setCompetitorLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('brand-prompt-agent', {
        body: {
          brand_id: gen.brand_id,
          user_message: `Analyze this competitor content and compare it against our brand's campaign. Competitor URL: ${competitorUrl.trim()}\n\nOur campaign brief: ${gen.prompt_text || '(none)'}\n\nProvide: competitor strengths/weaknesses, what our campaign does better, what we could improve, and 2-3 strategic opportunities.`,
        },
      });
      if (error) throw error;
      setCompetitorAnalysis(data?.message || data?.reasoning || 'Analysis complete.');
    } catch (err) {
      toast.error('Competitor analysis failed — check console');
      console.error('[CampaignsTab] Competitor analysis error:', err);
    } finally {
      setCompetitorLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Brand Standards Analysis */}
      <div className="rounded-xl border border-border/40 bg-muted/5 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Brand Standards Analysis</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Run Gemini to evaluate each deliverable against your brand guidelines</p>
          </div>
        </div>
        {brandAnalysis ? (
          <div className="space-y-3">
            <div className="bg-muted/10 rounded-lg border border-border/30 p-4 max-h-[400px] overflow-y-auto prose prose-sm prose-invert max-w-none [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:text-sm [&_li]:text-foreground/80 [&_p]:text-sm [&_p]:text-foreground/85 [&_strong]:text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{brandAnalysis}</ReactMarkdown>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setBrandAnalysis(null)} className="text-xs h-7">
                Re-run Analysis
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={() => { navigator.clipboard.writeText(brandAnalysis); toast.success('Copied to clipboard'); }}
              >
                <Copy className="w-3 h-3" /> Copy
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={runBrandAnalysis}
            disabled={brandAnalysisLoading || !gen.brand_id}
            className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            size="sm"
          >
            {brandAnalysisLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
            {brandAnalysisLoading ? 'Analyzing…' : 'Analyze Brand Fit'}
          </Button>
        )}
      </div>

      {/* Competitor Comparison */}
      <div className="rounded-xl border border-border/40 bg-muted/5 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Competitor Comparison</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Paste a competitor ad URL or YouTube video to run a head-to-head analysis</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
            <Input
              placeholder="https://youtube.com/watch?v=... or ad URL"
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              className="pl-9 h-9 text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter') runCompetitorAnalysis(); }}
            />
          </div>
          <Button
            onClick={runCompetitorAnalysis}
            disabled={competitorLoading || !competitorUrl.trim() || !gen.brand_id}
            size="sm"
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {competitorLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {competitorLoading ? 'Analyzing…' : 'Compare'}
          </Button>
        </div>
        {competitorAnalysis && (
          <div className="space-y-3">
            <div className="bg-muted/10 rounded-lg border border-border/30 p-4 max-h-[400px] overflow-y-auto prose prose-sm prose-invert max-w-none [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:text-sm [&_li]:text-foreground/80 [&_p]:text-sm [&_p]:text-foreground/85 [&_strong]:text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{competitorAnalysis}</ReactMarkdown>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setCompetitorAnalysis(null); setCompetitorUrl(''); }} className="text-xs h-7">
                New Comparison
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={() => { navigator.clipboard.writeText(competitorAnalysis); toast.success('Copied to clipboard'); }}
              >
                <Copy className="w-3 h-3" /> Copy
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Campaign Grid Card ────────────────────────────────────────────────────────

function CampaignGridCard({ gen, resolvedNames, onOpen, onArchive, onDelete }: {
  gen: GenerationWithDetails;
  resolvedNames: string[];
  onOpen: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}) {
  const [zipping, setZipping] = useState(false);
  const images = gen.output_urls || [];
  const mosaicImages = images.slice(0, 4);
  const extraCount = images.length - 4;
  const brandName = gen.brand?.name || 'Unknown Brand';
  const brief = gen.prompt_text || '';
  const accentColor = gen.brand?.primary_color || '#7c3aed';
  const MAX_CHIPS = 4;
  const userName = gen.user?.full_name;

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

  const renderMosaic = () => {
    const count = mosaicImages.length;
    if (count === 0) return <div className="w-full h-full flex items-center justify-center bg-muted/20"><Layers className="w-10 h-10 text-muted-foreground/20" /></div>;
    if (count === 1) return <img src={mosaicImages[0]} alt="" className="object-cover w-full h-full" loading="lazy" />;
    if (count === 2) return <div className="grid grid-cols-2 w-full h-full">{mosaicImages.map((url, i) => <img key={i} src={url} alt="" className="object-cover w-full h-full" loading="lazy" />)}</div>;
    if (count === 3) return (
      <div className="grid w-full h-full" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <img src={mosaicImages[0]} alt="" className="object-cover w-full h-full" loading="lazy" />
        <div className="grid grid-rows-2 h-full">
          <img src={mosaicImages[1]} alt="" className="object-cover w-full h-full" loading="lazy" />
          <img src={mosaicImages[2]} alt="" className="object-cover w-full h-full" loading="lazy" />
        </div>
      </div>
    );
    return (
      <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
        {mosaicImages.map((url, i) => (
          <div key={i} className="relative overflow-hidden">
            <img src={url} alt="" className="object-cover w-full h-full" loading="lazy" />
            {i === 3 && extraCount > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">+{extraCount} more</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className="group bg-card border border-border/40 rounded-2xl overflow-hidden hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-200 cursor-pointer flex flex-col"
      onClick={onOpen}
    >
      <div className="aspect-video relative overflow-hidden">
        {renderMosaic()}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <Button size="sm" className="gap-1.5 bg-white text-gray-900 hover:bg-white/90 font-semibold shadow-lg" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
            <FolderOpen className="w-4 h-4" />Open Campaign
          </Button>
        </div>
      </div>

      <div className="h-[3px] shrink-0" style={{ backgroundColor: accentColor }} />

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm text-foreground truncate">{brandName}</span>
          <span className="text-xs text-muted-foreground shrink-0">{formatDistanceToNow(new Date(gen.created_at), { addSuffix: true })}</span>
        </div>

        {brief && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{brief}</p>}

        {resolvedNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {resolvedNames.slice(0, MAX_CHIPS).map((name, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{name}</span>
            ))}
            {resolvedNames.length > MAX_CHIPS && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground/60 border border-border/30">+{resolvedNames.length - MAX_CHIPS} more</span>
            )}
          </div>
        )}

        <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground/50">
          <span className="flex items-center gap-1"><Image className="w-2.5 h-2.5" />{images.length} image{images.length !== 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1"><Cpu className="w-2.5 h-2.5" />{gen.model_used}</span>
          {gen.generation_time_ms && <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{(gen.generation_time_ms / 1000).toFixed(1)}s</span>}
        </div>

        {/* User badge + actions */}
        <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between gap-2">
          {userName ? <UserBadge name={userName} avatarUrl={gen.user?.avatar_url} size="xs" /> : <div />}
          <div className="flex gap-1.5">
            <Button size="sm" className="gap-1.5 h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white px-2.5" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
              <FolderOpen className="w-3 h-3" />Open
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleZip} disabled={zipping} title="Download ZIP">
              {zipping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            </Button>
            {onArchive && (
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground/50 hover:text-amber-400" onClick={(e) => { e.stopPropagation(); onArchive(); }} title="Archive campaign">
                <ArchiveX className="w-3 h-3" />
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground/50 hover:text-red-400" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete permanently">
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Campaign List Row ─────────────────────────────────────────────────────────

function CampaignListRow({ gen, resolvedNames, onOpen, onArchive, onDelete }: {
  gen: GenerationWithDetails;
  resolvedNames: string[];
  onOpen: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}) {
  const [zipping, setZipping] = useState(false);
  const images = gen.output_urls || [];
  const stripImages = images.slice(0, 4);
  const brandName = gen.brand?.name || 'Unknown Brand';
  const brief = gen.prompt_text || '';
  const accentColor = gen.brand?.primary_color || '#7c3aed';
  const MAX_CHIPS = 5;
  const userName = gen.user?.full_name;

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
    <div className="group bg-card border border-border/40 rounded-xl p-4 hover:border-violet-500/40 hover:bg-card/50 transition-all cursor-pointer" onClick={onOpen}>
      <div className="flex items-center gap-3">
        <div className="w-1 rounded-full self-stretch shrink-0" style={{ backgroundColor: accentColor }} />
        {stripImages.length > 0 && (
          <div className="flex gap-1.5 shrink-0 w-[200px]">
            {stripImages.map((url, i) => (
              <div key={i} className="flex-1 h-14 rounded-md overflow-hidden border border-border/20 bg-muted/10">
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-sm font-semibold text-foreground">{brandName}</p>
          {brief && <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">{brief}</p>}
          {resolvedNames.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {resolvedNames.slice(0, MAX_CHIPS).map((name, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{name}</span>
              ))}
              {resolvedNames.length > MAX_CHIPS && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground/60 border border-border/30">+{resolvedNames.length - MAX_CHIPS} more</span>
              )}
            </div>
          )}
          {userName && <UserBadge name={userName} avatarUrl={gen.user?.avatar_url} size="xs" />}
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <div className="text-right space-y-1 hidden sm:block">
            <p className="text-xs text-muted-foreground/60">{formatDistanceToNow(new Date(gen.created_at), { addSuffix: true })}</p>
            <p className="text-[10px] text-muted-foreground/40 flex items-center justify-end gap-1"><Image className="w-2.5 h-2.5" />{images.length} image{images.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" className="h-8 gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
              <FolderOpen className="w-3.5 h-3.5" />Open
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleZip} disabled={zipping} title="Download ZIP">
              {zipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            </Button>
            {onArchive && (
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-amber-400" onClick={(e) => { e.stopPropagation(); onArchive(); }} title="Archive campaign">
                <ArchiveX className="w-3.5 h-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-red-400" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete permanently">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Campaign Detail ───────────────────────────────────────────────────────────

interface ImageInfoState {
  index: number;
  name: string;
  imageUrl: string;
}

interface MediaRecord {
  auto_tags: string[] | null;
  synthid_detected: boolean | null;
  synthid_confidence: number | null;
  synthid_generated_by: string | null;
  width: number | null;
  height: number | null;
}

function CampaignDetail({ gen, onBack }: { gen: GenerationWithDetails; onBack: () => void }) {
  const [zipping, setZipping] = useState(false);
  const [imageInfo, setImageInfo] = useState<ImageInfoState | null>(null);
  const [mediaRecord, setMediaRecord] = useState<MediaRecord | null>(null);
  const [nearbyConversation, setNearbyConversation] = useState<{ id: string; created_at: string } | null>(null);
  const storedNames = (gen.metadata?.deliverable_names as string[] | undefined) || [];
  const copyBlocks = (gen.copy_blocks as PackagePart[] | undefined) || [];
  const hasCopy = copyBlocks.some(p => p.type === 'text');
  const resolvedNames = hasCopy ? resolveDeliverableNames(copyBlocks, storedNames) : storedNames;
  const brandName = gen.brand?.name || 'Campaign';
  const brief = gen.prompt_text || '';
  const conversationId = gen.metadata?.conversation_id as string | undefined;
  const userName = gen.user?.full_name;

  // When no conversation is directly linked, look for the nearest Vince session within 2 hours
  useEffect(() => {
    if (conversationId) return;
    const created = new Date(gen.created_at);
    const windowStart = new Date(created.getTime() - 30 * 60 * 1000).toISOString();
    const windowEnd = new Date(created.getTime() + 2 * 60 * 60 * 1000).toISOString();
    supabase
      .from('chatbot_conversations')
      .select('id, created_at, messages')
      .eq('metadata->>assistant', 'vince')
      .gte('updated_at', windowStart)
      .lte('updated_at', windowEnd)
      .order('updated_at', { ascending: true })
      .limit(10)
      .then(({ data }) => {
        if (!data) return;
        // Pick the first one that has at least 1 message
        const match = data.find(c => Array.isArray(c.messages) && c.messages.length > 0);
        if (match) setNearbyConversation({ id: match.id, created_at: match.created_at });
      });
  }, [gen.created_at, conversationId]);

  useEffect(() => {
    if (!imageInfo) { setMediaRecord(null); return; }
    supabase
      .from('media')
      .select('auto_tags, synthid_detected, synthid_confidence, synthid_generated_by, width, height')
      .eq('url', imageInfo.imageUrl)
      .maybeSingle()
      .then(({ data }) => setMediaRecord(data ?? null));
  }, [imageInfo]);

  const getCopyForIndex = (idx: number): string | undefined => {
    let imageCount = 0;
    let pendingText: string | undefined;
    for (const part of copyBlocks) {
      if (part.type === 'text' && part.content) pendingText = part.content;
      else if (part.type === 'image') {
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

  const brandColor = gen.brand?.primary_color || '#1ED75F';
  const brandLogoUrl = gen.brand?.logo_url;

  return (
    <>
    <div className="space-y-6" style={{ ['--foreground' as string]: '140 10% 92%', ['--muted-foreground' as string]: '150 10% 65%', ['--muted' as string]: '165 14% 14%', ['--border' as string]: '165 16% 20%' } as React.CSSProperties}>
      {/* Campaign header */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(15,34,25,0.85)', border: '1px solid rgba(0,133,108,0.25)' }}>
        {/* Brand color accent stripe */}
        <div className="h-1 w-full" style={{ backgroundColor: brandColor }} />
        <div className="p-5">
          {/* Back nav */}
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/40 hover:text-foreground/70 transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            All Campaigns
          </button>

          {/* Hero row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              {/* Brand identity mark */}
              <div
                className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border border-white/10"
                style={{ backgroundColor: brandLogoUrl ? '#fff' : `${brandColor}18` }}
              >
                {brandLogoUrl ? (
                  <img src={brandLogoUrl} alt={brandName} className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: brandColor }} />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70 mb-0.5">
                  {brandName}
                </p>
                <h2 className="font-fraunces text-xl font-semibold text-foreground leading-tight">
                  Creative Campaign
                </h2>

                {/* Metadata row */}
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  <span className="font-epilogue text-xs text-foreground/45 tabular-nums">
                    {format(new Date(gen.created_at), 'MMMM d, yyyy')}
                  </span>
                  {userName && (
                    <>
                      <span className="text-foreground/20 text-xs">·</span>
                      <span className="font-epilogue text-xs text-foreground/45 flex items-center gap-1">
                        <User className="w-3 h-3" />{userName}
                      </span>
                    </>
                  )}
                  <span className="text-foreground/20 text-xs">·</span>
                  <span className="font-epilogue text-xs text-foreground/60 font-semibold">
                    {resolvedNames.length}
                  </span>
                  <span className="font-epilogue text-xs text-foreground/45">
                    {resolvedNames.length !== 1 ? 'deliverables' : 'deliverable'}
                  </span>
                  {gen.generation_time_ms && (
                    <>
                      <span className="text-foreground/20 text-xs">·</span>
                      <span className="font-epilogue text-xs text-foreground/45 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{(gen.generation_time_ms / 1000).toFixed(1)}s
                      </span>
                    </>
                  )}
                </div>

                {brief && (
                  <p className="font-epilogue text-xs text-muted-foreground mt-2.5 leading-relaxed max-w-2xl line-clamp-2">
                    {brief}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <Button
              size="sm"
              className="gap-1.5 shrink-0 rounded-full px-4 text-xs text-white"
              style={{ backgroundColor: brandColor }}
              onClick={handleZip}
              disabled={zipping}
            >
              {zipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
              Download ZIP
            </Button>
          </div>
        </div>
      </div>

      {/* Body: main content + metadata sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Left: tabbed content */}
        <div className="min-w-0">
          <Tabs defaultValue="campaign">
            <TabsList className="mb-4">
              <TabsTrigger value="campaign" className="gap-1.5 text-xs">
                <Layers className="w-3.5 h-3.5" />Campaign
              </TabsTrigger>
              <TabsTrigger value="conversation" className="gap-1.5 text-xs">
                <MessageSquare className="w-3.5 h-3.5" />Conversation
                {!conversationId && !nearbyConversation && <span className="ml-1 text-[9px] text-muted-foreground/40">(no link)</span>}
              </TabsTrigger>
              <TabsTrigger value="analysis" className="gap-1.5 text-xs">
                <BarChart2 className="w-3.5 h-3.5" />Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="campaign">
              {hasCopy ? (
                <div style={{ padding: '12px', background: 'rgba(15,34,25,0.9)', border: '1px solid rgba(0,133,108,0.3)', borderRadius: '8px', ['--foreground' as string]: '140 10% 92%', ['--muted-foreground' as string]: '150 10% 65%', ['--muted' as string]: '165 14% 14%', ['--border' as string]: '165 16% 20%' } as React.CSSProperties}>
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
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                      <p className="text-sm text-amber-300/80">Copy is stored for campaigns generated after March 14, 2026. Images are available below.</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    {(gen.output_urls || []).map((url, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 shrink-0">{storedNames[i] || `Deliverable ${i + 1}`}</span>
                          <div className="flex-1 h-px bg-purple-500/20" />
                        </div>
                        <div className="relative group/img rounded-lg overflow-hidden border border-border/30">
                          <img src={url} alt={storedNames[i]} className="w-full h-auto block" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity">
                            <div className="absolute bottom-3 right-3">
                              <Button size="sm" variant="secondary" className="h-7 gap-1.5 text-xs"
                                onClick={() => { const a = document.createElement('a'); a.href = url; a.download = `${slugify(brandName)}-${slugify(storedNames[i] || `deliverable-${i+1}`)}.jpg`; a.click(); }}>
                                <Download className="w-3 h-3" />Save
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="conversation">
              {conversationId ? (
                <ConversationTranscript conversationId={conversationId} />
              ) : nearbyConversation ? (
                <ConversationTranscript
                  conversationId={nearbyConversation.id}
                  isNearby
                  nearbyDate={nearbyConversation.created_at}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/20" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground/60">No conversation found</p>
                    <p className="text-xs text-muted-foreground/40 max-w-xs">
                      This campaign was generated via voice mode before transcript recording was enabled.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analysis">
              <AnalysisPanel gen={gen} resolvedNames={resolvedNames} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Metadata panel */}
        <div className="lg:sticky lg:top-6 rounded-xl overflow-hidden" style={{ background: 'rgba(15,34,25,0.85)', border: '1px solid rgba(0,133,108,0.25)' }}>
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(0,133,108,0.2)', background: 'rgba(15,34,25,0.4)' }}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">Campaign Info</span>
          </div>
          <div className="p-4">
            <CampaignMetadataPanel gen={gen} resolvedNames={resolvedNames} />
          </div>
        </div>
      </div>
    </div>

    {/* Per-image info dialog */}
    <Dialog open={!!imageInfo} onOpenChange={(open) => { if (!open) setImageInfo(null); }}>
      <DialogContent className="max-w-lg brand-guidelines-panel">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {imageInfo ? resolvedNames[imageInfo.index] || `Deliverable ${imageInfo.index + 1}` : ''}
          </DialogTitle>
        </DialogHeader>
        {imageInfo && (() => {
          const copyText = getCopyForIndex(imageInfo.index);
          return (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-border/30 bg-muted/10">
                <img src={imageInfo.imageUrl} alt={imageInfo.name} className="w-full h-auto block max-h-64 object-contain" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5"><p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Deliverable</p><p className="text-xs text-foreground/85">{resolvedNames[imageInfo.index] || `Deliverable ${imageInfo.index + 1}`}</p></div>
                <div className="space-y-0.5"><p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Index</p><p className="text-xs font-mono text-foreground/85">{String(imageInfo.index + 1).padStart(2, '0')} of {resolvedNames.length}</p></div>
                <div className="space-y-0.5"><p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Model</p><p className="text-xs font-mono text-foreground/85">{gen.model_used}</p></div>
                <div className="space-y-0.5"><p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Generated</p><p className="text-xs text-foreground/85">{format(new Date(gen.created_at), 'MMM d, yyyy · h:mm a')}</p></div>
                {gen.generation_time_ms && <div className="space-y-0.5"><p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Generation Time</p><p className="text-xs text-foreground/85">{(gen.generation_time_ms / 1000).toFixed(2)}s</p></div>}
                {gen.brand && <div className="space-y-0.5"><p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Brand</p><p className="text-xs text-foreground/85">{gen.brand.name}</p></div>}
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Image URL</p>
                <p className="text-[10px] font-mono text-muted-foreground/60 break-all leading-relaxed bg-muted/20 rounded p-2">{imageInfo.imageUrl}</p>
              </div>
              {/* Media library metadata */}
              {mediaRecord && (mediaRecord.synthid_detected || (mediaRecord.auto_tags && mediaRecord.auto_tags.length > 0) || (mediaRecord.width && mediaRecord.height)) && (
                <div className="space-y-2 border-t border-border/20 pt-3">
                  {mediaRecord.synthid_detected && (
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">AI Watermark</span>
                      {mediaRecord.synthid_confidence != null && (
                        <span className="text-[10px] text-muted-foreground/60 font-mono ml-auto">{Math.round(mediaRecord.synthid_confidence * 100)}% confidence</span>
                      )}
                    </div>
                  )}
                  {mediaRecord.width && mediaRecord.height && (
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Dimensions</p>
                      <p className="text-xs font-mono text-foreground/85">{mediaRecord.width} × {mediaRecord.height}</p>
                    </div>
                  )}
                  {mediaRecord.auto_tags && mediaRecord.auto_tags.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {mediaRecord.auto_tags.map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/20 text-muted-foreground/60">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {copyText && (
                <div className="space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Copy</p>
                  <div className="bg-muted/10 rounded-md p-3 border border-border/20">
                    <p className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap">{copyText.replace(/\*{1,3}/g, '')}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                  onClick={() => { const a = document.createElement('a'); a.href = imageInfo.imageUrl; a.download = `${slugify(brandName)}-${slugify(resolvedNames[imageInfo.index] || `deliverable-${imageInfo.index + 1}`)}.jpg`; a.click(); }}>
                  <Download className="w-3 h-3" />Download Image
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

type SortDir = 'desc' | 'asc';

export function CampaignsTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [view, setView] = useState<'active' | 'archived'>('active');
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const archiveGeneration = useArchiveGeneration();
  const deleteGeneration = useDeleteGeneration();

  const { data: campaigns = [], isLoading } = useAllGenerations({ type: 'creative_package', limit: 500, archived: view === 'archived' });
  const { data: archivedCampaigns = [] } = useAllGenerations({ type: 'creative_package', limit: 500, archived: true });
  const archivedCount = archivedCampaigns.length;

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archiveGeneration.mutateAsync(archiveTarget);
      setArchiveTarget(null);
      toast.success('Campaign archived');
    } catch {
      toast.error('Failed to archive campaign');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGeneration.mutateAsync(deleteTarget);
      setDeleteTarget(null);
      toast.success('Campaign deleted');
    } catch {
      toast.error('Failed to delete campaign');
    }
  };

  const brands = Array.from(
    new Map(campaigns.filter(g => g.brand).map(g => [g.brand!.id, g.brand!] as const)).values()
  );

  const filtered = campaigns
    .filter(g => {
      if (brandFilter !== 'all' && g.brand?.id !== brandFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesBrief = (g.prompt_text || '').toLowerCase().includes(term);
        const matchesBrand = (g.brand?.name || '').toLowerCase().includes(term);
        const matchesDeliverables = ((g.metadata?.deliverable_names as string[] | undefined) || []).some(n => n.toLowerCase().includes(term));
        if (!matchesBrief && !matchesBrand && !matchesDeliverables) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === 'desc' ? -diff : diff;
    });

  const selectedCampaign = selectedId ? campaigns.find(g => g.id === selectedId) : null;

  if (selectedCampaign) {
    return (
      <div className="p-6">
        <CampaignDetail gen={selectedCampaign} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  // Date range summary
  const oldestDate = campaigns.length > 0
    ? format(new Date(campaigns[campaigns.length - 1].created_at), 'MMM d, yyyy')
    : null;
  const newestDate = campaigns.length > 0
    ? format(new Date(campaigns[0].created_at), 'MMM d, yyyy')
    : null;

  return (
    <div className="p-6 space-y-5">
      {/* Hero header */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-indigo-500/5 border border-violet-500/10 p-6 mb-2">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <Archive className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold">Campaign Archive</h1>
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
              Every creative package Vince has built — with full copy, images, briefs, and conversation provenance. Open any campaign to review deliverables, see who created it, read the chat that led to it, or run a brand standards analysis.
            </p>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span className="font-semibold text-foreground/80">{campaigns.length}</span> campaigns
              </span>
              {brands.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <Layers className="w-3 h-3 text-blue-400" />
                  <span className="font-semibold text-foreground/80">{brands.length}</span> brand{brands.length !== 1 ? 's' : ''}
                </span>
              )}
              {oldestDate && newestDate && oldestDate !== newestDate && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <Calendar className="w-3 h-3 text-muted-foreground/40" />
                  {oldestDate} – {newestDate}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
          <Input
            placeholder="Search by brand, brief, or deliverable…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {brands.length > 1 && (
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-44 h-9 text-xs">
              <SelectValue placeholder="All brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {/* Sort */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 text-xs"
          onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
          title={sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
        >
          {sortDir === 'desc' ? <SortDesc className="w-3.5 h-3.5" /> : <SortAsc className="w-3.5 h-3.5" />}
          {sortDir === 'desc' ? 'Newest' : 'Oldest'}
        </Button>

        {/* Archive toggle */}
        <Button
          variant={view === 'archived' ? 'secondary' : 'outline'}
          size="sm"
          className="h-9 gap-1.5 text-xs"
          onClick={() => setView(v => v === 'active' ? 'archived' : 'active')}
        >
          <Archive className="w-3.5 h-3.5" />
          Archived
          {archivedCount > 0 && (
            <span className="ml-0.5 bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
              {archivedCount}
            </span>
          )}
        </Button>

        {/* View toggle */}
        <div className="flex items-center border border-border/40 rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('card')} className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-violet-500/15 text-violet-400' : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted/30'}`} title="Grid view">
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-violet-500/15 text-violet-400' : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted/30'}`} title="List view">
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Separator />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/50" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-violet-400/30" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground/60">
              {view === 'archived' ? 'No archived campaigns' : (searchTerm || brandFilter !== 'all' ? 'No campaigns match your filters' : 'No campaigns yet')}
            </p>
            <p className="text-xs text-muted-foreground/40 max-w-xs">
              {view === 'archived' ? 'Campaigns you archive will appear here.' : (searchTerm || brandFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Ask Vince to create a campaign and it will appear here with full copy and images.')}
            </p>
          </div>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(gen => {
            const copyBlocks = (gen.copy_blocks as PackagePart[] | undefined) || [];
            const storedNames = (gen.metadata?.deliverable_names as string[] | undefined) || [];
            const resolvedNames = copyBlocks.some(p => p.type === 'text') ? resolveDeliverableNames(copyBlocks, storedNames) : storedNames;
            return (
              <CampaignGridCard
                key={gen.id}
                gen={gen}
                resolvedNames={resolvedNames}
                onOpen={() => setSelectedId(gen.id)}
                onArchive={view === 'active' ? () => setArchiveTarget(gen.id) : undefined}
                onDelete={view === 'archived' ? () => setDeleteTarget(gen.id) : undefined}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(gen => {
            const copyBlocks = (gen.copy_blocks as PackagePart[] | undefined) || [];
            const storedNames = (gen.metadata?.deliverable_names as string[] | undefined) || [];
            const resolvedNames = copyBlocks.some(p => p.type === 'text') ? resolveDeliverableNames(copyBlocks, storedNames) : storedNames;
            return (
              <CampaignListRow
                key={gen.id}
                gen={gen}
                resolvedNames={resolvedNames}
                onOpen={() => setSelectedId(gen.id)}
                onArchive={view === 'active' ? () => setArchiveTarget(gen.id) : undefined}
                onDelete={view === 'archived' ? () => setDeleteTarget(gen.id) : undefined}
              />
            );
          })}
        </div>
      )}

      {/* Archive confirmation */}
      <Dialog open={!!archiveTarget} onOpenChange={(open) => { if (!open) setArchiveTarget(null); }}>
        <DialogContent className="max-w-sm brand-guidelines-panel">
          <DialogHeader>
            <DialogTitle>Archive campaign?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This campaign will be moved to the archive. You can access it anytime from the Archived view.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setArchiveTarget(null)}>Cancel</Button>
            <Button size="sm" onClick={handleArchive} disabled={archiveGeneration.isPending}>
              {archiveGeneration.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
              Archive
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm brand-guidelines-panel">
          <DialogHeader>
            <DialogTitle>Delete campaign permanently?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete the campaign record. This action cannot be undone.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteGeneration.isPending}>
              {deleteGeneration.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
