// ABOUTME: Horizontal toolbar with 6 edit tools for Creative Studio
// ABOUTME: Supports keyboard shortcuts (B/R/I/S/E/U) and contextual tool options

import {
  Wand2, Lasso, Trash2, Maximize2, ArrowUpFromLine, Paintbrush,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCreativeStudioEditStore, type EditTool, type ExpansionDirection } from '@/store/creative-studio-edit-store';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface ToolConfig {
  id: EditTool;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hotkey: string;
  description: string;
}

const tools: ToolConfig[] = [
  {
    id: 'background-swap',
    icon: Wand2,
    label: 'Background Swap',
    hotkey: 'B',
    description: 'Replace background automatically',
  },
  {
    id: 'object-remove',
    icon: Trash2,
    label: 'Remove Object',
    hotkey: 'R',
    description: 'Remove unwanted objects',
  },
  {
    id: 'object-insert',
    icon: Paintbrush,
    label: 'Insert Object',
    hotkey: 'I',
    description: 'Add objects to masked area',
  },
  {
    id: 'foreground-swap',
    icon: Lasso,
    label: 'Swap Subject',
    hotkey: 'S',
    description: 'Replace main subject',
  },
  {
    id: 'canvas-expand',
    icon: Maximize2,
    label: 'Expand Canvas',
    hotkey: 'E',
    description: 'Outpaint to extend image',
  },
  {
    id: 'upscale',
    icon: ArrowUpFromLine,
    label: 'Upscale',
    hotkey: 'U',
    description: 'Enhance resolution 2x/4x',
  },
];

const expansionDirections: Array<{ id: ExpansionDirection; icon: React.ComponentType<{ className?: string }>; label: string }> = [
  { id: 'left', icon: ArrowLeft, label: 'Left' },
  { id: 'right', icon: ArrowRight, label: 'Right' },
  { id: 'top', icon: ArrowUp, label: 'Up' },
  { id: 'bottom', icon: ArrowDown, label: 'Down' },
];

export function ToolsBar() {
  const {
    activeTool, setActiveTool,
    expansionDirection, setExpansionDirection,
    upscaleFactor, setUpscaleFactor,
  } = useCreativeStudioEditStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const tool = tools.find(t => t.hotkey.toLowerCase() === e.key.toLowerCase());
      if (tool) {
        e.preventDefault();
        setActiveTool(tool.id);
      }

      // ESC to deselect
      if (e.key === 'Escape') {
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [setActiveTool]);

  return (
    <div className="space-y-2">
      {/* Tool Buttons */}
      <div className="flex items-center justify-center gap-2 py-3 px-4 bg-card/50 backdrop-blur-sm border-t border-border">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTool(tool.id)}
                  className={cn(
                    'p-3 rounded-lg transition-all',
                    'border hover:shadow-lg',
                    isActive
                      ? 'bg-primary border-primary text-primary-foreground shadow-md'
                      : 'bg-card/80 border-border hover:border-primary hover:bg-primary/10'
                  )}
                >
                  <tool.icon className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-primary-foreground' : 'text-foreground'
                  )} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {tool.label} <kbd className="ml-1 px-1 py-0.5 bg-muted rounded text-[10px]">{tool.hotkey}</kbd>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Expansion Direction Selector */}
      {activeTool === 'canvas-expand' && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-muted/30 rounded-lg border border-border">
          <span className="text-xs text-muted-foreground mr-1">Direction:</span>
          {expansionDirections.map((dir) => {
            const isActive = expansionDirection === dir.id;
            return (
              <button
                key={dir.id}
                onClick={() => setExpansionDirection(dir.id)}
                title={`Expand ${dir.label}`}
                className={cn(
                  'p-2 rounded-md transition-all border',
                  isActive
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-card/80 border-border hover:border-primary hover:bg-primary/10'
                )}
              >
                <dir.icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      )}

      {/* Upscale Factor Selector */}
      {activeTool === 'upscale' && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-muted/30 rounded-lg border border-border">
          <span className="text-xs text-muted-foreground mr-1">Factor:</span>
          {(['x2', 'x4'] as const).map((factor) => {
            const isActive = upscaleFactor === factor;
            return (
              <button
                key={factor}
                onClick={() => setUpscaleFactor(factor)}
                className={cn(
                  'px-4 py-1.5 rounded-md transition-all border text-sm font-medium',
                  isActive
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-card/80 border-border hover:border-primary hover:bg-primary/10'
                )}
              >
                {factor.toUpperCase()}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
