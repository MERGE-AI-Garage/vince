// ABOUTME: Dialog for synthesizing brand analyses into a unified Brand DNA profile
// ABOUTME: Shows source inventory, explains the synthesis pipeline, and displays results with confidence score

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Brain, Loader2, CheckCircle, ChevronRight, Info, Lightbulb,
  Image, Globe, FileText, Sparkles, Camera, BookOpen,
  Palette, LayoutGrid, Type, MessageSquare, Wand2, Package,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { BrandImageAnalysis } from '@/hooks/useCreativeStudioBrandIntelligence';

interface BrandSynthesizeDialogProps {
  brandId: string;
  brandName: string;
  analyses: BrandImageAnalysis[];
  hasProfile: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SynthesisResult {
  confidence_score: number;
  updated_sections: string[];
  source_breakdown: {
    logos: number;
    photos: number;
    images: number;
    websites: number;
    documents: number;
  };
  images_analyzed: number;
}

const PIPELINE_STEPS = [
  { num: 1, label: 'Gather', detail: 'Collect all analyses — website crawls, image extractions, and document imports' },
  { num: 2, label: 'Synthesize', detail: 'Gemini merges overlapping data using source-weighted rules (logos > docs > websites > photos)' },
  { num: 3, label: 'Profile', detail: 'Write the unified Brand DNA profile — visual DNA, colors, typography, tone, brand story' },
];

const SECTION_ICONS: Record<string, typeof Brain> = {
  'Visual DNA': Sparkles,
  'Photography Style': Camera,
  'Color Profile': Palette,
  'Composition Rules': LayoutGrid,
  'Product Catalog': Package,
  'Brand Identity': Brain,
  'Tone of Voice': MessageSquare,
  'Typography': Type,
  'Art Direction Rules': Wand2,
  'Post-Production Style': Image,
  'Brand Story': BookOpen,
};

export function BrandSynthesizeDialog({
  brandId,
  brandName,
  analyses,
  hasProfile,
  open,
  onOpenChange,
}: BrandSynthesizeDialogProps) {
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<'ready' | 'running' | 'done' | 'error'>('ready');
  const [result, setResult] = useState<SynthesisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Count sources from analyses
  const sourceCount = {
    images: analyses.filter(a => a.source_type === 'image' || !a.source_type).length,
    websites: analyses.filter(a => a.source_type === 'website').length,
    documents: analyses.filter(a => a.source_type === 'document').length,
  };
  const totalSources = sourceCount.images + sourceCount.websites + sourceCount.documents;

  const handleSynthesize = async () => {
    setPhase('running');
    setErrorMessage('');
    try {
      const { data, error } = await supabase.functions.invoke('synthesize-brand-profile', {
        body: { brand_id: brandId },
      });
      if (error) throw error;
      if (data?.success) {
        setResult({
          confidence_score: data.confidence_score || 0,
          updated_sections: data.updated_sections || [],
          source_breakdown: data.source_breakdown || { logos: 0, photos: 0, images: 0, websites: 0, documents: 0 },
          images_analyzed: data.images_analyzed || 0,
        });
        setPhase('done');
        queryClient.invalidateQueries({ queryKey: ['creative-studio-brand-profiles', brandId] });
        queryClient.invalidateQueries({ queryKey: ['creative-studio-brand-stats', brandId] });
        queryClient.invalidateQueries({ queryKey: ['creative-studio-brands'] });
      } else {
        throw new Error(data?.error || 'Synthesis failed');
      }
    } catch (err) {
      setErrorMessage(String(err));
      setPhase('error');
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setPhase('ready');
      setResult(null);
      setErrorMessage('');
    }
    onOpenChange(isOpen);
  };

  const confidencePercent = result ? Math.round(result.confidence_score * 100) : 0;
  const confidenceColor = confidencePercent >= 70
    ? 'text-purple-600'
    : confidencePercent >= 40
      ? 'text-amber-600'
      : 'text-red-500';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto brand-guidelines-panel">
        <DialogHeader className="pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <Brain className="h-4 w-4" />
            </div>
            Synthesize Brand Profile
          </DialogTitle>
          <DialogDescription className="text-sm">
            Merge all intelligence sources for <strong className="text-foreground">{brandName}</strong> into
            a unified Brand DNA profile — the single source of truth for creative generation.
          </DialogDescription>
        </DialogHeader>

        {/* Pipeline stepper */}
        <div className="flex items-center gap-1 py-2 px-1">
          {PIPELINE_STEPS.map((ps, i) => {
            const isComplete = phase === 'done'
              ? true
              : phase === 'running'
                ? ps.num === 1
                : false;
            const isActive = phase === 'done'
              ? false
              : phase === 'running'
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
                      {i < PIPELINE_STEPS.length - 1 && (
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

        {/* Pre-synthesis: explanation + source inventory */}
        {phase === 'ready' && (
          <div className="space-y-3">
            {/* How it works */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-violet-500/5 to-purple-500/5 border border-violet-500/10">
              <div className="flex items-start gap-2.5">
                <Info className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">How Brand Synthesis works</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Gemini reads every analysis you've gathered — website crawls, image extractions, and document
                    imports — then merges them into one coherent profile using{' '}
                    <strong className="text-foreground">source-weighted rules</strong>.
                    Logo colors always take precedence. Documents define brand story and guidelines.
                    Website data anchors tone, fonts, and values. Photography informs visual style.
                  </p>
                </div>
              </div>
            </div>

            {/* Source inventory */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Intelligence sources</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-card/50">
                  <Image className="h-4 w-4 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{sourceCount.images}</p>
                    <p className="text-[10px] text-muted-foreground">Image{sourceCount.images !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-card/50">
                  <Globe className="h-4 w-4 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{sourceCount.websites}</p>
                    <p className="text-[10px] text-muted-foreground">Website{sourceCount.websites !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-card/50">
                  <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{sourceCount.documents}</p>
                    <p className="text-[10px] text-muted-foreground">Document{sourceCount.documents !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            </div>

            {totalSources === 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">No sources yet.</strong> Analyze a website, upload brand images,
                    or import documents first — synthesis needs at least one analysis to build from.
                  </p>
                </div>
              </div>
            )}

            {totalSources > 0 && (
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-500/5 border border-amber-500/10">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Tip:</strong> The more diverse your sources, the richer the profile.
                  A mix of logos, photography, website content, and brand documents yields the highest confidence scores.
                  {hasProfile && ' This will update the existing profile with any new data.'}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSynthesize}
                disabled={totalSources === 0}
                className="gap-2"
              >
                <Brain className="h-4 w-4" />
                {hasProfile ? 'Re-Synthesize Profile' : 'Synthesize Profile'}
              </Button>
            </div>
          </div>
        )}

        {/* Running synthesis */}
        {phase === 'running' && (
          <div className="py-8 space-y-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-violet-500" />
            <div className="space-y-1">
              <p className="font-medium">Synthesizing Brand DNA...</p>
              <p className="text-sm text-muted-foreground">
                Merging {totalSources} source{totalSources !== 1 ? 's' : ''} into a unified profile.
                This may take 10–20 seconds.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="space-y-3">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm font-medium text-destructive">Synthesis failed</p>
              <p className="text-xs text-muted-foreground mt-1">{errorMessage}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>Close</Button>
              <Button onClick={handleSynthesize} className="gap-2">
                <Brain className="h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {phase === 'done' && result && (
          <div className="space-y-4">
            {/* Confidence score */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-violet-500/5 to-purple-500/5 border border-violet-500/10 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Profile Confidence</p>
              <p className={`text-4xl font-bold ${confidenceColor}`}>{confidencePercent}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on {result.images_analyzed} total analys{result.images_analyzed !== 1 ? 'es' : 'is'} across{' '}
                {[
                  result.source_breakdown.logos > 0 && `${result.source_breakdown.logos} logo${result.source_breakdown.logos !== 1 ? 's' : ''}`,
                  result.source_breakdown.photos > 0 && `${result.source_breakdown.photos} photo${result.source_breakdown.photos !== 1 ? 's' : ''}`,
                  result.source_breakdown.websites > 0 && `${result.source_breakdown.websites} website${result.source_breakdown.websites !== 1 ? 's' : ''}`,
                  result.source_breakdown.documents > 0 && `${result.source_breakdown.documents} document${result.source_breakdown.documents !== 1 ? 's' : ''}`,
                ].filter(Boolean).join(', ')}
              </p>
            </div>

            {/* Updated sections */}
            {result.updated_sections.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sections populated</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {result.updated_sections.map((section) => {
                    const Icon = SECTION_ICONS[section] || Brain;
                    return (
                      <div key={section} className="flex items-center gap-2 p-2 rounded-md bg-purple-500/5 border border-purple-500/10">
                        <CheckCircle className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-medium">{section}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button onClick={() => handleClose(false)} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
