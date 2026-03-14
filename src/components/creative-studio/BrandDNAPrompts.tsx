// ABOUTME: Admin UI for editing Brand DNA system prompts (website analysis, image analysis, profile synthesis)
// ABOUTME: Supports prompt versioning — each save creates a version record with optional change summary

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Save, RotateCcw, Dna, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCreatePromptVersion } from '@/hooks/usePromptVersions';
import { PromptVersionHistory } from './PromptVersionHistory';

interface BrandDNAPrompt {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  prompt_text: string;
  function_target: string | null;
  is_active: boolean;
  usage_count: number;
  last_used_at: string | null;
  updated_at: string;
}

const PROMPT_LABELS: Record<string, {
  label: string;
  description: string;
  trigger: string;
  variables?: string[];
}> = {
  'brand-website-analysis': {
    label: 'Website Analysis',
    description: 'Sent to Gemini when analyzing a brand website for colors, fonts, logo, tone, and values.',
    trigger: 'Triggered when a brand has a website URL and website analysis is run.',
  },
  'brand-image-analysis': {
    label: 'Image Analysis',
    description: 'Sent to Gemini when analyzing brand reference images for photography style and visual metadata.',
    trigger: 'Default fallback for all brands without a specialized image analysis prompt.',
  },
  'brand-image-analysis-food': {
    label: 'Image Analysis — Food & Restaurant',
    description: 'Specialized image analysis for food and restaurant brands (plating, lighting, cuisine style).',
    trigger: 'Auto-selected when the brand category matches food or restaurant.',
  },
  'brand-profile-synthesis': {
    label: 'Profile Synthesis',
    description: 'Sent to Gemini to synthesize a unified brand DNA profile from website, image, and document analyses.',
    trigger: 'Always runs as the final step after all individual analyses complete.',
  },
  'brand-document-analysis': {
    label: 'Document Analysis',
    description: 'Sent to Gemini when analyzing uploaded brand documents (PDFs, decks, style guides).',
    trigger: 'Triggered when a brand document is uploaded and processed.',
  },
  'brand-hero-image': {
    label: 'Hero Image Generation',
    description: 'Prompt template used when generating brand hero/header images.',
    trigger: 'Used during image generation for brand hero assets.',
    variables: ['{{brand_name}}', '{{brand_category}}', '{{primary_color}}', '{{secondary_color}}', '{{visual_identity}}'],
  },
};

export function BrandDNAPrompts() {
  const createVersion = useCreatePromptVersion();

  const { data: prompts, isLoading } = useQuery({
    queryKey: ['brand-dna-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_prompt_templates')
        .select('id, name, slug, description, prompt_text, function_target, is_active, usage_count, last_used_at, updated_at')
        .in('category', ['brand-dna', 'brand'])
        .order('category')
        .order('name');
      if (error) throw error;
      return data as BrandDNAPrompt[];
    },
  });

  // Per-prompt editing state
  const [editState, setEditState] = useState<Record<string, string>>({});
  // Per-prompt version creation options
  const [createVersionState, setCreateVersionState] = useState<Record<string, boolean>>({});
  const [summaryState, setSummaryState] = useState<Record<string, string>>({});

  // Sync edit state when prompts load
  useEffect(() => {
    if (prompts) {
      setEditState(prev => {
        const next: Record<string, string> = {};
        for (const p of prompts) {
          next[p.id] = prev[p.id] ?? p.prompt_text;
        }
        return next;
      });
      setCreateVersionState(prev => {
        const next: Record<string, boolean> = {};
        for (const p of prompts) {
          next[p.id] = prev[p.id] ?? true;
        }
        return next;
      });
    }
  }, [prompts]);

  const isDirty = (prompt: BrandDNAPrompt) =>
    editState[prompt.id] !== undefined && editState[prompt.id] !== prompt.prompt_text;

  const handleSave = async (prompt: BrandDNAPrompt) => {
    const text = editState[prompt.id];
    if (!text || text === prompt.prompt_text) return;

    const shouldVersion = createVersionState[prompt.id] ?? true;
    const summary = summaryState[prompt.id]?.trim() || undefined;

    try {
      if (shouldVersion) {
        await createVersion.mutateAsync({ promptId: prompt.id, content: text, changeSummary: summary });
      } else {
        // Save without creating a version record
        const { error } = await supabase
          .from('ai_prompt_templates')
          .update({ prompt_text: text, updated_at: new Date().toISOString() })
          .eq('id', prompt.id);
        if (error) throw error;
      }
      setSummaryState(prev => ({ ...prev, [prompt.id]: '' }));
      toast.success(`${PROMPT_LABELS[prompt.slug]?.label || prompt.name} saved`);
    } catch {
      toast.error('Failed to save prompt');
    }
  };

  const handleReset = (prompt: BrandDNAPrompt) => {
    setEditState(prev => ({ ...prev, [prompt.id]: prompt.prompt_text }));
    setSummaryState(prev => ({ ...prev, [prompt.id]: '' }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!prompts?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Dna className="h-4 w-4" />
            Brand DNA Prompts
          </CardTitle>
          <CardDescription>No Brand DNA prompts found in the database</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Dna className="h-4 w-4" />
        <h3 className="text-base font-semibold">Brand DNA Prompts</h3>
        <Badge variant="outline" className="text-xs">{prompts.length} prompts</Badge>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 p-4 space-y-1.5 text-sm">
        <p className="font-medium text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          These are live system prompts sent to Gemini during brand analysis.
        </p>
        <ul className="text-amber-800 dark:text-amber-300 space-y-1 text-xs pl-5 list-disc">
          <li>Changes take effect immediately on the next analysis run — there is no staging environment.</li>
          <li>Specialized prompts (e.g., Food &amp; Restaurant) are auto-selected based on brand category. All others fall back to the generic variant.</li>
          <li>Each save can create a version record so you can roll back if a change breaks analysis output.</li>
        </ul>
      </div>

      {prompts.map(prompt => {
        const meta = PROMPT_LABELS[prompt.slug];
        const dirty = isDirty(prompt);
        const shouldVersion = createVersionState[prompt.id] ?? true;

        return (
          <Card key={prompt.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">{meta?.label || prompt.name}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {meta?.description || prompt.description || prompt.slug}
                  </CardDescription>
                  {meta?.trigger && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium">When triggered:</span> {meta.trigger}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                  {prompt.usage_count > 0 && (
                    <span>{prompt.usage_count} uses</span>
                  )}
                  <Badge variant={prompt.is_active ? 'default' : 'outline'} className="text-[10px]">
                    {prompt.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {meta?.variables && (
                <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium">Available variables:</span>{' '}
                  {meta.variables.map(v => (
                    <code key={v} className="font-mono bg-background px-1 rounded mr-1">{v}</code>
                  ))}
                </div>
              )}
              <Textarea
                value={editState[prompt.id] ?? prompt.prompt_text}
                onChange={e => setEditState(prev => ({ ...prev, [prompt.id]: e.target.value }))}
                className="font-mono text-xs min-h-[200px] resize-y"
                rows={12}
              />

              <PromptVersionHistory
                promptId={prompt.id}
                currentContent={prompt.prompt_text}
              />

              {dirty && (
                <div className="space-y-2 pt-1 border-t">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`version-${prompt.id}`}
                      checked={shouldVersion}
                      onCheckedChange={checked =>
                        setCreateVersionState(prev => ({ ...prev, [prompt.id]: !!checked }))
                      }
                    />
                    <Label htmlFor={`version-${prompt.id}`} className="text-xs font-normal cursor-pointer">
                      Save as a new version (recommended)
                    </Label>
                  </div>
                  {shouldVersion && (
                    <Input
                      placeholder="Change summary (optional) — e.g. 'Tightened food plating instructions'"
                      value={summaryState[prompt.id] || ''}
                      onChange={e => setSummaryState(prev => ({ ...prev, [prompt.id]: e.target.value }))}
                      className="text-xs h-8"
                    />
                  )}
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleReset(prompt)}>
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Revert
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSave(prompt)}
                      disabled={createVersion.isPending}
                      title="Overwrites the active prompt. Changes take effect on the next analysis run."
                    >
                      {createVersion.isPending ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3 mr-1" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
