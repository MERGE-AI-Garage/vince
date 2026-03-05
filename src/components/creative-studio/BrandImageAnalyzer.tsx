// ABOUTME: Dialog for uploading brand reference images and triggering Gemini Vision analysis
// ABOUTME: Supports drag-drop file upload to Supabase Storage and URL-paste as secondary option

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Brain, Upload, Loader2, Image, X, Link, ChevronDown, ChevronUp, CheckCircle, Info, Eye, Shield,
  Sparkles, Camera, Palette, Package, Megaphone, LayoutGrid, ChevronRight, Lightbulb,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface BrandImageAnalyzerProps {
  brandId: string;
  brandName: string;
  brandSlug?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadedFile {
  file: File;
  preview: string;
  url?: string;
  uploading: boolean;
  error?: string;
}

const MAX_FILES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const RECOMMENDED_IMAGES = [
  { icon: Camera, label: 'Brand Photography', description: 'Hero shots, lifestyle imagery, campaign photography' },
  { icon: Package, label: 'Product Shots', description: 'Product renders, packaging, catalog photography' },
  { icon: Palette, label: 'Logo Files', description: 'Primary logo, marks, wordmarks, reversed versions' },
  { icon: Megaphone, label: 'Campaign Creative', description: 'Ad units, social posts, OOH, digital banners' },
  { icon: LayoutGrid, label: 'Brand Collateral', description: 'Business cards, signage, environmental graphics' },
  { icon: Image, label: 'Style References', description: 'Mood boards, art direction samples, color inspiration' },
];

const IMAGE_PIPELINE_STEPS = [
  { num: 1, label: 'Upload', detail: 'Add brand images via drag-drop, file picker, or URL paste' },
  { num: 2, label: 'Analyze', detail: 'Gemini Vision extracts shot type, colors, mood, styling, and brand cues' },
  { num: 3, label: 'Synthesize', detail: 'Analysis merges into the unified Brand DNA profile' },
];

export function BrandImageAnalyzer({ brandId, brandName, brandSlug, open, onOpenChange }: BrandImageAnalyzerProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [analysisDirectives, setAnalysisDirectives] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Step tracking: 'upload' → 'analyze' → 'synthesize' → 'done'
  const [step, setStep] = useState<'upload' | 'analyze' | 'synthesize' | 'done'>('upload');
  const [analyzeResult, setAnalyzeResult] = useState<{ analyzed: number; failed: number } | null>(null);
  const [analysisSummaries, setAnalysisSummaries] = useState<Array<{
    image_url: string;
    image_category?: 'logo' | 'photo';
    shot_type: string;
    scene_context: string | null;
    mood: string | null;
    dominant_colors: string[];
    tags: string[];
  }>>([]);
  const [synthesisResult, setSynthesisResult] = useState<{
    updated_sections: string[];
    source_breakdown: { logos?: number; photos?: number; images: number; websites: number; documents: number };
    confidence_score: number;
  } | null>(null);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);
  const [isOfficialLogos, setIsOfficialLogos] = useState(false);

  const folder = `brands/${brandSlug || brandId}/references`;

  const resetState = () => {
    setUploadedFiles([]);
    setUrlInput('');
    setShowUrlInput(false);
    setAnalysisDirectives('');
    setStep('upload');
    setAnalyzeResult(null);
    setAnalysisSummaries([]);
    setSynthesisResult(null);
    setShowAnalysisDetails(false);
    setIsOfficialLogos(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  // --- File upload ---
  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from('media')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const addFiles = async (files: File[]) => {
    const validFiles = files.filter(f => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast.error(`${f.name}: unsupported type`);
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    const remaining = MAX_FILES - uploadedFiles.length;
    const toAdd = validFiles.slice(0, remaining);
    if (toAdd.length < validFiles.length) {
      toast.error(`Maximum ${MAX_FILES} images. ${validFiles.length - toAdd.length} skipped.`);
    }

    const newEntries: UploadedFile[] = toAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
    }));

    setUploadedFiles(prev => [...prev, ...newEntries]);
    setIsUploading(true);

    // Upload each file in parallel
    const results = await Promise.allSettled(
      toAdd.map(async (file, i) => {
        const url = await uploadFile(file);
        setUploadedFiles(prev =>
          prev.map((f, idx) =>
            idx === uploadedFiles.length + i ? { ...f, url, uploading: false } : f
          )
        );
        return url;
      })
    );

    // Mark failures
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        setUploadedFiles(prev =>
          prev.map((f, idx) =>
            idx === uploadedFiles.length + i
              ? { ...f, uploading: false, error: 'Upload failed' }
              : f
          )
        );
      }
    });

    setIsUploading(false);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const removed = prev[index];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) addFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) addFiles(files);
    e.target.value = '';
  };

  // --- Collect all URLs (uploaded + pasted) ---
  const getAllUrls = (): string[] => {
    const uploadUrls = uploadedFiles
      .filter(f => f.url && !f.error)
      .map(f => f.url!);
    const pastedUrls = urlInput
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.startsWith('http'));
    return [...uploadUrls, ...pastedUrls];
  };

  // --- Analyze ---
  const handleAnalyze = async () => {
    const urls = getAllUrls();
    if (urls.length === 0) {
      toast.error('Upload or paste at least one image');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeResult(null);

    try {
      // When "Official Logos" is on, hard-label all images as logos (skip Gemini classification)
      const categoryOverrides = isOfficialLogos
        ? Object.fromEntries(urls.map(url => [url, 'logo' as const]))
        : undefined;

      const { data, error } = await supabase.functions.invoke('analyze-brand-images', {
        body: {
          brand_id: brandId,
          image_urls: urls,
          analysis_directives: analysisDirectives.trim() || undefined,
          image_category_overrides: categoryOverrides,
          add_to_logo_library: isOfficialLogos || undefined,
        },
      });

      if (error) throw error;

      if (data?.success) {
        const analyzed = data.analyzed ?? 0;
        const failed = data.failed ?? 0;
        setAnalyzeResult({ analyzed, failed });
        if (data.summaries) setAnalysisSummaries(data.summaries);
        setStep('synthesize');

        queryClient.invalidateQueries({ queryKey: ['creative-studio-brand-profiles', brandId] });
        queryClient.invalidateQueries({ queryKey: ['creative-studio-brand-stats', brandId] });
        queryClient.invalidateQueries({ queryKey: ['creative-studio-brand-analyses', brandId] });

        toast.success(`Analyzed ${analyzed} image${analyzed !== 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''}`);
      } else {
        throw new Error(data?.error || 'Analysis failed');
      }
    } catch (err) {
      toast.error(`Analysis failed: ${String(err)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- Synthesize ---
  const handleSynthesize = async () => {
    setIsSynthesizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('synthesize-brand-profile', {
        body: { brand_id: brandId },
      });

      if (error) throw error;

      if (data?.success) {
        queryClient.invalidateQueries({ queryKey: ['creative-studio-brand-profiles', brandId] });
        queryClient.invalidateQueries({ queryKey: ['creative-studio-brand-stats', brandId] });
        setSynthesisResult({
          updated_sections: data.updated_sections || [],
          source_breakdown: data.source_breakdown || { images: 0, websites: 0, documents: 0 },
          confidence_score: data.confidence_score || 0,
        });
        setStep('done');
        toast.success(`Visual DNA profile synthesized — Confidence: ${Math.round((data.confidence_score || 0) * 100)}%`);
      } else {
        throw new Error(data?.error || 'Synthesis failed');
      }
    } catch (err) {
      toast.error(`Synthesis failed: ${String(err)}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const totalUrls = getAllUrls().length;
  const anyUploading = uploadedFiles.some(f => f.uploading);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            Brand Visual Intelligence
          </DialogTitle>
          <DialogDescription className="text-sm">
            Feed <strong className="text-foreground">{brandName}</strong>'s brand imagery to Gemini Vision — it extracts
            photography style, color palettes, visual mood, shot composition, and logo assets into your Brand DNA.
          </DialogDescription>
        </DialogHeader>

        {/* Pipeline stepper */}
        <div className="flex items-center gap-1 py-2 px-1">
          {IMAGE_PIPELINE_STEPS.map((ps, i) => {
            const stepOrder = ['upload', 'analyze', 'synthesize', 'done'];
            const currentIdx = stepOrder.indexOf(step);
            const isActive = ps.num - 1 === currentIdx || (step === 'done' && ps.num === 3);
            const isComplete = ps.num - 1 < currentIdx || step === 'done';
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
                      {i < IMAGE_PIPELINE_STEPS.length - 1 && (
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

        <div className="space-y-4">
          {/* Step: Upload */}
          {(step === 'upload' || step === 'synthesize') && (
            <>
              {/* Guidance section — shown when no images uploaded yet */}
              {step === 'upload' && uploadedFiles.length === 0 && (
                <div className="space-y-3">
                  {/* What the system does */}
                  <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/10">
                    <div className="flex items-start gap-2.5">
                      <Info className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium">How Brand Visual Intelligence works</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Upload brand images and Gemini Vision will analyze each one as an art director would — extracting{' '}
                          <strong className="text-foreground">shot type</strong>, <strong className="text-foreground">styling choices</strong>,{' '}
                          <strong className="text-foreground">lighting</strong>, <strong className="text-foreground">color treatment</strong>,{' '}
                          <strong className="text-foreground">mood</strong>, and <strong className="text-foreground">brand positioning</strong>.
                          Logos are auto-detected and their colors become the authoritative brand palette.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recommended image types */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Best images to upload</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {RECOMMENDED_IMAGES.map((img) => (
                        <div key={img.label} className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <img.icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium">{img.label}</p>
                            <p className="text-[10px] text-muted-foreground leading-snug">{img.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-500/5 border border-amber-500/10">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Tip:</strong> Upload a mix of logos and photography for the richest
                      extraction. Toggle <strong className="text-foreground">"These are official logos"</strong> when uploading
                      logos to hard-label them. Results are additive — each batch strengthens the brand's visual DNA.
                    </p>
                  </div>
                </div>
              )}

              {/* Drop zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <Image className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Drop images here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WebP — up to 10MB each, {MAX_FILES} images max
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Uploaded thumbnails */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>{uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} queued</Label>
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.map((f, i) => (
                      <div key={i} className="relative group w-16 h-16">
                        <img
                          src={f.preview}
                          alt=""
                          className={`w-16 h-16 rounded object-cover border ${f.error ? 'border-destructive opacity-50' : ''}`}
                        />
                        {f.uploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                          </div>
                        )}
                        {f.url && !f.error && (
                          <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-green-500 bg-white rounded-full" />
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          className="absolute -top-1 -left-1 h-4 w-4 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* URL paste toggle */}
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-xs gap-1 h-7"
                >
                  <Link className="h-3 w-3" />
                  Or paste image URLs
                  {showUrlInput ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
                {showUrlInput && (
                  <div className="mt-2 space-y-1">
                    <Textarea
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      placeholder={"https://example.com/hero-shot-1.jpg\nhttps://example.com/hero-shot-2.jpg"}
                      rows={4}
                      className="font-mono text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">One URL per line</p>
                  </div>
                )}
              </div>

              {/* Official logos toggle */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="official-logos" className="text-sm font-medium cursor-pointer">
                      These are official logos
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Hard-labels as logos (skips auto-detection) and adds to the brand's logo library
                    </p>
                  </div>
                </div>
                <Switch
                  id="official-logos"
                  checked={isOfficialLogos}
                  onCheckedChange={setIsOfficialLogos}
                />
              </div>

              {/* Analysis directives */}
              <div className="space-y-2">
                <Label>Analysis Directives (optional)</Label>
                <Textarea
                  value={analysisDirectives}
                  onChange={e => setAnalysisDirectives(e.target.value)}
                  placeholder="Focus on ingredient layering order, sauce drip patterns, bread coloring..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            </>
          )}

          {/* Step: Synthesize (post-analysis) */}
          {step === 'synthesize' && analyzeResult && (
            <div className="space-y-3">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">
                    Analyzed {analyzeResult.analyzed} image{analyzeResult.analyzed !== 1 ? 's' : ''} successfully
                    {analyzeResult.failed > 0 && (
                      <span className="text-amber-500"> ({analyzeResult.failed} failed)</span>
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Synthesize the analyses into a unified Visual DNA profile for this brand.
                </p>
                <Button onClick={handleSynthesize} disabled={isSynthesizing} className="gap-2">
                  {isSynthesizing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4" />
                  )}
                  Synthesize Visual DNA Profile
                </Button>
              </div>

              {/* Per-image analysis summaries */}
              {analysisSummaries.length > 0 && (
                <div className="border rounded-lg">
                  <button
                    onClick={() => setShowAnalysisDetails(!showAnalysisDetails)}
                    className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      What was extracted
                    </span>
                    {showAnalysisDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {showAnalysisDetails && (
                    <div className="border-t divide-y">
                      {analysisSummaries.map((summary, i) => (
                        <div key={i} className="p-3 space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="relative shrink-0">
                              <img
                                src={summary.image_url}
                                alt=""
                                className="w-12 h-12 rounded object-cover border"
                              />
                              {summary.image_category && (
                                <Badge
                                  variant={summary.image_category === 'logo' ? 'default' : 'secondary'}
                                  className="absolute -bottom-1 -right-1 text-[8px] px-1 py-0 h-3.5"
                                >
                                  {summary.image_category === 'logo' ? 'Logo' : 'Photo'}
                                </Badge>
                              )}
                            </div>
                            <div className="min-w-0 space-y-1">
                              <p className="text-sm font-medium truncate">{summary.shot_type}</p>
                              {summary.scene_context && (
                                <p className="text-xs text-muted-foreground">{summary.scene_context}</p>
                              )}
                              {summary.mood && (
                                <p className="text-xs text-muted-foreground">Mood: {summary.mood}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {summary.dominant_colors?.map((color, ci) => (
                              <div
                                key={ci}
                                className="w-5 h-5 rounded border"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                            {summary.tags?.slice(0, 5).map((tag, ti) => (
                              <span key={ti} className="text-[10px] px-1.5 py-0.5 bg-muted rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Visual DNA profile updated</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The brand's visual DNA has been synthesized from all analyzed sources. You can upload more images at any time.
              </p>

              {/* Synthesis details */}
              {synthesisResult && (
                <div className="space-y-2 pt-1">
                  {/* Source breakdown */}
                  <div className="text-xs text-muted-foreground">
                    Synthesized from{' '}
                    {[
                      (synthesisResult.source_breakdown.logos ?? 0) > 0 && `${synthesisResult.source_breakdown.logos} logo${synthesisResult.source_breakdown.logos !== 1 ? 's' : ''}`,
                      (synthesisResult.source_breakdown.photos ?? 0) > 0 && `${synthesisResult.source_breakdown.photos} photo${synthesisResult.source_breakdown.photos !== 1 ? 's' : ''}`,
                      !synthesisResult.source_breakdown.logos && !synthesisResult.source_breakdown.photos && synthesisResult.source_breakdown.images > 0 && `${synthesisResult.source_breakdown.images} image${synthesisResult.source_breakdown.images !== 1 ? 's' : ''}`,
                      synthesisResult.source_breakdown.websites > 0 && `${synthesisResult.source_breakdown.websites} website${synthesisResult.source_breakdown.websites !== 1 ? 's' : ''}`,
                      synthesisResult.source_breakdown.documents > 0 && `${synthesisResult.source_breakdown.documents} document${synthesisResult.source_breakdown.documents !== 1 ? 's' : ''}`,
                    ].filter(Boolean).join(', ')}
                    {' '}— Confidence: {Math.round(synthesisResult.confidence_score * 100)}%
                  </div>

                  {/* Updated sections */}
                  {synthesisResult.updated_sections.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {synthesisResult.updated_sections.map((section, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-700 dark:text-purple-300 rounded">
                          {section}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {step === 'done' ? 'Done' : 'Close'}
          </Button>
          {step === 'upload' && (
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || anyUploading || totalUrls === 0}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Analyze {totalUrls} Image{totalUrls !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
