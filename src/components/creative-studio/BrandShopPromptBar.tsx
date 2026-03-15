// ABOUTME: Bottom-anchored prompt bar for Brand Shop (ChatGPT/Midjourney-style)
// ABOUTME: Glass morphism bar with prompt textarea, mode selector, generate button, and keyboard shortcuts

import { useRef, useCallback, useEffect } from 'react';
import {
  Loader2,
  Sparkles,
  Video,
  Image,
  Edit,
  ArrowUpCircle,
  ShoppingBag,
  Shirt,
  MessageSquare,
  Paintbrush,
  Send,
  Clock,
  History,
  SlidersHorizontal,
  FlaskConical,
  X,
  Upload,
  Star,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { PromptExpander } from '@/components/creative-studio/PromptExpander';
import { useCreativeStudioStore } from '@/store/creative-studio-store';

export type GenerationMode = 'image' | 'video' | 'edit' | 'upscale' | 'recontext' | 'tryon' | 'conversation';

const MODE_CONFIG: { mode: GenerationMode; icon: React.ElementType; label: string; shortLabel: string; requiresConversation?: boolean }[] = [
  { mode: 'image', icon: Image, label: 'Generate Image', shortLabel: 'Generate' },
  { mode: 'edit', icon: Edit, label: 'Edit Image', shortLabel: 'Edit' },
  { mode: 'video', icon: Video, label: 'Generate Video', shortLabel: 'Video' },
  { mode: 'upscale', icon: ArrowUpCircle, label: 'Upscale Image', shortLabel: 'Upscale' },
  { mode: 'recontext', icon: ShoppingBag, label: 'Product Recontext', shortLabel: 'Product' },
  { mode: 'tryon', icon: Shirt, label: 'Virtual Try-On', shortLabel: 'Try-On' },
  { mode: 'conversation', icon: MessageSquare, label: 'Chat Edit', shortLabel: 'Chat', requiresConversation: true },
];

interface BrandShopPromptBarProps {
  // Prompt state
  prompt: string;
  onPromptChange: (prompt: string) => void;
  showPromptInput: boolean;
  placeholder: string;
  // Mode
  generationType: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  supportsConversation: boolean;
  // Generation
  onGenerate: () => void;
  isGenerating: boolean;
  currentOperation: string;
  currentProgress: number;
  currentElapsedSeconds: number;
  generateLabel: string;
  // Edit tools
  activeTool: string;
  currentMask: string | null;
  selectionMode: string;
  currentImage: string | null;
  onOpenMaskingCanvas: () => void;
  // Save template
  selectedBrandId: string | null;
  onSaveTemplate: () => void;
  // Drawers
  onToggleHistory: () => void;
  historyOpen: boolean;
  onToggleSettings: () => void;
  settingsOpen: boolean;
  vinceActive?: boolean;
  // Quota
  quotaExhausted?: boolean;
  // Manual edit detection
  onManualEdit?: () => void;
  // Lab mode
  labMode?: boolean;
  onToggleLabGuide?: () => void;
  labGuideOpen?: boolean;
}

export function BrandShopPromptBar({
  prompt,
  onPromptChange,
  showPromptInput,
  placeholder,
  generationType,
  onModeChange,
  supportsConversation,
  onGenerate,
  isGenerating,
  currentOperation,
  currentProgress,
  currentElapsedSeconds,
  generateLabel,
  activeTool,
  currentMask,
  selectionMode,
  currentImage,
  onOpenMaskingCanvas,
  selectedBrandId,
  onSaveTemplate,
  onToggleHistory,
  historyOpen,
  onToggleSettings,
  settingsOpen,
  vinceActive = false,
  quotaExhausted = false,
  onManualEdit,
  labMode = false,
  onToggleLabGuide,
  labGuideOpen = false,
}: BrandShopPromptBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { setCurrentImage } = useCreativeStudioStore();

  const handleUploadFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setCurrentImage(`data:${file.type};base64,${base64}`);
    };
    reader.readAsDataURL(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  }, [setCurrentImage]);

  // Auto-resize textarea (only grows, never shrinks below user-set height)
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onPromptChange(e.target.value);
    onManualEdit?.();
    const el = e.target;
    if (el.scrollHeight > el.clientHeight) {
      el.style.height = Math.min(el.scrollHeight, 240) + 'px';
    }
  }, [onPromptChange, onManualEdit]);

  // Keyboard shortcut: Cmd/Ctrl+Enter to generate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isGenerating) onGenerate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, onGenerate]);

  const showMaskButton = selectionMode === 'manual' && activeTool !== 'select' && activeTool !== 'upscale' && !!currentImage;

  return (
    <div
      className="shrink-0 border-t z-20"
      style={{ backgroundColor: 'hsl(var(--cs-surface-1))', borderTopColor: 'hsl(var(--cs-border-subtle))' }}
    >
      {/* Mode bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/30">
        <TooltipProvider delayDuration={200}>
          {MODE_CONFIG.map(({ mode, icon: Icon, label, shortLabel, requiresConversation }) => {
            if (requiresConversation && !supportsConversation) return null;
            return (
              <Tooltip key={mode}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onModeChange(mode)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
                      generationType === mode
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-black/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border/50 hover:shadow-sm'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{shortLabel}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>

        {/* Upload Image — inline with mode buttons */}
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          onChange={handleUploadFile}
          className="hidden"
        />
        <button
          onClick={() => uploadInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border/50 hover:shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Image</span>
        </button>

        <div className="flex-1" />

        {/* Edit tool active indicator */}
        {activeTool !== 'select' && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-medium text-primary">
              {activeTool.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            {currentMask && (
              <span className="text-[9px] px-1 py-0.5 bg-primary/20 rounded text-primary">Mask</span>
            )}
          </div>
        )}

        {/* Manual mask button */}
        {showMaskButton && (
          <Button
            variant={currentMask ? 'outline' : 'default'}
            size="sm"
            onClick={onOpenMaskingCanvas}
            className="h-6 text-[10px] gap-1"
          >
            <Paintbrush className="w-3 h-3" />
            {currentMask ? 'Edit Mask' : 'Mask'}
          </Button>
        )}

        {/* Showcase */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-[#1ED75F] hover:text-[#1ED75F] hover:bg-[#1ED75F]/10"
              onClick={() => navigate('/showcase')}
            >
              <Star className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Vince Showcase</p>
          </TooltipContent>
        </Tooltip>

        {/* Drawer toggles */}
        <div className="flex items-center gap-0.5 ml-2">
          {onToggleLabGuide && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={labGuideOpen ? 'secondary' : 'ghost'}
                  size="icon"
                  className={cn('h-7 w-7', labGuideOpen && 'text-amber-500')}
                  onClick={onToggleLabGuide}
                >
                  <FlaskConical className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Lab Guide</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={historyOpen ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={onToggleHistory}
              >
                <History className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">History</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={settingsOpen ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7 relative"
                onClick={onToggleSettings}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {vinceActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#1ED75F] rounded-full" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{vinceActive ? 'Settings (Vince active)' : 'Settings'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Prompt input area */}
      {showPromptInput && generationType !== 'conversation' && (
        <div className="flex items-end gap-2 px-3 py-2">
          <div className="flex-1 relative">
            <PromptExpander
              currentPrompt={prompt}
              onExpandPrompt={onPromptChange}
              mode={generationType === 'video' ? 'video' : 'image'}
            />
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handleInput}
              placeholder={placeholder}
              rows={4}
              className="w-full pl-9 pr-3 py-2 bg-muted/30 border border-border/50 rounded-lg resize-y focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50 text-sm leading-relaxed"
              style={{ minHeight: '100px', maxHeight: '240px' }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  if (!isGenerating) onGenerate();
                }
              }}
            />
            {prompt && (
              <button
                type="button"
                onClick={() => { onPromptChange(''); onManualEdit?.(); }}
                className="absolute top-1.5 right-2 p-0.5 rounded hover:bg-muted/60 text-muted-foreground/50 hover:text-foreground transition-colors"
                title="Clear prompt"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="absolute bottom-1.5 right-2 text-[9px] text-muted-foreground/40">
              {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
            </div>
          </div>

          {/* Save template button */}
          {selectedBrandId && prompt.trim() && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onSaveTemplate}
              title="Save as template"
              className="h-10 px-4 text-xs shrink-0 shadow-sm border border-border/50 hover:border-primary/30 hover:shadow transition-all"
            >
              Save
            </Button>
          )}

          {/* Generate button */}
          {currentOperation === 'generating' ? (
            <span className="relative inline-flex shrink-0 rounded-full p-px text-sm font-bold leading-6 text-[#1ED75F]/70">
              <span className="relative flex items-center gap-2 z-10 rounded-full bg-card dark:bg-[#0D1B16] py-2 px-5 ring-1 ring-border/60 dark:ring-white/10">
                <Loader2 className="w-4 h-4 animate-spin" />
                <div className="flex flex-col items-start">
                  <span className="text-xs text-foreground">
                    {generationType === 'video' ? 'Video' : 'Generating'}... {currentElapsedSeconds > 0 ? `${currentElapsedSeconds}s` : `${Math.round(currentProgress)}%`}
                  </span>
                  {currentElapsedSeconds > 0 && (
                    <span className="text-[9px] opacity-70 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {Math.round(currentProgress)}% — ~{generationType.includes('video') ? '30-60' : '10-20'}s estimated
                    </span>
                  )}
                </div>
              </span>
            </span>
          ) : quotaExhausted ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="relative inline-flex shrink-0 rounded-full p-px text-sm font-bold leading-6 text-muted-foreground opacity-60 cursor-not-allowed">
                    <span className="relative flex items-center gap-1.5 z-10 rounded-full bg-card dark:bg-[#0D1B16] py-2 px-5 ring-1 ring-border/60 dark:ring-white/10">
                      <Send className="w-4 h-4" />
                      Quota reached
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Weekly {generationType === 'video' ? 'video' : 'image'} limit reached. Resets Monday.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 shrink-0 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-md shadow-black/25 hover:shadow-lg hover:shadow-black/30 hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {generateLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
