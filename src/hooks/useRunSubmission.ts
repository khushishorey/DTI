import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { fetchProfile } from '../services/auth';
import { fetchParty } from '../services/parties';
import { submitRun } from '../services/runs';
import { useAuthStore } from '../stores/useAuthStore';
import { usePartyStore } from '../stores/usePartyStore';
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
    const partyId = await livePartyId(queryClient);
    const result = await submitRun(session, partyId);
    setSubmission(session.id, { state: 'saved', result });
    if (result.runId) {
      await Promise.all([
        ...(partyId ? [
          queryClient.invalidateQueries({ queryKey: queryKeys.party(partyId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.partyLeaderboard(partyId) }),
        ] : []),
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

/** Tag the run with the active party only while it's live (the server re-checks membership and window). */
async function livePartyId(queryClient: QueryClient): Promise<string | null> {
  const id = usePartyStore.getState().activePartyId;
  if (!id) return null;
  // fetchQuery, not getQueryData: the party entry is garbage-collected 5 min after its screens unmount (i.e. mid-run).
  const party = await queryClient
    .fetchQuery({ queryKey: queryKeys.party(id), queryFn: () => fetchParty(id) })
    .catch(() => null);
  return party?.status === 'in_progress' ? id : null;
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
