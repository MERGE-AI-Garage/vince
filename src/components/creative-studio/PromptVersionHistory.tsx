// ABOUTME: Visual timeline for Brand DNA prompt version history
// ABOUTME: Shows collapsible version entries with full content preview and rollback confirmation

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { History, RotateCcw, Clock, ChevronDown, ChevronRight, ChevronUp, Check } from 'lucide-react';
import {
  usePromptVersions,
  useRestorePromptVersion,
  type PromptVersion,
} from '@/hooks/usePromptVersions';
import { format } from 'date-fns';

interface PromptVersionHistoryProps {
  promptId: string;
  currentContent: string;
}

export const PromptVersionHistory: React.FC<PromptVersionHistoryProps> = ({
  promptId,
  currentContent,
}) => {
  const { data: versions = [], isLoading } = usePromptVersions(promptId);
  const restoreVersion = useRestorePromptVersion();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<PromptVersion | null>(null);

  const handleRestore = () => {
    if (!rollbackTarget) return;
    restoreVersion.mutate({ versionToRestore: rollbackTarget });
    setRollbackTarget(null);
  };

  if (isLoading) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1 py-2">
        <History className="w-3 h-3" />
        Loading version history...
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1 py-2">
        <History className="w-3 h-3" />
        No version history yet. Versions are created when you save changes.
      </div>
    );
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground p-0 h-auto">
            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <History className="w-3 h-3" />
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
            {versions.slice(0, 10).map((version, index) => {
              const isCurrent = version.content === currentContent;
              const isExpanded = expandedVersion === version.id;

              return (
                <Collapsible
                  key={version.id}
                  open={isExpanded}
                  onOpenChange={() => setExpandedVersion(isExpanded ? null : version.id)}
                >
                  <div
                    className={`border rounded-lg transition-colors ${
                      isCurrent ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          {/* Timeline dot */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${
                                isCurrent ? 'bg-primary' : 'bg-muted-foreground/30'
                              }`}
                            />
                            {index < Math.min(versions.length, 10) - 1 && (
                              <div className="w-0.5 h-3 bg-muted-foreground/20 mt-0.5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">v{version.version_number}</span>
                              {isCurrent && (
                                <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                                  <Check className="h-2.5 w-2.5 mr-0.5" />
                                  Current
                                </Badge>
                              )}
                            </div>
                            {version.change_summary && (
                              <p className="text-[11px] text-muted-foreground italic mt-0.5">
                                {version.change_summary}
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {format(new Date(version.created_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isCurrent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRollbackTarget(version);
                              }}
                              disabled={restoreVersion.isPending}
                            >
                              <RotateCcw className="w-3 h-3" />
                              Rollback
                            </Button>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-3 pb-3">
                        <div className="bg-muted rounded-lg p-3 mt-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                              Prompt Text
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {version.content.length.toLocaleString()} chars
                            </span>
                          </div>
                          <pre className="text-xs font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto break-words">
                            {version.content}
                          </pre>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
            {versions.length > 10 && (
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                Showing 10 of {versions.length} versions
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Rollback Confirmation */}
      <AlertDialog open={!!rollbackTarget} onOpenChange={() => setRollbackTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rollback to Version {rollbackTarget?.version_number}</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new version with the content from v{rollbackTarget?.version_number} and
              update the active prompt. The current version will remain in history — this action can
              be undone by rolling back again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={restoreVersion.isPending}
            >
              {restoreVersion.isPending ? 'Rolling back...' : 'Rollback'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
