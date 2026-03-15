// ABOUTME: Brand intelligence overview tab for Creative Studio admin dashboard
// ABOUTME: Shows per-brand visual DNA status, directives, prompt counts, and confidence scores

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  AudioLines,
  Brain,
  Shield,
  BookMarked,
  Camera,
  Palette,
  Eye,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  Save,
  X,
  Globe,
  MessageSquare,
  Type,
  Sparkles,
  Dna,
  FileText,
  Wand2,
  ToggleLeft,
  ToggleRight,
  History,
  BookOpen,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { LayoutGrid, List, Star, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAllCreativeStudioBrands } from '@/hooks/useCreativeStudioBrands';
import {
  useBrandProfile,
  useBrandDirectives,
  useBrandStats,
  useBrandAnalyses,
  useUpdateBrandProfileSection,
  useDeleteBrandAnalysis,
  useDeleteBrandProfile,
  type ProfileSection,
} from '@/hooks/useCreativeStudioBrandIntelligence';
import { PromptTemplateAdmin } from './PromptTemplateAdmin';
import { useDeleteAgentDirective, useGenerateBrandGuardrails } from '@/hooks/useCreativeStudioDirectives';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DIRECTIVE_FOCUS_AREAS } from '@/types/creative-studio';
import { AgentDirectiveEditor } from './AgentDirectiveEditor';
import { BrandImageAnalyzer } from './BrandImageAnalyzer';
import { BrandDocumentImport } from './BrandDocumentImport';
import { BrandDNABuilder } from './BrandDNABuilder';
import { BrandIntelligenceDialog } from './BrandIntelligenceDialog';
import { BrandReferenceCollections } from './BrandReferenceCollections';
import { BrandSynthesizeDialog } from './BrandSynthesizeDialog';
import type { BrandDialogView } from './BrandDialogNav';
import type { BrandGenerationPromptSectionToggles } from '@/types/creative-studio';
import {
  ColorProfileDisplay,
  ColorProfileEditor,
  TypographyDisplay,
  BrandIdentityDisplay,
  ToneOfVoiceDisplay,
  VisualDNADisplay,
  BrandStoryDisplay,
  PhotographyStyleDisplay,
  CompositionRulesDisplay,
} from './BrandProfileVisuals';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useBrandToolApprovals, type BrandToolApproval } from '@/hooks/useBrandToolApprovals';
import { useProducts } from '@/hooks/useProducts';
import type { AgentDirective } from '@/types/creative-studio';
import { GENERATION_PROMPT_SECTIONS } from '@/types/creative-studio';
import {
  useBrandGenerationPrompt,
  useSynthesizeGenerationPrompt,
  useTogglePromptSection,
  useUpdateGenerationPrompt,
  parsePromptSections,
} from '@/hooks/useBrandGenerationPrompt';

const SECTION_ICONS: Record<keyof BrandGenerationPromptSectionToggles, React.ComponentType<{ className?: string }>> = {
  brand_identity: Dna,
  tone_of_voice: AudioLines,
  visual_style: Eye,
  color_palette: Palette,
  typography: Type,
  photography_direction: Camera,
  composition_rules: Layers,
  brand_guardrails: Shield,
  brand_story: BookMarked,
};

interface BrandIntelligenceTabProps {
  brandId?: string | null;
}

export function BrandIntelligenceTab({ brandId }: BrandIntelligenceTabProps) {
  const { data: brands, isLoading: brandsLoading } = useAllCreativeStudioBrands();

  const activeBrands = brands?.filter(b => b.is_active) || [];

  const effectiveBrandId = brandId || activeBrands[0]?.id || null;
  const selectedBrand = activeBrands.find(b => b.id === effectiveBrandId) || null;
  const [logoError, setLogoError] = useState(false);

  // Reset logo error when brand or logo URL changes
  useEffect(() => {
    setLogoError(false);
  }, [effectiveBrandId, selectedBrand?.logo_url]);

  // Showcase dialog state (lifted from child so buttons live in the brand identity card)
  const { data: profile } = useBrandProfile(effectiveBrandId ?? undefined);
  const [brandDialogView, setBrandDialogView] = useState<BrandDialogView | null>(null);

  if (brandsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Build radial gradient from brand palette for the animated border
  // Priority: admin-curated border colors > first 5 palette colors > primary/secondary
  const borderColors = selectedBrand?.animated_border_colors?.length
    ? selectedBrand.animated_border_colors
    : selectedBrand?.color_palette?.length
      ? selectedBrand.color_palette.slice(0, 5)
      : [selectedBrand?.primary_color || '#6366f1', selectedBrand?.secondary_color || '#8b5cf6'];
  const showBorder = selectedBrand?.show_animated_border !== false;

  if (activeBrands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Palette className="h-12 w-12 mb-4 opacity-50" />
        <p>No active brands configured</p>
        <p className="text-sm">Create a brand in the Brands tab first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Brand identity card */}
      <div
        className="relative rounded-xl"
        style={{ padding: showBorder ? 2 : 0 }}
      >
        {showBorder && (
          <div
            className="absolute inset-0 rounded-xl motion-safe:animate-shine-pulse will-change-[background-position]"
            style={{
              '--duration': `${selectedBrand?.animated_border_speed ?? 20}s`,
              backgroundImage: `radial-gradient(${borderColors[0]}00, ${borderColors.join(', ')}, ${borderColors[borderColors.length - 1]}00)`,
              backgroundSize: '300% 300%',
              padding: 2,
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
            } as React.CSSProperties}
          />
        )}
        <Card className="relative overflow-hidden border-0 shadow-md">
        <div className="flex items-center gap-6 p-5">
          {/* Logo — large, prominent */}
          <div className="shrink-0 flex items-center justify-center w-36 h-20">
            {selectedBrand?.logo_url && !logoError ? (
              <img
                src={selectedBrand.logo_url}
                alt={selectedBrand.name}
                className="max-w-36 max-h-20 object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: selectedBrand?.primary_color }}
              >
                <span className="text-white text-3xl font-bold">
                  {selectedBrand?.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Brand info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold truncate">{selectedBrand?.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Brand Intelligence Dashboard
            </p>
            {selectedBrand?.website_url && (
              <a
                href={selectedBrand.website_url.startsWith('http') ? selectedBrand.website_url : `https://${selectedBrand.website_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground mt-1.5 inline-flex items-center gap-1"
              >
                <Globe className="w-3 h-3" />
                {selectedBrand.website_url}
              </a>
            )}
          </div>

          {/* Color palette preview with hover labels */}
          {selectedBrand && (
            <TooltipProvider delayDuration={100}>
              <div className="shrink-0 flex items-center gap-1.5">
                {(selectedBrand.color_palette && selectedBrand.color_palette.length > 0
                  ? selectedBrand.color_palette.slice(0, 6)
                  : [selectedBrand.primary_color, selectedBrand.secondary_color]
                ).map((color: string, i: number) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div
                        className="w-6 h-6 rounded-full border-2 border-background shadow-sm cursor-default"
                        style={{ backgroundColor: color }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[10px]">
                      {color?.toUpperCase()}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          )}
        </div>

        {/* Showcase navigation */}
        {selectedBrand && (() => {
          const autoColors = selectedBrand.color_palette?.length && selectedBrand.color_palette.length >= 3
            ? selectedBrand.color_palette.slice(0, 3)
            : [selectedBrand.primary_color, selectedBrand.secondary_color, selectedBrand.primary_color];
          const btnColors = selectedBrand.showcase_button_colors?.length
            ? selectedBrand.showcase_button_colors
            : autoColors;
          return (
          <div className="flex items-center gap-1.5 px-5 pb-4">
            {profile && (
              <>
                {[
                  { label: 'Brand DNA', icon: Dna, onClick: () => setBrandDialogView('brand-dna') },
                  { label: 'Corporate DNA', icon: BookOpen, onClick: () => setBrandDialogView('corporate-dna') },
                  { label: 'Art Direction', icon: Camera, onClick: () => setBrandDialogView('art-direction') },
                  { label: 'Brand Guidelines', icon: Lightbulb, onClick: () => setBrandDialogView('brand-standards') },
                ].map(({ label, icon: Icon, onClick }, idx) => {
                  const color = btnColors[idx] || selectedBrand.primary_color;
                  return (
                  <button
                    key={label}
                    onClick={onClick}
                    className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 hover:shadow-sm"
                    style={{
                      backgroundColor: `${color}15`,
                      borderWidth: 1,
                      borderColor: `${color}30`,
                      color: color,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${color}25`;
                      e.currentTarget.style.borderColor = `${color}50`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${color}15`;
                      e.currentTarget.style.borderColor = `${color}30`;
                    }}
                  >
                    <Icon className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                    {label}
                  </button>
                  );
                })}
              </>
            )}
            {!profile && (
              <p className="text-xs text-muted-foreground italic">
                Build a Visual DNA profile to unlock Brand DNA, Corporate DNA, and Brand Guidelines views
              </p>
            )}
          </div>
          );
        })()}
      </Card>
      </div>

      {effectiveBrandId && selectedBrand && (
        <BrandIntelligenceDetail brandId={effectiveBrandId} brandLogoUrl={selectedBrand.logo_url} />
      )}

      {/* Showcase dialog — single unified dialog, no open/close animation between views */}
      {selectedBrand && (
        <BrandIntelligenceDialog
          brand={selectedBrand}
          open={brandDialogView !== null}
          onOpenChange={(open) => { if (!open) setBrandDialogView(null); }}
          initialView={brandDialogView ?? 'brand-dna'}
        />
      )}
    </div>
  );
}

// ── Per-brand detail view ─────────────────────────────────────────────────────

// Shared pill button class for section actions — matches header brand pills
const PILL_BTN = 'rounded-full border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50 transition-all duration-150';

export function BrandIntelligenceDetail({ brandId, brandLogoUrl }: { brandId: string; brandLogoUrl?: string }) {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useBrandStats(brandId);
  const { data: profile, isLoading: profileLoading } = useBrandProfile(brandId);
  const { data: directives, isLoading: directivesLoading } = useBrandDirectives(brandId);
  const deleteMutation = useDeleteAgentDirective();
  const generateGuardrailsMutation = useGenerateBrandGuardrails();
  const updateProfileSection = useUpdateBrandProfileSection();

  const [directiveEditorOpen, setDirectiveEditorOpen] = useState(false);
  const [editingDirective, setEditingDirective] = useState<AgentDirective | null>(null);
  const [isGeneratingAllDirectives, setIsGeneratingAllDirectives] = useState(false);
  const [analyzerOpen, setAnalyzerOpen] = useState(false);
  const [docImportOpen, setDocImportOpen] = useState(false);
  const [dnaBuilderOpen, setDnaBuilderOpen] = useState(false);
  const [synthesizeDialogOpen, setSynthesizeDialogOpen] = useState(false);

  const { data: analyses } = useBrandAnalyses(brandId);
  const deleteAnalysis = useDeleteBrandAnalysis();
  const deleteProfile = useDeleteBrandProfile();

  // Map focus_area → existing directive for replace-on-regenerate logic
  const directiveByFocusArea = useMemo(() => {
    const map: Record<string, AgentDirective> = {};
    directives?.forEach(d => { if (d.focus_area) map[d.focus_area] = d; });
    return map;
  }, [directives]);

  // Brand voice (legacy)
  const [editingBrandVoice, setEditingBrandVoice] = useState(false);
  const [brandVoiceText, setBrandVoiceText] = useState('');
  const [savingBrandVoice, setSavingBrandVoice] = useState(false);

  // Generation prompt
  const { data: generationPrompt, isLoading: genPromptLoading } = useBrandGenerationPrompt(brandId);
  const synthesizeMutation = useSynthesizeGenerationPrompt();
  const toggleSectionMutation = useTogglePromptSection();
  const updatePromptMutation = useUpdateGenerationPrompt();
  const [editingGenPrompt, setEditingGenPrompt] = useState(false);
  const [genPromptText, setGenPromptText] = useState('');
  const [showLegacyVoice, setShowLegacyVoice] = useState(false);

  // Tool approvals
  const { data: toolApprovalsData } = useBrandToolApprovals(brandId);
  const toolApprovals = toolApprovalsData?.approvals || [];
  const { data: allProducts } = useProducts();
  const [addingTool, setAddingTool] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newApprovalStatus, setNewApprovalStatus] = useState<string>('approved');
  const [newUsageScope, setNewUsageScope] = useState<string>('internal_concepting');
  const [newNotes, setNewNotes] = useState('');
  const [editingApprovalId, setEditingApprovalId] = useState<string | null>(null);
  const [editApprovalStatus, setEditApprovalStatus] = useState<string>('');
  const [editUsageScope, setEditUsageScope] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Bulk tool manage (select/delete existing approvals)
  const [bulkManaging, setBulkManaging] = useState(false);
  const [bulkManageSelectedIds, setBulkManageSelectedIds] = useState<Set<string>>(new Set());

  // Bulk tool add
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSearch, setBulkSearch] = useState('');
  const [bulkApprovalStatus, setBulkApprovalStatus] = useState<string>('approved');
  const [bulkUsageScope, setBulkUsageScope] = useState<string>('internal_concepting');
  const [bulkNotes, setBulkNotes] = useState('');

  // Reference images view mode
  type ThumbnailSize = 'sm' | 'md' | 'lg';
  const [imageViewMode, setImageViewMode] = useState<'grid' | 'list'>('grid');
  const [thumbnailSize, setThumbnailSize] = useState<ThumbnailSize>('sm');

  // Separate analyses by source type
  const imageAnalyses = analyses?.filter(a => a.source_type !== 'website' && a.source_type !== 'document') || [];
  const websiteAnalyses = analyses?.filter(a => a.source_type === 'website') || [];
  const documentAnalyses = analyses?.filter(a => a.source_type === 'document') || [];

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!window.confirm('Delete this analysis? This cannot be undone.')) return;
    try {
      await deleteAnalysis.mutateAsync({ id: analysisId, brandId });
      toast.success('Analysis deleted');
    } catch (err) {
      toast.error(`Failed to delete: ${String(err)}`);
    }
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm('Delete this brand profile? All visual DNA, color, typography, tone, and identity data will be permanently removed.')) return;
    try {
      await deleteProfile.mutateAsync(brandId);
      toast.success('Brand profile deleted');
    } catch (err) {
      toast.error(`Failed to delete profile: ${String(err)}`);
    }
  };

  const handleSetBrandLogo = async (imageUrl: string) => {
    try {
      const { error } = await supabase
        .from('creative_studio_brands')
        .update({ logo_url: imageUrl })
        .eq('id', brandId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['creative-studio-brands'] });
      toast.success('Set as brand logo');
    } catch (err) {
      toast.error(`Failed to set logo: ${String(err)}`);
    }
  };

  // Extract a readable filename from a storage URL or path
  const getDisplayName = (url: string) => {
    const segment = decodeURIComponent(url.split('/').pop() || url);
    // Strip upload prefix like "1772246815308-w3kz4d157w."
    return segment.replace(/^\d+-[a-z0-9]+\./, '');
  };

  const handleSaveBrandVoice = async () => {
    setSavingBrandVoice(true);
    try {
      const { error } = await supabase
        .from('creative_studio_brands')
        .update({ brand_voice: brandVoiceText.trim() || null })
        .eq('id', brandId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['creative-studio-brands'] });
      toast.success('Brand voice updated');
      setEditingBrandVoice(false);
    } catch (err) {
      toast.error(`Failed to save: ${String(err)}`);
    } finally {
      setSavingBrandVoice(false);
    }
  };

  // Get brand info for the analyzer dialog
  const { data: brands } = useAllCreativeStudioBrands();
  const brand = brands?.find(b => b.id === brandId);
  const brandName = brand?.name || 'Brand';
  const brandSlug = brand?.slug;

  const isLoading = statsLoading || profileLoading || directivesLoading;

  const handleDeleteDirective = async (directiveId: string) => {
    try {
      await deleteMutation.mutateAsync({ id: directiveId, brandId });
      toast.success('Directive deleted');
    } catch (err) {
      toast.error(`Failed to delete: ${String(err)}`);
    }
  };


  // Tool approval CRUD
  const handleAddToolApproval = async () => {
    if (!selectedProductId) return;
    try {
      const { error } = await supabase
        .from('brand_tool_approvals')
        .upsert({
          brand_id: brandId,
          product_id: selectedProductId,
          approval_status: newApprovalStatus,
          usage_scope: newUsageScope,
          notes: newNotes || null,
        }, { onConflict: 'brand_id,product_id' });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['brand-tool-approvals', brandId] });
      toast.success('Tool approval added');
      setAddingTool(false);
      setSelectedProductId('');
      setNewApprovalStatus('approved');
      setNewUsageScope('internal_concepting');
      setNewNotes('');
    } catch (err) {
      toast.error(`Failed to add: ${String(err)}`);
    }
  };

  const handleUpdateToolApproval = async (approvalId: string) => {
    try {
      const { error } = await supabase
        .from('brand_tool_approvals')
        .update({
          approval_status: editApprovalStatus,
          usage_scope: editUsageScope,
          notes: editNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', approvalId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['brand-tool-approvals', brandId] });
      toast.success('Tool approval updated');
      setEditingApprovalId(null);
    } catch (err) {
      toast.error(`Failed to update: ${String(err)}`);
    }
  };

  const handleDeleteToolApproval = async (approvalId: string) => {
    if (!window.confirm('Remove this tool approval?')) return;
    try {
      const { error } = await supabase
        .from('brand_tool_approvals')
        .delete()
        .eq('id', approvalId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['brand-tool-approvals', brandId] });
      toast.success('Tool approval removed');
    } catch (err) {
      toast.error(`Failed to remove: ${String(err)}`);
    }
  };

  const handleBulkDeleteToolApprovals = async () => {
    if (bulkManageSelectedIds.size === 0) return;
    if (!window.confirm(`Remove ${bulkManageSelectedIds.size} tool approval${bulkManageSelectedIds.size !== 1 ? 's' : ''}?`)) return;
    try {
      const { error } = await supabase
        .from('brand_tool_approvals')
        .delete()
        .in('id', Array.from(bulkManageSelectedIds));
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['brand-tool-approvals', brandId] });
      toast.success(`${bulkManageSelectedIds.size} tool approval${bulkManageSelectedIds.size !== 1 ? 's' : ''} removed`);
      setBulkManageSelectedIds(new Set());
      setBulkManaging(false);
    } catch (err) {
      toast.error(`Failed to remove: ${String(err)}`);
    }
  };

  const handleBulkAddToolApprovals = async () => {
    if (bulkSelectedIds.size === 0) return;
    try {
      const rows = Array.from(bulkSelectedIds).map(productId => ({
        brand_id: brandId,
        product_id: productId,
        approval_status: bulkApprovalStatus,
        usage_scope: bulkUsageScope,
        notes: bulkNotes || null,
      }));
      const { error } = await supabase
        .from('brand_tool_approvals')
        .upsert(rows, { onConflict: 'brand_id,product_id' });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['brand-tool-approvals', brandId] });
      toast.success(`${bulkSelectedIds.size} tool approval${bulkSelectedIds.size !== 1 ? 's' : ''} added`);
      setBulkAdding(false);
      setBulkSelectedIds(new Set());
      setBulkSearch('');
      setBulkApprovalStatus('approved');
      setBulkUsageScope('internal_concepting');
      setBulkNotes('');
    } catch (err) {
      toast.error(`Failed to bulk add: ${String(err)}`);
    }
  };

  const startEditingApproval = (approval: BrandToolApproval) => {
    setEditingApprovalId(approval.id);
    setEditApprovalStatus(approval.approval_status);
    setEditUsageScope(approval.usage_scope);
    setEditNotes(approval.notes || '');
  };

  // Products available to add (not already assigned to this brand)
  const assignedProductIds = new Set(toolApprovals.map(a => a.product.id));
  const availableProducts = (allProducts || [])
    .filter(p => !assignedProductIds.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Bulk add: filter available products by search query
  const bulkFilteredProducts = useMemo(() => {
    if (!bulkSearch.trim()) return availableProducts;
    const q = bulkSearch.toLowerCase();
    return availableProducts.filter(p => p.name.toLowerCase().includes(q));
  }, [availableProducts, bulkSearch]);

  // Thumbnail grid column mapping
  const THUMBNAIL_GRID: Record<ThumbnailSize, string> = {
    sm: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6',
    md: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    lg: 'grid-cols-2 lg:grid-cols-3',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  const confidencePct = Math.round((stats?.confidenceScore || 0) * 100);
  const confidenceColor = confidencePct >= 70 ? 'text-green-500' : confidencePct >= 40 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="space-y-6">
      {/* Summary cards — Intelligence + Governance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Intelligence Coverage */}
        <HoverCard openDelay={200}>
          <HoverCardTrigger asChild>
            <Card className="cursor-default hover:border-primary/30 transition-colors">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Intelligence</p>
                    <div className="flex items-baseline gap-3 mt-1.5">
                      <span className="text-3xl font-bold">{stats?.imagesAnalyzed || 0}</span>
                      <span className="text-sm text-muted-foreground">sources</span>
                      <Separator orientation="vertical" className="h-5 mx-1" />
                      <span className={`text-2xl font-bold ${confidenceColor}`}>{confidencePct}%</span>
                      <span className="text-sm text-muted-foreground">confidence</span>
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg ${confidencePct >= 70 ? 'bg-green-500/10' : confidencePct >= 40 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                    <TrendingUp className={`h-5 w-5 ${confidenceColor}`} />
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={confidencePct} className="h-1.5" />
                  <div className="flex items-center justify-between mt-1.5">
                    {profile?.source_metadata ? (
                      <div className="flex gap-3 text-[10px] text-muted-foreground">
                        {(profile.source_metadata as any)?.image_analyses > 0 && (
                          <span className="flex items-center gap-1"><Camera className="h-3 w-3" />{(profile.source_metadata as any).image_analyses} images</span>
                        )}
                        {(profile.source_metadata as any)?.website_analyses > 0 && (
                          <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{(profile.source_metadata as any).website_analyses} websites</span>
                        )}
                        {(profile.source_metadata as any)?.document_analyses > 0 && (
                          <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{(profile.source_metadata as any).document_analyses} docs</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">
                        {(stats?.imagesAnalyzed || 0) < 2 ? 'Add more sources for accuracy' : 'Sources analyzed'}
                      </p>
                    )}
                    {profile && (
                      <p className="text-[10px] text-muted-foreground">
                        Updated {new Date(profile.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </HoverCardTrigger>
          <HoverCardContent side="bottom" align="start" className="w-80">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Intelligence Coverage</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  How well the AI understands this brand's visual identity, tone, and guidelines.
                </p>
              </div>
              <Separator />
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sources Analyzed</span>
                  <span className="font-medium">{stats?.imagesAnalyzed || 0} total</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidence Score</span>
                  <span className={`font-medium ${confidenceColor}`}>
                    {confidencePct}% — {confidencePct >= 70 ? 'Strong' : confidencePct >= 40 ? 'Moderate' : 'Low'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DNA Sections Populated</span>
                  <span className="font-medium">
                    {profile ? Object.entries(profile).filter(([k, v]) =>
                      ['visual_dna', 'photography_style', 'color_profile', 'composition_rules', 'brand_identity', 'tone_of_voice', 'typography', 'brand_story'].includes(k) && v && Object.keys(v as any).length > 0
                    ).length : 0} / 8
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                Higher confidence = more consistent AI-generated content. Add images, websites, and documents to improve accuracy.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>

        {/* Governance & Templates */}
        <HoverCard openDelay={200}>
          <HoverCardTrigger asChild>
            <Card className="cursor-default hover:border-primary/30 transition-colors">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Governance</p>
                    <div className="flex items-baseline gap-3 mt-1.5">
                      <span className="text-3xl font-bold">{stats?.directiveCount || 0}</span>
                      <span className="text-sm text-muted-foreground">directives</span>
                      <Separator orientation="vertical" className="h-5 mx-1" />
                      <span className="text-2xl font-bold text-purple-600">{stats?.promptCount || 0}</span>
                      <span className="text-sm text-muted-foreground">templates</span>
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg ${(stats?.directiveCount || 0) > 0 ? 'bg-blue-500/10' : 'bg-amber-500/10'}`}>
                    <Shield className={`h-5 w-5 ${(stats?.directiveCount || 0) > 0 ? 'text-blue-500' : 'text-amber-500'}`} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-3">
                    {(stats?.directiveCount || 0) === 0 ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-500">
                        <AlertTriangle className="h-3 w-3" />
                        No governance rules — AI generation is unguided
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Brand compliance rules active
                      </div>
                    )}
                    {(stats?.promptCount || 0) > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground ml-auto">
                        <BookMarked className="h-3 w-3 text-purple-500" />
                        {stats?.promptCount} ready to use
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </HoverCardTrigger>
          <HoverCardContent side="bottom" align="start" className="w-80">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Brand Governance</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Rules, guardrails, and reusable templates that control how AI generates content for this brand.
                </p>
              </div>
              <Separator />
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agent Directives</span>
                  <span className="font-medium">
                    {stats?.directiveCount || 0} active {(stats?.directiveCount || 0) === 0 && '(recommended: 2+)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prompt Templates</span>
                  <span className="font-medium">{stats?.promptCount || 0} saved</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tool Approvals</span>
                  <span className="font-medium">{toolApprovals.length} configured</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                Directives enforce brand compliance during every generation. Templates give users pre-built prompts with brand context.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>

      {/* Visual DNA Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  Visual DNA Profile
                </CardTitle>
                <CardDescription>
                  {profile
                    ? `Last updated ${new Date(profile.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · `
                    : ''}
                  The brand's creative fingerprint. AI synthesizes all intelligence sources into a structured profile — visual style, color science, photography direction, composition rules, and tone of voice — so every generated asset is unmistakably on-brand.
                </CardDescription>
              </div>
              <TooltipProvider delayDuration={200}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mr-1">Build DNA:</span>
                  <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 px-2.5" onClick={() => setDnaBuilderOpen(true)}>
                          <Globe className="h-3.5 w-3.5" />
                          Analyze Website
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p className="text-xs">Scrape and analyze a brand website to extract visual DNA, colors, typography, and tone</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 px-2.5" onClick={() => setAnalyzerOpen(true)}>
                          <Upload className="h-3.5 w-3.5" />
                          Analyze Images
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p className="text-xs">Upload brand photography, ads, or packaging to extract visual patterns and style rules</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 px-2.5" onClick={() => setDocImportOpen(true)}>
                          <FileText className="h-3.5 w-3.5" />
                          Import Docs
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p className="text-xs">Import brand guidelines, annual reports, or brochures to build corporate DNA</p></TooltipContent>
                    </Tooltip>
                  </div>
                  {((stats?.imagesAnalyzed || 0) > 0 || profile) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className={`h-7 text-xs gap-1.5 px-2.5 ${PILL_BTN}`} onClick={() => setSynthesizeDialogOpen(true)}>
                          <Brain className="h-3.5 w-3.5" />
                          Synthesize Profile
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p className="text-xs">Combine all intelligence sources into a unified Visual DNA profile</p></TooltipContent>
                    </Tooltip>
                  )}
                  {profile && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={handleDeleteProfile}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p className="text-xs">Delete this brand's Visual DNA profile</p></TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!profile ? (
            <div className="flex items-center gap-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              Upload brand reference images and run the analyzer to build a visual DNA profile.
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              <CollapsibleSection
                icon={Eye}
                title="Visual DNA"
                data={profile.visual_dna}
                iconColor="text-purple-500"
                section="visual_dna"
                brandId={brandId}
                onSave={updateProfileSection.mutateAsync}
                saving={updateProfileSection.isPending}
                renderer={<VisualDNADisplay data={profile.visual_dna} />}
              />
              <CollapsibleSection
                icon={Camera}
                title="Photography Style"
                data={profile.photography_style}
                iconColor="text-blue-500"
                section="photography_style"
                brandId={brandId}
                onSave={updateProfileSection.mutateAsync}
                saving={updateProfileSection.isPending}
                renderer={profile.photography_style ? <PhotographyStyleDisplay data={profile.photography_style} /> : undefined}
                emptyHint="Requires image analysis — upload brand reference images to populate."
              />
              <CollapsibleSection
                icon={Palette}
                title="Color Profile"
                data={profile.color_profile}
                iconColor="text-pink-500"
                section="color_profile"
                brandId={brandId}
                onSave={updateProfileSection.mutateAsync}
                saving={updateProfileSection.isPending}
                renderer={profile.color_profile ? <ColorProfileDisplay data={profile.color_profile} /> : undefined}
                editor={(props) => (
                  <ColorProfileEditor
                    data={profile.color_profile}
                    onSave={props.onSave}
                    onCancel={props.onCancel}
                    saving={props.saving}
                  />
                )}
              />
              <CollapsibleSection
                icon={Layers}
                title="Composition Rules"
                data={profile.composition_rules}
                iconColor="text-purple-500"
                section="composition_rules"
                brandId={brandId}
                onSave={updateProfileSection.mutateAsync}
                saving={updateProfileSection.isPending}
                renderer={profile.composition_rules ? <CompositionRulesDisplay data={profile.composition_rules} /> : undefined}
                emptyHint="Requires image analysis — upload brand reference images to populate."
              />
              <CollapsibleSection
                icon={Sparkles}
                title="Brand Identity"
                data={profile.brand_identity as Record<string, unknown> | null | undefined}
                iconColor="text-amber-500"
                section="brand_identity"
                brandId={brandId}
                onSave={updateProfileSection.mutateAsync}
                saving={updateProfileSection.isPending}
                renderer={profile.brand_identity ? <BrandIdentityDisplay data={profile.brand_identity} /> : undefined}
              />
              <CollapsibleSection
                icon={MessageSquare}
                title="Tone of Voice"
                data={profile.tone_of_voice as Record<string, unknown> | null | undefined}
                iconColor="text-orange-500"
                section="tone_of_voice"
                brandId={brandId}
                onSave={updateProfileSection.mutateAsync}
                saving={updateProfileSection.isPending}
                renderer={profile.tone_of_voice ? <ToneOfVoiceDisplay data={profile.tone_of_voice} /> : undefined}
              />
              <CollapsibleSection
                icon={Type}
                title="Typography"
                data={profile.typography as Record<string, unknown> | null | undefined}
                iconColor="text-cyan-500"
                section="typography"
                brandId={brandId}
                onSave={updateProfileSection.mutateAsync}
                saving={updateProfileSection.isPending}
                renderer={profile.typography ? <TypographyDisplay data={profile.typography} /> : undefined}
              />
              <CollapsibleSection
                icon={BookOpen}
                title="Corporate DNA"
                data={profile.brand_story as Record<string, unknown> | null | undefined}
                iconColor="text-indigo-500"
                section="brand_story"
                brandId={brandId}
                onSave={updateProfileSection.mutateAsync}
                saving={updateProfileSection.isPending}
                renderer={profile.brand_story ? <BrandStoryDisplay data={profile.brand_story} /> : undefined}
                emptyHint="Import corporate documents (annual reports, about pages, brochures) to populate."
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Intelligence Sources — websites and documents analyzed for this brand */}
      {(websiteAnalyses.length > 0 || documentAnalyses.length > 0) && (() => {
        const allSources = [
          ...websiteAnalyses.map(a => ({ ...a, _sourceType: 'website' as const })),
          ...documentAnalyses.map(a => ({ ...a, _sourceType: 'document' as const })),
        ].sort((a, b) => new Date(b.analyzed_at).getTime() - new Date(a.analyzed_at).getTime());
        const COLLAPSED_LIMIT = 3;
        const hasMore = allSources.length > COLLAPSED_LIMIT;

        const renderSourceRow = (source: typeof allSources[number]) => (
          <div key={source.id} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md border bg-muted/30 text-xs group">
            {source._sourceType === 'website' ? (
              <Globe className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            ) : (
              <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            )}
            <span className="truncate flex-1 text-foreground font-medium" title={source.source_image_url}>
              {source.source_image_url}
            </span>
            <Badge variant="outline" className={`text-[9px] h-4 px-1.5 shrink-0 ${source._sourceType === 'website' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' : ''}`}>
              {source._sourceType === 'website' ? 'website' : ((source.analysis_data as any)?.document_type || 'document')}
            </Badge>
            <span className="text-muted-foreground shrink-0">
              {new Date(source.analyzed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={() => handleDeleteAnalysis(source.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        );

        return (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-500" />
                    Intelligence Sources
                  </CardTitle>
                  <CardDescription>
                    {websiteAnalyses.length > 0 && `${websiteAnalyses.length} website${websiteAnalyses.length !== 1 ? 's' : ''}`}
                    {websiteAnalyses.length > 0 && documentAnalyses.length > 0 && ', '}
                    {documentAnalyses.length > 0 && `${documentAnalyses.length} document${documentAnalyses.length !== 1 ? 's' : ''}`}
                    {' analyzed'} · The foundation of brand intelligence. AI extracts colors, typography, tone of voice, and brand values from your websites and documents — then synthesizes them into a unified Visual DNA profile that drives every generation.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setDnaBuilderOpen(true)}>
                    <Globe className="h-3.5 w-3.5" />
                    Add Website
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setDocImportOpen(true)}>
                    <FileText className="h-3.5 w-3.5" />
                    Add Document
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Collapsible defaultOpen={!hasMore}>
                <div className="space-y-1.5">
                  {(hasMore ? allSources.slice(0, COLLAPSED_LIMIT) : allSources).map(renderSourceRow)}
                </div>
                {hasMore && (
                  <>
                    <CollapsibleContent>
                      <div className="space-y-1.5 mt-1.5">
                        {allSources.slice(COLLAPSED_LIMIT).map(renderSourceRow)}
                      </div>
                    </CollapsibleContent>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground w-full mt-2 hover:text-foreground">
                        {`Show all ${allSources.length} sources`}
                      </Button>
                    </CollapsibleTrigger>
                  </>
                )}
              </Collapsible>
            </CardContent>
          </Card>
        );
      })()}

      {/* Generation Prompt */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                Generation Prompt
                {generationPrompt && (
                  <Badge variant="outline" className="text-[10px] ml-1">
                    v{generationPrompt.version}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {generationPrompt
                  ? `${GENERATION_PROMPT_SECTIONS.filter(s => generationPrompt.section_toggles[s.key]).length} of ${GENERATION_PROMPT_SECTIONS.length} sections active · `
                  : ''}
                The brand leads the prompt. This structured prompt is auto-synthesized from your Visual DNA and injected into every generation request — covering identity, color palette, typography, photography direction, composition, and guardrails. Toggle individual sections on or off to fine-tune what AI sees.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {generationPrompt && !editingGenPrompt && (
                <Button
                  variant="outline"
                  size="sm"
                  className={PILL_BTN}
                  onClick={() => {
                    setGenPromptText(generationPrompt.prompt_text);
                    setEditingGenPrompt(true);
                  }}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className={PILL_BTN}
                onClick={async () => {
                  try {
                    await synthesizeMutation.mutateAsync(brandId);
                    toast.success('Generation prompt synthesized');
                    setEditingGenPrompt(false);
                  } catch (err) {
                    toast.error(`Synthesis failed: ${String(err)}`);
                  }
                }}
                disabled={synthesizeMutation.isPending}
              >
                {synthesizeMutation.isPending
                  ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  : <Brain className="h-3 w-3 mr-1" />}
                {generationPrompt ? 'Re-synthesize' : 'Synthesize'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {genPromptLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : generationPrompt ? (
            <>
              {/* Edit mode — raw text */}
              {editingGenPrompt ? (
                <div className="space-y-3">
                  <Textarea
                    value={genPromptText}
                    onChange={(e) => setGenPromptText(e.target.value)}
                    className="font-mono text-xs min-h-[300px]"
                    rows={16}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await updatePromptMutation.mutateAsync({
                            promptId: generationPrompt.id,
                            promptText: genPromptText,
                            brandId,
                          });
                          toast.success('Generation prompt updated');
                          setEditingGenPrompt(false);
                        } catch (err) {
                          toast.error(`Failed to save: ${String(err)}`);
                        }
                      }}
                      disabled={updatePromptMutation.isPending}
                    >
                      {updatePromptMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingGenPrompt(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* Section cards with toggles */
                <div className="space-y-2">
                  {parsePromptSections(generationPrompt.prompt_text).map((section, i) => {
                    const sectionDef = section.key
                      ? GENERATION_PROMPT_SECTIONS.find(s => s.key === section.key)
                      : null;
                    const isEnabled = section.key ? generationPrompt.section_toggles[section.key] : true;

                    return (
                      <Collapsible key={i}>
                        <div className={`border rounded-lg transition-colors ${isEnabled ? '' : 'opacity-50'}`}>
                          <div className="flex items-center justify-between px-3 py-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex items-center gap-2 text-left flex-1 hover:text-primary transition-colors">
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                {section.key && SECTION_ICONS[section.key] && (() => {
                                  const SectionIcon = SECTION_ICONS[section.key!];
                                  return <SectionIcon className="h-3.5 w-3.5 text-muted-foreground" />;
                                })()}
                                <span className="text-sm font-medium">{section.heading}</span>
                              </button>
                            </CollapsibleTrigger>
                            {section.key && (
                              <button
                                className="flex-shrink-0 ml-2"
                                onClick={() => {
                                  toggleSectionMutation.mutate({
                                    promptId: generationPrompt.id,
                                    sectionKey: section.key!,
                                    enabled: !isEnabled,
                                    brandId,
                                  });
                                }}
                              >
                                {isEnabled
                                  ? <ToggleRight className="h-5 w-5 text-primary" />
                                  : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                              </button>
                            )}
                          </div>
                          <CollapsibleContent>
                            <div className="px-3 pb-3 pt-0">
                              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                                {section.content}
                              </p>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t">
                <span className="flex items-center gap-1">
                  <History className="h-3 w-3" />
                  v{generationPrompt.version} — {new Date(generationPrompt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span>{generationPrompt.prompt_text.length.toLocaleString()} chars</span>
                {brand?.brand_voice && (
                  <button
                    className="text-primary hover:underline"
                    onClick={() => setShowLegacyVoice(!showLegacyVoice)}
                  >
                    {showLegacyVoice ? 'Hide' : 'Show'} legacy brand voice
                  </button>
                )}
              </div>

              {/* Legacy brand voice (collapsible) */}
              {showLegacyVoice && brand?.brand_voice && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <AudioLines className="h-3 w-3" />
                      Legacy Brand Voice (fallback)
                    </p>
                    {!editingBrandVoice && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px]"
                        onClick={() => {
                          setBrandVoiceText(brand.brand_voice || '');
                          setEditingBrandVoice(true);
                        }}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {editingBrandVoice ? (
                    <div className="space-y-2">
                      <Textarea
                        value={brandVoiceText}
                        onChange={(e) => setBrandVoiceText(e.target.value)}
                        rows={3}
                        className="text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="h-7 text-xs" onClick={handleSaveBrandVoice} disabled={savingBrandVoice}>
                          {savingBrandVoice ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                          Save
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingBrandVoice(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-lg p-3 border">
                      <p className="text-xs leading-relaxed italic text-foreground">
                        &ldquo;{brand.brand_voice}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* No generation prompt — show legacy brand voice + synthesis CTA */
            <div className="space-y-4">
              {/* Legacy brand voice editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <AudioLines className="h-3 w-3" />
                    Brand Voice (current)
                  </p>
                  {!editingBrandVoice && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px]"
                      onClick={() => {
                        setBrandVoiceText(brand?.brand_voice || '');
                        setEditingBrandVoice(true);
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
                {editingBrandVoice ? (
                  <div className="space-y-2">
                    <Textarea
                      value={brandVoiceText}
                      onChange={(e) => setBrandVoiceText(e.target.value)}
                      placeholder="Describe the brand's tone, personality, and style direction..."
                      rows={3}
                      className="text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={handleSaveBrandVoice} disabled={savingBrandVoice}>
                        {savingBrandVoice ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingBrandVoice(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : brand?.brand_voice ? (
                  <div className="bg-muted/30 rounded-lg p-3 border">
                    <p className="text-xs leading-relaxed italic text-foreground">
                      &ldquo;{brand.brand_voice}&rdquo;
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No brand voice set
                  </p>
                )}
              </div>

              {/* Synthesis CTA */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center space-y-2">
                <Wand2 className="h-6 w-6 text-primary mx-auto" />
                <p className="text-sm font-medium">
                  Synthesize a Generation Prompt
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                  Compile your brand&apos;s Visual DNA profile, agent directives, and brand voice into a
                  structured, multi-section prompt that guides every image generation.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Directives */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                Agent Directives
              </CardTitle>
              <CardDescription>
                {directives?.filter(d => d.is_active).length || 0} active · {directives?.length || 0} total · Brand governance rules that AI enforces during every generation. Define what's required ("always use brand green as the dominant color"), what's forbidden ("never show competing products"), and tone guidelines — so creative output stays compliant even at scale.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={PILL_BTN}
                    disabled={generateGuardrailsMutation.isPending || isGeneratingAllDirectives || !profile}
                    title={!profile ? 'Build a brand profile first' : undefined}
                  >
                    {(generateGuardrailsMutation.isPending || isGeneratingAllDirectives)
                      ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      : <Wand2 className="h-3 w-3 mr-1" />}
                    Generate Guardrails
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="text-xs">Choose focus area</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        const result = await generateGuardrailsMutation.mutateAsync({ brandId });
                        toast.success(`General guardrails generated — ${result.summary.rules} rules. Review and activate.`);
                      } catch (err) {
                        toast.error(`Generation failed: ${String(err)}`);
                      }
                    }}
                  >
                    <div>
                      <div className="text-sm font-medium">General Overview</div>
                      <div className="text-xs text-muted-foreground">One broad directive covering all brand domains</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      setIsGeneratingAllDirectives(true);
                      const results = await Promise.allSettled(
                        DIRECTIVE_FOCUS_AREAS.map(async area => {
                          // Replace existing directive for this focus area if present
                          if (directiveByFocusArea[area.value]) {
                            await deleteMutation.mutateAsync({ id: directiveByFocusArea[area.value].id, brandId });
                          }
                          return generateGuardrailsMutation.mutateAsync({ brandId, focusArea: area.value });
                        })
                      );
                      setIsGeneratingAllDirectives(false);
                      const succeeded = results.filter(r => r.status === 'fulfilled').length;
                      const failed = results.filter(r => r.status === 'rejected').length;
                      if (failed === 0) {
                        toast.success(`All 6 focused directive sets generated. Review and activate each one.`);
                      } else {
                        toast.warning(`${succeeded} generated, ${failed} failed. Retry individual areas as needed.`);
                      }
                    }}
                  >
                    <div>
                      <div className="text-sm font-medium">All 6 Focus Areas</div>
                      <div className="text-xs text-muted-foreground">Generate one specialized directive per domain — replaces existing</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {DIRECTIVE_FOCUS_AREAS.map(area => {
                    const existing = directiveByFocusArea[area.value];
                    return (
                      <DropdownMenuItem
                        key={area.value}
                        onClick={async () => {
                          try {
                            if (existing) {
                              await deleteMutation.mutateAsync({ id: existing.id, brandId });
                            }
                            const result = await generateGuardrailsMutation.mutateAsync({ brandId, focusArea: area.value });
                            toast.success(`${area.label} guardrails ${existing ? 'regenerated' : 'generated'} — ${result.summary.rules} rules. Review and activate.`);
                          } catch (err) {
                            toast.error(`Generation failed: ${String(err)}`);
                          }
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">{area.label}</div>
                            {existing && <span className="text-[10px] text-muted-foreground ml-2">replace existing</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">{area.description}</div>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                className={PILL_BTN}
                onClick={() => { setEditingDirective(null); setDirectiveEditorOpen(true); }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Directive
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!directives || directives.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No directives configured for this brand — add one manually or generate from brand intelligence
            </p>
          ) : (
            <div className="space-y-3">
              {directives.map(directive => (
                <div key={directive.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{directive.name}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant={directive.is_active ? "outline" : "secondary"} className="text-[10px]">
                        {directive.is_active ? 'Active' : 'Review'}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {directive.focus_area
                          ? (DIRECTIVE_FOCUS_AREAS.find(a => a.value === directive.focus_area)?.label ?? directive.focus_area)
                          : 'General'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => { setEditingDirective(directive); setDirectiveEditorOpen(true); }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDeleteDirective(directive.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{directive.persona}</p>
                  {directive.rules && Array.isArray(directive.rules) && directive.rules.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-medium text-muted-foreground">Rules:</span>
                      <ul className="text-xs space-y-0.5 ml-3">
                        {directive.rules.slice(0, 5).map((ruleObj, i) => (
                          <li key={i} className="list-disc text-muted-foreground">
                            {typeof ruleObj === 'string' ? ruleObj : (ruleObj as { rule: string; severity?: string }).rule}
                            {typeof ruleObj !== 'string' && (ruleObj as { severity?: string }).severity && (
                              <Badge variant="outline" className="ml-1 text-[8px] h-3 px-1">
                                {(ruleObj as { severity: string }).severity}
                              </Badge>
                            )}
                          </li>
                        ))}
                        {directive.rules.length > 5 && (
                          <li className="text-muted-foreground/50">
                            +{directive.rules.length - 5} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                  {directive.tone_guidelines && (
                    <p className="text-[10px] text-muted-foreground">
                      <span className="font-medium">Tone:</span> {directive.tone_guidelines}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tool Approvals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-500" />
                Tool Approvals
              </CardTitle>
              <CardDescription>
                {toolApprovals.length} tool{toolApprovals.length !== 1 ? 's' : ''} configured · Brand-level AI tool governance. Control exactly which tools teams can use for {brandName} and how — from internal concepting to client-facing deliverables. Keeps your brand compliant with client contracts and internal policies across every AI tool in the platform.
              </CardDescription>
            </div>
            {!addingTool && !bulkAdding && !bulkManaging && (
              <div className="flex items-center gap-2">
                {toolApprovals.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={PILL_BTN}
                    onClick={() => { setBulkManaging(true); setBulkManageSelectedIds(new Set()); }}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Manage
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className={PILL_BTN}
                  onClick={() => setBulkAdding(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Bulk Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={PILL_BTN}
                  onClick={() => setAddingTool(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Tool
                </Button>
              </div>
            )}
            {bulkManaging && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (bulkManageSelectedIds.size === toolApprovals.length) {
                      setBulkManageSelectedIds(new Set());
                    } else {
                      setBulkManageSelectedIds(new Set(toolApprovals.map(a => a.id)));
                    }
                  }}
                >
                  {bulkManageSelectedIds.size === toolApprovals.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={bulkManageSelectedIds.size === 0}
                  onClick={handleBulkDeleteToolApprovals}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Remove {bulkManageSelectedIds.size > 0 ? bulkManageSelectedIds.size : ''}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setBulkManaging(false); setBulkManageSelectedIds(new Set()); }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Done
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add tool form */}
          {addingTool && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Tool</label>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="">Select a tool...</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Approval Status</label>
                  <select
                    value={newApprovalStatus}
                    onChange={e => setNewApprovalStatus(e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="approved">Approved</option>
                    <option value="not_approved">Not Approved</option>
                    <option value="pending">Pending</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Usage Scope</label>
                  <select
                    value={newUsageScope}
                    onChange={e => setNewUsageScope(e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="client_deliverables">Client Deliverables</option>
                    <option value="internal_concepting">Internal Concepting</option>
                    <option value="internal_only">Internal Only</option>
                    <option value="not_allowed">Not Allowed</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Notes (optional)</label>
                  <input
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                    placeholder="e.g. Approved for all client work"
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleAddToolApproval} disabled={!selectedProductId}>
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setAddingTool(false); setSelectedProductId(''); setNewNotes(''); }}>
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Bulk add panel */}
          {bulkAdding && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={bulkSearch}
                  onChange={e => setBulkSearch(e.target.value)}
                  placeholder="Search tools..."
                  className="w-full h-8 rounded-md border border-input bg-background pl-7 pr-2 text-xs"
                />
              </div>
              <div className="flex items-center gap-2 border-b pb-2">
                <Checkbox
                  checked={bulkFilteredProducts.length > 0 && bulkFilteredProducts.every(p => bulkSelectedIds.has(p.id))}
                  onCheckedChange={(checked) => {
                    const next = new Set(bulkSelectedIds);
                    if (checked) {
                      bulkFilteredProducts.forEach(p => next.add(p.id));
                    } else {
                      bulkFilteredProducts.forEach(p => next.delete(p.id));
                    }
                    setBulkSelectedIds(next);
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  {bulkSelectedIds.size > 0
                    ? `${bulkSelectedIds.size} selected`
                    : `Select all (${bulkFilteredProducts.length})`
                  }
                </span>
              </div>
              <ScrollArea className="max-h-64">
                <div className="space-y-1">
                  {bulkFilteredProducts.map(p => (
                    <label key={p.id} className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-muted/50 cursor-pointer">
                      <Checkbox
                        checked={bulkSelectedIds.has(p.id)}
                        onCheckedChange={(checked) => {
                          const next = new Set(bulkSelectedIds);
                          if (checked) next.add(p.id); else next.delete(p.id);
                          setBulkSelectedIds(next);
                        }}
                      />
                      {p.logo_url ? (
                        <img src={p.logo_url} alt="" className="w-5 h-5 rounded object-contain" />
                      ) : (
                        <Shield className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-xs">{p.name}</span>
                    </label>
                  ))}
                  {bulkFilteredProducts.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      {bulkSearch ? 'No matching tools' : 'All tools already assigned'}
                    </p>
                  )}
                </div>
              </ScrollArea>
              <div className="grid grid-cols-3 gap-3 border-t pt-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Approval Status</label>
                  <select
                    value={bulkApprovalStatus}
                    onChange={e => setBulkApprovalStatus(e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="approved">Approved</option>
                    <option value="not_approved">Not Approved</option>
                    <option value="pending">Pending</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Usage Scope</label>
                  <select
                    value={bulkUsageScope}
                    onChange={e => setBulkUsageScope(e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="client_deliverables">Client Deliverables</option>
                    <option value="internal_concepting">Internal Concepting</option>
                    <option value="internal_only">Internal Only</option>
                    <option value="not_allowed">Not Allowed</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Notes (optional)</label>
                  <input
                    value={bulkNotes}
                    onChange={e => setBulkNotes(e.target.value)}
                    placeholder="e.g. Approved for all client work"
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleBulkAddToolApprovals} disabled={bulkSelectedIds.size === 0}>
                  <Save className="h-3 w-3 mr-1" />
                  Add {bulkSelectedIds.size} Tool{bulkSelectedIds.size !== 1 ? 's' : ''}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setBulkAdding(false); setBulkSelectedIds(new Set()); setBulkSearch(''); setBulkNotes(''); }}>
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Existing approvals */}
          {toolApprovals.length === 0 && !addingTool && !bulkAdding ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tool approvals configured for this brand
            </p>
          ) : (
            toolApprovals.map(approval => (
              <div key={approval.id} className="border rounded-lg p-4 space-y-2">
                {editingApprovalId === approval.id ? (
                  /* Edit mode */
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {approval.product.logo_url ? (
                        <img src={approval.product.logo_url} alt="" className="w-6 h-6 rounded object-contain" />
                      ) : (
                        <Shield className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">{approval.product.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">Status</label>
                        <select
                          value={editApprovalStatus}
                          onChange={e => setEditApprovalStatus(e.target.value)}
                          className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="approved">Approved</option>
                          <option value="not_approved">Not Approved</option>
                          <option value="pending">Pending</option>
                          <option value="restricted">Restricted</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">Scope</label>
                        <select
                          value={editUsageScope}
                          onChange={e => setEditUsageScope(e.target.value)}
                          className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="client_deliverables">Client Deliverables</option>
                          <option value="internal_concepting">Internal Concepting</option>
                          <option value="internal_only">Internal Only</option>
                          <option value="not_allowed">Not Allowed</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">Notes</label>
                        <input
                          value={editNotes}
                          onChange={e => setEditNotes(e.target.value)}
                          className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleUpdateToolApproval(approval.id)}>
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingApprovalId(null)}>
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Display mode */
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {bulkManaging && (
                          <Checkbox
                            checked={bulkManageSelectedIds.has(approval.id)}
                            onCheckedChange={(checked) => {
                              setBulkManageSelectedIds(prev => {
                                const next = new Set(prev);
                                if (checked) next.add(approval.id);
                                else next.delete(approval.id);
                                return next;
                              });
                            }}
                          />
                        )}
                        {approval.product.logo_url ? (
                          <img src={approval.product.logo_url} alt="" className="w-6 h-6 rounded object-contain" />
                        ) : (
                          <Shield className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-sm">{approval.product.name}</span>
                        <Badge
                          variant="outline"
                          className={
                            approval.approval_status === 'approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px]'
                              : approval.approval_status === 'restricted'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]'
                              : approval.approval_status === 'not_approved'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px]'
                              : 'text-[10px]'
                          }
                        >
                          {approval.approval_status === 'not_approved' ? 'Not Approved' : approval.approval_status.charAt(0).toUpperCase() + approval.approval_status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px]">
                          {approval.usage_scope === 'client_deliverables' ? 'Client Deliverables'
                            : approval.usage_scope === 'internal_concepting' ? 'Internal Concepting'
                            : approval.usage_scope === 'internal_only' ? 'Internal Only'
                            : 'Not Allowed'}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditingApproval(approval)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteToolApproval(approval.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {approval.notes && (
                      <p className="text-xs text-muted-foreground ml-8">{approval.notes}</p>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Directive Editor Dialog */}
      <AgentDirectiveEditor
        brandId={brandId}
        directive={editingDirective}
        open={directiveEditorOpen}
        onOpenChange={setDirectiveEditorOpen}
      />

      {/* Brand Image Analyzer Dialog */}
      <BrandImageAnalyzer
        brandId={brandId}
        brandName={brandName}
        brandSlug={brandSlug}
        open={analyzerOpen}
        onOpenChange={setAnalyzerOpen}
      />

      {/* Brand Document Import Dialog */}
      <BrandDocumentImport
        brandId={brandId}
        brandName={brandName}
        brandSlug={brandSlug}
        open={docImportOpen}
        onOpenChange={setDocImportOpen}
      />

      {/* Brand DNA Builder Dialog */}
      <BrandDNABuilder
        brandId={brandId}
        brandName={brandName}
        brandSlug={brandSlug}
        existingWebsiteUrl={brand?.website_url}
        existingBrandVoice={brand?.brand_voice}
        existingVisualIdentity={brand?.visual_identity}
        open={dnaBuilderOpen}
        onOpenChange={setDnaBuilderOpen}
      />

      {/* Brand Synthesize Dialog */}
      <BrandSynthesizeDialog
        brandId={brandId}
        brandName={brandName}
        analyses={analyses || []}
        hasProfile={!!profile}
        open={synthesizeDialogOpen}
        onOpenChange={setSynthesizeDialogOpen}
      />

      {/* Prompt Template Admin */}
      <PromptTemplateAdmin brandId={brandId} />

      {/* Reference Images Gallery */}
      {imageAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4 text-blue-500" />
                  Reference Images
                </CardTitle>
                <CardDescription>
                  {imageAnalyses.length} reference image{imageAnalyses.length !== 1 ? 's' : ''} analyzed · Brand assets that AI sees alongside every intelligence source. Upload logos, product photography, and style exemplars — AI analyzes each to extract visual patterns, color usage, and compositional style that feed into the Visual DNA profile and strengthen brand fidelity.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {imageViewMode === 'grid' && (
                  <div className="flex items-center border rounded-md">
                    {(['sm', 'md', 'lg'] as ThumbnailSize[]).map(size => (
                      <Button
                        key={size}
                        variant={thumbnailSize === size ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-7 px-2 text-[10px] font-medium uppercase"
                        onClick={() => setThumbnailSize(size)}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={imageViewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 w-7 p-0 rounded-r-none"
                    onClick={() => setImageViewMode('grid')}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={imageViewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 w-7 p-0 rounded-l-none"
                    onClick={() => setImageViewMode('list')}
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" className={PILL_BTN} onClick={() => setAnalyzerOpen(true)}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add More
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {imageViewMode === 'grid' ? (
              <div className={`grid ${THUMBNAIL_GRID[thumbnailSize]} gap-3`}>
                {imageAnalyses.map(analysis => {
                  const isCurrentLogo = brandLogoUrl === analysis.source_image_url;
                  return (
                    <div key={analysis.id} className={`border rounded-lg overflow-hidden hover:border-primary/50 transition-colors group relative ${isCurrentLogo ? 'ring-2 ring-primary' : ''}`}>
                      <div className="relative aspect-square bg-muted">
                        <img
                          src={analysis.source_image_url}
                          alt={getDisplayName(analysis.source_image_url)}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute top-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-6 w-6 p-0 bg-background/80 ${isCurrentLogo ? 'text-primary opacity-100' : 'hover:text-primary text-muted-foreground'}`}
                            onClick={() => handleSetBrandLogo(analysis.source_image_url)}
                            title={isCurrentLogo ? 'Current brand logo' : 'Set as brand logo'}
                            style={isCurrentLogo ? { opacity: 1 } : undefined}
                          >
                            <Star className={`h-3 w-3 ${isCurrentLogo ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-background/80 hover:bg-destructive/20 hover:text-destructive text-muted-foreground"
                            onClick={() => handleDeleteAnalysis(analysis.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-2 space-y-1.5">
                        <p className="text-[11px] font-medium text-foreground truncate" title={getDisplayName(analysis.source_image_url)}>
                          {getDisplayName(analysis.source_image_url)}
                        </p>
                        <div className="flex flex-wrap gap-0.5">
                          {analysis.tags.slice(0, 4).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] h-5 px-1.5">
                              {tag}
                            </Badge>
                          ))}
                          {analysis.tags.length > 4 && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-muted-foreground">
                              +{analysis.tags.length - 4}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(analysis.analyzed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {imageAnalyses.map(analysis => {
                  const isCurrentLogo = brandLogoUrl === analysis.source_image_url;
                  return (
                    <div key={analysis.id} className={`flex items-center gap-3 border rounded-lg p-2 hover:border-primary/50 transition-colors ${isCurrentLogo ? 'ring-2 ring-primary' : ''}`}>
                      <div className="w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
                        <img
                          src={analysis.source_image_url}
                          alt={getDisplayName(analysis.source_image_url)}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" title={getDisplayName(analysis.source_image_url)}>
                          {getDisplayName(analysis.source_image_url)}
                        </p>
                        <div className="flex flex-wrap gap-0.5 mt-1">
                          {analysis.tags.slice(0, 5).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] h-5 px-1.5">
                              {tag}
                            </Badge>
                          ))}
                          {analysis.tags.length > 5 && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-muted-foreground">
                              +{analysis.tags.length - 5}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(analysis.analyzed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 w-7 p-0 ${isCurrentLogo ? 'text-primary' : 'hover:text-primary text-muted-foreground'}`}
                          onClick={() => handleSetBrandLogo(analysis.source_image_url)}
                          title={isCurrentLogo ? 'Current brand logo' : 'Set as brand logo'}
                        >
                          <Star className={`h-3.5 w-3.5 ${isCurrentLogo ? 'fill-current' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-destructive/20 hover:text-destructive text-muted-foreground"
                          onClick={() => handleDeleteAnalysis(analysis.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reference Collections */}
      {brandSlug && (
        <Card>
          <CardContent className="pt-6">
            <BrandReferenceCollections brandId={brandId} brandSlug={brandSlug} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Collapsible JSON section with edit support ──────────────────────────────

function CollapsibleSection({
  icon: Icon,
  title,
  data,
  iconColor,
  section,
  brandId,
  onSave,
  saving,
  renderer,
  emptyHint,
  editor,
}: {
  icon: React.ElementType;
  title: string;
  data: Record<string, unknown> | null;
  iconColor: string;
  section: ProfileSection;
  brandId: string;
  onSave: (params: { brandId: string; section: ProfileSection; data: Record<string, unknown> }) => Promise<void>;
  saving: boolean;
  renderer?: React.ReactNode;
  emptyHint?: string;
  editor?: (props: { data: Record<string, unknown> | null; onSave: (data: Record<string, unknown>) => Promise<void>; onCancel: () => void; saving: boolean }) => React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const hasData = data && Object.entries(data).some(([, v]) => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'string') return v.trim().length > 0;
    if (v && typeof v === 'object') return Object.keys(v).length > 0;
    return v != null;
  });

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditText(JSON.stringify(data || {}, null, 2));
    setParseError(null);
    setIsEditing(true);
    setIsOpen(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setParseError(null);
  };

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(editText);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setParseError('Must be a JSON object');
        return;
      }
      setParseError(null);
      await onSave({ brandId, section, data: parsed });
      setIsEditing(false);
      toast.success(`${title} updated`);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setParseError(`Invalid JSON: ${err.message}`);
      } else {
        toast.error(`Failed to save: ${String(err)}`);
      }
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${iconColor}`} />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {hasData ? (
              <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600">
                {Object.keys(data!).length} fields
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Empty
              </Badge>
            )}
            {!isEditing && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={startEditing}
                title="Edit"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
            {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {isEditing && editor ? (
          editor({
            data,
            onSave: async (newData) => {
              await onSave({ brandId, section, data: newData });
              setIsEditing(false);
              toast.success(`${title} updated`);
            },
            onCancel: cancelEditing,
            saving,
          })
        ) : isEditing ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={editText}
              onChange={(e) => { setEditText(e.target.value); setParseError(null); }}
              className="font-mono text-xs min-h-[200px] max-h-[400px]"
              rows={12}
            />
            {parseError && (
              <p className="text-xs text-destructive">{parseError}</p>
            )}
            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={cancelEditing} className="h-7 text-xs">
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs">
                {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                Save
              </Button>
            </div>
          </div>
        ) : hasData && renderer ? (
          <div className="p-3 mt-2 border rounded-lg bg-muted/20">
            {renderer}
          </div>
        ) : hasData ? (
          <pre className="text-xs font-mono bg-muted/30 border rounded-lg p-3 mt-2 overflow-auto max-h-[300px]">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <p className="text-xs text-muted-foreground p-3 mt-2">
            {emptyHint || 'No data available. Run the brand analyzer to populate.'}
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
