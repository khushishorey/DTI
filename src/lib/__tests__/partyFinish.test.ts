import { FINISH_RETRY_CAP, nextFinishRetry, PARTY_NOT_ENDED } from '../partyFinish';

describe('nextFinishRetry', () => {
  it('always retries clock skew after 3 s, however many failures', () => {
    expect(nextFinishRetry(0, PARTY_NOT_ENDED)).toEqual({ delayMs: 3000, giveUp: false });
    expect(nextFinishRetry(99, PARTY_NOT_ENDED)).toEqual({ delayMs: 3000, giveUp: false });
  });
  it('retries other errors with a delay until the cap, then gives up', () => {
    for (let failures = 1; failures < FINISH_RETRY_CAP; failures += 1) {
      const next = nextFinishRetry(failures, 'Network request failed');
      expect(next.giveUp).toBe(false);
      expect(next.delayMs).toBeGreaterThanOrEqual(3000);
    }
    expect(nextFinishRetry(FINISH_RETRY_CAP, 'Network request failed').giveUp).toBe(true);
  });
});
