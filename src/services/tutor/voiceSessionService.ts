// ABOUTME: Persistence layer for voice session transcripts
// ABOUTME: Saves transcripts on session close and queries them for admin review

import { supabase } from '@/integrations/supabase/client';
import type { TranscriptItem } from './tutorVoiceService';

export interface VoiceTranscriptTurn {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface VoiceSessionRecord {
  id: string;
  user_id: string;
  agent: string;
  program_id: string | null;
  module_id: string | null;
  program_name: string | null;
  module_title: string | null;
  status: string;
  duration_seconds: number | null;
  turn_count: number;
  tool_calls_count: number;
  transcript: VoiceTranscriptTurn[];
  error_message: string | null;
  created_at: string;
  updated_at: string;
  // Joined from profiles for admin queries
  user_name?: string;
  user_email?: string;
}

export interface SaveVoiceSessionParams {
  userId: string;
  agent?: string;
  programId?: string;
  moduleId?: string;
  programName?: string;
  moduleTitle?: string;
  status: 'completed' | 'error' | 'abandoned';
  durationSeconds?: number | null;
  transcript: TranscriptItem[];
  toolCallsCount?: number;
  errorMessage?: string;
}

/**
 * Persists a voice session transcript to the database.
 * Saves all sessions including empty ones (useful UX friction signal).
 */
export async function saveVoiceSession(params: SaveVoiceSessionParams): Promise<string | null> {
  const finalTurns: VoiceTranscriptTurn[] = params.transcript
    .filter(t => t.isFinal && t.text.trim())
    .map(t => ({
      role: t.role,
      text: t.text,
      timestamp: new Date().toISOString(),
    }));

  const { data, error } = await supabase
    .from('voice_sessions')
    .insert({
      user_id: params.userId,
      agent: params.agent ?? 'mitch',
      program_id: params.programId ?? null,
      module_id: params.moduleId ?? null,
      program_name: params.programName ?? null,
      module_title: params.moduleTitle ?? null,
      status: params.status,
      duration_seconds: params.durationSeconds ?? null,
      turn_count: finalTurns.length,
      tool_calls_count: params.toolCallsCount ?? 0,
      transcript: finalTurns,
      error_message: params.errorMessage ?? null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[VoiceSession] Failed to save:', error);
    return null;
  }
  return data.id;
}

export interface FetchVoiceSessionsOptions {
  agent?: string;
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
  daysBack?: number;
}

/**
 * Fetches voice sessions for admin review.
 * Joins profile data for user display name.
 */
export async function fetchVoiceSessions(options?: FetchVoiceSessionsOptions): Promise<{
  sessions: VoiceSessionRecord[];
  count: number;
}> {
  const limit = options?.limit ?? 25;
  const offset = options?.offset ?? 0;

  let query = supabase
    .from('voice_sessions')
    .select(`
      *,
      profiles!voice_sessions_user_id_fkey (
        first_name,
        last_name,
        email
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.agent) {
    query = query.eq('agent', options.agent);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.daysBack) {
    const since = new Date();
    since.setDate(since.getDate() - options.daysBack);
    query = query.gte('created_at', since.toISOString());
  }

  if (options?.search) {
    query = query.or(
      `module_title.ilike.%${options.search}%,program_name.ilike.%${options.search}%`
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions = (data || []).map((row: any) => ({
    ...row,
    user_name: [row.profiles?.first_name, row.profiles?.last_name]
      .filter(Boolean).join(' ') || 'Unknown',
    user_email: row.profiles?.email || '',
    profiles: undefined,
  }));

  return { sessions, count: count ?? 0 };
}

/**
 * Fetches a single voice session by ID (for detail view).
 */
export async function fetchVoiceSession(id: string): Promise<VoiceSessionRecord | null> {
  const { data, error } = await supabase
    .from('voice_sessions')
    .select(`
      *,
      profiles!voice_sessions_user_id_fkey (
        first_name,
        last_name,
        email
      )
    `)
    .eq('id', id)
    .single();

  if (error) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return {
    ...row,
    user_name: [row.profiles?.first_name, row.profiles?.last_name]
      .filter(Boolean).join(' ') || 'Unknown',
    user_email: row.profiles?.email || '',
    profiles: undefined,
  } as VoiceSessionRecord;
}
