// ABOUTME: Text chat service for the AI Tutor embedded in learning modules
// ABOUTME: Sends messages to tutor-message edge function with module context as grounding

import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
import { getTutorSettings, DEFAULT_GREETING_TEMPLATES, DEFAULT_QUIZ_GREETING_TEMPLATES } from './tutorSettings';

export interface TutorContext {
  userId: string;
  moduleId: string;
  moduleTitle: string;
  moduleType: string;
  contentMarkdown: string;
  programId: string;
  programName: string;
  learnerName: string;
  learnerTitle?: string;
  learnerDepartment?: string;
  learnerExperienceLevel?: string;
  learnerTools?: string[];
  learnerInterests?: string[];
}

export interface TutorMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Creates a new tutor conversation tied to a specific module
 */
export async function createTutorConversation(
  userId: string,
  moduleId: string,
  programId: string,
): Promise<string> {
  // Reuse an existing empty conversation for this module to avoid proliferation
  const { data: existing } = await supabase
    .from('chatbot_conversations')
    .select('id')
    .eq('user_id', userId)
    .contains('metadata', { assistant: 'tutor', module_id: moduleId, program_id: programId })
    .eq('messages', '[]')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('chatbot_conversations')
    .insert({
      user_id: userId,
      messages: [],
      tool_calls_count: 0,
      metadata: {
        assistant: 'tutor',
        module_id: moduleId,
        program_id: programId,
      },
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Deletes a tutor conversation
 */
export async function deleteTutorConversation(conversationId: string): Promise<void> {
  await supabase
    .from('chatbot_conversations')
    .delete()
    .eq('id', conversationId);
}

/**
 * Sends a message to the tutor edge function and returns the response
 */
export interface MessageMetadata {
  source?: 'quick_prompt' | 'typed';
  template?: string;
}

export async function sendTutorMessage(
  message: string,
  conversationId: string,
  userId: string,
  context: TutorContext,
  onChunk?: (chunk: string) => void,
  messageMetadata?: MessageMetadata,
): Promise<TutorMessage> {
  // Stage 1: Load settings
  let settings;
  try {
    settings = await getTutorSettings();
  } catch (err) {
    console.error('[Tutor] Stage 1 — settings fetch failed:', err);
    throw new Error('Failed to load tutor settings');
  }

  const body = {
    message,
    conversation_id: conversationId,
    user_id: userId,
    model_override: settings.text_model,
    message_metadata: messageMetadata,
    stream: !!onChunk,
    tutor_context: {
      module_id: context.moduleId,
      module_title: context.moduleTitle,
      module_type: context.moduleType,
      content_markdown: context.contentMarkdown,
      program_id: context.programId,
      program_name: context.programName,
      learner_name: context.learnerName,
    },
  };

  // Stage 2: Get auth session (refresh if close to expiry)
  let { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const expiresInMs = expiresAt - Date.now();
    if (expiresInMs < 60_000) {
      console.warn(`[Tutor] Stage 2 — token expires in ${Math.round(expiresInMs / 1000)}s, refreshing`);
      const { data } = await supabase.auth.refreshSession();
      session = data.session;
    }
  }
  if (!session) {
    console.error('[Tutor] Stage 2 — no auth session available');
    throw new Error('Not authenticated — please sign in again');
  }

  // Stage 3: Call edge function
  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/tutor-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('[Tutor] Stage 3 — fetch failed:', err);
    throw new Error(`Network error calling tutor: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    let errorMsg: string;
    try {
      const errorData = JSON.parse(errorText);
      errorMsg = errorData.error || errorData.msg || `Tutor request failed: ${response.status}`;
    } catch {
      errorMsg = errorText || `Tutor request failed: ${response.status}`;
    }
    console.error(`[Tutor] Stage 3 — edge function returned ${response.status}:`, errorMsg);
    throw new Error(errorMsg);
  }

  // Stage 4: Parse streaming SSE response
  if (onChunk && response.headers.get('content-type')?.includes('text/event-stream')) {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalMessage: TutorMessage | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === 'chunk') {
            onChunk(event.text);
          } else if (event.type === 'done') {
            finalMessage = {
              role: event.message.role,
              content: event.message.content,
              timestamp: new Date(event.message.timestamp),
            };
          } else if (event.type === 'error') {
            console.error('[Tutor] Stage 4 — stream error event:', event.error);
            throw new Error(event.error);
          }
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }

    if (finalMessage) return finalMessage;
    console.error('[Tutor] Stage 4 — stream ended without done event');
    throw new Error('Stream ended without completion event');
  }

  // Non-streaming JSON response (fallback)
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const preview = await response.text().catch(() => '');
    console.error(`[Tutor] Stage 4 — unexpected content-type: ${contentType}`, preview.slice(0, 200));
    throw new Error(`Tutor returned unexpected response (${contentType || 'no content-type'})`);
  }
  const data = await response.json();

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to get response from Tutor');
  }

  return {
    role: data.message.role,
    content: data.message.content,
    timestamp: new Date(data.message.timestamp),
  };
}

/**
 * Triggers session summary generation for a completed conversation.
 * Fire-and-forget — does not block the caller.
 */
export async function summarizeTutorSession(
  conversationId: string,
  userId: string,
  context?: TutorContext,
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const body: Record<string, any> = {
      mode: 'summarize',
      conversation_id: conversationId,
      user_id: userId,
    };

    if (context) {
      body.tutor_context = {
        module_id: context.moduleId,
        module_title: context.moduleTitle,
        module_type: context.moduleType,
        content_markdown: '',
        program_id: context.programId,
        program_name: context.programName,
        learner_name: context.learnerName,
      };
    }

    await fetch(`${SUPABASE_URL}/functions/v1/tutor-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn('[Tutor] Session summarization failed (non-critical):', err);
  }
}

function replaceGreetingVars(template: string, context: TutorContext): string {
  const firstName = context.learnerName.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  return template
    .replace(/{name}/g, firstName)
    .replace(/{moduleTitle}/g, context.moduleTitle)
    .replace(/{programName}/g, context.programName)
    .replace(/{moduleType}/g, context.moduleType)
    .replace(/{timeOfDay}/g, timeOfDay);
}

/**
 * Generates the tutor's initial greeting for a module using template system
 */
export async function generateTutorGreeting(context: TutorContext): Promise<string> {
  const settings = await getTutorSettings();
  const isQuiz = context.moduleType === 'quiz';
  const templates = (settings.greeting_templates && settings.greeting_templates.length > 0)
    ? settings.greeting_templates
    : isQuiz ? DEFAULT_QUIZ_GREETING_TEMPLATES : DEFAULT_GREETING_TEMPLATES;
  const template = templates[Math.floor(Math.random() * templates.length)];
  return replaceGreetingVars(template, context);
}
