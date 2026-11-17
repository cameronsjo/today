/**
 * Send one notification to NOTIFY_URL, ntfy-style: a POST whose body is the
 * message, with the title in a Title header. Works as-is with ntfy topics and
 * with any webhook that takes a plain-text body. NOTIFY_TOKEN, when set, goes
 * in an Authorization: Bearer header (ntfy access tokens).
 *
 * Run: bun harness/notify.ts <title> [message-file]   (message read from stdin without a file)
 *
 * Never fails the caller: a missing NOTIFY_URL or a failed send only logs.
 */
import { readFileSync } from "node:fs";

/** Keep the message short enough for a phone notification and for ntfy's 4 KB message limit. */
export function tailForNotification(log: string, maxLines = 15, maxChars = 3000): string {
  const tail = log.trimEnd().split("\n").slice(-maxLines).join("\n");
  return tail.length > maxChars ? "…" + tail.slice(-maxChars) : tail;
}

export async function notify(
  title: string,
  message: string,
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const url = env.NOTIFY_URL;
  if (!url) return false;
  const headers: Record<string, string> = { Title: title, Tags: "warning", "Content-Type": "text/plain; charset=utf-8" };
  if (env.NOTIFY_TOKEN) headers.Authorization = `Bearer ${env.NOTIFY_TOKEN}`;
  try {
    const res = await fetchImpl(url, { method: "POST", headers, body: message, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) console.error(`[notify] ${url} answered HTTP ${res.status}`);
    return res.ok;
  } catch (err) {
    console.error(`[notify] could not reach ${url}: ${(err as Error).message}`);
    return false;
  }
}

if (import.meta.main) {
  const [title = "The Context", file] = process.argv.slice(2);
  const raw = file ? readFileSync(file, "utf-8") : await new Response(Bun.stdin.stream()).text();
  await notify(title, tailForNotification(raw) || title);
}
