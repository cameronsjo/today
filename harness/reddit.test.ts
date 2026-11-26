import { expect, test } from "bun:test";
import type { BrowserBridge } from "@homepage/agent-core";
import { redditFeedFor, withReddit } from "./reddit";

test("maps subreddit listings to their RSS feeds", () => {
  expect(redditFeedFor("https://old.reddit.com/r/devops+sre/top/?t=day")).toBe("https://www.reddit.com/r/devops+sre/top.rss?t=day");
  expect(redditFeedFor("https://www.reddit.com/r/ClaudeAI/")).toBe("https://www.reddit.com/r/ClaudeAI/hot.rss");
  expect(redditFeedFor("https://www.reddit.com/r/ClaudeAI/comments/abc/x/")).toBeNull();
  expect(redditFeedFor("https://www.reddit.com/user/someone/")).toBeNull();
  expect(redditFeedFor("https://news.ycombinator.com/")).toBeNull();
});

test("reads Reddit through the feed and everything else through the bridge", async () => {
  const fetched: string[] = [];
  const inner: BrowserBridge = {
    getHistory: async () => ({ sites: [], totalSitesSeen: 0 }),
    getPageHtml: async ({ urls }) => {
      fetched.push(...urls);
      return { pages: urls.map((url) => ({ url, title: url, html: "<p/>" })), failed: [] };
    },
  };
  const feeds: string[] = [];
  const sampleAtom = `<?xml version="1.0" encoding="UTF-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>top scoring links : homelab</title>
      <entry>
        <category term="homelab" label="r/homelab"/>
        <title>New rack build</title>
        <link href="https://www.reddit.com/r/homelab/comments/abc/new_rack_build/"/>
        <updated>2026-11-26T10:00:00+00:00</updated>
        <content type="html">&lt;p&gt;Clean cable management.&lt;/p&gt;</content>
      </entry>
    </feed>`;
  const bridge = withReddit(inner, async (url) => {
    feeds.push(url);
    if (url.includes("broken")) throw new Error("HTTP 429");
    return sampleAtom;
  });
  const result = await bridge.getPageHtml({
    urls: ["https://news.ycombinator.com/", "https://old.reddit.com/r/homelab/top/?t=day", "https://old.reddit.com/r/broken/"],
  });
  expect(fetched).toEqual(["https://news.ycombinator.com/"]);
  expect(feeds).toEqual(["https://www.reddit.com/r/homelab/top.rss?t=day", "https://www.reddit.com/r/broken/hot.rss"]);
  expect(result.pages.map((p) => p.url)).toEqual(["https://news.ycombinator.com/", "https://old.reddit.com/r/homelab/top/?t=day"]);
  expect(result.pages[1].html).toContain("- **r/homelab** · [New rack build](https://www.reddit.com/r/homelab/comments/abc/new_rack_build/) (2026-11-26)");
  expect(result.failed).toEqual([{ url: "https://old.reddit.com/r/broken/", reason: "Reddit feed: HTTP 429" }]);
});

test("falls back to Arctic Shift when Reddit RSS returns 429/404", async () => {
  const inner: BrowserBridge = {
    getHistory: async () => ({ sites: [], totalSitesSeen: 0 }),
    getPageHtml: async () => ({ pages: [], failed: [] }),
  };
  const mockArctic = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const sub = new URL(url).searchParams.get("subreddit") ?? "unknown";
    return new Response(
      JSON.stringify({
        data: [
          {
            title: `Top post in ${sub}`,
            subreddit: sub,
            permalink: `/r/${sub}/comments/xyz/top_post/`,
            selftext: "Useful discussion body.",
            score: 420,
            num_comments: 35,
            created_utc: 1795700000,
          },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  const bridge = withReddit(
    inner,
    async () => {
      throw new Error("HTTP 429");
    },
    0,
    mockArctic,
  );
  const result = await bridge.getPageHtml({
    urls: ["https://old.reddit.com/r/ClaudeAI+GeminiAI/top/?t=day"],
  });
  expect(result.failed).toEqual([]);
  expect(result.pages).toHaveLength(1);
  expect(result.pages[0].html).toContain("**r/ClaudeAI** · [Top post in ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/xyz/top_post/)");
  expect(result.pages[0].html).toContain("**r/GeminiAI** · [Top post in GeminiAI](https://www.reddit.com/r/GeminiAI/comments/xyz/top_post/)");
});
