// ABOUTME: Shared helper to track AI API usage and costs via the tracking middleware
// ABOUTME: Provides a single fire-and-forget function for all edge functions to report Gemini usage

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

interface UsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

interface TrackUsageParams {
  supabase: SupabaseClient;
  userId: string;
  apiProvider: 'gemini' | 'google-ai' | 'openai' | 'vertex' | 'other';
  endpoint: string;
  modelName: string;
  featureType: string;
  promptText?: string;
  usageMetadata?: UsageMetadata;
  requestTokens?: number;
  responseTokens?: number;
  costUsd?: number;
  responseTimeMs?: number;
  status: 'success' | 'error' | 'timeout';
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Track an AI API call. Fire-and-forget — never throws.
 * Pass usageMetadata from Gemini SDK responses for automatic token extraction,
 * or pass requestTokens/responseTokens directly for estimated counts.
 */
export function trackUsage(params: TrackUsageParams): void {
  const { supabase, usageMetadata, requestTokens, responseTokens, ...rest } = params;

  // Prefer actual token counts from Gemini usageMetadata, fall back to manual estimates
  const finalRequestTokens = usageMetadata?.promptTokenCount ?? requestTokens ?? 0;
  const finalResponseTokens = usageMetadata?.candidatesTokenCount ?? responseTokens ?? 0;

  supabase.functions.invoke('ai-tracking-middleware', {
    body: {
      action: 'track_api_call',
      data: {
        ...rest,
        requestTokens: finalRequestTokens,
        responseTokens: finalResponseTokens,
        promptText: rest.promptText?.substring(0, 2000) || 'No prompt captured',
      }
    }
  }).catch(err => {
    console.error('[trackUsage] Failed to track:', err);
  });
}
