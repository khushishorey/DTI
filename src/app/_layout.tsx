import { useEffect, useRef } from 'react';
import { router, SplashScreen, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { usePartyStore } from '../stores/usePartyStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

SplashScreen.preventAutoHideAsync().catch(() => {});

// Every in-app route must be listed here so the auth guard covers it.
const APP_SCREENS = [
  'index',
  'explore',
  'leaderboard',
  'profile',
  'run',
  'summary',
  'player/[id]',
  'parties/index',
  'parties/create',
  'parties/join',
  'parties/lobby',
  'parties/leaderboard',
  'parties/results',
] as const;

const AUTH_PATHS = ['/get-started', '/login', '/register'] as const;
type AuthPath = (typeof AUTH_PATHS)[number];
const isAuthPath = (path: string): path is AuthPath => (AUTH_PATHS as readonly string[]).includes(path);

export default function RootLayout() {
  const status = useAuthStore((state) => state.status);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => initialize(), [initialize]);

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync().catch(() => {});
  }, [status]);

  // The guard's own fallback lands on whichever auth screen the router lists first.
  // On launch or after logging out, open get-started instead, unless the app was opened
  // straight on an auth page (e.g. a /login link), which we keep.
  const pathname = usePathname();
  const launchPath = useRef(pathname);
  const previousStatus = useRef(status);
  useEffect(() => {
    if (status === 'signed-out' && previousStatus.current !== 'signed-out') {
      queryClient.clear(); // never show the previous player's data to the next one
      usePartyStore.getState().setActivePartyId(null);
      const launch = launchPath.current;
      const openedOnAuthPage = previousStatus.current === 'loading' && isAuthPath(launch);
      router.replace(openedOnAuthPage ? launch : '/get-started');
    }
    previousStatus.current = status;
  }, [status]);

  // 'offline' = no Supabase keys yet: let everyone straight into the app on mock data.
  const canUseApp = status === 'signed-in' || status === 'offline';
  const signedOut = status === 'signed-out' || status === 'loading';

  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.container}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'fade',
          }}
        >
          <Stack.Protected guard={canUseApp}>
            {APP_SCREENS.map((name) => (
              <Stack.Screen key={name} name={name} />
            ))}
          </Stack.Protected>
          <Stack.Protected guard={signedOut}>
            <Stack.Screen name="(auth)/get-started" />
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(auth)/register" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'needs-setup'}>
            <Stack.Screen name="(auth)/setup" />
          </Stack.Protected>
        </Stack>
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
