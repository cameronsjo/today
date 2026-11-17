import { expect, test } from "bun:test";
import webpush from "web-push";
import { editionPush, parseSubscriptions, sendEdition } from "./push";

const SUB = { endpoint: "https://web.push.apple.com/abc", keys: { p256dh: "BNc", auth: "xyz" } };

test("reads one subscription or a list, and drops anything malformed", () => {
  expect(parseSubscriptions(JSON.stringify(SUB))).toEqual([SUB]);
  expect(parseSubscriptions(JSON.stringify([SUB, { endpoint: "http://insecure/", keys: SUB.keys }, { nope: 1 }]))).toEqual([SUB]);
  expect(parseSubscriptions(undefined)).toEqual([]);
  expect(parseSubscriptions("  ")).toEqual([]);
});

test("the notification leads with the edition's headline", () => {
  const msg = editionPush('<meta name="lead" content="Claude Code 3.0 ships">', new Date("2026-11-17T12:00:00Z"));
  expect(msg.title).toBe("The Context · Tuesday, November 17");
  expect(msg.body).toBe("Claude Code 3.0 ships");
  expect(editionPush("<p/>").body).toBe("Today's edition is out.");
});

test("sends to every subscription and counts expired ones", async () => {
  const sent: string[] = [];
  const result = await sendEdition(
    [SUB, { ...SUB, endpoint: "https://fcm.googleapis.com/gone" }, { ...SUB, endpoint: "https://updates.push.services.mozilla.com/x" }],
    { title: "t", body: "b", url: "./" },
    async (sub, payload) => {
      if (sub.endpoint.endsWith("/gone")) throw Object.assign(new Error("Gone"), { statusCode: 410 });
      sent.push(`${sub.endpoint} ${payload}`);
      return { statusCode: 201 };
    },
  );
  expect(result).toEqual({ sent: 2, gone: 1, failed: 1 });
  expect(sent[0]).toBe('https://web.push.apple.com/abc {"title":"t","body":"b","url":"./"}');
});

test("web-push builds an encrypted, VAPID-signed request for a real subscription", () => {
  const keys = webpush.generateVAPIDKeys();
  // A browser-shaped subscription: an uncompressed P-256 public key and a 16-byte auth secret.
  const ecdh = require("node:crypto").createECDH("prime256v1");
  ecdh.generateKeys();
  const sub = {
    endpoint: "https://web.push.apple.com/QH-test",
    keys: { p256dh: ecdh.getPublicKey().toString("base64url"), auth: require("node:crypto").randomBytes(16).toString("base64url") },
  };
  const req = webpush.generateRequestDetails(sub, '{"title":"t"}', {
    vapidDetails: { subject: "https://cameronsjo.github.io/today/", publicKey: keys.publicKey, privateKey: keys.privateKey },
    TTL: 60,
  });
  expect(req.endpoint).toBe(sub.endpoint);
  expect(req.headers["Content-Encoding"]).toBe("aes128gcm");
  expect(String(req.headers.Authorization)).toStartWith("vapid t=");
});
