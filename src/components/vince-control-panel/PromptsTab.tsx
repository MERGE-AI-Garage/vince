// ABOUTME: Greetings & system prompts tab for Vince Control Panel
// ABOUTME: Greeting template management, context-aware greetings toggle

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, X, GripVertical, RotateCw, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  getBrandAgentSettings,
  clearBrandAgentSettingsCache,
  DEFAULT_GREETING_TEMPLATES,
} from '@/services/brand-agent/brandAgentSettings';
import { toast } from 'sonner';

export const PromptsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [newGreeting, setNewGreeting] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['brand-agent-settings'],
    queryFn: getBrandAgentSettings,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase
        .from('brand_agent_settings')
        .update(updates)
        .eq('id', 'default');
      if (error) throw error;
    },
    onSuccess: () => {
      clearBrandAgentSettingsCache();
      queryClient.invalidateQueries({ queryKey: ['brand-agent-settings'] });
    },
    onError: (error) => {
      console.error('[Vince Settings] Update failed:', error);
      toast.error('Failed to update settings');
    },
  });

  if (!settings) return null;

  const greetings = settings.greeting_templates || DEFAULT_GREETING_TEMPLATES;

  const addGreeting = () => {
    if (!newGreeting.trim()) return;
    const current = settings.greeting_templates || [...DEFAULT_GREETING_TEMPLATES];
    const updated = [...current, newGreeting.trim()];
    updateMutation.mutate({ greeting_template: JSON.stringify(updated) });
    setNewGreeting('');
  };

  const removeGreeting = (index: number) => {
    const current = settings.greeting_templates || [...DEFAULT_GREETING_TEMPLATES];
    const updated = current.filter((_, i) => i !== index);
    updateMutation.mutate({ greeting_template: updated.length > 0 ? JSON.stringify(updated) : null });
  };

  return (
    <div className="space-y-6">
      {/* Greeting Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                Greeting Templates
              </CardTitle>
              <CardDescription>
                Vince randomly selects a greeting when a conversation starts. Templates support variable substitution.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {greetings.length} templates
              </Badge>
              {settings.greeting_templates && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateMutation.mutate({ greeting_template: null })}
                >
                  <RotateCw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newGreeting}
              onChange={(e) => setNewGreeting(e.target.value)}
              placeholder="Add a greeting template..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') addGreeting();
              }}
            />
            <Button
              variant="outline"
              size="icon"
              disabled={!newGreeting.trim()}
              onClick={addGreeting}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1 border rounded-lg p-3">
            {greetings.map((tpl, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group">
                <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                <span className="flex-1 text-sm">{tpl}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => removeGreeting(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Available variables:</p>
              <p>
                <code className="px-1 py-0.5 bg-background rounded">{'{name}'}</code> User's first name{' '}
                <code className="px-1 py-0.5 bg-background rounded">{'{brandName}'}</code> Active brand{' '}
                <code className="px-1 py-0.5 bg-background rounded">{'{totalPrompts}'}</code> Prompt count{' '}
                <code className="px-1 py-0.5 bg-background rounded">{'{imagesAnalyzed}'}</code> Analysis count{' '}
                <code className="px-1 py-0.5 bg-background rounded">{'{timeOfDay}'}</code> morning/afternoon/evening
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Context-Aware Greetings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-purple-500" />
            Context-Aware Greetings
          </CardTitle>
          <CardDescription>
            When enabled, Vince appends a brand health callout to the greeting (missing profile, low image count, stale analysis, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label>Enable Context Greetings</Label>
              <p className="text-xs text-muted-foreground">Append brand health status to greetings</p>
            </div>
            <Switch
              checked={settings.enable_context_greetings}
              onCheckedChange={(checked) => updateMutation.mutate({ enable_context_greetings: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
