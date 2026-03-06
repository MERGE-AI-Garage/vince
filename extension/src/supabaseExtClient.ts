// ABOUTME: Extension-compatible Supabase client using chrome.storage.local for session persistence
// ABOUTME: Drop-in replacement for the main app's client — aliased in vite.config.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = 'https://foolpmhiedplyftbiocb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvb2xwbWhpZWRwbHlmdGJpb2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTA0NzcsImV4cCI6MjA4ODMyNjQ3N30.HuAbOrT5cdTb_zc1eyAj5KjAYL44HVs1vDSKjmqwL7w';

const chromeStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const result = await chrome.storage.local.get(key);
    return result[key] ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await chrome.storage.local.set({ [key]: value });
  },
  removeItem: async (key: string): Promise<void> => {
    await chrome.storage.local.remove(key);
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: chromeStorageAdapter,
    persistSession: true,
    autoRefreshToken: true,
  },
});
