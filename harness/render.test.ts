import { expect, test } from "bun:test";
import { renderSite } from "./render";

const COMPONENT = `import React from 'react';
export default function PersonalizedHomepage() {
  const [hover, setHover] = React.useState(false);
  return <a href="https://news.ycombinator.com/" onMouseEnter={() => setHover(true)}>{hover ? "Hacker News!" : "Hacker News"}</a>;
}`;

test("server-renders the component and bundles a self-contained hydration script", async () => {
  const { html, script } = await renderSite(COMPONENT, new Date("2026-10-11T06:00:00Z"));
  expect(html).toContain('<a href="https://news.ycombinator.com/">Hacker News</a>');
  expect(html).toContain('src="homepage.js?v=');
  expect(html).toContain('static.cloudflareinsights.com/beacon.min.js');
  expect(html).toContain(':root[data-theme="night"]');
  expect(html).toContain('[data-theme-toggle]');
  expect(html).toContain('<link rel="apple-touch-icon" href="apple-touch-icon.png">');
  expect(html).toContain('<link rel="icon" href="icon.svg" type="image/svg+xml">');
  expect(html).toContain('<link rel="manifest" href="manifest.webmanifest">');
  expect(html).toContain('navigator.serviceWorker.register(root+"sw.js"');
  expect(html).toContain('[data-story][data-new]::before');
  expect(html).toContain('<meta name="apple-mobile-web-app-capable" content="yes">');
  // Bundled, not imported from a CDN at view time.
  expect(script).not.toMatch(/from\s*["']react["']/);
  expect(script).toContain("Hacker News!");
});

test("rejects components that import anything but React", async () => {
  await expect(renderSite(`import x from 'lodash'; export default function A() { return x }`, new Date())).rejects.toThrow(/only "react"/);
});

test("the web app manifest is valid and its icons exist", async () => {
  const { existsSync, readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const dir = join(import.meta.dir, "../hosted/static");
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.webmanifest"), "utf-8"));
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("./");
  for (const icon of manifest.icons) expect(existsSync(join(dir, icon.src))).toBe(true);
});
