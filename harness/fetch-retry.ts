/**
 * fetch with a few retries, for the hosted build's page and feed fetches. A
 * source that fails once (a 422 from RSSHub, a Reddit rate limit, a 503, a
 * timeout) would otherwise drop out of the day's edition entirely.
 */

/** Statuses worth asking again for: rate limits, server hiccups, and 422s from flaky feed proxies. */
export const RETRY_STATUSES = new Set([408, 422, 425, 429, 500, 502, 503, 504]);

export interface RetryOptions {
  /** Total tries, including the first. Default 3. */
  attempts?: number;
  /** Delay before the first retry; it doubles each time, plus up to 25% jitter. Default 1000ms. */
  baseDelayMs?: number;
  /** Longest wait between tries, including a server's Retry-After. Default 10s. */
  maxDelayMs?: number;
  /** Per-try timeout. Default 20s. */
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Seconds or an HTTP date, as Retry-After allows; null when absent or unreadable. */
export function retryAfterMs(header: string | null, now = Date.now()): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(header);
  return Number.isNaN(at) ? null : Math.max(0, at - now);
}

/**
 * Like fetch, but retries network errors, timeouts and RETRY_STATUSES. Returns
 * the last response (which may still be an error status) so callers keep their
 * own "HTTP 4xx" reporting; throws only if the last try threw.
 */
export async function fetchWithRetry(url: string, init: RequestInit = {}, options: RetryOptions = {}): Promise<Response> {
  const {
    attempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10_000,
    timeoutMs = 20_000,
    fetchImpl = fetch,
    sleep = defaultSleep,
  } = options;

  for (let attempt = 1; ; attempt++) {
    let delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1) * (1 + Math.random() * 0.25));
    try {
      const res = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (!RETRY_STATUSES.has(res.status) || attempt >= attempts) return res;
      const hinted = retryAfterMs(res.headers.get("retry-after"));
      if (hinted !== null) delay = Math.min(maxDelayMs, hinted);
      await res.body?.cancel().catch(() => {});
    } catch (err) {
      if (attempt >= attempts) throw err;
    }
    await sleep(delay);
  }
}
