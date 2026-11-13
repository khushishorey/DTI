/** Server reply when our clock runs ahead of its clock; not a real failure. */
export const PARTY_NOT_ENDED = 'Party has not ended yet';
export const FINISH_RETRY_CAP = 5;

/**
 * What to do after an automatic finish_party call fails. `failures` counts the real failures
 * so far, including this one. 'Not ended yet' is clock skew and is always retried (no cap).
 */
export function nextFinishRetry(failures: number, message: string): { delayMs: number; giveUp: boolean } {
  if (message === PARTY_NOT_ENDED) return { delayMs: 3000, giveUp: false };
  return failures >= FINISH_RETRY_CAP ? { delayMs: 0, giveUp: true } : { delayMs: 4000, giveUp: false };
}
