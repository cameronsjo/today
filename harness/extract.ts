/**
 * Automatic content extraction for the hosted build.
 *
 * Works for any URL without a per-site feed map:
 * 1. Negotiates Markdown or RSS/Atom directly via Accept headers.
 * 2. Auto-discovers <link rel="alternate"> RSS/Atom feeds on listing pages
 *    (and probes standard feed paths on HTTP 403), formatting entries as
 *    compact Markdown.
 * 3. Extracts clean Markdown from HTML pages using @mozilla/readability
 *    (for articles) or pruned DOM -> Turndown (for listings without feeds).
 * 4. Paces requests per hostname so parallel fetches across different sites
 *    don't burst a single host into 429/503 responses.
 */
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import TurndownService from "turndown";

export const BROWSER_FETCH_HEADERS: Record<string, string> = {
  accept:
    "text/markdown, text/html;q=0.9, application/rss+xml;q=0.8, application/atom+xml;q=0.8, application/xml;q=0.7, */*;q=0.5",
  "accept-language": "en-US,en;q=0.9",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

/**
 * Honest feed-reader headers for RSS/Atom fetches.
 * Bot-mitigated hosts (e.g. Cloudflare) often 403 spoofed Chrome UAs without a
 * matching browser TLS fingerprint, while allowing standard RSS reader UAs.
 */
export const FEED_FETCH_HEADERS: Record<string, string> = {
  accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5",
  "user-agent": "homepage-builder/1.0 (personal daily digest)",
};

const MAX_OUTPUT_CHARS = 120_000;
const MAX_FEED_ITEMS = 30;
const MAX_SUMMARY_CHARS = 360;

export interface ExtractedPage {
  title: string;
  content: string;
}

/**
 * Serialize requests to the same hostname with at least `minGapMs` between
 * starts, while allowing different hostnames to run in parallel.
 */
export function createHostPacer(minGapMs: number): <T>(url: string, fn: () => Promise<T>) => Promise<T> {
  if (minGapMs <= 0) return (_url, fn) => fn();
  const tails = new Map<string, Promise<unknown>>();
  const lastStart = new Map<string, number>();

  return <T>(url: string, fn: () => Promise<T>): Promise<T> => {
    let host = url;
    try {
      host = new URL(url).hostname.toLowerCase();
    } catch {
      // Keep raw string as bucket key if URL is malformed.
    }

    const prev = tails.get(host) ?? Promise.resolve();
    const run = prev
      .catch(() => {})
      .then(async () => {
        const last = lastStart.get(host);
        if (last !== undefined) {
          const wait = minGapMs - (Date.now() - last);
          if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        }
        lastStart.set(host, Date.now());
        return fn();
      });

    tails.set(host, run);
    return run;
  };
}

/** True when a response looks like RSS or Atom XML. */
export function isFeedContent(raw: string, contentType = ""): boolean {
  const ct = contentType.toLowerCase();
  if (ct.includes("rss") || ct.includes("atom")) return true;
  const head = raw.trimStart().slice(0, 500).toLowerCase();
  if (ct.includes("xml") && (head.includes("<rss") || head.includes("<feed") || head.includes("<rdf:rdf"))) {
    return true;
  }
  return (
    head.startsWith("<?xml") &&
    (head.includes("<rss") || head.includes("<feed") || head.includes("<rdf:rdf"))
  ) || head.startsWith("<rss") || head.startsWith("<feed");
}

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripTags(html: string): string {
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function xmlTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeEntities(m[1]).trim() : "";
}

function atomLink(block: string, baseUrl: string): string {
  const links = [...block.matchAll(/<link\b([^>]*?)\/?>/gi)];
  let fallback = "";
  for (const m of links) {
    const attrs = m[1];
    const hrefMatch = attrs.match(/\bhref=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const href = decodeEntities(hrefMatch[1]).trim();
    const relMatch = attrs.match(/\brel=["']([^"']+)["']/i);
    const rel = relMatch ? relMatch[1].toLowerCase() : "alternate";
    if (rel === "alternate") return resolveUrl(href, baseUrl);
    if (!fallback) fallback = resolveUrl(href, baseUrl);
  }
  const textLink = xmlTag(block, "link");
  if (textLink) return resolveUrl(textLink, baseUrl);
  return fallback;
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

function formatDate(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 20);
  return d.toISOString().slice(0, 10);
}

/**
 * Parse an RSS 2.0 or Atom feed into compact Markdown.
 * Returns null if the XML contains no items/entries.
 */
export function formatFeedToMarkdown(
  xml: string,
  sourceUrl: string,
  maxItems = MAX_FEED_ITEMS,
): ExtractedPage | null {
  const isAtom = /<feed[\s>]/i.test(xml.slice(0, 1000)) && !/<rss[\s>]/i.test(xml.slice(0, 1000));
  const entryTag = isAtom ? "entry" : "item";
  const entryRe = new RegExp(`<${entryTag}\\b[^>]*>([\\s\\S]*?)<\\/${entryTag}>`, "gi");

  const headerSlice = xml.slice(0, xml.search(new RegExp(`<${entryTag}\\b`, "i")));
  const feedTitle = stripTags(xmlTag(headerSlice, "title")) || sourceUrl;

  const lines: string[] = [`# ${feedTitle}`, `Source: ${sourceUrl}`, ""];
  let count = 0;

  for (const m of xml.matchAll(entryRe)) {
    if (count >= maxItems) break;
    const block = m[1];
    const title = stripTags(xmlTag(block, "title"));
    const link = isAtom ? atomLink(block, sourceUrl) : resolveUrl(stripTags(xmlTag(block, "link")), sourceUrl);
    if (!title && !link) continue;

    const date = formatDate(
      xmlTag(block, "pubDate") ||
        xmlTag(block, "published") ||
        xmlTag(block, "updated") ||
        xmlTag(block, "dc:date"),
    );
    const rawSummary =
      xmlTag(block, "description") ||
      xmlTag(block, "summary") ||
      xmlTag(block, "content:encoded") ||
      xmlTag(block, "content");
    const summary = stripTags(rawSummary).slice(0, MAX_SUMMARY_CHARS);

    const heading = link ? `[${title || link}](${link})` : title;
    lines.push(date ? `- ${heading} (${date})` : `- ${heading}`);
    if (summary && summary !== title) {
      lines.push(`  ${summary}`);
    }
    count++;
  }

  if (count === 0) return null;
  return {
    title: feedTitle.slice(0, 200),
    content: lines.join("\n").slice(0, MAX_OUTPUT_CHARS),
  };
}

/**
 * Find the primary RSS or Atom <link rel="alternate"> feed advertised by an HTML page.
 * Skips comment feeds.
 */
export function discoverFeedUrl(html: string, pageUrl: string): string | null {
  const { document } = parseHTML(html);
  const links = Array.from(document.querySelectorAll('link[rel~="alternate"][href]'));
  let best: string | null = null;

  for (const el of links) {
    const type = (el.getAttribute("type") ?? "").toLowerCase();
    if (!type.includes("rss+xml") && !type.includes("atom+xml")) continue;
    const title = (el.getAttribute("title") ?? "").toLowerCase();
    const href = (el.getAttribute("href") ?? "").trim();
    if (!href) continue;
    if (title.includes("comment") || /\/comments?\/feed/i.test(href)) continue;

    const resolved = resolveUrl(href, pageUrl);
    if (!resolved.startsWith("http://") && !resolved.startsWith("https://")) continue;
    // Prefer a feed whose path shares a prefix with the current section URL.
    try {
      const pagePath = new URL(pageUrl).pathname.replace(/\/+$/, "");
      const feedPath = new URL(resolved).pathname;
      if (pagePath && pagePath !== "/" && feedPath.includes(pagePath)) return resolved;
    } catch {
      // Ignore URL parse errors.
    }
    if (!best) best = resolved;
  }

  return best;
}

/**
 * Heuristic: true when an HTML page looks like a homepage, section, or category
 * listing rather than a single article — i.e., where an advertised RSS/Atom feed
 * is cleaner and more complete than scraping the HTML index.
 */
export function isLikelyListingPage(html: string, pageUrl: string, discoveredFeedUrl?: string | null): boolean {
  let pathname = "/";
  try {
    pathname = new URL(pageUrl).pathname;
  } catch {
    return false;
  }

  // If the page advertises a feed whose path directly extends this page's path
  // (e.g. /owner/repo/releases -> /owner/repo/releases.atom, or WordPress category
  // pages like /category/ai/ -> /category/ai/feed/ which Yoast marks og:type=article),
  // it is a feed-backed listing.
  if (discoveredFeedUrl) {
    try {
      const pageNorm = pathname.replace(/\/+$/, "");
      const feedPath = new URL(discoveredFeedUrl).pathname;
      if (pageNorm && pageNorm !== "/" && feedPath.startsWith(pageNorm)) return true;
    } catch {
      // Ignore URL parse errors.
    }
  }

  const { document } = parseHTML(html);
  const ogType = (document.querySelector('meta[property="og:type"]')?.getAttribute("content") ?? "").toLowerCase();
  if (ogType === "article") return false;

  const articles = document.querySelectorAll("article").length;
  if (articles >= 3) return true;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return true;
  // Dated paths (e.g. /2026/11/slug) or long deep slugs are almost always articles.
  if (segments.some((s) => /^\d{4}$/.test(s)) || segments.length >= 3) return false;
  return segments.every((s) => s.length <= 36);
}

/**
 * Standard feed paths to try when an HTML listing returns HTTP 403.
 * Only probes paths on the same origin.
 */
export function wellKnownFeedCandidates(pageUrl: string): string[] {
  let parsed: URL;
  try {
    parsed = new URL(pageUrl);
  } catch {
    return [];
  }
  const basePath = parsed.pathname.endsWith("/") ? parsed.pathname : `${parsed.pathname}/`;
  const candidates = [
    new URL(`${basePath}feed/`, parsed.origin).toString(),
    new URL("/feed/", parsed.origin).toString(),
    new URL("/rss.xml", parsed.origin).toString(),
    new URL("/index.xml", parsed.origin).toString(),
  ];
  return [...new Set(candidates)];
}

function makeTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
  });
  // Drop images to keep context compact while preserving links and text.
  td.addRule("dropImages", {
    filter: "img",
    replacement: () => "",
  });
  return td;
}

function absolutizeLinks(root: Element, pageUrl: string): void {
  for (const a of Array.from(root.querySelectorAll("a[href]"))) {
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) continue;
    a.setAttribute("href", resolveUrl(href, pageUrl));
  }
}

/**
 * Extract clean Markdown from an HTML document.
 * Uses @mozilla/readability for single articles and pruned DOM -> Turndown for
 * listings or pages where Readability doesn't match.
 */
export function extractHtmlToMarkdown(html: string, pageUrl: string): ExtractedPage {
  const { document } = parseHTML(html);
  const fallbackTitle = document.querySelector("title")?.textContent?.trim().slice(0, 200) || pageUrl;
  const td = makeTurndown();

  // Resolve links before Readability clones/prunes nodes.
  if (document.body) absolutizeLinks(document.body, pageUrl);

  const listing = isLikelyListingPage(html, pageUrl);
  if (!listing) {
    try {
      const reader = new Readability(document.cloneNode(true) as Document);
      const article = reader.parse();
      if (article?.content && (article.textContent?.trim().length ?? 0) >= 200) {
        const md = td.turndown(article.content).replace(/\n{3,}/g, "\n\n").trim();
        const title = (article.title?.trim() || fallbackTitle).slice(0, 200);
        return {
          title,
          content: `# ${title}\nSource: ${pageUrl}\n\n${md}`.slice(0, MAX_OUTPUT_CHARS),
        };
      }
    } catch {
      // Fall through to pruned DOM extraction.
    }
  }

  for (const el of Array.from(
    document.querySelectorAll(
      'script, style, svg, noscript, template, iframe, form, button, input, select, textarea, nav, footer, [aria-hidden="true"]',
    ),
  )) {
    el.remove();
  }

  const root = document.querySelector("main") ?? document.body ?? document.documentElement;
  const md = td.turndown(root?.innerHTML ?? "").replace(/\n{3,}/g, "\n\n").trim();
  return {
    title: fallbackTitle,
    content: `# ${fallbackTitle}\nSource: ${pageUrl}\n\n${md}`.slice(0, MAX_OUTPUT_CHARS),
  };
}

/** Dispatch any fetched response (Markdown, RSS/Atom, or HTML) to clean text. */
export function extractPage(raw: string, pageUrl: string, contentType = ""): ExtractedPage {
  const ct = contentType.toLowerCase();
  if (ct.includes("text/markdown") || (ct.includes("text/plain") && !isFeedContent(raw, ct))) {
    const firstHeading = raw.match(/^#\s+(.+)$/m)?.[1]?.trim();
    return {
      title: (firstHeading || pageUrl).slice(0, 200),
      content: raw.trim().slice(0, MAX_OUTPUT_CHARS),
    };
  }
  if (isFeedContent(raw, ct)) {
    const feed = formatFeedToMarkdown(raw, pageUrl);
    if (feed) return feed;
  }
  return extractHtmlToMarkdown(raw, pageUrl);
}
