// ABOUTME: Admin query layer for browsing agent conversations stored in chatbot_conversations
// ABOUTME: Fetches conversations by agent name with profile joins, search, and pagination

import { supabase } from '@/integrations/supabase/client';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationRecord {
  id: string;
  user_id: string;
  title: string | null;
  messages: ConversationMessage[];
  metadata: Record<string, unknown>;
  tool_calls_count: number;
  created_at: string;
  updated_at: string;
  message_count: number;
  user_name: string;
  user_email: string;
}

export interface FetchConversationsOptions {
  agent: string;
  limit?: number;
  offset?: number;
  search?: string;
  daysBack?: number;
}

/**
 * Fetches agent conversations for admin review.
 * Queries chatbot_conversations filtered by metadata.assistant = agent.
 */
export async function fetchConversations(options: FetchConversationsOptions): Promise<{
  conversations: ConversationRecord[];
  count: number;
}> {
  const limit = options.limit ?? 25;
  const offset = options.offset ?? 0;
  const isSearching = !!options.search;

  // When searching, fetch a larger batch since client-side filter reduces results
  const fetchLimit = isSearching ? limit * 4 : limit;
  const fetchOffset = isSearching ? 0 : offset;

  let query = supabase
    .from('chatbot_conversations')
    .select(`
      id,
      user_id,
      title,
      messages,
      metadata,
      tool_calls_count,
      created_at,
      updated_at,
      profiles!chatbot_conversations_user_id_fkey (
        first_name,
        last_name,
        email
      )
    `, { count: 'exact' })
    .contains('metadata', { assistant: options.agent })
    .order('updated_at', { ascending: false })
    .range(fetchOffset, fetchOffset + fetchLimit - 1);

  if (options.daysBack) {
    const since = new Date();
    since.setDate(since.getDate() - options.daysBack);
    query = query.gte('created_at', since.toISOString());
  }

  const { data, error, count } = await query;
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversations: ConversationRecord[] = (data || []).map((row: any) => {
    const messages = (row.messages ?? []) as ConversationMessage[];
    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      messages,
      metadata: row.metadata ?? {},
      tool_calls_count: row.tool_calls_count ?? 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
      message_count: messages.length,
      user_name: [row.profiles?.first_name, row.profiles?.last_name]
        .filter(Boolean).join(' ') || 'Unknown',
      user_email: row.profiles?.email || '',
    };
  });

  if (isSearching) {
    const searchLower = options.search!.toLowerCase();
    const filtered = conversations.filter(c => {
      if (c.user_name.toLowerCase().includes(searchLower)) return true;
      const firstUserMsg = c.messages.find(m => m.role === 'user');
      if (firstUserMsg?.content.toLowerCase().includes(searchLower)) return true;
      return false;
    });
    const paged = filtered.slice(offset, offset + limit);
    return { conversations: paged, count: filtered.length };
  }

  return { conversations, count: count ?? 0 };
}
