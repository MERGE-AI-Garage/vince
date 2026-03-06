// ABOUTME: Slide-out sheet panel for Vince (creative director agent) on Creative Studio
// ABOUTME: Right-side overlay with settings gear for admin configuration

import React, { useState } from 'react';
import { Camera, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { BrandAgentApp } from './BrandAgentApp';
import { BrandAgentSettingsPanel } from './BrandAgentSettingsPanel';
import type { CameraPreset } from '@/types/creative-studio';

interface BrandAgentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string | null;
  brandName: string;
  onApplyPrompt?: (prompt: string) => void;
  onApplyCameraPreset?: (preset: CameraPreset) => void;
  onApplyModel?: (modelId: string) => void;
  onBrandCreated?: (brandId: string) => void;
}

export function BrandAgentPanel({
  open,
  onOpenChange,
  brandId,
  brandName,
  onApplyPrompt,
  onApplyCameraPreset,
  onApplyModel,
  onBrandCreated,
}: BrandAgentPanelProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[480px] p-0 flex flex-col"
        >
          <SheetHeader className="px-4 py-3 border-b border-border/50 shrink-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                <Camera className="h-4 w-4 text-purple-500" />
              </div>
              Vince
              <span className="text-xs font-normal text-muted-foreground">Creative Director</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden relative">
            {open && (
              <BrandAgentApp
                brandId={brandId}
                brandName={brandName}
                onApplyPrompt={onApplyPrompt}
                onApplyCameraPreset={onApplyCameraPreset}
                onApplyModel={onApplyModel}
                onClose={() => onOpenChange(false)}
                onBrandCreated={onBrandCreated}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-4 right-4 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-background"
              onClick={() => setSettingsOpen(true)}
              title="Vince Settings"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <BrandAgentSettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
