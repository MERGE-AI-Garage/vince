// ABOUTME: Admin UI for editing Brand DNA system prompts (website analysis, image analysis, profile synthesis)
// ABOUTME: Fetches prompts by category='brand-dna' from ai_prompt_templates and allows inline editing

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, RotateCcw, Dna } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

const PROMPT_LABELS: Record<string, { label: string; description: string }> = {
  'brand-website-analysis': {
    label: 'Website Analysis',
    description: 'Sent to Gemini when analyzing a brand website for colors, fonts, logo, tone, and values',
  },
  'brand-image-analysis': {
    label: 'Image Analysis',
    description: 'Sent to Gemini when analyzing brand reference images for photography style and visual metadata',
  },
  'brand-profile-synthesis': {
    label: 'Profile Synthesis',
    description: 'Sent to Gemini when synthesizing a unified brand DNA profile from multiple analysis sources',
  },
};

export function BrandDNAPrompts() {
  const queryClient = useQueryClient();

  const { data: prompts, isLoading } = useQuery({
    queryKey: ['brand-dna-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_prompt_templates')
        .select('id, name, slug, description, prompt_text, function_target, is_active, usage_count, last_used_at, updated_at')
        .eq('category', 'brand-dna')
        .order('name');
      if (error) throw error;
      return data as BrandDNAPrompt[];
    },
  });

  const updatePrompt = useMutation({
    mutationFn: async ({ id, prompt_text }: { id: string; prompt_text: string }) => {
      const { error } = await supabase
        .from('ai_prompt_templates')
        .update({ prompt_text, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-dna-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['ai-prompt-templates'] });
    },
  });

  // Track per-prompt editing state
  const [editState, setEditState] = useState<Record<string, string>>({});

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
    }
  }, [prompts]);

  const isDirty = (prompt: BrandDNAPrompt) =>
    editState[prompt.id] !== undefined && editState[prompt.id] !== prompt.prompt_text;

  const handleSave = async (prompt: BrandDNAPrompt) => {
    const text = editState[prompt.id];
    if (!text || text === prompt.prompt_text) return;
    try {
      await updatePrompt.mutateAsync({ id: prompt.id, prompt_text: text });
      toast.success(`${PROMPT_LABELS[prompt.slug]?.label || prompt.name} prompt saved`);
    } catch {
      toast.error('Failed to save prompt');
    }
  };

  const handleReset = (prompt: BrandDNAPrompt) => {
    setEditState(prev => ({ ...prev, [prompt.id]: prompt.prompt_text }));
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
      <p className="text-sm text-muted-foreground">
        System prompts sent to Gemini during brand analysis. Changes take effect on the next analysis run.
      </p>

      {prompts.map(prompt => {
        const meta = PROMPT_LABELS[prompt.slug];
        const dirty = isDirty(prompt);
        return (
          <Card key={prompt.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">{meta?.label || prompt.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {meta?.description || prompt.description || prompt.slug}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
              <Textarea
                value={editState[prompt.id] ?? prompt.prompt_text}
                onChange={e => setEditState(prev => ({ ...prev, [prompt.id]: e.target.value }))}
                className="font-mono text-xs min-h-[200px] resize-y"
                rows={12}
              />
              {dirty && (
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleReset(prompt)}>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Revert
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave(prompt)}
                    disabled={updatePrompt.isPending}
                  >
                    {updatePrompt.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3 mr-1" />
                    )}
                    Save
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
