import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchMyRuns } from '../services/runs';
import { fetchMyStats } from '../services/stats';
import { Bounds, cellsToTerritories, fetchCellOwner, fetchCellsInBounds, snapBounds } from '../services/territory';
import { useAuthStore } from '../stores/useAuthStore';

/** Query keys in one place so a finished run can invalidate exactly what changed. */
export const queryKeys = {
  cells: (bounds: Bounds) => ['cells', bounds] as const,
  allCells: ['cells'] as const,
  cellOwner: (h3: string) => ['cell-owner', h3] as const,
  allCellOwners: ['cell-owner'] as const,
  myStats: ['my-stats'] as const,
  myRuns: ['my-runs'] as const,
};

/**
 * True when the backend can be queried. In offline demo mode (no Supabase keys) these hooks
 * stay idle and screens keep showing mock data.
 */
export function useIsOnline(): boolean {
  return useAuthStore((state) => state.status === 'signed-in');
}

/** Owned cells in the viewport, ready for the map (`null` while offline). */
export function useTerritoriesInBounds(bounds: Bounds) {
  const online = useIsOnline();
  const myUserId = useAuthStore((state) => state.session?.user.id);
  const snapped = useMemo(() => snapBounds(bounds), [bounds]);
  const query = useQuery({
    queryKey: queryKeys.cells(snapped),
    queryFn: () => fetchCellsInBounds(snapped),
    enabled: online,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
  const territories = useMemo(
    () => (query.data ? cellsToTerritories(query.data, myUserId) : null),
    [query.data, myUserId],
  );
  return { ...query, territories: online ? territories : null };
}

export function useCellOwner(h3: string | undefined) {
  const online = useIsOnline();
  return useQuery({
    queryKey: queryKeys.cellOwner(h3 ?? ''),
    queryFn: () => fetchCellOwner(h3!),
    enabled: online && Boolean(h3),
    staleTime: 60_000,
  });
}

export function useMyStats() {
  const online = useIsOnline();
  return useQuery({ queryKey: queryKeys.myStats, queryFn: fetchMyStats, enabled: online });
}

export function useMyRuns() {
  const online = useIsOnline();
  return useQuery({ queryKey: queryKeys.myRuns, queryFn: () => fetchMyRuns(10), enabled: online });
}
