import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { fetchProfile, PLACEHOLDER_USERNAME, Profile } from '../services/auth';

/**
 * - `offline`: Supabase isn't configured — the app runs on mock data without sign-in.
 * - `needs-setup`: signed in, but the player hasn't picked a username/colour yet.
 */
export type AuthStatus = 'loading' | 'offline' | 'signed-out' | 'needs-setup' | 'signed-in';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  /** Subscribe to auth changes. Call once from the root layout; returns an unsubscribe. */
  initialize: () => () => void;
  setProfile: (profile: Profile) => void;
}

const statusFor = (session: Session | null, profile: Profile | null): AuthStatus => {
  if (!session) return 'signed-out';
  if (!profile || PLACEHOLDER_USERNAME.test(profile.username)) return 'needs-setup';
  return 'signed-in';
};

export const useAuthStore = create<AuthState>((set) => ({
  status: isSupabaseConfigured ? 'loading' : 'offline',
  session: null,
  profile: null,

  initialize: () => {
    if (!supabase) return () => {};

    const applySession = async (session: Session | null) => {
      let profile: Profile | null = null;
      if (session) {
        try {
          profile = await fetchProfile(session.user.id);
        } catch (error) {
          console.warn('[auth] could not load profile', error);
        }
      }
      set({ session, profile, status: statusFor(session, profile) });
    };

    // onAuthStateChange fires INITIAL_SESSION right away, so no separate getSession() call.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Don't await inside the callback: supabase-js holds a lock while it runs.
      setTimeout(() => void applySession(session), 0);
    });
    return () => data.subscription.unsubscribe();
  },

  setProfile: (profile) => set((state) => ({ profile, status: statusFor(state.session, profile) })),
}));
