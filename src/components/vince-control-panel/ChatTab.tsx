// ABOUTME: Chat & features tab for Vince Control Panel
// ABOUTME: Text model, chat system prompt, feature toggles, and quick prompt library

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings2, Globe, Image, Camera, Zap, MessageSquare, Plus, X, GripVertical, RotateCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  getBrandAgentSettings,
  clearBrandAgentSettingsCache,
  GEMINI_TEXT_MODELS,
  DEFAULT_QUICK_PROMPTS,
  DEFAULT_CHAT_PROMPT,
} from '@/services/brand-agent/brandAgentSettings';
import { toast } from 'sonner';

export const ChatTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [newPrompt, setNewPrompt] = useState('');

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

  return (
    <div className="space-y-6">
      {/* Model & Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-purple-500" />
            Model & Features
          </CardTitle>
          <CardDescription>
            Configure Vince's text chat model and creative capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Text Model (Chat Mode)</Label>
            <Select
              value={settings.text_model}
              onValueChange={(value) => updateMutation.mutate({ text_model: value })}
            >
              <SelectTrigger className="max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GEMINI_TEXT_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{model.label}</span>
                      <span className="text-xs text-muted-foreground">{model.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-500" />
                  <Label>Google Search</Label>
                </div>
                <p className="text-xs text-muted-foreground">Search the web for current info</p>
              </div>
              <Switch
                checked={settings.enable_google_search}
                onCheckedChange={(checked) => updateMutation.mutate({ enable_google_search: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-purple-500" />
                  <Label>Image Upload</Label>
                </div>
                <p className="text-xs text-muted-foreground">Reference image uploads</p>
              </div>
              <Switch
                checked={settings.enable_image_upload}
                onCheckedChange={(checked) => updateMutation.mutate({ enable_image_upload: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-purple-500" />
                  <Label>Camera Controls</Label>
                </div>
                <p className="text-xs text-muted-foreground">Aperture, focal length, lighting</p>
              </div>
              <Switch
                checked={settings.enable_camera_controls}
                onCheckedChange={(checked) => updateMutation.mutate({ enable_camera_controls: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat System Prompt */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                Chat System Prompt
              </CardTitle>
              <CardDescription>
                Personality and behavioral instructions for text chat mode. Brand data is automatically appended.
              </CardDescription>
            </div>
            {settings.chat_system_prompt && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateMutation.mutate({ chat_system_prompt: null })}
              >
                Reset to default
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={settings.chat_system_prompt || ''}
            onChange={(e) => updateMutation.mutate({ chat_system_prompt: e.target.value || null })}
            placeholder={DEFAULT_CHAT_PROMPT}
            className="min-h-[200px] font-mono text-xs"
          />
        </CardContent>
      </Card>

      {/* Quick Prompts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                Quick Prompts
              </CardTitle>
              <CardDescription>
                Suggested prompts shown as chips below the chat input. Vince cycles through them in groups.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {settings.quick_prompts.length} prompts
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateMutation.mutate({ quick_prompts: JSON.stringify(DEFAULT_QUICK_PROMPTS) })}
              >
                <RotateCw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Display Count</Label>
              <Badge variant="outline">{settings.quick_prompts_display_count} at a time</Badge>
            </div>
            <Slider
              value={[settings.quick_prompts_display_count]}
              min={3}
              max={8}
              step={1}
              className="max-w-md"
              onValueChange={(value) => updateMutation.mutate({ quick_prompts_display_count: value[0] })}
            />
          </div>

          <div className="flex gap-2">
            <Input
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Enter a new quick prompt..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newPrompt.trim()) {
                  const updated = [...settings.quick_prompts, newPrompt.trim()];
                  updateMutation.mutate({ quick_prompts: JSON.stringify(updated) });
                  setNewPrompt('');
                }
              }}
            />
            <Button
              variant="outline"
              size="icon"
              disabled={!newPrompt.trim()}
              onClick={() => {
                if (newPrompt.trim()) {
                  const updated = [...settings.quick_prompts, newPrompt.trim()];
                  updateMutation.mutate({ quick_prompts: JSON.stringify(updated) });
                  setNewPrompt('');
                }
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1 border rounded-lg p-3">
            {settings.quick_prompts.map((prompt, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group">
                <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                <span className="flex-1 text-sm">{prompt}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => {
                    const updated = settings.quick_prompts.filter((_, i) => i !== index);
                    updateMutation.mutate({ quick_prompts: JSON.stringify(updated) });
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
