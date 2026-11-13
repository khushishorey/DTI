import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * False until EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are set in `.env`.
 * Without them the app runs in offline demo mode (mock data, no sign-in), so teammates
 * can keep working on UI before the backend is ready.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

// During web server rendering there is no window/localStorage; skip persistence there.
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        storage: isServer ? undefined : AsyncStorage,
        autoRefreshToken: !isServer,
        persistSession: !isServer,
        detectSessionInUrl: false,
      },
    })
  : null;

// On native, refresh the session only while the app is in the foreground.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured. Copy .env.example to .env and fill in your project keys.');
  }
  return supabase;
}
