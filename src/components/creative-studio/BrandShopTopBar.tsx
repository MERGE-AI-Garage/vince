// ABOUTME: Minimal 44px top bar for Creative Studio full-bleed layout
// ABOUTME: Glass morphism bar with logo, brand selector, status, and action buttons

import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  BookOpen,
  Bot,
  ChevronLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BrandSelector } from '@/components/creative-studio/BrandSelector';
import { cn } from '@/lib/utils';
import type { CreativeStudioBrand } from '@/types/creative-studio';

interface BrandShopTopBarProps {
  // Brand state
  brands: CreativeStudioBrand[] | undefined;
  selectedBrandId: string | null;
  onSelectBrand: (brandId: string | null) => void;
  // Prompt callbacks
  onSetPrompt: (prompt: string) => void;
  onOpenPromptLibrary: () => void;
  onToggleVince: () => void;
  vinceActive: boolean;
  onOpenBrandDNA?: () => void;
  onOpenCorporateDNA?: () => void;
  onOpenBrandStandards?: () => void;
  onOpenGuidelines?: () => void;
  onOpenMediaLibrary: () => void;
  // Theme
  studioTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  // Status
  statusText: string;
  statusColor: string;
  statusPulse: boolean;
}

export function BrandShopTopBar({
  brands,
  selectedBrandId,
  onSelectBrand,
  onSetPrompt,
  onOpenPromptLibrary,
  onToggleVince,
  vinceActive,
  onOpenBrandDNA,
  onOpenCorporateDNA,
  onOpenBrandStandards,
  onOpenGuidelines,
  onOpenMediaLibrary,
  studioTheme,
  onToggleTheme,
  statusText,
  statusColor,
  statusPulse,
}: BrandShopTopBarProps) {
  const navigate = useNavigate();

  return (
    <header
      className="h-11 flex items-center justify-between px-3 border-b shrink-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
      style={{
        backgroundColor: 'hsl(var(--cs-surface-1))',
        borderBottomColor: 'hsl(var(--cs-border-subtle))',
      }}
    >
      {/* Left: Logo + Back */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => navigate('/')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <img
          src="/mergelogos/Merge_Logo_Primary_Viridian-Green_RGB.png"
          alt="MERGE"
          className="h-4 w-auto select-none"
        />
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-muted/50 rounded-full select-none">
          <div className={`w-1.5 h-1.5 ${statusColor} rounded-full ${statusPulse ? 'animate-pulse' : ''}`} />
          <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap tracking-tight">
            {statusText === 'Ready' ? 'Creative Studio' : statusText}
          </span>
        </div>


      </div>

      {/* Center: Brand Context */}
      <div className="flex-1 min-w-0 mx-3">
        <BrandSelector
          brands={brands}
          selectedBrandId={selectedBrandId}
          onSelectBrand={onSelectBrand}
          onOpenPromptLibrary={onOpenPromptLibrary}
          onOpenBrandAgent={onToggleVince}
          onOpenBrandDNA={onOpenBrandDNA}
          onOpenCorporateDNA={onOpenCorporateDNA}
          onOpenBrandStandards={onOpenBrandStandards}
          onOpenGuidelines={onOpenGuidelines}
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <TooltipProvider delayDuration={200}>
          {/* Library */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onOpenMediaLibrary}
              >
                <FolderOpen className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Media Library</p>
            </TooltipContent>
          </Tooltip>

          {/* AI Library */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onOpenPromptLibrary}
              >
                <BookOpen className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">AI Library</p>
            </TooltipContent>
          </Tooltip>

          {/* Dark Mode Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onToggleTheme}
              >
                <Sun className="h-3.5 w-3.5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute h-3.5 w-3.5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{studioTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Vince */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={vinceActive ? 'secondary' : 'ghost'}
                size="icon"
                className={cn('h-7 w-7', vinceActive && 'text-purple-500')}
                onClick={onToggleVince}
              >
                <Bot className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{vinceActive ? 'Vince (active)' : 'Vince'}</p>
            </TooltipContent>
          </Tooltip>


        </TooltipProvider>
      </div>
    </header>
  );
}
