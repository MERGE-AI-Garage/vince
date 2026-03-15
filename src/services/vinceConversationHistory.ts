// ABOUTME: Fetches Vince conversation history for the web app.
// ABOUTME: Returns summaries with thumbnails and converts Gemini messages to web Message format.

import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/components/shared-chat/types';

export interface ConversationSummary {
  id: string;
  firstUserMessage: string;
  updatedAt: string;
  thumbnails: string[];
  hasCreativePackage: boolean;
}

interface GeminiPart {
  text?: string;
  functionCall?: { name: string };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

interface GeminiMessage {
  role: 'user' | 'model';
  parts?: GeminiPart[];
  // Legacy voice-format fields
  content?: string;
}

const IMAGE_TOOLS = new Set(['generate_image', 'generate_headshot_scene']);
const PACKAGE_TOOL = 'generate_creative_package';

function messageText(msg: GeminiMessage): string {
  if (msg.content !== undefined) return msg.content;
  return (msg.parts || []).filter(p => p.text).map(p => p.text!).join('').trim();
}

function isUserMessage(msg: GeminiMessage): boolean {
  return msg.role === 'user' || (msg.role as string) === 'user';
}

function isFunctionResponseTurn(msg: GeminiMessage): boolean {
  return isUserMessage(msg) && !!(msg.parts?.length) && msg.parts!.every(p => p.functionResponse);
}

function extractThumbnails(messages: GeminiMessage[]): string[] {
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

/** Fetch recent Vince conversations for the current user */
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
    const firstUserMsg = messages.find(m => {
      const text = messageText(m);
      return text && isUserMessage(m) && !isFunctionResponseTurn(m);
    });
    if (!firstUserMsg) return null;
    const firstText = messageText(firstUserMsg);
    const hasCreativePackage = messages.some(m =>
      (m.parts || []).some(p => p.functionResponse?.name === PACKAGE_TOOL)
    );
    return {
      id: row.id,
      firstUserMessage: firstText,
      updatedAt: row.updated_at,
      thumbnails: extractThumbnails(messages),
      hasCreativePackage,
    };
  }).filter((c): c is ConversationSummary => c !== null);
}

/** Load and convert a conversation to web app Message[] format (text content only) */
export async function loadConversationMessages(id: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('chatbot_conversations')
    .select('messages')
    .eq('id', id)
    .single();

  if (error || !data) return [];

  const geminiMessages = (data.messages || []) as GeminiMessage[];
  const result: Message[] = [];
  let counter = 0;

  for (const msg of geminiMessages) {
    // Legacy voice format
    if (msg.content !== undefined) {
      const text = msg.content.trim();
      if (!text) continue;
      result.push({
        id: `hist-${counter++}`,
        role: (msg.role as string) === 'user' ? 'user' : 'model',
        content: text,
        timestamp: new Date(),
      });
      continue;
    }

    // Skip functionResponse user turns (tool results injected back as user turns)
    if (isFunctionResponseTurn(msg)) continue;

    const text = (msg.parts || []).filter(p => p.text).map(p => p.text!).join('').trim();
    if (!text) continue;

    result.push({
      id: `hist-${counter++}`,
      role: msg.role === 'model' ? 'model' : 'user',
      content: text,
      timestamp: new Date(),
    });
  }

  return result;
}
