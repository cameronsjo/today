import { expect, test } from "bun:test";
import { fetchWithRetry, retryAfterMs } from "./fetch-retry";

/** A fake fetch that plays back the given outcomes in order and counts calls. */
function scripted(...outcomes: Array<number | Error | { status: number; retryAfter: string }>) {
  let calls = 0;
  const fetchImpl = (async () => {
    const next = outcomes[Math.min(calls++, outcomes.length - 1)];
    if (next instanceof Error) throw next;
    if (typeof next === "number") return new Response(`status ${next}`, { status: next });
    return new Response("", { status: next.status, headers: { "retry-after": next.retryAfter } });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls: () => calls };
}

function recordSleeps() {
  const waits: number[] = [];
  return { waits, sleep: async (ms: number) => void waits.push(ms) };
}

test("retries a 422 and returns the success", async () => {
  const f = scripted(422, 200);
  const s = recordSleeps();
  const res = await fetchWithRetry("https://x.test/", {}, { fetchImpl: f.fetchImpl, sleep: s.sleep });
  expect(res.status).toBe(200);
  expect(f.calls()).toBe(2);
  expect(s.waits).toHaveLength(1);
});

test("retries network errors and timeouts", async () => {
  const f = scripted(new TypeError("fetch failed"), new DOMException("timed out", "TimeoutError"), 200);
  const s = recordSleeps();
  const res = await fetchWithRetry("https://x.test/", {}, { fetchImpl: f.fetchImpl, sleep: s.sleep });
  expect(res.status).toBe(200);
  expect(f.calls()).toBe(3);
});

test("gives up after the last attempt and returns the final error response", async () => {
  const f = scripted(503, 503, 503, 200);
  const s = recordSleeps();
  const res = await fetchWithRetry("https://x.test/", {}, { fetchImpl: f.fetchImpl, sleep: s.sleep, attempts: 3 });
  expect(res.status).toBe(503);
  expect(f.calls()).toBe(3);
  expect(s.waits).toHaveLength(2);
});

test("rethrows when the last attempt throws", async () => {
  const f = scripted(new TypeError("fetch failed"));
  const s = recordSleeps();
  await expect(fetchWithRetry("https://x.test/", {}, { fetchImpl: f.fetchImpl, sleep: s.sleep, attempts: 2 })).rejects.toThrow("fetch failed");
  expect(f.calls()).toBe(2);
});

test("does not retry statuses that won't change, like 404 and 403", async () => {
  for (const status of [404, 403, 401]) {
    const f = scripted(status, 200);
    const res = await fetchWithRetry("https://x.test/", {}, { fetchImpl: f.fetchImpl, sleep: recordSleeps().sleep });
    expect(res.status).toBe(status);
    expect(f.calls()).toBe(1);
  }
});

test("backs off exponentially and honours a capped Retry-After", async () => {
  const backoff = recordSleeps();
  await fetchWithRetry("https://x.test/", {}, { fetchImpl: scripted(500, 500, 200).fetchImpl, sleep: backoff.sleep, baseDelayMs: 100 });
  expect(backoff.waits[0]).toBeGreaterThanOrEqual(100);
  expect(backoff.waits[0]).toBeLessThanOrEqual(125);
  expect(backoff.waits[1]).toBeGreaterThanOrEqual(200);
  expect(backoff.waits[1]).toBeLessThanOrEqual(250);

  const hinted = recordSleeps();
  await fetchWithRetry("https://x.test/", {}, {
    fetchImpl: scripted({ status: 429, retryAfter: "3" }, { status: 429, retryAfter: "120" }, 200).fetchImpl,
    sleep: hinted.sleep,
    maxDelayMs: 10_000,
  });
  expect(hinted.waits).toEqual([3000, 10_000]);
});

test("reads Retry-After as seconds or an HTTP date", () => {
  const now = Date.parse("2026-11-16T12:00:00Z");
  expect(retryAfterMs("5", now)).toBe(5000);
  expect(retryAfterMs("Mon, 16 Nov 2026 12:00:30 GMT", now)).toBe(30_000);
  expect(retryAfterMs(null, now)).toBeNull();
  expect(retryAfterMs("soon", now)).toBeNull();
});
