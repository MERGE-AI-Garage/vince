// ABOUTME: Shared confirmation dialog for Gemini image generation actions
// ABOUTME: Used across Labs, Guidelines, and Creative Studio admin image surfaces

import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export interface PendingImageGeneration {
  label: string;
  count: number;
  onConfirm: () => void;
  model?: string;
  costTier?: 'High' | 'Low';
  costPerImage?: number;
}

interface ImageGenerationConfirmProps {
  pending: PendingImageGeneration | null;
  onCancel: () => void;
}

export function ImageGenerationConfirm({ pending, onCancel }: ImageGenerationConfirmProps) {
  return (
    <AlertDialog open={!!pending} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Confirm Image Generation
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                This will generate <strong>{pending?.label}</strong> using
                the Gemini API, which incurs usage charges on your Google Cloud account.
              </p>
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3 space-y-2">
                {pending?.model && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-medium">{pending.model}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Images</span>
                  <span className="font-medium">{pending?.count ?? 0}</span>
                </div>
                {pending?.costPerImage != null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Per image</span>
                    <span className="font-medium tabular-nums">${pending.costPerImage.toFixed(3)}</span>
                  </div>
                )}
                {pending?.costTier && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cost tier</span>
                    <Badge
                      variant={pending.costTier === 'High' ? 'destructive' : 'secondary'}
                      className="text-[10px]"
                    >
                      {pending.costTier === 'High' ? 'High — Pro model' : 'Low cost'}
                    </Badge>
                  </div>
                )}
                {pending?.costPerImage != null && (pending?.count ?? 0) > 0 && (
                  <div className="flex items-center justify-between text-sm pt-1 border-t border-border/30">
                    <span className="font-medium">Estimated total</span>
                    <span className={`font-semibold tabular-nums ${
                      pending.costPerImage * (pending?.count ?? 0) >= 2 ? 'text-amber-600 dark:text-amber-400' : ''
                    }`}>
                      ${(pending.costPerImage * (pending?.count ?? 0)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            pending?.onConfirm();
            onCancel();
          }}>
            Generate {pending?.count === 1 ? 'Image' : `${pending?.count} Images`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
