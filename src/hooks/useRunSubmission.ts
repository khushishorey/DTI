import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { fetchProfile } from '../services/auth';
import { submitRun } from '../services/runs';
import { useAuthStore } from '../stores/useAuthStore';
import { useRunStore } from '../stores/useRunStore';
import { queryKeys } from './useServerData';

/**
 * Uploads the finished run once (and on retry), then refreshes everything it changed:
 * map cells, stats, recent runs and the player's XP. Lives outside the component so the
 * upload finishes even if the player leaves the summary screen.
 */
async function uploadFinishedRun(queryClient: QueryClient) {
  const { currentSession: session, setSubmission } = useRunStore.getState();
  if (!session || session.status !== 'finished') return;

  setSubmission(session.id, { state: 'saving' });
  try {
    const result = await submitRun(session);
    setSubmission(session.id, { state: 'saved', result });
    if (result.runId) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.allCells }),
        queryClient.invalidateQueries({ queryKey: queryKeys.allCellOwners }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myStats }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myRuns }),
        refreshProfile(),
      ]);
    }
  } catch (error) {
    setSubmission(session.id, {
      state: 'failed',
      error: error instanceof Error ? error.message : 'Couldn’t save your run.',
    });
  }
}

async function refreshProfile() {
  const { session, setProfile } = useAuthStore.getState();
  if (!session) return;
  const profile = await fetchProfile(session.user.id).catch(() => null);
  if (profile) setProfile(profile);
}

export function useRunSubmission() {
  const queryClient = useQueryClient();
  const submission = useRunStore((state) => state.submission);
  const sessionStatus = useRunStore((state) => state.currentSession?.status);

  useEffect(() => {
    if (sessionStatus === 'finished' && useRunStore.getState().submission.state === 'idle') {
      void uploadFinishedRun(queryClient);
    }
  }, [sessionStatus, queryClient]);

  const retry = useCallback(() => void uploadFinishedRun(queryClient), [queryClient]);
  return { submission, retry };
}
