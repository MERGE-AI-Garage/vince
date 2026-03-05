// ABOUTME: Admin settings panel for Vince (creative director agent)
// ABOUTME: Configures voice, chat prompts, visualizer, brand defaults, and feature toggles

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Camera, Volume2, Palette, RotateCw, Loader2, MessageSquare, Zap, Plus, X, GripVertical, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  getBrandAgentSettings,
  clearBrandAgentSettingsCache,
  GEMINI_VOICES,
  GEMINI_LIVE_MODELS,
  GEMINI_TEXT_MODELS,
  type GeminiVoice,
  DEFAULT_VOICE_PROMPT,
  DEFAULT_CHAT_PROMPT,
  DEFAULT_GREETING_TEMPLATES,
  DEFAULT_QUICK_PROMPTS,
} from '@/services/brand-agent/brandAgentSettings';
import { toast } from 'sonner';

interface BrandAgentSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BrandAgentSettingsPanel: React.FC<BrandAgentSettingsPanelProps> = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const [newPrompt, setNewPrompt] = useState('');
  const [newGreeting, setNewGreeting] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['brand-agent-settings'],
    queryFn: getBrandAgentSettings,
    enabled: open,
  });

  const { data: brands } = useQuery({
    queryKey: ['creative-studio-brands-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('creative_studio_brands')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      return data || [];
    },
    enabled: open,
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
      console.error('[Brand Agent Settings] Update failed:', error);
      toast.error('Failed to update settings');
    },
  });

  if (isLoading || !settings) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-purple-500" />
            Vince Settings
          </DialogTitle>
          <DialogDescription>
            Configure Vince's voice, prompts, and creative capabilities
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="space-y-6 py-4 pr-4">
            {/* Branding Card */}
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500 via-purple-600 to-violet-700 p-[1px]">
              <div className="rounded-lg bg-background/95 backdrop-blur-sm p-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Camera className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">Vince — Creative Director</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Voice: <span className="font-medium text-foreground">{settings.voice_name}</span> /
                      Chat: <span className="font-medium text-foreground">{settings.text_model.includes('3') ? 'Gemini 3 Flash' : 'Gemini 2.5 Flash'}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Default Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-purple-500" />
                <h3 className="font-semibold">Brand Context</h3>
              </div>

              <div className="space-y-2">
                <Label>Default Brand</Label>
                <Select
                  value={settings.default_brand_id || 'none'}
                  onValueChange={(value) => updateMutation.mutate({ default_brand_id: value === 'none' ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default brand..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No default (user selects)</SelectItem>
                    {brands?.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Brand profile, visual DNA, and directives are loaded into the agent's context</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Camera Controls</Label>
                  <p className="text-xs text-muted-foreground">Show aperture, focal length, and lighting sliders</p>
                </div>
                <Switch
                  checked={settings.enable_camera_controls}
                  onCheckedChange={(checked) => updateMutation.mutate({ enable_camera_controls: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Image Upload</Label>
                  <p className="text-xs text-muted-foreground">Allow reference image uploads in voice and chat</p>
                </div>
                <Switch
                  checked={settings.enable_image_upload}
                  onCheckedChange={(checked) => updateMutation.mutate({ enable_image_upload: checked })}
                />
              </div>
            </div>

            <Separator />

            {/* Voice Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-purple-500" />
                <h3 className="font-semibold">Voice Configuration</h3>
              </div>

              <div className="space-y-2">
                <Label>Voice</Label>
                <Select
                  value={settings.voice_name}
                  onValueChange={(value: GeminiVoice) => updateMutation.mutate({ voice_name: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GEMINI_VOICES.map((voice) => (
                      <SelectItem key={voice.value} value={voice.value}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{voice.label}</span>
                          <span className="text-xs text-muted-foreground">{voice.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Voice Speed</Label>
                  <Badge variant="outline">{settings.voice_speed.toFixed(1)}x</Badge>
                </div>
                <Slider
                  value={[settings.voice_speed]}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  onValueChange={(value) => updateMutation.mutate({ voice_speed: value[0] })}
                />
              </div>

              <div className="space-y-2">
                <Label>Voice Model (Gemini Live)</Label>
                <Select
                  value={settings.voice_model}
                  onValueChange={(value) => updateMutation.mutate({ voice_model: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GEMINI_LIVE_MODELS.map((model) => (
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

              <div className="space-y-2">
                <Label>Text Model (Chat Mode)</Label>
                <Select
                  value={settings.text_model}
                  onValueChange={(value) => updateMutation.mutate({ text_model: value })}
                >
                  <SelectTrigger>
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
            </div>

            <Separator />

            {/* System Prompts */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-500" />
                <h3 className="font-semibold">System Prompts</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Customize Vince's personality and creative direction. Leave empty to use defaults.
                Brand-specific data (visual DNA, prompts, directives) is automatically appended.
              </p>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Greeting Templates ({(settings.greeting_templates || DEFAULT_GREETING_TEMPLATES).length} rotating)</Label>
                  {settings.greeting_templates && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => updateMutation.mutate({ greeting_template: null })}>
                      Reset to defaults
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newGreeting}
                    onChange={(e) => setNewGreeting(e.target.value)}
                    placeholder="Add a greeting template..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newGreeting.trim()) {
                        const current = settings.greeting_templates || [...DEFAULT_GREETING_TEMPLATES];
                        const updated = [...current, newGreeting.trim()];
                        updateMutation.mutate({ greeting_template: JSON.stringify(updated) });
                        setNewGreeting('');
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!newGreeting.trim()}
                    onClick={() => {
                      if (newGreeting.trim()) {
                        const current = settings.greeting_templates || [...DEFAULT_GREETING_TEMPLATES];
                        const updated = [...current, newGreeting.trim()];
                        updateMutation.mutate({ greeting_template: JSON.stringify(updated) });
                        setNewGreeting('');
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1 max-h-[160px] overflow-y-auto border rounded-lg p-2">
                  {(settings.greeting_templates || DEFAULT_GREETING_TEMPLATES).map((tpl, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group">
                      <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                      <span className="flex-1 text-sm truncate">{tpl}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => {
                          const current = settings.greeting_templates || [...DEFAULT_GREETING_TEMPLATES];
                          const updated = current.filter((_, i) => i !== index);
                          updateMutation.mutate({ greeting_template: updated.length > 0 ? JSON.stringify(updated) : null });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Variables: {'{name}'}, {'{brandName}'}, {'{totalPrompts}'}, {'{imagesAnalyzed}'}, {'{timeOfDay}'}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Context-Aware Greetings</Label>
                  <p className="text-xs text-muted-foreground">Append brand health callout (missing profile, low image count, etc.)</p>
                </div>
                <Switch
                  checked={settings.enable_context_greetings}
                  onCheckedChange={(checked) => updateMutation.mutate({ enable_context_greetings: checked })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Voice Mode System Prompt</Label>
                  {settings.voice_system_prompt && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => updateMutation.mutate({ voice_system_prompt: null })}>
                      Reset to default
                    </Button>
                  )}
                </div>
                <Textarea
                  value={settings.voice_system_prompt || ''}
                  onChange={(e) => updateMutation.mutate({ voice_system_prompt: e.target.value || null })}
                  placeholder={DEFAULT_VOICE_PROMPT}
                  className="min-h-[100px] font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Chat Mode System Prompt</Label>
                  {settings.chat_system_prompt && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => updateMutation.mutate({ chat_system_prompt: null })}>
                      Reset to default
                    </Button>
                  )}
                </div>
                <Textarea
                  value={settings.chat_system_prompt || ''}
                  onChange={(e) => updateMutation.mutate({ chat_system_prompt: e.target.value || null })}
                  placeholder={DEFAULT_CHAT_PROMPT}
                  className="min-h-[100px] font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Brand data is automatically appended: visual DNA, photography style, color profile, product catalog, directives, and prompt templates.
                </p>
              </div>
            </div>

            <Separator />

            {/* Quick Prompts */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500" />
                <h3 className="font-semibold">Quick Prompts</h3>
              </div>

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
                  onValueChange={(value) => updateMutation.mutate({ quick_prompts_display_count: value[0] })}
                />
              </div>

              <div className="space-y-2">
                <Label>Add New Prompt</Label>
                <div className="flex gap-2">
                  <Input
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    placeholder="Enter a quick prompt..."
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
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Prompt Library ({settings.quick_prompts.length} prompts)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => updateMutation.mutate({ quick_prompts: JSON.stringify(DEFAULT_QUICK_PROMPTS) })}
                  >
                    Reset to defaults
                  </Button>
                </div>
                <div className="space-y-1 max-h-[160px] overflow-y-auto border rounded-lg p-2">
                  {settings.quick_prompts.map((prompt, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group">
                      <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                      <span className="flex-1 text-sm truncate">{prompt}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
              </div>
            </div>

            <Separator />

            {/* Visualizer */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-purple-500" />
                <h3 className="font-semibold">Voice Mode Visualizer</h3>
              </div>

              <div className="space-y-2">
                <Label>Visualizer Style</Label>
                <Select
                  value={settings.visualizer_style}
                  onValueChange={(value: typeof settings.visualizer_style) =>
                    updateMutation.mutate({ visualizer_style: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic_wave">Classic Wave</SelectItem>
                    <SelectItem value="codrops_3d_orb">3D Orb</SelectItem>
                    <SelectItem value="light_pillar">Light Pillar</SelectItem>
                    <SelectItem value="hyperspeed">Hyperspeed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.voice_background_override || '#0f0326'}
                    onChange={(e) => updateMutation.mutate({ voice_background_override: e.target.value })}
                    className="w-12 h-8 p-0 border-0"
                  />
                  <Input
                    type="text"
                    value={settings.voice_background_override || '#0f0326'}
                    onChange={(e) => updateMutation.mutate({ voice_background_override: e.target.value })}
                    className="flex-1 font-mono text-xs"
                    placeholder="#0f0326"
                  />
                </div>
              </div>
            </div>

            <div className="h-4" />
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4 mt-4">
          <p className="text-xs text-muted-foreground flex-1">Changes save automatically</p>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
