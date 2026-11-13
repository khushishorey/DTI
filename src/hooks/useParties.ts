import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  createParty,
  fetchParties,
  fetchParty,
  finishParty,
  joinPartyByCode,
  leaveParty,
  startParty,
} from '../services/parties';
import { queryKeys, useIsOnline } from './useServerData';

export function useParties() {
  const online = useIsOnline();
  return useQuery({ queryKey: queryKeys.parties, queryFn: fetchParties, enabled: online });
}

export function useParty(id: string | undefined) {
  const online = useIsOnline();
  return useQuery({
    queryKey: queryKeys.party(id ?? ''),
    queryFn: () => fetchParty(id!),
    enabled: online && Boolean(id),
  });
}

function usePartyMutation<TArg, TResult>(fn: (arg: TArg) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.parties }),
  });
}

export const useCreateParty = () => usePartyMutation(createParty);
export const useJoinParty = () => usePartyMutation(joinPartyByCode);
export const useStartParty = () => usePartyMutation(startParty);
export const useFinishParty = () => usePartyMutation(finishParty);
export const useLeaveParty = () => usePartyMutation(leaveParty);

/** Live lobby/competition updates: refetch the party and its leaderboard when members or the party row change. */
export function usePartyRealtime(partyId?: string) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!supabase || !partyId) return;
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.party(partyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.partyLeaderboard(partyId) });
    };
    const channel = supabase
      .channel(`party:${partyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'party_members', filter: `party_id=eq.${partyId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parties', filter: `id=eq.${partyId}` }, refresh)
      .subscribe();
    return () => {
      supabase?.removeChannel(channel);
    };
  }, [partyId, queryClient]);
}
