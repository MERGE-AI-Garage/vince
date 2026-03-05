// ABOUTME: Persistent lab instructions sidebar for Creative Studio hands-on exercises
// ABOUTME: Shows objectives, progress, generation gallery, and submission controls alongside the canvas

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FlaskConical,
  ChevronDown,
  ChevronRight,
  Check,
  CheckCircle2,
  XCircle,
  Send,
  ArrowLeft,
  ArrowRight,
  Image,
  Target,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import type { LabConfig, LabSubmission } from '@/hooks/useEnablementPrograms';
import type { GenerationWithDetails } from '@/types/creative-studio';

interface LabGuidePanelProps {
  open: boolean;
  onToggle: () => void;
  labConfig: LabConfig;
  labSubmission: LabSubmission | null;
  generations: GenerationWithDetails[];
  onSelectForSubmission: (generationId: string) => void;
  selectedGenerationId: string | null;
  onSubmit: () => void;
  isSubmitting: boolean;
  onExitLab: () => void;
  passingScore: number;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function LabGuidePanel({
  open,
  onToggle,
  labConfig,
  labSubmission,
  generations,
  onSelectForSubmission,
  selectedGenerationId,
  onSubmit,
  isSubmitting,
  onExitLab,
  passingScore,
  onRetry,
  isRetrying,
}: LabGuidePanelProps) {
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const [criteriaOpen, setCriteriaOpen] = useState(false);

  const minGenerations = labConfig.constraints?.min_generations || 1;
  const generationCount = generations.length;
  const hasEnoughGenerations = generationCount >= minGenerations;
  const hasSelection = selectedGenerationId !== null;
  const canSubmit = hasEnoughGenerations && hasSelection && !isSubmitting;
  const isAlreadySubmitted = labSubmission?.submitted_at !== null && labSubmission?.submitted_at !== undefined;
  const isEvaluating = labSubmission?.evaluation_status === 'evaluating';
  const isEvaluated = labSubmission?.evaluation_status === 'completed';
  const isEvaluationFailed = labSubmission?.evaluation_status === 'failed';
  const evaluationPassed = isEvaluated && (labSubmission?.score ?? 0) >= passingScore;

  const progressPercent = Math.min(
    (generationCount / minGenerations) * 100,
    100
  );

  const isVideoLab = labConfig.lab_type === 'video_generation';
  const mediaLabel = isVideoLab ? 'video' : 'image';

  const getDisabledReason = (): string | null => {
    if (isAlreadySubmitted) return 'Lab already submitted';
    if (!hasEnoughGenerations)
      return `Generate at least ${minGenerations} ${mediaLabel}${minGenerations > 1 ? 's' : ''}`;
    if (!hasSelection) return `Select a ${mediaLabel} to submit`;
    return null;
  };

  const disabledReason = getDisabledReason();

  // Collapsed state — just a thin strip with expand toggle
  if (!open) {
    return (
      <div
        className="h-full flex flex-col items-center py-2 px-1 border-r flex-shrink-0"
        style={{ backgroundColor: 'hsl(var(--cs-surface-1))', borderRightColor: 'hsl(var(--cs-border-subtle))' }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 mb-2"
          onClick={onToggle}
          aria-label="Expand lab guide"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </Button>
        <div className="flex flex-col items-center gap-2 mt-1">
          <FlaskConical className="w-4 h-4 text-amber-500" />
          <span className="text-[9px] font-medium text-amber-600 [writing-mode:vertical-lr] rotate-180">
            Lab Guide
          </span>
          {generationCount > 0 && (
            <Badge variant="secondary" className="text-[8px] h-4 w-4 p-0 flex items-center justify-center">
              {generationCount}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col flex-shrink-0 border-r"
      style={{
        width: 300,
        backgroundColor: 'hsl(var(--cs-surface-1))',
        borderRightColor: 'hsl(var(--cs-border-subtle))',
      }}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b flex-shrink-0" style={{ borderBottomColor: 'hsl(var(--cs-border-subtle))' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
            {labConfig.title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggle}
            aria-label="Collapse lab guide"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </Button>
        </div>
        <button
          onClick={onExitLab}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Course
        </button>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-3 py-3 space-y-4">
          {/* Instructions */}
          <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen}>
            <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-left group">
              {instructionsOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className="text-xs font-semibold">Instructions</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-3">
              {/* Objective callout */}
              <div className="flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                <Target className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  {labConfig.objective}
                </p>
              </div>

              {/* Step list */}
              <ol className="space-y-2 pl-1">
                {labConfig.instructions.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-[11px] leading-relaxed p-1.5 rounded-md hover:bg-muted/30 transition-colors">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-foreground/80">{step}</span>
                  </li>
                ))}
              </ol>
            </CollapsibleContent>
          </Collapsible>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium">Progress</span>
              <span className="text-[10px] text-muted-foreground">
                {generationCount} of {minGenerations} min
              </span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
            {hasEnoughGenerations && (
              <p className="text-[10px] text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Minimum met
              </p>
            )}
          </div>

          {/* Generation gallery */}
          <div className="space-y-2">
            <span className="text-[11px] font-medium">Your Generations</span>
            {generationCount === 0 ? (
              <div className="text-center py-6">
                <Image className="w-6 h-6 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-[10px] text-muted-foreground">
                  No generations yet. Start creating!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {generations.map((gen) => {
                  const imageUrl = gen.output_urls?.[0];
                  const isSelected = selectedGenerationId === gen.id;

                  return (
                    <button
                      key={gen.id}
                      onClick={() => onSelectForSubmission(gen.id)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all text-left ${
                        isSelected
                          ? 'ring-2 ring-amber-500 border-amber-500'
                          : 'border-transparent hover:border-muted-foreground/30'
                      }`}
                    >
                      {imageUrl ? (
                        imageUrl.endsWith('.mp4') || imageUrl.endsWith('.webm') ? (
                          <video
                            src={imageUrl}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="w-full aspect-square object-cover"
                          />
                        ) : (
                          <img
                            src={imageUrl}
                            alt={gen.prompt_text || 'Generation'}
                            className="w-full aspect-square object-cover"
                          />
                        )
                      ) : (
                        <div className="w-full aspect-square bg-muted flex items-center justify-center">
                          <Image className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}

                      {gen.prompt_text && (
                        <p className="p-1 text-[9px] text-muted-foreground line-clamp-2 leading-tight">
                          {gen.prompt_text}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Evaluation criteria */}
          {labConfig.evaluation_criteria.length > 0 && (
            <Collapsible open={criteriaOpen} onOpenChange={setCriteriaOpen}>
              <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-left group">
                {criteriaOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span className="text-xs font-semibold">Evaluation Criteria</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {labConfig.evaluation_criteria.map((criterion) => (
                  <div
                    key={criterion.name}
                    className="p-2 rounded-md border bg-muted/30"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-medium">{criterion.name}</span>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                        {Math.round(criterion.weight * 100)}%
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {criterion.description}
                    </p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </ScrollArea>

      {/* Sticky submit/status section */}
      <div className="px-3 py-2.5 border-t flex-shrink-0 space-y-2" style={{ borderTopColor: 'hsl(var(--cs-border-subtle))' }}>
        {/* Evaluating state */}
        {isEvaluating && (
          <div className="flex items-center justify-center gap-2 py-2 text-[11px] text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
            Evaluating your submission...
          </div>
        )}

        {/* Failed state */}
        {isEvaluationFailed && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] text-red-600">
              <XCircle className="w-3.5 h-3.5" />
              Evaluation failed
            </div>
            <Button
              onClick={onSubmit}
              size="sm"
              className="w-full h-7 text-[11px] gap-1.5"
            >
              <ArrowRight className="w-3 h-3" />
              Retry Evaluation
            </Button>
          </div>
        )}

        {/* Evaluated state — mini score card */}
        {isEvaluated && (
          <div className="space-y-1.5">
            <div className={`flex items-center gap-2 p-2 rounded-md border ${
              evaluationPassed
                ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20'
                : 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20'
            }`}>
              <span className="text-lg font-bold tabular-nums">{labSubmission?.score ?? 0}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  {evaluationPassed ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Target className="w-3 h-3 text-amber-600" />
                  )}
                  <span className={`text-[10px] font-medium ${evaluationPassed ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {evaluationPassed ? 'Passed' : 'Almost There'}
                  </span>
                </div>
                {labSubmission?.feedback_summary && (
                  <p className="text-[9px] text-muted-foreground line-clamp-2 mt-0.5">
                    {labSubmission.feedback_summary}
                  </p>
                )}
              </div>
            </div>
            {evaluationPassed ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onExitLab}
                className="w-full h-7 text-[11px] gap-1.5"
              >
                View Full Results
                <ArrowRight className="w-3 h-3" />
              </Button>
            ) : (
              <div className="space-y-1">
                {onRetry && (labSubmission?.attempt_number ?? 1) < 3 ? (
                  <Button
                    size="sm"
                    onClick={onRetry}
                    disabled={isRetrying}
                    className="w-full h-7 text-[11px] gap-1.5"
                  >
                    {isRetrying ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3 h-3" />
                    )}
                    Try Again ({(labSubmission?.attempt_number ?? 1) + 1} of 3)
                  </Button>
                ) : (labSubmission?.attempt_number ?? 1) >= 3 ? (
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 text-center">
                    All 3 attempts used. An instructor will follow up.
                  </p>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExitLab}
                  className="w-full h-7 text-[11px] gap-1.5"
                >
                  View Full Results
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Default submit controls (not yet submitted or pending) */}
        {!isEvaluating && !isEvaluated && !isEvaluationFailed && (
          <>
            {disabledReason && (
              <p className="text-[10px] text-muted-foreground text-center">
                {disabledReason}
              </p>
            )}
            <Button
              onClick={onSubmit}
              disabled={!canSubmit}
              className="w-full h-8 text-xs gap-1.5"
            >
              {isSubmitting ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit Lab
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
