// ABOUTME: Full-page admin control panel for Vince creative director agent
// ABOUTME: Provides tabbed interface for voice, chat, prompts, and brand intelligence configuration

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Camera,
  Volume2,
  Settings2,
  MessageSquare,
  Brain,
  Shield,
  Zap,
  MessagesSquare,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/PageLayout';
import AdminHeader from '@/components/headers/AdminHeader';
import { useUserRole } from '@/hooks/useUserRole';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getBrandAgentSettings, DEFAULT_GREETING_TEMPLATES } from '@/services/brand-agent/brandAgentSettings';

import { VoiceTab } from '@/components/vince-control-panel/VoiceTab';
import { ChatTab } from '@/components/vince-control-panel/ChatTab';
import { PromptsTab } from '@/components/vince-control-panel/PromptsTab';
import { BrandIntelTab } from '@/components/vince-control-panel/BrandIntelTab';
import { ConversationsTab } from '@/components/agent-conversations/ConversationsTab';

const VALID_TABS = ['voice', 'chat', 'prompts', 'brand-intel', 'conversations'];

const VinceControlPanel = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useUserRole();

  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    initialTab && VALID_TABS.includes(initialTab) ? initialTab : 'voice'
  );

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Quick stats
  const { data: settings } = useQuery({
    queryKey: ['brand-agent-settings'],
    queryFn: getBrandAgentSettings,
  });

  const { data: directiveCount } = useQuery({
    queryKey: ['vince-directive-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('creative_studio_agent_directives')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: conversationCount } = useQuery({
    queryKey: ['vince-conversation-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('chatbot_conversations')
        .select('*', { count: 'exact', head: true })
        .contains('metadata', { assistant: 'vince' });
      if (error) throw error;
      return count || 0;
    },
  });

  const greetingCount = (settings?.greeting_templates || DEFAULT_GREETING_TEMPLATES).length;
  const quickPromptCount = settings?.quick_prompts?.length || 0;

  if (!isAdmin) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Shield className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You need administrator privileges to access the Vince Control Panel.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <div className="space-y-8 py-8">
          <AdminHeader
            variant="card"
            icon={Camera}
            title="Vince Control Panel"
            description="Creative director configuration: voice, chat, greetings, and brand intelligence"
            backTo={{ path: '/admin', label: 'Back to Mission Control' }}
            actions={
              <Badge variant="outline" className="text-xs">
                AI Agent
              </Badge>
            }
          />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              className="border-l-4 border-l-purple-500 cursor-pointer hover:shadow-md transition-all"
              onClick={() => handleTabChange('prompts')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Greeting Templates</p>
                    <p className="text-2xl font-bold">{greetingCount}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-l-4 border-l-violet-500 cursor-pointer hover:shadow-md transition-all"
              onClick={() => handleTabChange('chat')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Quick Prompts</p>
                    <p className="text-2xl font-bold">{quickPromptCount}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Zap className="h-5 w-5 text-violet-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-all"
              onClick={() => handleTabChange('brand-intel')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Brand Directives</p>
                    <p className="text-2xl font-bold">{directiveCount ?? '...'}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Shield className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-l-4 border-l-emerald-500 cursor-pointer hover:shadow-md transition-all"
              onClick={() => handleTabChange('conversations')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversations</p>
                    <p className="text-2xl font-bold">{conversationCount ?? '...'}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <MessagesSquare className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList>
              <TabsTrigger value="voice">
                <Volume2 className="h-4 w-4" />
                Voice
              </TabsTrigger>
              <TabsTrigger value="chat">
                <Settings2 className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="prompts">
                <MessageSquare className="h-4 w-4" />
                Prompts
              </TabsTrigger>
              <TabsTrigger value="brand-intel">
                <Brain className="h-4 w-4" />
                Brand Intel
              </TabsTrigger>
              <TabsTrigger value="conversations">
                <MessagesSquare className="h-4 w-4" />
                Conversations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="voice" className="space-y-6">
              <VoiceTab />
            </TabsContent>

            <TabsContent value="chat" className="space-y-6">
              <ChatTab />
            </TabsContent>

            <TabsContent value="prompts" className="space-y-6">
              <PromptsTab />
            </TabsContent>

            <TabsContent value="brand-intel" className="space-y-6">
              <BrandIntelTab />
            </TabsContent>

            <TabsContent value="conversations" className="space-y-6">
              <ConversationsTab agent="vince" agentLabel="Vince" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
};

export default VinceControlPanel;
