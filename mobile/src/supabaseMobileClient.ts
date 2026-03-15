// ABOUTME: Mobile-compatible Supabase client using Capacitor Preferences for session persistence
// ABOUTME: Drop-in replacement for the main app's client — aliased in vite.config.ts

import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Adapter that stores Supabase auth tokens in Capacitor Preferences (native UserDefaults on iOS)
// instead of localStorage (which can be cleared by iOS when storage pressure is high)
const capacitorStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string): Promise<void> => {
    await Preferences.remove({ key });
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: capacitorStorageAdapter,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Re-export the URL for any code that imports it
export const SUPABASE_URL_EXPORT = SUPABASE_URL;
