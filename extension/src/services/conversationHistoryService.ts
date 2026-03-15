// ABOUTME: Fetches and parses persisted Vince conversation history from chatbot_conversations.
// ABOUTME: Handles both Gemini-format (chat) and legacy voice-format messages.

import { supabase } from '@/integrations/supabase/client';
import type { Message } from '../chat/ChatMessage';
import type { ToolResult } from '../hooks/useVinceVoice';

export interface ConversationSummary {
  id: string;
  firstUserMessage: string;
  updatedAt: string;
  thumbnails: string[];
  messageCount: number;
  hasCreativePackage: boolean;
}

// Gemini-format message (chat sessions via brand-prompt-agent edge function)
interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

interface GeminiMessage {
  role: 'user' | 'model';
  parts?: GeminiPart[];
  // Legacy voice-format fields (saveVoiceConversation)
  content?: string;
  timestamp?: string;
}

const IMAGE_TOOLS = new Set(['generate_image', 'generate_headshot_scene']);
const PACKAGE_TOOL = 'generate_creative_package';
const COMPETITOR_TOOL = 'analyze_competitor_content';

/** Get text content from either message format */
function messageText(msg: GeminiMessage): string {
  if (msg.content !== undefined) return msg.content; // legacy voice format
  return (msg.parts || []).filter(p => p.text).map(p => p.text!).join('').trim();
}

/** True if this is a user-originated message in either format */
function isUserMessage(msg: GeminiMessage): boolean {
  return msg.role === 'user' || (msg.role as string) === 'user';
}

/** True if this message is a Gemini functionResponse turn (tool results injected as user turn) */
function isFunctionResponseTurn(msg: GeminiMessage): boolean {
  return isUserMessage(msg) && !!(msg.parts?.length) && msg.parts.every(p => p.functionResponse);
}

/** Extract up to 3 image thumbnail URLs from stored messages */
export function extractThumbnails(messages: GeminiMessage[]): string[] {
  const urls: string[] = [];
  for (const msg of messages) {
    if (urls.length >= 3) break;
    for (const part of (msg.parts || [])) {
      if (!part.functionResponse) continue;
      const { name, response } = part.functionResponse;
      if (IMAGE_TOOLS.has(name)) {
        const imageUrls = (response.image_urls as string[] | undefined) || [];
        const single = response.image_url as string | undefined;
        for (const url of imageUrls.length ? imageUrls : single ? [single] : []) {
          if (urls.length < 3) urls.push(url);
        }
      } else if (name === PACKAGE_TOOL) {
        for (const url of (response.image_urls as string[] | undefined) || []) {
          if (urls.length < 3) urls.push(url);
        }
      }
    }
  }
  return urls;
}

/** Convert stored messages (either format) to Message[] for rendering in ChatTab */
export function convertToDisplayMessages(messages: GeminiMessage[]): Message[] {
  const display: Message[] = [];
  let idCounter = 0;
  const nextId = () => `hist-${idCounter++}`;

  for (const msg of messages) {
    // Legacy voice format: { role: 'user'|'assistant', content: string }
    if (msg.content !== undefined) {
      const text = msg.content.trim();
      if (!text) continue;
      const role = (msg.role as string) === 'user' ? 'user' as const : 'assistant' as const;
      display.push({ id: nextId(), role, text });
      continue;
    }

    // Gemini format
    if (msg.role === 'user') {
      if (isFunctionResponseTurn(msg)) {
        // Tool results — attach to last assistant message
        const toolResults = extractToolResults((msg.parts || []).map(p => p.functionResponse!).filter(Boolean));
        if (toolResults.length > 0) {
          const lastAssistant = [...display].reverse().find(m => m.role === 'assistant');
          if (lastAssistant) {
            lastAssistant.toolResults = [...(lastAssistant.toolResults || []), ...toolResults];
          }
        }
        continue;
      }
      const text = messageText(msg);
      if (text) display.push({ id: nextId(), role: 'user', text });

    } else if (msg.role === 'model') {
      const text = (msg.parts || []).filter(p => p.text).map(p => p.text!).join('').trim();
      if (text) display.push({ id: nextId(), role: 'assistant', text, toolResults: [] });
    }
  }

  return display;
}

function extractToolResults(responses: Array<{ name: string; response: Record<string, unknown> }>): ToolResult[] {
  const results: ToolResult[] = [];
  for (const { name, response } of responses) {
    if (name === PACKAGE_TOOL) {
      const parts = response.parts as unknown[] | undefined;
      if (parts?.length) results.push({ type: 'creative_package', data: response });
    } else if (IMAGE_TOOLS.has(name)) {
      const imageUrls = (response.image_urls as string[] | undefined) || [];
      const single = response.image_url as string | undefined;
      const urls = imageUrls.length ? imageUrls : single ? [single] : [];
      if (urls.length) results.push({ type: 'generated_images', data: { image_urls: urls } });
    } else if (name === COMPETITOR_TOOL) {
      const directions = response.campaign_directions as unknown[] | undefined;
      if (directions?.length) results.push({ type: 'competitor_analysis', data: response });
    }
  }
  return results;
}

/** Fetch the current user's recent Vince conversations, newest first */
export async function fetchRecentConversations(limit = 25): Promise<ConversationSummary[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('chatbot_conversations')
    .select('id, messages, updated_at')
    .eq('user_id', user.id)
    .contains('metadata', { assistant: 'vince' })
    .not('messages', 'eq', '[]')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map(row => {
    const messages = (row.messages || []) as GeminiMessage[];

    // Find the first user message in either format
    const firstUserMsg = messages.find(m => {
      const text = messageText(m);
      return text && (isUserMessage(m)) && !isFunctionResponseTurn(m);
    });
    if (!firstUserMsg) return null;

    const firstText = messageText(firstUserMsg);
    const thumbnails = extractThumbnails(messages);
    const hasCreativePackage = messages.some(m =>
      (m.parts || []).some(p => p.functionResponse?.name === PACKAGE_TOOL)
    );
    return {
      id: row.id,
      firstUserMessage: firstText,
      updatedAt: row.updated_at,
      thumbnails,
      messageCount: messages.length,
      hasCreativePackage,
    };
  }).filter((c): c is ConversationSummary => c !== null);
}

/** Load and convert a specific conversation for display */
export async function loadConversation(id: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('chatbot_conversations')
    .select('messages')
    .eq('id', id)
    .single();

  if (error || !data) return [];
  return convertToDisplayMessages((data.messages || []) as GeminiMessage[]);
}
