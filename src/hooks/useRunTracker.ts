import { useEffect, useRef, useState } from 'react';
import { createTrackingSource, TrackingError, TrackingErrorCode, TrackingSource } from '../lib/tracking/sources';
import { useRunStore } from '../stores/useRunStore';

/**
 * Drives the active run: a 1 s clock plus the GPS source (device or simulator) chosen
 * when the run started. Both stop while paused and are cleaned up on unmount.
 */
export function useRunTracker(): { error: TrackingErrorCode | null } {
  const sessionId = useRunStore((state) => state.currentSession?.id);
  const mode = useRunStore((state) => state.currentSession?.trackingMode);
  const status = useRunStore((state) => state.status);
  const [error, setError] = useState<TrackingErrorCode | null>(null);
  const sourceRef = useRef<{ sessionId: string; source: TrackingSource } | null>(null);

  useEffect(() => {
    if (!sessionId || !mode || status !== 'running') return;

    if (sourceRef.current?.sessionId !== sessionId) {
      sourceRef.current = { sessionId, source: createTrackingSource(mode) };
    }
    const { tick, addTrackPoint } = useRunStore.getState();
    const clock = setInterval(tick, 1000);

    let stop: (() => void) | undefined;
    let cancelled = false;
    sourceRef.current.source
      .start(addTrackPoint)
      .then((stopFn) => {
        if (cancelled) stopFn();
        else stop = stopFn;
        setError(null);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof TrackingError ? reason.code : 'unavailable');
      });

    return () => {
      cancelled = true;
      clearInterval(clock);
      stop?.();
    };
  }, [sessionId, mode, status]);

  return { error };
}
