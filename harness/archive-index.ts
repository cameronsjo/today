/**
 * Write site/archive/index.html: every edition, newest first, with its lead
 * headline. Also points each archived page's icon and manifest links back at the
 * site root, since an archived copy sits two folders down and has none of its
 * own. Safe to run again over editions it has already fixed.
 *
 * Run: bun harness/archive-index.ts <site-dir>     (publish-pages.sh does)
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Root files the page links by relative path; archived copies need them as ../../. */
const ROOT_LINKS = ["icon.svg", "favicon-32.png", "apple-touch-icon.png", "manifest.webmanifest"];

const decode = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const text = (inner: string) => decode(inner.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();

/**
 * The edition's lead headline: its lead meta tag, else the element marked
 * data-lead, else the first <h2> (the gazette's lead headline in editions built
 * before data-lead existed). Null when none is found.
 */
export function leadHeadline(html: string): string | null {
  const meta = html.match(/<meta name="lead" content="([^"]*)"/);
  if (meta) return decode(meta[1]) || null;
  const marked = html.match(/<(\w+)\b[^>]*\bdata-lead\b[^>]*>([\s\S]*?)<\/\1>/);
  if (marked && text(marked[2])) return text(marked[2]);
  const h2 = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
  return h2 && text(h2[1]) ? text(h2[1]) : null;
}

/** Point an archived page's root links (icons, manifest) two folders up. */
export function rootLinksFromArchive(html: string): string {
  let out = html;
  for (const file of ROOT_LINKS) out = out.replaceAll(`href="${file}"`, `href="../../${file}"`);
  return out;
}

export function renderArchiveIndex(editions: Array<{ date: string; lead: string | null }>): string {
  const rows = editions
    .map(
      ({ date, lead }) =>
        `<a href="${date}/"><time datetime="${date}">${new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</time><span>${lead ? escapeHtml(lead) : "<em>No headline recorded</em>"}</span></a>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>The Context: archive</title>
<link rel="icon" href="../icon.svg" type="image/svg+xml">
<link rel="icon" href="../favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
<link rel="manifest" href="../manifest.webmanifest">
<meta name="theme-color" content="#f5ead0" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#292c33" media="(prefers-color-scheme: dark)">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
:root{--bg:#f5ead0;--fg:#20203e;--fg2:#3d3424;--accent:#7a5a10;--steel:#2e4a5a;--border:#cbb88a}
@media (prefers-color-scheme: dark){:root{--bg:#292c33;--fg:#e8e6e1;--fg2:#c5c8c6;--accent:#dbbb6f;--steel:#b8cad4;--border:#4a4f5c}}
body{margin:0;background:var(--bg);color:var(--fg);font-family:Newsreader,"Iowan Old Style",Georgia,serif}
main{max-width:720px;margin:0 auto;padding:clamp(16px,4vw,40px) 16px 64px}
h1{font-style:italic;font-weight:700;font-size:clamp(2.5rem,9vw,4rem);letter-spacing:-.03em;line-height:1;margin:0;text-align:center}
.sub{display:flex;align-items:center;gap:12px;margin:12px 0 28px;color:var(--accent);font:500 .75rem "JetBrains Mono",ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase}
.sub::before,.sub::after{content:"";flex:1;border-top:1px solid var(--accent)}
nav{border-top:3px double var(--fg)}
a{display:grid;grid-template-columns:9.5rem 1fr;gap:4px 16px;padding:14px 0;border-bottom:1px solid var(--border);color:var(--fg);text-decoration:none}
a:hover span{color:var(--accent)}
time{color:var(--steel);font:.8rem/1.9 "JetBrains Mono",ui-monospace,monospace;text-transform:uppercase;letter-spacing:.04em}
span{font-size:1.15rem;font-weight:600;line-height:1.35}em{font-weight:400;color:var(--fg2)}
a.today span{font-style:italic}
@media (max-width:480px){a{grid-template-columns:1fr}}
</style>
</head>
<body>
<main>
<h1>The Context</h1>
<div class="sub">the archive</div>
<nav>
<a class="today" href="../"><time>Today</time><span>Today&#39;s edition</span></a>
${rows}
</nav>
</main>
</body>
</html>
`;
}

/** Fix every archived edition's links and write archive/index.html. */
export function buildArchive(siteDir: string): number {
  const archive = join(siteDir, "archive");
  if (!existsSync(archive)) return 0;
  const dates = readdirSync(archive).filter((d) => DATE.test(d)).sort().reverse();
  const editions = dates.map((date) => {
    const page = join(archive, date, "index.html");
    if (!existsSync(page)) return { date, lead: null };
    const html = readFileSync(page, "utf-8");
    const fixed = rootLinksFromArchive(html);
    if (fixed !== html) writeFileSync(page, fixed);
    return { date, lead: leadHeadline(html) };
  });
  writeFileSync(join(archive, "index.html"), renderArchiveIndex(editions));
  return editions.length;
}

if (import.meta.main) {
  const site = process.argv[2];
  if (!site) throw new Error("usage: bun harness/archive-index.ts <site-dir>");
  console.log(`[archive] indexed ${buildArchive(site)} editions`);
}
