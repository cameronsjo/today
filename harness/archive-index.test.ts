import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildArchive, leadHeadline, rootLinksFromArchive } from "./archive-index";
import { renderSite } from "./render";

test("finds the lead from the meta tag, then data-lead, then the first h2", () => {
  expect(leadHeadline('<meta name="lead" content="Claude &amp; friends">')).toBe("Claude & friends");
  expect(leadHeadline('<h2>Other</h2><h2 class="x" data-lead="">A <em>real</em>&nbsp;lead</h2>')).toBe("A real lead");
  expect(leadHeadline("<h1>The Context</h1><h2>Old-style lead</h2>")).toBe("Old-style lead");
  expect(leadHeadline("<p>nothing</p>")).toBeNull();
});

test("points an archived page's icon and manifest links at the site root, once", () => {
  const page = '<link rel="icon" href="icon.svg"><link rel="manifest" href="manifest.webmanifest"><script src="homepage.js?v=1">';
  const fixed = rootLinksFromArchive(page);
  expect(fixed).toContain('href="../../icon.svg"');
  expect(fixed).toContain('href="../../manifest.webmanifest"');
  expect(fixed).toContain('src="homepage.js?v=1"');
  expect(rootLinksFromArchive(fixed)).toBe(fixed);
});

test("the rendered page carries its lead headline as a meta tag", async () => {
  const tsx = `import React from 'react';
export default function A() { return <main><h1>The Context</h1><article data-story><h2 data-lead>Patch "now" & reboot</h2></article></main> }`;
  const { html } = await renderSite(tsx, new Date("2026-11-17T06:00:00Z"));
  expect(html).toContain('<meta name="lead" content="Patch &quot;now&quot; &amp; reboot">');
  expect(leadHeadline(html)).toBe('Patch "now" & reboot');
});

test("indexes editions newest first with their headlines and fixes their links", () => {
  const site = mkdtempSync(join(tmpdir(), "archive-"));
  for (const [date, page] of [
    ["2026-11-15", '<link rel="icon" href="icon.svg"><h2>Old lead</h2>'],
    ["2026-11-16", '<meta name="lead" content="New lead"><link rel="apple-touch-icon" href="apple-touch-icon.png">'],
    ["2026-11-17", "<p>no headline</p>"],
  ]) {
    mkdirSync(join(site, "archive", date), { recursive: true });
    writeFileSync(join(site, "archive", date, "index.html"), page);
  }
  mkdirSync(join(site, "archive", "not-a-date"));
  expect(buildArchive(site)).toBe(3);
  const index = readFileSync(join(site, "archive", "index.html"), "utf-8");
  expect(index.indexOf("2026-11-17/")).toBeLessThan(index.indexOf("2026-11-16/"));
  expect(index.indexOf("2026-11-16/")).toBeLessThan(index.indexOf("2026-11-15/"));
  expect(index).toContain("<span>New lead</span>");
  expect(index).toContain("<span>Old lead</span>");
  expect(index).toContain("No headline recorded");
  expect(index).not.toContain("not-a-date");
  expect(readFileSync(join(site, "archive", "2026-11-15", "index.html"), "utf-8")).toContain('href="../../icon.svg"');
});
