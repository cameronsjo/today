/**
 * Read Reddit listings through their RSS feeds.
 *
 * Anonymous requests to Reddit's .json endpoints get a 403, and the HTML pages
 * come back as login walls, but /r/<subs>/<sort>.rss still answers with the
 * top 25 posts and their text. The reading list keeps the normal listing URL;
 * the bridge swaps in the feed at fetch time and reports it under that URL.
 */
import type { BrowserBridge } from "@homepage/agent-core";
import { createHostPacer, formatFeedToMarkdown, isFeedContent } from "./extract";

const REDDIT_HOSTS = new Set(["reddit.com", "www.reddit.com", "old.reddit.com", "new.reddit.com"]);
const SUBS = /^[A-Za-z0-9_+]{2,200}$/;
const SORTS = new Set(["hot", "new", "top", "rising", "best"]);
/** Reddit asks API clients for a descriptive User-Agent and throttles generic ones. */
const USER_AGENT = "linux:cameronsjo-today:v1.0 (personal daily digest)";
const ARCTIC_SHIFT_API = "https://arctic-shift.photon-reddit.com/api/posts/search";
const MAX_POSTS_PER_FEED = 25;
const MAX_SNIPPET_CHARS = 320;

interface ParsedRedditListing {
  subs: string[];
  sort: string;
  timeRange: string | null;
  feedUrl: string;
}

function parseRedditListing(url: string): ParsedRedditListing | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!REDDIT_HOSTS.has(parsed.hostname.toLowerCase())) return null;
  const [r, subs, sort = "hot", ...rest] = parsed.pathname.split("/").filter(Boolean);
  if (r !== "r" || !SUBS.test(subs) || !SORTS.has(sort) || rest.length) return null;
  const feed = new URL(`https://www.reddit.com/r/${subs}/${sort}.rss`);
  const t = parsed.searchParams.get("t");
  if (t) feed.searchParams.set("t", t);
  return { subs: subs.split("+").filter(Boolean), sort, timeRange: t, feedUrl: feed.toString() };
}

/** The RSS feed for a subreddit listing URL, or null when the URL isn't one. */
export function redditFeedFor(url: string): string | null {
  return parseRedditListing(url)?.feedUrl ?? null;
}

type FetchText = (url: string) => Promise<string>;

const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 1;

function retryDelayMs(res: Response, attempt: number): number {
  const retryAfter = res.headers.get("retry-after");
  if (retryAfter) {
    const secs = Number(retryAfter);
    if (Number.isFinite(secs) && secs > 0) return Math.min(secs * 1000, 10_000);
  }
  return Math.min(2000 * 2 ** attempt, 10_000);
}

const defaultFetch: FetchText = async (url) => {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      headers: {
        accept: "application/atom+xml, application/rss+xml, application/xml;q=0.9, */*;q=0.5",
        "user-agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) {
      const body = await res.text();
      const ct = res.headers.get("content-type") ?? "";
      if (!isFeedContent(body, ct)) {
        throw new Error(`unexpected non-feed response (${ct || "unknown content-type"})`);
      }
      return body;
    }
    if (attempt >= MAX_RETRIES || !RETRY_STATUSES.has(res.status)) {
      throw new Error(`HTTP ${res.status}`);
    }
    await new Promise((r) => setTimeout(r, retryDelayMs(res, attempt)));
  }
};

interface ArcticShiftPost {
  title?: string;
  subreddit?: string;
  permalink?: string;
  url?: string;
  selftext?: string;
  score?: number;
  num_comments?: number;
  created_utc?: number;
}

function lookbackSeconds(timeRange: string | null): number {
  switch (timeRange) {
    case "hour":
      return 3600;
    case "week":
      return 7 * 86400;
    case "month":
      return 30 * 86400;
    default:
      return 24 * 3600;
  }
}

/**
 * Format Arctic Shift API posts into compact Markdown grouped-ready by subreddit.
 */
export function formatArcticShiftPosts(posts: ArcticShiftPost[], sourceUrl: string, limit = MAX_POSTS_PER_FEED): string | null {
  const cleaned = posts.filter((p) => {
    if (!p.title || !p.permalink) return false;
    const body = (p.selftext ?? "").trim();
    return body !== "[removed]" && body !== "[deleted]";
  });
  if (!cleaned.length) return null;

  cleaned.sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || (b.num_comments ?? 0) - (a.num_comments ?? 0));

  const lines: string[] = [`# Reddit: ${new URL(sourceUrl).pathname}`, `Source: ${sourceUrl}`, ""];
  for (const post of cleaned.slice(0, limit)) {
    const sub = post.subreddit ? `**r/${post.subreddit}** · ` : "";
    const permalink = post.permalink!.startsWith("http")
      ? post.permalink!
      : `https://www.reddit.com${post.permalink}`;
    const date = post.created_utc ? new Date(post.created_utc * 1000).toISOString().slice(0, 10) : "";
    const meta = [
      date,
      typeof post.score === "number" ? `${post.score} pts` : "",
      typeof post.num_comments === "number" ? `${post.num_comments} comments` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    lines.push(`- ${sub}[${post.title!.trim()}](${permalink})${meta ? ` (${meta})` : ""}`);
    if (post.url && !post.url.includes("reddit.com/r/")) {
      lines.push(`  Link: ${post.url}`);
    }
    const snippet = (post.selftext ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_SNIPPET_CHARS);
    if (snippet) {
      lines.push(`  ${snippet}`);
    }
  }
  return lines.join("\n");
}

async function fetchArcticShiftFallback(
  listing: ParsedRedditListing,
  sourceUrl: string,
  fetchFn: typeof fetch = fetch,
  pace: <T>(url: string, fn: () => Promise<T>) => Promise<T> = (_u, fn) => fn(),
): Promise<string> {
  const after = Math.floor(Date.now() / 1000) - lookbackSeconds(listing.timeRange);
  const perSubLimit = Math.max(8, Math.ceil(MAX_POSTS_PER_FEED / listing.subs.length));
  const allPosts: ArcticShiftPost[] = [];

  for (const sub of listing.subs) {
    const apiUrl = `${ARCTIC_SHIFT_API}?subreddit=${encodeURIComponent(sub)}&after=${after}&limit=100&sort=desc`;
    try {
      const res = await pace(apiUrl, () =>
        fetchFn(apiUrl, {
          headers: { "user-agent": USER_AGENT },
          signal: AbortSignal.timeout(15_000),
        }),
      );
      if (!res.ok) continue;
      const json = (await res.json()) as { data?: ArcticShiftPost[] };
      const subPosts = (json.data ?? []).sort(
        (a, b) => (b.score ?? 0) - (a.score ?? 0) || (b.num_comments ?? 0) - (a.num_comments ?? 0),
      );
      allPosts.push(...subPosts.slice(0, perSubLimit));
    } catch {
      // Skip a single slow/errored subreddit rather than failing the whole multireddit.
    }
  }

  const formatted = formatArcticShiftPosts(allPosts, sourceUrl);
  if (!formatted) throw new Error("Arctic Shift returned no posts");
  return formatted;
}

export function withReddit(
  bridge: BrowserBridge,
  fetchText: FetchText = defaultFetch,
  pacingMs = fetchText === defaultFetch ? 2500 : 0,
  fallbackFetch: typeof fetch | null = fetchText === defaultFetch ? fetch : null,
): BrowserBridge {
  const pace = createHostPacer(pacingMs);
  const fallbackPace = createHostPacer(pacingMs > 0 ? 300 : 0);
  return {
    getHistory: bridge.getHistory,
    async getPageHtml({ urls, loadDelayMs }) {
      const others = urls.filter((url) => !parseRedditListing(url));
      const [feeds, rest] = await Promise.all([
        Promise.all(
          urls
            .filter((url) => parseRedditListing(url))
            .map(async (url) => {
              const listing = parseRedditListing(url)!;
              try {
                const xml = await pace(listing.feedUrl, () => fetchText(listing.feedUrl));
                const formatted = formatFeedToMarkdown(xml, url);
                return {
                  page: {
                    url,
                    title: formatted?.title || `Reddit feed: ${new URL(url).pathname}`,
                    html: formatted?.content ?? xml,
                  },
                };
              } catch (rssErr) {
                if (fallbackFetch) {
                  try {
                    const md = await fetchArcticShiftFallback(listing, url, fallbackFetch, fallbackPace);
                    return {
                      page: {
                        url,
                        title: `Reddit: ${new URL(url).pathname}`,
                        html: md,
                      },
                    };
                  } catch {
                    // Fall through to report the primary Reddit error.
                  }
                }
                return { failed: { url, reason: `Reddit feed: ${(rssErr as Error).message}` } };
              }
            }),
        ),
        others.length ? bridge.getPageHtml({ urls: others, loadDelayMs }) : Promise.resolve({ pages: [], failed: [] }),
      ]);
      return {
        pages: [...rest.pages, ...feeds.flatMap((f) => (f.page ? [f.page] : []))],
        failed: [...rest.failed, ...feeds.flatMap((f) => (f.failed ? [f.failed] : []))],
      };
    },
  };
}
