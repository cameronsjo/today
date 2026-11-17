/**
 * Web Push: tell the reader's devices that a new edition of The Context is out.
 *
 * The site is static, so there's no server to collect subscriptions. Instead the
 * page shows its subscription once (the "Notify me" button), the reader pastes
 * it into PUSH_SUBSCRIPTIONS on the builder, and this script sends to each one
 * after a successful publish.
 *
 * Env: VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY (make a pair with --keys),
 * VAPID_SUBJECT (a mailto: or https: contact; defaults to the Pages URL), and
 * PUSH_SUBSCRIPTIONS (one subscription object, or a JSON array of them).
 *
 * Run: bun harness/push.ts <site-dir>    send "edition is out" (entrypoint.sh does, after publishing)
 *      bun harness/push.ts --keys        print a new VAPID key pair
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import webpush, { type PushSubscription } from "web-push";
import { leadHeadline } from "./archive-index";

export interface EditionPush {
  title: string;
  body: string;
  /** Opened when the notification is tapped; the service worker resolves it against its scope. */
  url: string;
}

/** PUSH_SUBSCRIPTIONS as a list, keeping only entries shaped like a subscription. */
export function parseSubscriptions(raw: string | undefined): PushSubscription[] {
  if (!raw?.trim()) return [];
  const parsed = JSON.parse(raw);
  const list = Array.isArray(parsed) ? parsed : [parsed];
  return list.filter(
    (s): s is PushSubscription =>
      typeof s?.endpoint === "string" && s.endpoint.startsWith("https://") && typeof s?.keys?.p256dh === "string" && typeof s?.keys?.auth === "string",
  );
}

export function editionPush(indexHtml: string, now = new Date()): EditionPush {
  const day = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return { title: `The Context · ${day}`, body: leadHeadline(indexHtml) ?? "Today's edition is out.", url: "./" };
}

type Send = (sub: PushSubscription, payload: string) => Promise<{ statusCode: number }>;

/** Send to every subscription; report the ones the push service says are gone. */
export async function sendEdition(subs: PushSubscription[], message: EditionPush, send: Send) {
  const payload = JSON.stringify(message);
  const results = await Promise.all(
    subs.map(async (sub) => {
      const where = new URL(sub.endpoint).host;
      try {
        await send(sub, payload);
        return { where, ok: true, gone: false };
      } catch (err: any) {
        const gone = err?.statusCode === 404 || err?.statusCode === 410;
        console.error(`[push] ${where}: ${gone ? "subscription expired; remove it from PUSH_SUBSCRIPTIONS" : err?.message ?? err}`);
        return { where, ok: false, gone };
      }
    }),
  );
  return { sent: results.filter((r) => r.ok).length, gone: results.filter((r) => r.gone).length, failed: results.filter((r) => !r.ok).length };
}

if (import.meta.main) {
  if (process.argv[2] === "--keys") {
    const { publicKey, privateKey } = webpush.generateVAPIDKeys();
    console.log(`VAPID_PUBLIC_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${privateKey}`);
    process.exit(0);
  }
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, PUSH_SUBSCRIPTIONS, PAGES_REPO } = process.env;
  const subs = parseSubscriptions(PUSH_SUBSCRIPTIONS);
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !subs.length) {
    console.log("[push] skipped: set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and PUSH_SUBSCRIPTIONS to send");
    process.exit(0);
  }
  const [owner, repo] = (PAGES_REPO ?? "").split("/");
  const subject = process.env.VAPID_SUBJECT ?? (owner && repo ? `https://${owner}.github.io/${repo}/` : "https://github.com/");
  webpush.setVapidDetails(subject, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  const html = readFileSync(join(process.argv[2] ?? "site", "index.html"), "utf-8");
  const result = await sendEdition(subs, editionPush(html), (sub, payload) => webpush.sendNotification(sub, payload, { TTL: 6 * 3600 }));
  console.log(`[push] sent ${result.sent} of ${subs.length}${result.gone ? `, ${result.gone} expired` : ""}`);
}
