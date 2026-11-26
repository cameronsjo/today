import { expect, test } from "bun:test";
import {
  createHostPacer,
  discoverFeedUrl,
  extractHtmlToMarkdown,
  extractPage,
  formatFeedToMarkdown,
  isFeedContent,
  isLikelyListingPage,
  wellKnownFeedCandidates,
} from "./extract";
import { createNodeBridge } from "./node-bridge";

test("passes through text/markdown directly", () => {
  const res = extractPage("# Release Notes\n\n- Fixed a bug.", "https://example.com/notes", "text/markdown; charset=utf-8");
  expect(res.title).toBe("Release Notes");
  expect(res.content).toBe("# Release Notes\n\n- Fixed a bug.");
});

test("formats RSS 2.0 feeds into compact Markdown", () => {
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0"><channel>
      <title>Example AI Desk</title>
      <item>
        <title>New Model &amp; Benchmark</title>
        <link>https://example.com/posts/1</link>
        <pubDate>Thu, 26 Nov 2026 10:00:00 GMT</pubDate>
        <description><![CDATA[<p>Details with <a href="x">HTML</a> stripped.</p>]]></description>
      </item>
    </channel></rss>`;
  expect(isFeedContent(rss, "application/rss+xml")).toBe(true);
  const out = formatFeedToMarkdown(rss, "https://example.com/ai/");
  expect(out).not.toBeNull();
  expect(out!.title).toBe("Example AI Desk");
  expect(out!.content).toContain("# Example AI Desk");
  expect(out!.content).toContain("- [New Model & Benchmark](https://example.com/posts/1) (2026-11-26)");
  expect(out!.content).toContain("Details with HTML stripped.");
});

test("formats Atom feeds into compact Markdown", () => {
  const atom = `<?xml version="1.0" encoding="utf-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>Claude Code Releases</title>
      <entry>
        <title>v2.1.0</title>
        <link rel="alternate" href="/anthropics/claude-code/releases/tag/v2.1.0" />
        <updated>2026-11-25T18:00:00Z</updated>
        <summary>Faster startup and better diff rendering.</summary>
      </entry>
    </feed>`;
  const out = formatFeedToMarkdown(atom, "https://github.com/anthropics/claude-code/releases");
  expect(out).not.toBeNull();
  expect(out!.content).toContain(
    "- [v2.1.0](https://github.com/anthropics/claude-code/releases/tag/v2.1.0) (2026-11-25)",
  );
  expect(out!.content).toContain("Faster startup and better diff rendering.");
});

test("discovers primary alternate feed and skips comment feeds", () => {
  const html = `<html><head>
    <link rel="alternate" type="application/rss+xml" title="Site Comments Feed" href="/comments/feed/" />
    <link rel="alternate" type="application/atom+xml" title="AI Feed" href="/rss/ai/index.xml" />
  </head><body></body></html>`;
  expect(discoverFeedUrl(html, "https://www.theverge.com/ai-artificial-intelligence")).toBe(
    "https://www.theverge.com/rss/ai/index.xml",
  );
});

test("distinguishes listing pages from single articles", () => {
  const listing = `<html><head><title>AI</title></head><body><article>1</article><article>2</article><article>3</article></body></html>`;
  const article = `<html><head><meta property="og:type" content="article"><title>Story</title></head><body><article><p>Body</p></article></body></html>`;
  expect(isLikelyListingPage(listing, "https://example.com/ai/")).toBe(true);
  expect(isLikelyListingPage(article, "https://example.com/2026/11/story")).toBe(false);
  // WordPress category pages often set og:type=article but advertise a path-extending feed.
  expect(
    isLikelyListingPage(
      article,
      "https://techcrunch.com/category/artificial-intelligence/",
      "https://techcrunch.com/category/artificial-intelligence/feed/",
    ),
  ).toBe(true);
});

test("extracts article HTML to clean Markdown with absolute links", () => {
  const longBody =
    "Anthropic published a technical report on sandboxing agents in production environments. ".repeat(8);
  const html = `<!doctype html><html><head><meta property="og:type" content="article"><title>Sandboxing Agents</title></head>
    <body>
      <nav><a href="/home">Nav noise</a></nav>
      <main><article>
        <h1>Sandboxing Agents</h1>
        <p>${longBody}Read the <a href="/docs/spec">full spec</a>.</p>
      </article></main>
      <script>window.__NEXT_DATA__ = {"huge":"blob"}</script>
      <footer>Copyright noise</footer>
    </body></html>`;
  const out = extractHtmlToMarkdown(html, "https://example.com/2026/11/sandboxing");
  expect(out.title).toBe("Sandboxing Agents");
  expect(out.content).toContain("[full spec](https://example.com/docs/spec)");
  expect(out.content).not.toContain("__NEXT_DATA__");
  expect(out.content).not.toContain("Nav noise");
});

test("builds deduplicated same-origin feed probe candidates for 403 fallback", () => {
  expect(wellKnownFeedCandidates("https://www.bleepingcomputer.com/")).toEqual([
    "https://www.bleepingcomputer.com/feed/",
    "https://www.bleepingcomputer.com/rss.xml",
    "https://www.bleepingcomputer.com/index.xml",
  ]);
});

test("nodeBridge auto-upgrades listing pages to their advertised feed and recovers from 403 via feed probe", async () => {
  const rss = `<?xml version="1.0"?><rss version="2.0"><channel><title>Desk</title>
    <item><title>Headline</title><link>https://site.test/story</link></item>
  </channel></rss>`;

  const mockFetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === "https://listing.test/ai/") {
      return new Response(
        `<html><head><link rel="alternate" type="application/rss+xml" href="/ai/feed/"></head><body>Listing</body></html>`,
        { status: 200, headers: { "content-type": "text/html" } },
      );
    }
    if (url === "https://listing.test/ai/feed/") {
      return new Response(rss, { status: 200, headers: { "content-type": "application/rss+xml" } });
    }
    if (url === "https://blocked.test/") {
      return new Response("Forbidden", { status: 403, headers: { "content-type": "text/html" } });
    }
    if (url === "https://blocked.test/feed/") {
      return new Response(rss, { status: 200, headers: { "content-type": "application/rss+xml" } });
    }
    return new Response("Not Found", { status: 404 });
  }) as typeof fetch;

  const bridge = createNodeBridge({ fetchFn: mockFetch, pacingMs: 0 });
  const res = await bridge.getPageHtml({ urls: ["https://listing.test/ai/", "https://blocked.test/"] });
  expect(res.failed).toEqual([]);
  expect(res.pages.map((p) => p.url).sort()).toEqual(["https://blocked.test/", "https://listing.test/ai/"]);
  for (const page of res.pages) {
    expect(page.html).toContain("- [Headline](https://site.test/story)");
  }
});

test("createHostPacer serializes same-host calls with a gap while running different hosts in parallel", async () => {
  const pace = createHostPacer(40);
  const starts: Record<string, number> = {};
  const t0 = Date.now();
  await Promise.all([
    pace("https://a.test/1", async () => {
      starts.a1 = Date.now() - t0;
    }),
    pace("https://a.test/2", async () => {
      starts.a2 = Date.now() - t0;
    }),
    pace("https://b.test/1", async () => {
      starts.b1 = Date.now() - t0;
    }),
  ]);
  expect(starts.a2 - starts.a1).toBeGreaterThanOrEqual(30);
  expect(starts.b1).toBeLessThan(30);
});
