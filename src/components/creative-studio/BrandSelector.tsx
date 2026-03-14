// ABOUTME: Brand context hub for Creative Studio with intelligence status and quick actions
// ABOUTME: Shows brand selection, intelligence badges with tooltips, and DNA/template shortcuts

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookMarked, Shield, Dna, BookOpen, Lightbulb, Images, ScrollText,
} from 'lucide-react';
import { useBrandStats } from '@/hooks/useCreativeStudioBrandIntelligence';
import { useBrandReferenceCollections } from '@/hooks/useBrandReferences';
import type { CreativeStudioBrand } from '@/types/creative-studio';

interface BrandSelectorProps {
  brands: CreativeStudioBrand[] | undefined;
  selectedBrandId: string | null;
  onSelectBrand: (brandId: string | null) => void;
  onOpenPromptLibrary?: () => void;
  onOpenBrandAgent?: () => void;
  onOpenBrandDNA?: () => void;
  onOpenCorporateDNA?: () => void;
  onOpenBrandStandards?: () => void;
  onOpenGuidelines?: () => void;
  disabled?: boolean;
}

export function BrandSelector({
  brands,
  selectedBrandId,
  onSelectBrand,
  onOpenPromptLibrary,
  onOpenBrandDNA,
  onOpenCorporateDNA,
  onOpenBrandStandards,
  onOpenGuidelines,
  disabled = false,
}: BrandSelectorProps) {
  const activeBrands = brands?.filter(b => b.is_active) || [];
  const selectedBrand = activeBrands.find(b => b.id === selectedBrandId);
  const { data: stats } = useBrandStats(selectedBrandId ?? undefined);
  const { data: collections } = useBrandReferenceCollections(selectedBrandId ?? undefined);

  return (
    <div className="flex items-center gap-2 min-w-0" data-tour="brand-selector">
      <Select
        value={selectedBrandId || 'none'}
        onValueChange={(value) => onSelectBrand(value === 'none' ? null : value)}
        disabled={disabled || activeBrands.length === 0}
      >
        <SelectTrigger className="w-[220px] h-8 text-xs">
          <SelectValue placeholder="Select brand">
            {selectedBrand ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: selectedBrand.primary_color }}
                />
                <span className="font-medium">{selectedBrand.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Select a brand to get started</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">No Brand</span>
          </SelectItem>
          {activeBrands.map((brand) => (
            <SelectItem key={brand.id} value={brand.id}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: brand.primary_color }}
                />
                <span>{brand.name}</span>
                {brand.is_default && (
                  <Badge variant="secondary" className="text-[8px] h-4 px-1">Default</Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Brand intelligence badges with tooltips */}
      {selectedBrand && stats && (
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-1.5" data-tour="brand-intel-badges">
            {stats.promptCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-6 px-2.5 cursor-pointer shadow-sm border border-border/40 hover:border-primary/30 hover:shadow transition-all"
                    onClick={onOpenPromptLibrary}
                  >
                    <BookMarked className="w-3 h-3 mr-1 text-primary" />
                    {stats.promptCount} templates
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Saved prompt templates for this brand</p>
                </TooltipContent>
              </Tooltip>
            )}
            {stats.directiveCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-[10px] h-6 px-2.5 shadow-sm border border-border/40">
                    <Shield className="w-3 h-3 mr-1 text-primary" />
                    {stats.directiveCount} directives
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Brand compliance rules that guide AI generation</p>
                </TooltipContent>
              </Tooltip>
            )}
            {collections && collections.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-[10px] h-6 px-2.5 shadow-sm border border-border/40">
                    <Images className="w-3 h-3 mr-1 text-primary" />
                    {collections.length} collection{collections.length !== 1 ? 's' : ''}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Reference image collections for product fidelity</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      )}

      {/* Quick action buttons */}
      {selectedBrand && (
        <div className="flex items-center gap-1 ml-auto">
          {onOpenBrandDNA && stats?.hasProfile && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenBrandDNA}
              className="h-7 text-[11px] px-2.5 gap-1.5 shadow-sm hover:shadow border border-border/50 hover:border-primary/30 transition-all"
            >
              <Dna className="w-3.5 h-3.5 text-primary" />
              Brand DNA
            </Button>
          )}
          {onOpenCorporateDNA && stats?.hasProfile && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenCorporateDNA}
              className="h-7 text-[11px] px-2.5 gap-1.5 shadow-sm hover:shadow border border-border/50 hover:border-primary/30 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              Corporate DNA
            </Button>
          )}
          {onOpenBrandStandards && stats?.hasProfile && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenBrandStandards}
              className="h-7 text-[11px] px-2.5 gap-1.5 shadow-sm hover:shadow border border-border/50 hover:border-primary/30 transition-all"
            >
              <ScrollText className="w-3.5 h-3.5 text-primary" />
              Brand Guidelines
            </Button>
          )}
          {onOpenGuidelines && stats?.hasProfile && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenGuidelines}
              className="h-7 text-[11px] px-2.5 gap-1.5 shadow-sm hover:shadow border border-border/50 hover:border-primary/30 transition-all"
            >
              <Lightbulb className="w-3.5 h-3.5 text-primary" />
              AI Guidelines
            </Button>
          )}
          {onOpenPromptLibrary && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenPromptLibrary}
              className="h-7 text-[11px] px-2 gap-1 shadow-sm hover:shadow border border-border/50 hover:border-primary/30 transition-all"
            >
              <BookMarked className="w-3 h-3 text-primary" />
              Templates
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
