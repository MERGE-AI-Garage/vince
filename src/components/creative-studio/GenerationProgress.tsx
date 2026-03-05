// ABOUTME: Progress indicator for Creative Studio generation
// ABOUTME: Shows step-by-step progress with elapsed time and status messages

import { Loader2, Sparkles, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { GenerationStatus } from '@/types/creative-studio';

interface GenerationProgressProps {
  status: GenerationStatus;
  errorMessage?: string;
  generationType?: string;
  startTime?: number;
  onRetry?: () => void;
}

interface ProgressStep {
  label: string;
  thresholdSeconds: number;
}

const imageSteps: ProgressStep[] = [
  { label: 'Preparing request', thresholdSeconds: 0 },
  { label: 'Generating image', thresholdSeconds: 3 },
  { label: 'Applying settings', thresholdSeconds: 8 },
  { label: 'Finalizing output', thresholdSeconds: 12 },
];

const videoSteps: ProgressStep[] = [
  { label: 'Preparing request', thresholdSeconds: 0 },
  { label: 'Generating frames', thresholdSeconds: 5 },
  { label: 'Compositing video', thresholdSeconds: 20 },
  { label: 'Encoding output', thresholdSeconds: 40 },
  { label: 'Finalizing', thresholdSeconds: 55 },
];

export function GenerationProgress({
  status,
  errorMessage,
  generationType = 'image',
  startTime,
  onRetry,
}: GenerationProgressProps) {
  const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
  const isVideo = generationType.includes('video');
  const steps = isVideo ? videoSteps : imageSteps;
  const estimatedTime = isVideo ? 60 : 15;
  const progressPercent = Math.min((elapsed / estimatedTime) * 100, 95);

  // Determine current step
  const currentStepIndex = steps.reduce((idx, step, i) =>
    elapsed >= step.thresholdSeconds ? i : idx, 0);

  if (status === 'failed') {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Generation Failed</AlertTitle>
          <AlertDescription>
            {errorMessage || 'An unexpected error occurred. Please try again.'}
          </AlertDescription>
        </Alert>
        {onRetry && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="font-semibold text-lg mb-1">Generation Complete!</h3>
        <p className="text-sm text-muted-foreground">
          Your {generationType.replace(/_/g, ' ')} is ready
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
      {/* Animated icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center animate-pulse">
          <Sparkles className="h-10 w-10 text-purple-500" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-24 w-24 text-purple-500/30 animate-spin" />
        </div>
      </div>

      {/* Step indicators */}
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-1">
          {steps.map((step, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-1.5 rounded-full transition-all ${
                  i < currentStepIndex
                    ? 'bg-purple-500'
                    : i === currentStepIndex
                    ? 'bg-purple-500 animate-pulse'
                    : 'bg-muted'
                }`}
              />
              <span className={`text-[10px] ${
                i <= currentStepIndex ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs space-y-2">
        <Progress value={progressPercent} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{elapsed}s elapsed</span>
          <span>~{isVideo ? '30-60' : '10-20'}s estimated</span>
        </div>
      </div>
    </div>
  );
}
