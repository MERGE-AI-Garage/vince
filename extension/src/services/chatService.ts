// ABOUTME: Client for the brand-prompt-agent Supabase Edge Function in chat mode.
// ABOUTME: Sends user messages and parses structured tool results (creative packages, images, etc).

import { supabase } from '@/integrations/supabase/client';
import type { ToolResult, GenerationRecord } from '../hooks/useVinceVoice';
import type { PackagePart } from '../chat/CreativePackageCard';

export interface ChatResponse {
  message: string;
  toolResults: ToolResult[];
}

interface AgentToolAction {
  toolName: string;
  result?: Record<string, unknown>;
  success: boolean;
}

/** Extract visual tool results from the agent's tool_actions array */
function extractToolResults(toolActions: AgentToolAction[]): ToolResult[] {
  const results: ToolResult[] = [];

  for (const action of toolActions) {
    if (!action.success || !action.result) continue;
    const r = action.result;

    if (action.toolName === 'generate_creative_package') {
      const parts = r.parts as PackagePart[] | undefined;
      if (parts?.length) {
        results.push({ type: 'creative_package', data: r });
      }
    } else if (action.toolName === 'generate_image') {
      const urls = r.image_urls as string[] | undefined;
      if (urls?.length) {
        results.push({ type: 'generated_images', data: { image_urls: urls } });
      }
    } else if (action.toolName === 'generate_headshot_scene') {
      const url = r.image_url as string | undefined;
      if (url) {
        results.push({ type: 'generated_images', data: { image_urls: [url] } });
      }
    } else if (action.toolName === 'analyze_competitor_content') {
      const directions = r.campaign_directions as unknown[] | undefined;
      if (directions?.length) {
        results.push({ type: 'competitor_analysis', data: r });
      }
    } else if (action.toolName === 'list_generations') {
      const generations = r.generations as GenerationRecord[] | undefined;
      if (generations?.length) {
        results.push({ type: 'generation_history', data: { generations } });
      }
    }
  }

  return results;
}

export async function sendChatMessage(
  userMessage: string,
  brandId: string | null,
  conversationId?: string,
): Promise<ChatResponse> {
  const body: Record<string, unknown> = { user_message: userMessage };
  if (brandId) body.brand_id = brandId;
  if (conversationId) body.conversation_id = conversationId;

  const { data, error } = await supabase.functions.invoke('brand-prompt-agent', { body });

  if (error) {
    throw new Error(error.message || 'Agent request failed');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Agent returned an error');
  }

  const toolActions = (data.tool_actions as AgentToolAction[] | undefined) || [];
  const toolResults = extractToolResults(toolActions);

  return {
    message: data.message || '',
    toolResults,
  };
}
