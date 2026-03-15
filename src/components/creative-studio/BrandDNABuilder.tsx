// ABOUTME: Pomelli-style dialog for building brand DNA from website analysis
// ABOUTME: Crawls a site, presents editable brand sections (colors, fonts, tone, values), auto-synthesizes on confirm

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Globe, Loader2, CheckCircle, Brain, Palette, Type, MessageSquare,
  Sparkles, AlertCircle, X, Plus, ChevronRight, Star, Dna,
  Info, Lightbulb, Building2, BookOpen, Package,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useAnalyzeWebsite } from '@/hooks/useCreativeStudioBrandIntelligence';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface BrandDNABuilderProps {
  brandId: string;
  brandName: string;
  brandSlug?: string;
  brandPrimaryColor?: string;
  existingWebsiteUrl?: string;
  existingBrandVoice?: string;
  existingVisualIdentity?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface WebsiteAnalysisResult {
  tagline?: string;
  brand_values?: string[];
  brand_aesthetic?: string;
  messaging?: string[];
  logo_description?: string;
  tone_of_voice?: {
    formality?: string;
    personality?: string;
    energy?: string;
    dos?: string[];
    donts?: string[];
  };
  color_palette?: {
    primary?: string;
    secondary?: string;
    accent?: string[];
    background?: string;
    text?: string;
    all_detected?: string[];
  };
  typography?: {
    heading_font?: string;
    body_font?: string;
    style_description?: string;
  };
  imagery_style?: string;
  key_messaging?: string[];
  logo_url?: string;
  logo_mark_url?: string;
}

interface ExtractionData {
  css_colors: string[];
  css_fonts: string[];
  google_fonts: string[];
  image_urls: string[];
  logo_urls: string[];
  favicon_url: string;
}

const RECOMMENDED_SITES = [
  { icon: Building2, label: 'Corporate Homepages', description: 'Mission statements, hero imagery, brand positioning' },
  { icon: BookOpen, label: 'About & Team Pages', description: 'Company story, values, culture, leadership bios' },
  { icon: Package, label: 'Product Pages', description: 'Product photography, naming conventions, feature language' },
  { icon: Palette, label: 'Brand Portals', description: 'Style guides, color systems, typography standards' },
  { icon: MessageSquare, label: 'Blog & Newsroom', description: 'Brand voice, content tone, editorial direction' },
  { icon: Globe, label: 'Campaign Microsites', description: 'Creative direction, campaign aesthetics, target audience cues' },
];

const WEBSITE_PIPELINE_STEPS = [
  { num: 1, label: 'Enter URL', detail: "Paste the brand's website — we crawl the homepage and key subpages automatically" },
  { num: 2, label: 'Crawl & Analyze', detail: 'Screenshot the homepage, fetch pages, extract CSS colors and fonts, then Gemini analyzes everything visually and structurally' },
  { num: 3, label: 'Review & Build', detail: 'Preview and customize the extracted brand data, then build the unified DNA profile' },
];

// Deduplicate colors that are perceptually similar
function deduplicateColors(colors: string[], threshold = 30): string[] {
  const unique: string[] = [];
  for (const color of colors) {
    const rgb = hexToRgb(color);
    if (!rgb) continue;
    const isDuplicate = unique.some(existing => {
      const existingRgb = hexToRgb(existing);
      if (!existingRgb) return false;
      const dist = Math.sqrt(
        (rgb.r - existingRgb.r) ** 2 +
        (rgb.g - existingRgb.g) ** 2 +
        (rgb.b - existingRgb.b) ** 2
      );
      return dist < threshold;
    });
    if (!isDuplicate) unique.push(color);
  }
  return unique;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) };
}

export function BrandDNABuilder({
  brandId,
  brandName,
  brandSlug,
  brandPrimaryColor,
  existingWebsiteUrl,
  existingBrandVoice,
  existingVisualIdentity,
  open,
  onOpenChange,
}: BrandDNABuilderProps) {
  const queryClient = useQueryClient();
  const analyzeWebsite = useAnalyzeWebsite();

  const [urlInput, setUrlInput] = useState(existingWebsiteUrl || '');
  const [activeTab, setActiveTab] = useState('website');
  const [analysisResult, setAnalysisResult] = useState<WebsiteAnalysisResult | null>(null);
  const [extractionData, setExtractionData] = useState<ExtractionData | null>(null);
  const [pagesAnalyzed, setPagesAnalyzed] = useState(0);
  const [analyzedUrl, setAnalyzedUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLogoUrl, setSelectedLogoUrl] = useState<string | null>(null);

  // Product catalog URL import
  const [productUrlInput, setProductUrlInput] = useState('');
  const [isExtractingProducts, setIsExtractingProducts] = useState(false);
  const [extractedProductCount, setExtractedProductCount] = useState<number | null>(null);
  const [productExtractError, setProductExtractError] = useState<string | null>(null);

  // Overwrite confirmation for existing brand_voice / visual_identity
  const [overwriteConfirm, setOverwriteConfirm] = useState<{
    brandVoice: boolean;
    visualIdentity: boolean;
  } | null>(null);

  // Editable state — initialized from analysis, user can modify before saving
  const [editColors, setEditColors] = useState<{
    primary: string;
    secondary: string;
    accent: string[];
    background: string;
    text: string;
  }>({ primary: '', secondary: '', accent: [], background: '', text: '' });
  const [editTypography, setEditTypography] = useState<{
    heading_font: string;
    body_font: string;
    style_description: string;
  }>({ heading_font: '', body_font: '', style_description: '' });
  const [editTagline, setEditTagline] = useState('');
  const [editBrandValues, setEditBrandValues] = useState<string[]>([]);
  const [editTone, setEditTone] = useState<{
    formality: string;
    personality: string;
    energy: string;
  }>({ formality: '', personality: '', energy: '' });
  const [editMessaging, setEditMessaging] = useState<string[]>([]);
  const [newValueInput, setNewValueInput] = useState('');
  const [newMessageInput, setNewMessageInput] = useState('');

  const resetState = () => {
    setUrlInput(existingWebsiteUrl || '');
    setActiveTab('website');
    setAnalysisResult(null);
    setExtractionData(null);
    setPagesAnalyzed(0);
    setAnalyzedUrl('');
    setOverwriteConfirm(null);
    setSelectedLogoUrl(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  const initEditableState = (result: WebsiteAnalysisResult) => {
    const cp = result.color_palette;
    setEditColors({
      primary: cp?.primary || '',
      secondary: cp?.secondary || '',
      accent: cp?.accent || [],
      background: cp?.background || '',
      text: cp?.text || '',
    });
    const tp = result.typography;
    setEditTypography({
      heading_font: tp?.heading_font || '',
      body_font: tp?.body_font || '',
      style_description: tp?.style_description || '',
    });
    setEditTagline(result.tagline || '');
    setEditBrandValues(result.brand_values || []);
    setEditTone({
      formality: result.tone_of_voice?.formality || '',
      personality: result.tone_of_voice?.personality || '',
      energy: result.tone_of_voice?.energy || '',
    });
    setEditMessaging(result.key_messaging || result.messaging || []);
  };

  const handleAnalyze = async () => {
    if (!urlInput.trim()) {
      toast.error('Enter a website URL');
      return;
    }

    try {
      const result = await analyzeWebsite.mutateAsync({
        brandId,
        url: urlInput.trim(),
      });

      setAnalysisResult(result.analysis);
      setExtractionData(result.extraction);
      setPagesAnalyzed(result.pages_analyzed);
      setAnalyzedUrl(result.url || urlInput.trim());
      initEditableState(result.analysis);
      // Pre-select Gemini's logo pick, falling back to first detected logo candidate
      const autoPickedLogo = result.analysis?.logo_url
        || result.extraction?.logo_urls?.[0]
        || null;
      setSelectedLogoUrl(autoPickedLogo);
      setActiveTab('review');
      toast.success(`Analyzed ${result.pages_analyzed} page${result.pages_analyzed !== 1 ? 's' : ''}`);
    } catch (err) {
      toast.error(`Analysis failed: ${String(err)}`);
    }
  };

  const handleSaveAndSynthesize = async () => {
    setIsSaving(true);
    try {
      // Build profile directly from user's curated edits, deduplicated
      const allColors = deduplicateColors([
        editColors.primary,
        editColors.secondary,
        ...editColors.accent,
        editColors.background,
        editColors.text,
      ].filter(Boolean));

      const colorProfile = {
        mandatory_colors: allColors,
        overall_tone: analysisResult?.brand_aesthetic || '',
        palette_relationships: [
          editColors.primary && `Primary: ${editColors.primary}`,
          editColors.secondary && `Secondary: ${editColors.secondary}`,
          editColors.accent.length > 0 && `Accent: ${editColors.accent.join(', ')}`,
          editColors.background && `Background: ${editColors.background}`,
          editColors.text && `Text: ${editColors.text}`,
        ].filter(Boolean).join('. '),
        forbidden_colors: [],
      };

      const brandIdentity = {
        tagline: editTagline,
        brand_values: editBrandValues,
        messaging: editMessaging,
        brand_aesthetic: analysisResult?.brand_aesthetic || '',
        logo_description: analysisResult?.logo_description || '',
      };

      const toneOfVoice = {
        formality: editTone.formality,
        personality: editTone.personality,
        energy: editTone.energy,
        dos: analysisResult?.tone_of_voice?.dos || [],
        donts: analysisResult?.tone_of_voice?.donts || [],
      };

      const typography = {
        heading_font: editTypography.heading_font,
        body_font: editTypography.body_font,
        style_description: editTypography.style_description,
      };

      const visualDna = {
        signature_style: analysisResult?.brand_aesthetic || analysisResult?.imagery_style || '',
        visual_principles: editBrandValues.slice(0, 5),
        key_differentiators: editMessaging.slice(0, 5),
        dos: analysisResult?.tone_of_voice?.dos || [],
        donts: analysisResult?.tone_of_voice?.donts || [],
      };

      const now = new Date().toISOString();
      const profileData = {
        brand_id: brandId,
        visual_dna: visualDna,
        color_profile: colorProfile,
        brand_identity: brandIdentity,
        tone_of_voice: toneOfVoice,
        typography,
        total_images_analyzed: pagesAnalyzed,
        last_analysis_run: now,
        confidence_score: 0.6,
        updated_at: now,
        source_metadata: {
          source: 'website_analysis',
          url: analyzedUrl,
          analyzed_at: now,
        },
      };

      // Check if profile exists, then insert or update
      const { data: existing } = await supabase
        .from('creative_studio_brand_profiles')
        .select('id')
        .eq('brand_id', brandId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('creative_studio_brand_profiles')
          .update(profileData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('creative_studio_brand_profiles')
          .insert(profileData);
        if (error) throw error;
      }

      // Update brand record with discovered data
      const brandUpdate: Record<string, unknown> = {};
      if (analyzedUrl) brandUpdate.website_url = analyzedUrl;
      if (editColors.primary) brandUpdate.primary_color = editColors.primary;
      if (editColors.secondary) brandUpdate.secondary_color = editColors.secondary;
      if (allColors.length > 0) brandUpdate.color_palette = allColors;
      if (selectedLogoUrl) brandUpdate.logo_url = selectedLogoUrl;

      // Synthesize brand_voice from structured tone data
      const voiceParts = [
        editTone.personality,
        editTone.formality && `${editTone.formality} formality`,
        editTone.energy && `${editTone.energy} energy`,
      ].filter(Boolean);
      if (voiceParts.length > 0) {
        const synthesizedVoice = voiceParts.join(', ') + '.';
        const shouldWriteVoice = !existingBrandVoice || overwriteConfirm?.brandVoice;
        if (shouldWriteVoice) brandUpdate.brand_voice = synthesizedVoice;
      }

      // Synthesize visual_identity from aesthetic + imagery style
      const visualParts = [
        analysisResult?.brand_aesthetic,
        analysisResult?.imagery_style,
      ].filter(Boolean);
      if (visualParts.length > 0) {
        const synthesizedVisual = visualParts.join(' ');
        const shouldWriteVisual = !existingVisualIdentity || overwriteConfirm?.visualIdentity;
        if (shouldWriteVisual) brandUpdate.visual_identity = synthesizedVisual;
      }

      if (Object.keys(brandUpdate).length > 0) {
        await supabase
          .from('creative_studio_brands')
          .update(brandUpdate)
          .eq('id', brandId);
      }

      queryClient.invalidateQueries({ queryKey: ['creative-studio-brand-profiles', brandId] });
      queryClient.invalidateQueries({ queryKey: ['creative-studio-brand-stats', brandId] });
      queryClient.invalidateQueries({ queryKey: ['creative-studio-brands'] });

      toast.success('Brand DNA profile saved');
      handleOpenChange(false);
    } catch (err) {
      toast.error(`Failed to save profile: ${String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Color helpers
  const updateAccentColor = (index: number, value: string) => {
    setEditColors(prev => ({
      ...prev,
      accent: prev.accent.map((c, i) => i === index ? value : c),
    }));
  };
  const removeAccentColor = (index: number) => {
    setEditColors(prev => ({
      ...prev,
      accent: prev.accent.filter((_, i) => i !== index),
    }));
  };
  const addAccentColor = (color: string) => {
    setEditColors(prev => ({
      ...prev,
      accent: [...prev.accent, color],
    }));
  };
  const promoteDetectedColor = (color: string, role: 'primary' | 'secondary' | 'accent') => {
    if (role === 'accent') {
      addAccentColor(color);
    } else {
      setEditColors(prev => ({ ...prev, [role]: color }));
    }
    toast.success(`Set as ${role}`);
  };

  // Brand value helpers
  const removeBrandValue = (index: number) => {
    setEditBrandValues(prev => prev.filter((_, i) => i !== index));
  };
  const addBrandValue = () => {
    const val = newValueInput.trim();
    if (!val) return;
    setEditBrandValues(prev => [...prev, val]);
    setNewValueInput('');
  };

  // Messaging helpers
  const removeMessage = (index: number) => {
    setEditMessaging(prev => prev.filter((_, i) => i !== index));
  };
  const addMessage = () => {
    const msg = newMessageInput.trim();
    if (!msg) return;
    setEditMessaging(prev => [...prev, msg]);
    setNewMessageInput('');
  };

  // Show overwrite confirmation on first click if existing content exists, then save on second click
  const handleBuildClick = () => {
    const hasExistingContent = existingBrandVoice || existingVisualIdentity;
    if (hasExistingContent && !overwriteConfirm) {
      setOverwriteConfirm({ brandVoice: true, visualIdentity: true });
      return;
    }
    handleSaveAndSynthesize();
  };

  const detectedColors = extractionData?.css_colors
    ? deduplicateColors(extractionData.css_colors, 50)
    : [];

  const handleExtractProducts = async () => {
    if (!productUrlInput.trim()) return;
    setIsExtractingProducts(true);
    setExtractedProductCount(null);
    setProductExtractError(null);

    try {
      const { data, error } = await supabase.functions.invoke('extract-product-catalog', {
        body: { url: productUrlInput.trim(), brand_id: brandId },
      });

      if (error || !data?.success) {
        setProductExtractError(data?.error || error?.message || 'Extraction failed');
        return;
      }

      if (data.product_count === 0) {
        setProductExtractError(data.message || 'No products found on this page. Try a specific product page URL.');
        return;
      }

      setExtractedProductCount(data.product_count);
      setProductUrlInput('');
      queryClient.invalidateQueries({ queryKey: ['brand-profiles'] });
      toast.success(`Added ${data.product_count} product${data.product_count !== 1 ? 's' : ''} to catalog`);
    } catch (err) {
      setProductExtractError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsExtractingProducts(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 rounded-2xl overflow-hidden flex flex-col">
        {/* Branded gradient header */}
        <div
          className="relative overflow-hidden px-6 py-5 border-b"
          style={{
            background: brandPrimaryColor
              ? `linear-gradient(135deg, ${brandPrimaryColor}15 0%, ${brandPrimaryColor}08 50%, transparent 100%)`
              : undefined,
          }}
        >
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-teal-600 text-white shrink-0">
                <Dna className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Build Brand DNA</DialogTitle>
                <DialogDescription className="text-sm">
                  Analyze <strong>{brandName}</strong>'s website to extract brand identity, colors, fonts, tone of voice, and more.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable body */}
        <div className="px-6 py-4 overflow-y-auto flex-1" style={{ maxHeight: 'calc(90vh - 160px)' }}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 rounded-lg p-1">
            <TabsTrigger value="website" className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Website
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!analysisResult} className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Review & Edit
            </TabsTrigger>
          </TabsList>

          {/* Pipeline stepper */}
          <div className="flex items-center gap-1 py-2 px-1 mt-2">
            {WEBSITE_PIPELINE_STEPS.map((ps, i) => {
              const isComplete = analysisResult
                ? ps.num <= 2
                : analyzeWebsite.isPending
                  ? ps.num === 1
                  : false;
              const isActive = analysisResult
                ? ps.num === 3
                : analyzeWebsite.isPending
                  ? ps.num === 2
                  : ps.num === 1;
              return (
                <TooltipProvider key={ps.num} delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                          isActive ? 'bg-primary text-primary-foreground shadow-sm' :
                          isComplete ? 'bg-primary/10 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {isComplete && !isActive ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <span className="w-3.5 text-center">{ps.num}</span>
                          )}
                          <span>{ps.label}</span>
                        </div>
                        {i < WEBSITE_PIPELINE_STEPS.length - 1 && (
                          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs max-w-48">
                      {ps.detail}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>

          {/* Website Tab */}
          <TabsContent value="website" className="space-y-4 mt-2">
            {/* Guidance section — shown before analysis */}
            {!analysisResult && !analyzeWebsite.isPending && (
              <div className="space-y-3">
                {/* What the system does */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/5 to-teal-500/5 border border-purple-500/10">
                  <div className="flex items-start gap-2.5">
                    <Info className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium">How Website DNA Extraction works</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Enter a website URL and our AI will <strong className="text-foreground">screenshot the homepage</strong>,
                        then crawl it plus key subpages — About, Values, Products, Team — extracting{' '}
                        <strong className="text-foreground">colors</strong> from CSS,{' '}
                        <strong className="text-foreground">fonts</strong> from stylesheets,{' '}
                        <strong className="text-foreground">tone of voice</strong> from copy,{' '}
                        <strong className="text-foreground">brand values</strong> from messaging,{' '}
                        <strong className="text-foreground">imagery style</strong>, and{' '}
                        <strong className="text-foreground">logo candidates</strong> from site assets.
                        Gemini analyzes the screenshot as ground truth for visual identity — what you actually see on screen
                        takes priority over raw CSS data. Everything is fully editable before building the profile.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommended site types */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Best pages to analyze</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {RECOMMENDED_SITES.map((site) => (
                      <div key={site.label} className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <site.icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium">{site.label}</p>
                          <p className="text-[10px] text-muted-foreground leading-snug">{site.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-500/5 border border-amber-500/10">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Tip:</strong> Start with the main corporate homepage — it typically yields the
                    richest brand signals. If the brand has a dedicated style guide or brand portal, analyze that separately for the
                    most detailed extraction. Results are cumulative — each website analysis strengthens the brand's DNA.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="website-url">Website URL</Label>
              <div className="flex gap-2">
                <Input
                  id="website-url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://www.example.com"
                  className="flex-1"
                  onKeyDown={e => { if (e.key === 'Enter' && !analyzeWebsite.isPending) handleAnalyze(); }}
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzeWebsite.isPending || !urlInput.trim()}
                  className="gap-2"
                >
                  {analyzeWebsite.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                  {analyzeWebsite.isPending ? 'Analyzing...' : 'Analyze'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                We'll screenshot and crawl the homepage plus key pages (About, Values, etc.) to extract brand signals.
              </p>
            </div>

            {analyzeWebsite.isPending && (
              <div className="p-6 bg-muted/30 rounded-lg space-y-3 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
                <div className="space-y-1">
                  <p className="font-medium">Analyzing website...</p>
                  <p className="text-sm text-muted-foreground">
                    Fetching pages, extracting CSS, parsing metadata, and analyzing with AI.
                    This may take 15-30 seconds.
                  </p>
                </div>
              </div>
            )}

            {analyzeWebsite.isError && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Analysis failed</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {analyzeWebsite.error?.message || 'Unknown error'}
                  </p>
                </div>
              </div>
            )}

            {analysisResult && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">
                    Website analyzed successfully ({pagesAnalyzed} page{pagesAnalyzed !== 1 ? 's' : ''})
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Switch to the <strong>Review & Edit</strong> tab to customize and save your brand DNA.
                </p>
              </div>
            )}

            {/* Product Catalog import — separate from brand website analysis */}
            <div className="mt-6 pt-5 border-t space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Product catalog</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Import product data from a product page URL. This adds to the product catalog only — it won't affect brand identity, voice, or colors.
              </p>
              <div className="flex gap-2">
                <Input
                  value={productUrlInput}
                  onChange={e => setProductUrlInput(e.target.value)}
                  placeholder="https://store.example.com/products/model-name"
                  className="flex-1"
                  onKeyDown={e => { if (e.key === 'Enter' && !isExtractingProducts) handleExtractProducts(); }}
                />
                <Button
                  onClick={handleExtractProducts}
                  disabled={isExtractingProducts || !productUrlInput.trim()}
                  variant="outline"
                  className="gap-2"
                >
                  {isExtractingProducts ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                  {isExtractingProducts ? 'Extracting...' : 'Extract'}
                </Button>
              </div>
              {productExtractError && (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{productExtractError}</span>
                </div>
              )}
              {extractedProductCount !== null && (
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{extractedProductCount} product{extractedProductCount !== 1 ? 's' : ''} added to catalog</span>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Review & Edit Tab */}
          <TabsContent value="review" className="mt-4">
            {analysisResult && (
              <>
                {/* Tagline — full width */}
                <div className="rounded-lg border bg-card/50 p-4 space-y-1.5 mb-5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Tagline</Label>
                  <Input
                    value={editTagline}
                    onChange={e => setEditTagline(e.target.value)}
                    placeholder="Brand tagline or slogan"
                    className="text-lg font-medium"
                  />
                </div>

                {/* Two-column layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                  {/* Left column: Visual identity */}
                  <div className="space-y-4">
                    {/* Colors */}
                    <div className="rounded-lg border bg-card/50 p-4 space-y-3">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Palette className="h-3.5 w-3.5" />
                        Colors
                      </Label>

                      {/* Primary & Secondary */}
                      <div className="grid grid-cols-2 gap-3">
                        <EditableColorSwatch
                          label="Primary"
                          color={editColors.primary}
                          onChange={c => setEditColors(prev => ({ ...prev, primary: c }))}
                        />
                        <EditableColorSwatch
                          label="Secondary"
                          color={editColors.secondary}
                          onChange={c => setEditColors(prev => ({ ...prev, secondary: c }))}
                        />
                      </div>

                      {/* Accent colors */}
                      {editColors.accent.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-muted-foreground font-medium">Accent Colors</p>
                          <div className="flex flex-wrap gap-2">
                            {editColors.accent.map((c, i) => (
                              <div key={i} className="flex items-center gap-1.5 group">
                                <input
                                  type="color"
                                  value={c}
                                  onChange={e => updateAccentColor(i, e.target.value)}
                                  className="w-8 h-8 rounded border border-border cursor-pointer"
                                />
                                <Input
                                  value={c}
                                  onChange={e => updateAccentColor(i, e.target.value)}
                                  className="w-24 h-8 text-xs font-mono"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAccentColor(i)}
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Background & Text colors */}
                      {(editColors.background || editColors.text) && (
                        <div className="grid grid-cols-2 gap-3">
                          {editColors.background && (
                            <EditableColorSwatch
                              label="Background"
                              color={editColors.background}
                              onChange={c => setEditColors(prev => ({ ...prev, background: c }))}
                            />
                          )}
                          {editColors.text && (
                            <EditableColorSwatch
                              label="Text"
                              color={editColors.text}
                              onChange={c => setEditColors(prev => ({ ...prev, text: c }))}
                            />
                          )}
                        </div>
                      )}

                      {/* Detected CSS Colors — collapsed by default */}
                      {detectedColors.length > 0 && (
                        <DetectedColorsDisclosure
                          colors={detectedColors}
                          onPromote={promoteDetectedColor}
                        />
                      )}
                    </div>

                    {/* Typography */}
                    <div className="rounded-lg border bg-card/50 p-4 space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Type className="h-3.5 w-3.5" />
                        Typography
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground">Headings</p>
                          <Input
                            value={editTypography.heading_font}
                            onChange={e => setEditTypography(prev => ({ ...prev, heading_font: e.target.value }))}
                            placeholder="Heading font family"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground">Body</p>
                          <Input
                            value={editTypography.body_font}
                            onChange={e => setEditTypography(prev => ({ ...prev, body_font: e.target.value }))}
                            placeholder="Body font family"
                          />
                        </div>
                      </div>
                      <Input
                        value={editTypography.style_description}
                        onChange={e => setEditTypography(prev => ({ ...prev, style_description: e.target.value }))}
                        placeholder="Typography style description..."
                        className="text-sm"
                      />
                    </div>

                    {/* Brand Values */}
                    <div className="rounded-lg border bg-card/50 p-4 space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Brand Values</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {editBrandValues.map((v, i) => (
                          <Badge key={i} variant="secondary" className="gap-1 pr-1">
                            {v}
                            <button
                              onClick={() => removeBrandValue(i)}
                              className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </Badge>
                        ))}
                        <div className="flex items-center gap-1">
                          <Input
                            value={newValueInput}
                            onChange={e => setNewValueInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBrandValue(); } }}
                            placeholder="Add value..."
                            className="h-7 w-32 text-xs"
                          />
                          <Button variant="ghost" size="sm" onClick={addBrandValue} className="h-7 w-7 p-0">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right column: Voice & messaging */}
                  <div className="space-y-4">
                    {/* Tone of Voice */}
                    <div className="rounded-lg border bg-card/50 p-4 space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Tone of Voice
                      </Label>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground">Formality</p>
                          <Input
                            value={editTone.formality}
                            onChange={e => setEditTone(prev => ({ ...prev, formality: e.target.value }))}
                            placeholder="e.g. semi-formal"
                            className="text-sm capitalize"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground">Personality</p>
                          <Input
                            value={editTone.personality}
                            onChange={e => setEditTone(prev => ({ ...prev, personality: e.target.value }))}
                            placeholder="e.g. warm, confident"
                            className="text-sm capitalize"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground">Energy</p>
                          <Input
                            value={editTone.energy}
                            onChange={e => setEditTone(prev => ({ ...prev, energy: e.target.value }))}
                            placeholder="e.g. energetic"
                            className="text-sm capitalize"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Brand Aesthetic */}
                    {analysisResult.brand_aesthetic && (
                      <div className="rounded-lg border bg-card/50 p-4 space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Aesthetic</Label>
                        <p className="text-sm text-muted-foreground">{analysisResult.brand_aesthetic}</p>
                      </div>
                    )}

                    {/* Key Messaging */}
                    {(editMessaging.length > 0 || true) && (
                      <div className="rounded-lg border bg-card/50 p-4 space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Key Messaging</Label>
                        <ul className="space-y-1">
                          {editMessaging.map((m, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground group">
                              <span className="mt-0.5">•</span>
                              <span className="flex-1">{m}</span>
                              <button
                                onClick={() => removeMessage(i)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center gap-1">
                          <Input
                            value={newMessageInput}
                            onChange={e => setNewMessageInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMessage(); } }}
                            placeholder="Add a key message..."
                            className="text-sm flex-1"
                          />
                          <Button variant="ghost" size="sm" onClick={addMessage} className="h-8 w-8 p-0">
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Site Imagery — click star to select brand logo */}
                {extractionData && (extractionData.image_urls.length > 0 || (extractionData.logo_urls?.length ?? 0) > 0) && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Site Imagery
                      {selectedLogoUrl && (
                        <span className="ml-1.5 text-purple-500 normal-case tracking-normal">— logo selected</span>
                      )}
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Click the star on any image to set it as the brand logo.
                    </p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {(() => {
                        const logoUrls = extractionData.logo_urls ?? [];
                        const allUrls = [
                          ...logoUrls,
                          ...extractionData.image_urls.filter(url => !logoUrls.includes(url)),
                        ].slice(0, 15);

                        return allUrls.map((url, i) => {
                          const isSelected = selectedLogoUrl === url;
                          const isLogoCandidate = logoUrls.includes(url);

                          return (
                            <div key={i} className="relative group">
                              <img
                                src={url}
                                alt=""
                                className={`w-full aspect-square object-cover rounded border transition-all ${
                                  isSelected
                                    ? 'border-yellow-500 ring-2 ring-yellow-500/50'
                                    : 'border-border'
                                }`}
                                onError={(e) => {
                                  const container = (e.target as HTMLImageElement).closest('.relative');
                                  if (container) (container as HTMLElement).style.display = 'none';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setSelectedLogoUrl(isSelected ? null : url)}
                                className={`absolute top-1 right-1 p-0.5 rounded bg-background/80 backdrop-blur-sm transition-opacity ${
                                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                }`}
                                title={isSelected ? 'Unset as logo' : 'Set as brand logo'}
                              >
                                <Star className={`h-3.5 w-3.5 ${
                                  isSelected ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
                                }`} />
                              </button>
                              {isSelected && (
                                <Badge
                                  variant="default"
                                  className="absolute top-1 left-1 text-[9px] px-1 py-0 bg-yellow-500 text-yellow-950"
                                >
                                  Logo
                                </Badge>
                              )}
                              {isLogoCandidate && !isSelected && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent rounded-b px-1 py-0.5">
                                  <span className="text-[8px] text-white/80">detected logo</span>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* Summary + overwrite confirmation */}
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Ready to build {brandName}'s profile?</p>
                  <p className="text-xs text-muted-foreground">
                    Your edits above will be merged with any existing image analyses to create a unified brand DNA profile.
                    {existingWebsiteUrl ? ' This will update the existing profile.' : ''}
                  </p>
                  {/* Overwrite confirmation for existing brand_voice / visual_identity */}
                  {overwriteConfirm && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-2 text-sm">
                      <p className="font-medium text-amber-700 dark:text-amber-400">Existing content detected</p>
                      {existingBrandVoice && (
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={overwriteConfirm.brandVoice}
                            onChange={e => setOverwriteConfirm(prev => prev ? { ...prev, brandVoice: e.target.checked } : prev)}
                            className="mt-0.5 rounded"
                          />
                          <span className="text-muted-foreground">
                            Replace existing brand voice with discovered tone
                          </span>
                        </label>
                      )}
                      {existingVisualIdentity && (
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={overwriteConfirm.visualIdentity}
                            onChange={e => setOverwriteConfirm(prev => prev ? { ...prev, visualIdentity: e.target.checked } : prev)}
                            className="mt-0.5 rounded"
                          />
                          <span className="text-muted-foreground">
                            Replace existing visual identity with discovered aesthetic
                          </span>
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
        </div>

        {/* Sticky footer */}
        <div className="border-t px-6 py-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {analysisResult ? 'Cancel' : 'Close'}
          </Button>
          {analysisResult && activeTab === 'review' && (
            <Button
              onClick={handleBuildClick}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              {isSaving ? 'Building Profile...' : 'Looks Good — Build Profile'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Editable color swatch ────────────────────────────────────────────────────

function EditableColorSwatch({
  label,
  color,
  onChange,
}: {
  label: string;
  color: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
      <input
        type="color"
        value={color || '#000000'}
        onChange={e => onChange(e.target.value)}
        className="w-10 h-10 rounded border border-border cursor-pointer shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">{label}</p>
        <Input
          value={color}
          onChange={e => onChange(e.target.value)}
          className="h-7 text-xs font-mono mt-0.5"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

// ── Collapsed disclosure for raw CSS colors ──────────────────────────────────

function DetectedColorsDisclosure({
  colors,
  onPromote,
}: {
  colors: string[];
  onPromote: (color: string, role: 'primary' | 'secondary' | 'accent') => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border/50 rounded-lg">
      <button
        type="button"
        className="w-full flex items-center gap-1.5 px-3 py-2 text-[10px] text-muted-foreground hover:bg-muted/30 rounded-lg transition-colors"
        onClick={() => setOpen(!open)}
      >
        <ChevronRight className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} />
        <span>Raw CSS colors ({colors.length}) — click to assign roles</span>
        <div className="flex gap-0.5 ml-auto">
          {colors.slice(0, 6).map((c, i) => (
            <div key={i} className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: c }} />
          ))}
          {colors.length > 6 && <span className="text-[9px]">+{colors.length - 6}</span>}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-wrap gap-1.5">
          {colors.slice(0, 24).map((c, i) => (
            <DetectedColorSwatch
              key={i}
              color={c}
              onPromote={(role) => onPromote(c, role)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Detected CSS color swatch with role assignment ───────────────────────────

function DetectedColorSwatch({
  color,
  onPromote,
}: {
  color: string;
  onPromote: (role: 'primary' | 'secondary' | 'accent') => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        className="w-8 h-8 rounded border border-border hover:ring-2 hover:ring-primary/50 transition-all"
        style={{ backgroundColor: color }}
        title={`${color} — click to assign`}
        onClick={() => setShowMenu(!showMenu)}
      />
      {showMenu && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-popover border rounded-md shadow-md p-1 min-w-[100px]">
          <button
            className="w-full text-left text-xs px-2 py-1 hover:bg-muted rounded"
            onClick={() => { onPromote('primary'); setShowMenu(false); }}
          >
            Set as Primary
          </button>
          <button
            className="w-full text-left text-xs px-2 py-1 hover:bg-muted rounded"
            onClick={() => { onPromote('secondary'); setShowMenu(false); }}
          >
            Set as Secondary
          </button>
          <button
            className="w-full text-left text-xs px-2 py-1 hover:bg-muted rounded"
            onClick={() => { onPromote('accent'); setShowMenu(false); }}
          >
            Add as Accent
          </button>
        </div>
      )}
    </div>
  );
}
