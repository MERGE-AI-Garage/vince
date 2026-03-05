// ABOUTME: Brand intelligence tab for Vince Control Panel
// ABOUTME: Default brand selector and full brand intelligence detail view with directives, analysis, and Visual DNA

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  getBrandAgentSettings,
  clearBrandAgentSettingsCache,
} from '@/services/brand-agent/brandAgentSettings';
import { toast } from 'sonner';
import { BrandIntelligenceTab } from '@/components/creative-studio/BrandIntelligenceTab';

export const BrandIntelTab: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['brand-agent-settings'],
    queryFn: getBrandAgentSettings,
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

  return (
    <div className="space-y-6">
      {/* Default Brand Setting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-purple-500" />
            Default Brand
          </CardTitle>
          <CardDescription>
            The brand profile, visual DNA, and directives loaded into Vince's context by default.
            Users can override this per-session in Creative Studio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Default Brand</Label>
            <Select
              value={settings?.default_brand_id || 'none'}
              onValueChange={(value) => updateMutation.mutate({ default_brand_id: value === 'none' ? null : value })}
            >
              <SelectTrigger className="max-w-md">
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
          </div>
        </CardContent>
      </Card>

      {/* Full Brand Intelligence View */}
      <BrandIntelligenceTab />
    </div>
  );
};
