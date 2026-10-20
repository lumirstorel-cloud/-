import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase project URL for LUMIR
const DEFAULT_SUPABASE_URL = 'https://fpkkbyxjbshdgvnyivfi.supabase.co';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  '';

let clientInstance: SupabaseClient | null = null;

/**
 * Returns the client-side Supabase instance.
 * Safe to call even if anon key is not yet configured (will gracefully inform caller).
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return clientInstance;
  } catch (err) {
    console.warn('Failed to initialize client Supabase SDK:', err);
    return null;
  }
}
