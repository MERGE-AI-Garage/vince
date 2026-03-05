// ABOUTME: Admin query layer for text chat sessions stored in chatbot_conversations
// ABOUTME: Fetches tutor conversations with profile joins and message analytics

import { supabase } from '@/integrations/supabase/client';

export interface TextMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: 'quick_prompt' | 'typed';
  template?: string;
}

export interface TextSessionRecord {
  id: string;
  user_id: string;
  messages: TextMessage[];
  metadata: {
    assistant: string;
    module_id?: string;
    program_id?: string;
  };
  tool_calls_count: number;
  created_at: string;
  updated_at: string;
  // Derived
  message_count: number;
  quick_prompt_count: number;
  module_title?: string;
  program_name?: string;
  // Joined from profiles
  user_name: string;
  user_email: string;
}

export interface FetchTextSessionsOptions {
  limit?: number;
  offset?: number;
  search?: string;
  daysBack?: number;
}

/**
 * Fetches tutor text chat sessions for admin review.
 * Queries chatbot_conversations filtered by metadata.assistant = 'tutor'.
 */
export async function fetchTextSessions(options?: FetchTextSessionsOptions): Promise<{
  sessions: TextSessionRecord[];
  count: number;
}> {
  const limit = options?.limit ?? 25;
  const offset = options?.offset ?? 0;
  const isSearching = !!options?.search;

  // When searching, fetch a larger batch since client-side filter reduces results
  const fetchLimit = isSearching ? limit * 4 : limit;
  const fetchOffset = isSearching ? 0 : offset;

  let query = supabase
    .from('chatbot_conversations')
    .select(`
      id,
      user_id,
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
    .contains('metadata', { assistant: 'tutor' })
    .order('updated_at', { ascending: false })
    .range(fetchOffset, fetchOffset + fetchLimit - 1);

  if (options?.daysBack) {
    const since = new Date();
    since.setDate(since.getDate() - options.daysBack);
    query = query.gte('created_at', since.toISOString());
  }

  const { data, error, count } = await query;
  if (error) throw error;

  // Fetch module/program names for metadata IDs
  const moduleIds = new Set<string>();
  const programIds = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (data || []) as any[]) {
    if (row.metadata?.module_id) moduleIds.add(row.metadata.module_id);
    if (row.metadata?.program_id) programIds.add(row.metadata.program_id);
  }

  // Batch fetch module and program names
  let moduleMap = new Map<string, string>();
  let programMap = new Map<string, string>();

  if (moduleIds.size > 0) {
    const { data: modules } = await supabase
      .from('program_modules')
      .select('id, title')
      .in('id', [...moduleIds]);
    if (modules) {
      moduleMap = new Map(modules.map(m => [m.id, m.title]));
    }
  }

  if (programIds.size > 0) {
    const { data: programs } = await supabase
      .from('enablement_programs')
      .select('id, name')
      .in('id', [...programIds]);
    if (programs) {
      programMap = new Map(programs.map(p => [p.id, p.name]));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions: TextSessionRecord[] = (data || []).map((row: any) => {
    const messages = (row.messages ?? []) as TextMessage[];
    const userMessages = messages.filter(m => m.role === 'user');
    const quickPromptCount = userMessages.filter(m => m.source === 'quick_prompt').length;

    return {
      id: row.id,
      user_id: row.user_id,
      messages,
      metadata: row.metadata ?? {},
      tool_calls_count: row.tool_calls_count ?? 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
      message_count: messages.length,
      quick_prompt_count: quickPromptCount,
      module_title: row.metadata?.module_id ? moduleMap.get(row.metadata.module_id) : undefined,
      program_name: row.metadata?.program_id ? programMap.get(row.metadata.program_id) : undefined,
      user_name: [row.profiles?.first_name, row.profiles?.last_name]
        .filter(Boolean).join(' ') || 'Unknown',
      user_email: row.profiles?.email || '',
    };
  });

  // Client-side search filter (module/program names come from joined data)
  if (isSearching) {
    const searchLower = options.search!.toLowerCase();
    const filtered = sessions.filter(s =>
      (s.module_title?.toLowerCase().includes(searchLower)) ||
      (s.program_name?.toLowerCase().includes(searchLower)) ||
      (s.user_name.toLowerCase().includes(searchLower))
    );
    const paged = filtered.slice(offset, offset + limit);
    return { sessions: paged, count: filtered.length };
  }

  return { sessions, count: count ?? 0 };
}
