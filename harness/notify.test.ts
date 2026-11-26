import { expect, test } from "bun:test";
import { notify, tailForNotification } from "./notify";

function capture() {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response("", { status: 200 });
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

test("posts the message ntfy-style with a Title header", async () => {
  const c = capture();
  const sent = await notify("Build failed", "boom", { NOTIFY_URL: "https://ntfy.test/context" }, c.fetchImpl);
  expect(sent).toBe(true);
  expect(c.calls[0].url).toBe("https://ntfy.test/context");
  expect(c.calls[0].init.method).toBe("POST");
  expect(c.calls[0].init.body).toBe("boom");
  expect((c.calls[0].init.headers as Record<string, string>).Title).toBe("Build failed");
  expect((c.calls[0].init.headers as Record<string, string>).Authorization).toBeUndefined();
});

test("adds a bearer token when NOTIFY_TOKEN is set", async () => {
  const c = capture();
  await notify("t", "m", { NOTIFY_URL: "https://ntfy.test/x", NOTIFY_TOKEN: "tk_abc" }, c.fetchImpl);
  expect((c.calls[0].init.headers as Record<string, string>).Authorization).toBe("Bearer tk_abc");
});

test("does nothing without NOTIFY_URL, and never throws on a failed send", async () => {
  const c = capture();
  expect(await notify("t", "m", {}, c.fetchImpl)).toBe(false);
  expect(c.calls).toHaveLength(0);
  const broken = (async () => { throw new TypeError("fetch failed"); }) as unknown as typeof fetch;
  expect(await notify("t", "m", { NOTIFY_URL: "https://ntfy.test/x" }, broken)).toBe(false);
});

test("keeps only the end of a long build log", () => {
  const log = Array.from({ length: 40 }, (_, i) => `line ${i}`).join("\n") + "\n";
  const tail = tailForNotification(log, 3);
  expect(tail).toBe("line 37\nline 38\nline 39");
  expect(tailForNotification("x".repeat(5000), 15, 100)).toHaveLength(101);
});
