// ABOUTME: Voice & visualizer tab for Vince Control Panel
// ABOUTME: Voice name/speed/model selection, voice system prompt, and shared visualizer configuration

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Volume2, MessageSquare, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  getBrandAgentSettings,
  clearBrandAgentSettingsCache,
  GEMINI_VOICES,
  GEMINI_LIVE_MODELS,
  DEFAULT_VOICE_PROMPT,
  type GeminiVoice,
} from '@/services/brand-agent/brandAgentSettings';
import { toast } from 'sonner';
import { VisualizerSettings, type VisualizerSettingsData } from '@/components/shared-settings/VisualizerSettings';

export const VoiceTab: React.FC = () => {
  const queryClient = useQueryClient();

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

  const visualizerData: VisualizerSettingsData = {
    visualizer_style: settings.visualizer_style,
    voice_background_override: settings.voice_background_override,
    lightPillarSettings: settings.lightPillarSettings,
    classicWaveSettings: settings.classicWaveSettings,
    hyperspeedSettings: settings.hyperspeedSettings,
    codrops3DOrbSettings: settings.codrops3DOrbSettings,
  };

  return (
    <div className="space-y-6">
      {/* Voice Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-purple-500" />
            Voice Configuration
          </CardTitle>
          <CardDescription>
            Configure Vince's voice for Gemini Live conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </CardContent>
      </Card>

      {/* Voice System Prompt */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                Voice System Prompt
              </CardTitle>
              <CardDescription>
                Personality and behavioral instructions for voice mode. Brand data is automatically appended.
              </CardDescription>
            </div>
            {settings.voice_system_prompt && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateMutation.mutate({ voice_system_prompt: null })}
              >
                Reset to default
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={settings.voice_system_prompt || ''}
            onChange={(e) => updateMutation.mutate({ voice_system_prompt: e.target.value || null })}
            placeholder={DEFAULT_VOICE_PROMPT}
            className="min-h-[200px] font-mono text-xs"
          />
        </CardContent>
      </Card>

      {/* Voice Mode Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-500" />
            Voice Mode Appearance
          </CardTitle>
          <CardDescription>
            Controls how the voice mode UI looks when active
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Visualizer</Label>
              <p className="text-xs text-muted-foreground">Display animated visualizer in voice mode</p>
            </div>
            <Switch
              checked={settings.show_visualizer}
              onCheckedChange={(checked) => updateMutation.mutate({ show_visualizer: checked })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ambience Glow Color</Label>
                {settings.voice_ambience_color && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => updateMutation.mutate({ voice_ambience_color: null })}
                  >
                    Theme Default
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.voice_ambience_color || (settings.voice_theme === 'light' ? '#ecfdf5' : '#064e3b')}
                  onChange={(e) => updateMutation.mutate({ voice_ambience_color: e.target.value })}
                  className="h-9 w-12 rounded border border-input cursor-pointer"
                />
                <Input
                  value={settings.voice_ambience_color || ''}
                  onChange={(e) => updateMutation.mutate({ voice_ambience_color: e.target.value || null })}
                  placeholder={settings.voice_theme === 'light' ? '#ecfdf5 (theme)' : '#064e3b (theme)'}
                  className="font-mono text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">Center color of the radial gradient overlay</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Ambience Opacity</Label>
                <Badge variant="outline">{settings.voice_ambience_opacity.toFixed(2)}</Badge>
              </div>
              <Slider
                value={[settings.voice_ambience_opacity]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(value) => updateMutation.mutate({ voice_ambience_opacity: value[0] })}
              />
              <p className="text-xs text-muted-foreground">Higher = more overlay, less background bleed-through</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualizer - shared component */}
      <VisualizerSettings
        settings={visualizerData}
        onUpdate={(updates) => updateMutation.mutate(updates)}
      />
    </div>
  );
};
