// Interstitial cadence and lifecycle against a fake ads SDK.

type Listener = (payload?: unknown) => void;

class MockAd {
  listeners = new Map<string, Set<Listener>>();
  load = jest.fn();
  show = jest.fn(() => Promise.resolve());
  addAdEventListener(type: string, fn: Listener) {
    const set = this.listeners.get(type) ?? new Set();
    set.add(fn);
    this.listeners.set(type, set);
    return () => set.delete(fn);
  }
  emit(type: string, payload?: unknown) {
    for (const fn of Array.from(this.listeners.get(type) ?? [])) fn(payload);
  }
}

const mockCreated: MockAd[] = [];
const mockTrack = jest.fn();

jest.mock('../admob', () => ({
  adsModule: {
    AdEventType: {
      LOADED: 'loaded',
      ERROR: 'error',
      OPENED: 'opened',
      CLOSED: 'closed',
      PAID: 'paid',
    },
    InterstitialAd: {
      createForAdRequest: () => {
        const ad = new MockAd();
        mockCreated.push(ad);
        return ad;
      },
    },
  },
  getAdsState: () => ({ ready: true, privacyOptionsRequired: false }),
  onAdsStateChange: () => () => {},
}));
jest.mock('../config', () => ({ ADS_ENABLED: true, adUnitId: () => 'test-unit' }));
jest.mock('@/analytics/analytics', () => ({ track: (...args: unknown[]) => mockTrack(...args) }));

type Interstitial = typeof import('../interstitial');

const flush = () => new Promise(resolve => setImmediate(resolve));

let m: Interstitial;

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] });
  jest.resetModules();
  mockCreated.length = 0;
  mockTrack.mockClear();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  m = require('../interstitial');
});

afterEach(() => {
  jest.useRealTimers();
});

async function finishPuzzles(n: number) {
  for (let i = 0; i < n; i++) await m.countFinishedPuzzle();
}

const latest = () => mockCreated[mockCreated.length - 1];

async function showAndClose(adsRemoved = false) {
  const p = m.showInterstitialIfDue(adsRemoved);
  await flush();
  latest().emit('opened');
  latest().emit('closed');
  return p;
}

describe('interstitial cadence', () => {
  it('is due only after SHOW_EVERY finished puzzles', async () => {
    await finishPuzzles(m.SHOW_EVERY - 1);
    expect(await m.interstitialDue(false)).toBe(false);
    await finishPuzzles(1);
    expect(await m.interstitialDue(false)).toBe(true);
    expect(await m.interstitialDue(true)).toBe(false);
  });

  it('shows a loaded ad, resets the counter and preloads the next one', async () => {
    m.preloadInterstitial();
    latest().emit('loaded');
    const first = latest();
    await finishPuzzles(m.SHOW_EVERY);

    const p = m.showInterstitialIfDue(false);
    await flush();
    expect(first.show).toHaveBeenCalled();
    first.emit('opened');
    await flush();
    first.emit('closed');
    expect(await p).toBe(true);

    expect(await m.interstitialDue(false)).toBe(false);
    expect(mockCreated).toHaveLength(2);
    expect(latest().load).toHaveBeenCalled();
  });

  it('keeps the ad due when none is loaded yet', async () => {
    await finishPuzzles(m.SHOW_EVERY);
    expect(await m.showInterstitialIfDue(false)).toBe(false);
    expect(await m.interstitialDue(false)).toBe(true);
    // It asked for an ad, so the next finish can show one.
    expect(mockCreated).toHaveLength(1);
    latest().emit('loaded');
    expect(await showAndClose()).toBe(true);
  });

  it('never shows to players who removed ads', async () => {
    m.preloadInterstitial();
    latest().emit('loaded');
    await finishPuzzles(m.SHOW_EVERY);
    expect(await m.showInterstitialIfDue(true)).toBe(false);
    expect(latest().show).not.toHaveBeenCalled();
  });
});

describe('interstitial loading', () => {
  it('retries a failed load with backoff', () => {
    m.preloadInterstitial();
    latest().emit('error', { code: 'googleMobileAds/no-fill' });
    expect(mockCreated).toHaveLength(1);
    expect(mockTrack).toHaveBeenCalledWith('ad_failed', {
      ad_format: 'interstitial',
      error_code: 'googleMobileAds/no-fill',
    });

    jest.advanceTimersByTime(5_000);
    expect(mockCreated).toHaveLength(2);
    latest().emit('error', {});
    jest.advanceTimersByTime(5_000);
    expect(mockCreated).toHaveLength(2); // second retry waits longer
    jest.advanceTimersByTime(10_000);
    expect(mockCreated).toHaveLength(3);
  });

  it('does not request a second ad while one is loading or fresh', () => {
    m.preloadInterstitial();
    m.preloadInterstitial();
    latest().emit('loaded');
    m.preloadInterstitial();
    expect(mockCreated).toHaveLength(1);
  });

  it('replaces an expired ad instead of showing it', async () => {
    m.preloadInterstitial();
    latest().emit('loaded');
    const stale = latest();
    jest.advanceTimersByTime(56 * 60 * 1000);
    await finishPuzzles(m.SHOW_EVERY);

    expect(await m.showInterstitialIfDue(false)).toBe(false);
    expect(stale.show).not.toHaveBeenCalled();
    expect(mockCreated).toHaveLength(2);
  });

  it('gives up when a shown ad never opens', async () => {
    m.preloadInterstitial();
    latest().emit('loaded');
    await finishPuzzles(m.SHOW_EVERY);
    const p = m.showInterstitialIfDue(false);
    await flush();
    jest.advanceTimersByTime(5_000);
    expect(await p).toBe(false);
    expect(await m.interstitialDue(false)).toBe(true);
  });

  it('reports impression revenue', () => {
    m.preloadInterstitial();
    latest().emit('paid', { value: 0.004, currency: 'EUR', precision: 1 });
    expect(mockTrack).toHaveBeenCalledWith('ad_paid', {
      ad_format: 'interstitial',
      value: 0.004,
      currency: 'EUR',
      precision: 1,
    });
  });
});
