import React from 'react';

/* ------------------------------------------------------------------ */
/*  The Context — Saturday 24 October 2026 — morning edition           */
/*  Built from the reading list only (history was empty on the server) */
/* ------------------------------------------------------------------ */

const SERIF = "'Newsreader', 'Iowan Old Style', Georgia, serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

type MetaPart = string | { t: string; h: string };
type Tone = 'urgent' | 'good';

type Story = {
  kicker?: string;
  tone?: Tone;
  title: string;
  href: string;
  blurb?: string;
  parts?: { k: string; v: string }[];
  meta: MetaPart[];
  breakdown?: {
    paras: string[];
    source: { t: string; h: string };
    date: string;
  };
};

/* ---------- tiny helpers ---------- */

// `backticks` render as purple mono (versions, flags, code)
function rich(text: string): React.ReactNode {
  const bits = text.split('`');
  return bits.map((b, i) =>
    i % 2 === 1 ? (
      <code
        key={i}
        style={{ fontFamily: MONO, fontSize: '0.88em', color: 'var(--purple)' }}
      >
        {b}
      </code>
    ) : (
      <React.Fragment key={i}>{b}</React.Fragment>
    ),
  );
}

function Pill({
  kind,
  children,
}: {
  kind: 'urgent' | 'good' | 'plain';
  children: React.ReactNode;
}) {
  const base: React.CSSProperties = {
    display: 'inline-block',
    borderRadius: 999,
    fontFamily: MONO,
    fontSize: '0.64rem',
    lineHeight: 1.5,
    padding: '0 8px',
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em',
  };
  if (kind === 'urgent')
    return <span style={{ ...base, background: '#a04540', color: '#f5ead0' }}>{children}</span>;
  if (kind === 'good')
    return <span style={{ ...base, background: '#2d6644', color: '#f5ead0' }}>{children}</span>;
  return (
    <span style={{ ...base, border: '1px solid var(--border)', color: 'var(--fg2)' }}>
      {children}
    </span>
  );
}

function MetaLine({ parts }: { parts: MetaPart[] }) {
  return (
    <p
      style={{
        fontFamily: MONO,
        fontSize: '0.72rem',
        lineHeight: 1.6,
        color: 'var(--steel)',
        margin: '10px 0 0',
        overflowWrap: 'anywhere',
      }}
    >
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 ? ' · ' : ''}
          {typeof p === 'string' ? (
            p
          ) : (
            <a className="ctx-meta-a" href={p.h}>
              {p.t}
            </a>
          )}
        </React.Fragment>
      ))}
    </p>
  );
}

function Kicker({ text, tone }: { text: string; tone?: Tone }) {
  const color =
    tone === 'urgent' ? 'var(--urgent)' : tone === 'good' ? 'var(--good)' : 'var(--accent)';
  return (
    <p
      style={{
        fontFamily: MONO,
        fontSize: '0.7rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color,
        margin: '0 0 6px',
      }}
    >
      {text}
    </p>
  );
}

function Parts({ parts }: { parts: { k: string; v: string }[] }) {
  return (
    <dl
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(84px, 140px) minmax(0, 1fr)',
        gap: '10px 18px',
        margin: '14px 0 0',
      }}
    >
      {parts.map((p) => (
        <React.Fragment key={p.k}>
          <dt
            style={{
              fontFamily: MONO,
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              paddingTop: 4,
            }}
          >
            {p.k}
          </dt>
          <dd style={{ margin: 0, color: 'var(--fg2)', overflowWrap: 'anywhere' }}>{rich(p.v)}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

function Breakdown({ b }: { b: NonNullable<Story['breakdown']> }) {
  return (
    <details className="ctx-details" style={{ marginTop: 12 }}>
      <summary
        style={{
          fontFamily: MONO,
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          cursor: 'pointer',
        }}
      >
        Full breakdown
      </summary>
      <div style={{ marginTop: 10, borderLeft: '1px solid var(--border)', paddingLeft: 14 }}>
        {b.paras.map((p, i) => (
          <p key={i} style={{ margin: '0 0 0.8em', color: 'var(--fg2)', overflowWrap: 'anywhere' }}>
            {rich(p)}
          </p>
        ))}
        <p
          style={{
            fontFamily: MONO,
            fontSize: '0.72rem',
            color: 'var(--steel)',
            margin: '0.4em 0 0',
            overflowWrap: 'anywhere',
          }}
        >
          Source:{' '}
          <a className="ctx-meta-a" href={b.source.h}>
            {b.source.t}
          </a>{' '}
          · {b.date}
        </p>
      </div>
    </details>
  );
}

function StoryView({ s }: { s: Story }) {
  return (
    <article
      style={{
        padding: '22px 0 24px',
        borderBottom: '1px solid var(--border)',
        minWidth: 0,
      }}
    >
      {s.kicker ? <Kicker text={s.kicker} tone={s.tone} /> : null}
      <h3
        style={{
          fontFamily: SERIF,
          fontSize: '1.4rem',
          fontWeight: 600,
          lineHeight: 1.22,
          margin: 0,
          color: 'var(--fg)',
          overflowWrap: 'anywhere',
        }}
      >
        <a className="ctx-head-a" href={s.href}>
          {s.title}
        </a>
      </h3>
      {s.blurb ? (
        <p style={{ margin: '10px 0 0', color: 'var(--fg2)' }}>{rich(s.blurb)}</p>
      ) : null}
      {s.parts ? <Parts parts={s.parts} /> : null}
      <MetaLine parts={s.meta} />
      {s.breakdown ? <Breakdown b={s.breakdown} /> : null}
    </article>
  );
}

function SectionHead({ n, title, id }: { n: string; title: string; id: string }) {
  return (
    <header
      id={id}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 14,
        borderBottom: '1px solid var(--fg)',
        paddingBottom: 6,
        marginTop: 44,
        scrollMarginTop: 16,
      }}
    >
      <span style={{ fontFamily: MONO, fontSize: '0.85rem', color: 'var(--accent)' }}>{n}</span>
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: '1.9rem',
          fontWeight: 700,
          lineHeight: 1.1,
          margin: 0,
          color: 'var(--fg)',
        }}
      >
        {title}
      </h2>
    </header>
  );
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
  gap: '0 36px',
};

function Grid({ items }: { items: Story[] }) {
  return (
    <div style={gridStyle}>
      {items.map((s) => (
        <StoryView key={s.href + s.title} s={s} />
      ))}
    </div>
  );
}

function QuietLines({ lines }: { lines: { who: string; href: string; text: string }[] }) {
  return (
    <ul style={{ listStyle: 'none', margin: '18px 0 0', padding: 0 }}>
      {lines.map((l) => (
        <li
          key={l.who}
          style={{
            fontFamily: MONO,
            fontSize: '0.78rem',
            lineHeight: 1.6,
            color: 'var(--steel)',
            padding: '6px 0',
            borderBottom: '1px solid var(--border)',
            overflowWrap: 'anywhere',
          }}
        >
          <a className="ctx-meta-a" href={l.href} style={{ color: 'var(--accent)' }}>
            {l.who}
          </a>{' '}
          — {l.text}
        </li>
      ))}
    </ul>
  );
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: MONO,
        fontSize: '0.7rem',
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--accent)',
        margin: '0 0 10px',
        paddingBottom: 6,
        borderBottom: '1px solid var(--border)',
      }}
    >
      {children}
    </h2>
  );
}

/* ================================================================== */
/*  CONTENT                                                            */
/* ================================================================== */

/* ---------- 01 AI ---------- */

const aiStories: Story[] = [
  {
    kicker: 'weights promised · nov 4',
    title: 'Kimi K3.1 Pro lands on the API; open weights due by Nov 4',
    href: 'https://www.kimi.ai/blog/kimi-k3-1-pro',
    blurb:
      'Moonshot’s model benchmarks roughly level with Opus 5.5 and GPT-6 Astra, at $2 in and $10 out per million tokens. Simon Willison calls it the first soon-to-be open-weight model to score this high against the frontier. It has 926 points on HN.',
    meta: [
      { t: 'Simon Willison', h: 'https://simonwillison.net/2026/Oct/23/kimi-k31-pro/' },
      'Oct 23',
      { t: 'HN thread', h: 'https://news.ycombinator.com/item?id=50212065' },
    ],
    breakdown: {
      paras: [
        'Kimi K3.1 Pro went live on the Kimi API on October 23. It is not open weights yet, but Moonshot promises “Full model weights will be released by Nov 4, 2026”. A “Highspeed” variant is 2–3x faster at twice the price, except cached-input tokens, which cost the same.',
        'List pricing is $2.00 per million input tokens and $10 per million output: the same as GPT-6.1 Sol and half the price of Claude Opus 5.5. Moonshot’s own benchmarks put it about level with Opus 5.5 and GPT-6 Astra. Artificial Analysis scored it 55, ahead of Claude Fable 5.1, GPT-6 Astra and Gemini 4 Argon (all 53) and behind only Claude Opus 5.5 (58).',
        'Simon tried it through the `llm openai endpoint` command from LLM 0.32 against `api.moonshot.ai/v1` with model `kimi-k3.1-pro`, at its three reasoning levels (low, medium, max). His max-effort pelican on a bicycle is “pretty solid”, though both legs ended up on the same side of the frame. For you: nothing to do yet; the date to watch is Nov 4.',
      ],
      source: { t: 'simonwillison.net', h: 'https://simonwillison.net/2026/Oct/23/kimi-k31-pro/' },
      date: 'Oct 23, 2026',
    },
  },
  {
    kicker: 'standards · anthropic',
    title: 'Anthropic hands Agent Skills to the Agentic AI Foundation',
    href: 'https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation',
    blurb:
      'Skills now sit under the Linux Foundation’s AAIF, the same home MCP moved to, so both of the main ways you extend Claude Code are vendor-neutral. The New Stack’s headline says OpenAI gave the foundation its Open Responses LLM API spec the same day.',
    meta: [
      { t: 'Anthropic', h: 'https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation' },
      'Oct 22',
      { t: 'Simon Willison', h: 'https://simonwillison.net/2026/Oct/22/donating-agent-skills/' },
      { t: 'TLDR AI', h: 'https://tldr.tech/ai/2026-10-23' },
      { t: 'The New Stack', h: 'https://thenewstack.io/openai-donates-open-responses/' },
    ],
    breakdown: {
      paras: [
        'Anthropic announced on October 22 that it is donating the Agent Skills standard to the Agentic AI Foundation (AAIF) under the Linux Foundation. In its words, it is “committed to keeping Agent Skills open, community-driven, and vendor-neutral”. AAIF was co-founded last year with Block and OpenAI, and is where Anthropic already donated the Model Context Protocol.',
        'Simon Willison notes he called this in December 2025, when Anthropic first declared skills an “open standard”: “I wouldn’t be surprised to see this end up in the AAIF”. TLDR AI’s summary says the move puts the standard’s development under vendor-neutral governance.',
        'The New Stack ran a headline the same day saying OpenAI donated Open Responses, its spec for a common LLM API, to the same foundation; I only had that headline. For you: nothing to do, but skills and MCP are now both safe bets to build tooling on.',
      ],
      source: {
        t: 'anthropic.com',
        h: 'https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation',
      },
      date: 'Oct 22, 2026',
    },
  },
  {
    kicker: 'identity · agents',
    title: '1Password for Agents lets an agent log in without ever seeing the password',
    href: 'https://1password.com/blog/1password-for-ai-agents',
    blurb:
      'An agent requests credentials from your vault; once you approve, 1Password autofills them into the destination site and keeps them hidden from the agent. It is a direct answer to the problem of handing a browsing agent your logins.',
    meta: [
      '1Password',
      'via',
      { t: 'TLDR AI', h: 'https://tldr.tech/ai/2026-10-23' },
      'Oct 23',
      {
        t: 'TechCrunch (Oct 22, headline)',
        h: 'https://techcrunch.com/2026/10/22/1password-launches-a-way-for-ai-agents-to-log-in-on-your-behalf-without-seeing-your-password/',
      },
      'summary only',
    ],
  },
  {
    kicker: 'anthropic · distribution',
    title: 'The full Claude Platform arrives on Google Cloud',
    href: 'https://claude.com/resources/articles/claude-models-on-google-cloud-anthropic-managed',
    blurb:
      'Claude Platform features are now available on Google Cloud, with Google Cloud authentication, billing and commitment retirement. TechCrunch headlines from this week call Anthropic’s cloud partnerships “getting messy” (Oct 20) and the Claude Duet app “Anthropic’s bet on agents” (Oct 22); I only saw the headlines.',
    meta: [
      'Anthropic',
      'via',
      { t: 'TLDR AI', h: 'https://tldr.tech/ai/2026-10-23' },
      'Oct 23',
      { t: 'Duet', h: 'https://techcrunch.com/2026/10/22/claude-duet-app-is-anthropics-bet-on-agents/' },
      { t: 'cloud partnerships', h: 'https://techcrunch.com/2026/10/20/anthropics-cloud-partnerships-are-getting-messy/' },
      'summary only',
    ],
  },
  {
    kicker: 'anthropic · EU AI Act',
    title: 'Claude’s text output now carries an invisible watermark',
    href: 'https://www.oreilly.com/radar/the-latest-anthropic-claude-models-contain-ai-text-watermarks-what-does-this-mean-for-you',
    blurb:
      'O’Reilly Radar says Anthropic’s latest models embed a SynthID-Text-based watermark in all text output to comply with the EU AI Act. It nudges choices between near-equivalent words, adds no hidden characters or tokens, and carries nothing about the user. Worth knowing if you pipe Claude output into things you publish.',
    meta: [
      'O’Reilly Radar',
      'via',
      { t: 'TLDR AI', h: 'https://tldr.tech/ai/2026-10-23' },
      'Oct 23',
      'summary only',
    ],
  },
  {
    kicker: 'open source · AI reports',
    title: 'Stenberg: the hallucinated slop is gone, the accurate-but-wordy reports are not',
    href: 'https://daniel.haxx.se/blog/2026/10/22/ignore-the-slop/',
    blurb:
      'The curl maintainer says every one of the hundreds of vulnerability reports curl got in recent months involved AI. Hallucinated slop has largely disappeared since spring 2026, leaving high-volume, accurate, overly wordy reports maintainers cannot ignore. That is the load the tools you depend on are now under.',
    meta: [
      'daniel.haxx.se',
      'Oct 22',
      { t: 'TLDR InfoSec', h: 'https://tldr.tech/infosec/2026-10-23' },
      'Oct 23',
      'summary only',
    ],
  },
  {
    kicker: 'terminals · weird and good',
    title: 'WorldTUI: a 360M-parameter model that pretends to be your terminal',
    href: 'https://simedw.com/2026/10/21/world-model-terminal/',
    blurb:
      'The model predicts how the screen changes on every keypress, with no shell or file system behind it. It can create files, run vim and tmux, play snake and usually remember commands; there is a browser demo.',
    meta: [
      'simedw.com',
      'Oct 21',
      { t: 'TLDR AI', h: 'https://tldr.tech/ai/2026-10-23' },
      'Oct 23',
      'summary only',
    ],
  },
  {
    kicker: 'labs · money',
    title: 'OpenAI nears a $30B round at $1.25T, led by UAE investors',
    href: 'https://www.cnbc.com/2026/10/22/openai-funding-round-uae-investors.html',
    blurb:
      'The round is pitched as an opportunistic bridge ahead of a possible IPO, with signatures targeted by the end of next week and the final size still open. Separately, TechCrunch’s Oct 23 headline says OpenAI will stop training its models on the live internet, “citing significant risks”.',
    meta: [
      'CNBC',
      'Oct 22',
      'via',
      { t: 'TLDR AI', h: 'https://tldr.tech/ai/2026-10-23' },
      'Oct 23',
      {
        t: 'TechCrunch (headline)',
        h: 'https://techcrunch.com/2026/10/23/openai-says-it-will-no-longer-train-its-ai-models-on-the-live-internet-citing-significant-risks/',
      },
      'summary only',
    ],
  },
];

/* ---------- 02 From the Claude team ---------- */

const claudeStories: Story[] = [
  {
    kicker: 'release · v2.1.310 · oct 23',
    tone: 'good',
    title: 'Claude Code 2.1.310',
    href: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.310',
    blurb:
      'Monitor tool now works on Bedrock, Vertex and Foundry, and requests no longer fail behind gateways that reject the effort beta value. Also fixes the file-read permission prompt so it shows where a symlink leads. The sandbox and permission fixes are covered under AI security.',
    meta: [
      { t: 'GitHub releases', h: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.310' },
      'Oct 23, 23:39 UTC',
    ],
    breakdown: {
      paras: [
        'Added: the Monitor tool and plugin monitors on Bedrock, Vertex and Foundry, and when telemetry or nonessential traffic is disabled; long foreground sleeps are now blocked there too. Auto mode’s prompt before the first read outside the working directories now says when blocking those reads makes shell commands ask for permission.',
        'Fixed: requests failing behind gateways and compatible servers that reject the `effort-2025-11-24` beta value or mid-conversation system messages (Claude Code now retries without them); background cleanup deleting recent files such as pasted images when `cleanupPeriodDays` is very large; compaction after a “Prompt is too long” error keeping too much dense text such as base64 or SVG; and a question’s auto-continue timeout firing the moment an external editor closed.',
        'Improved: memory use of non-interactive sessions (`-p`, Agent SDK) during compaction of very large transcripts; image drawing inside tmux with `allow-passthrough` and `focus-events` on, and in kitty, Ghostty and iTerm2 3.5+ with fullscreen rendering. On Linux, `/sandbox` and the startup warning now name Ubuntu’s AppArmor restriction on user namespaces, and how to lift it, when it stops bubblewrap. An MCP tool call that times out in a non-interactive session while the server’s elicitation is unanswered now tells Claude no answer came and not to repeat the call.',
        'The rest is VS Code plan-review fixes and a batch of cloud-session, Claude Tag and Code Review admin changes, none of which touch a terminal workflow. Update; if you use `/sandbox` on Ubuntu, read the new AppArmor message.',
      ],
      source: { t: 'github.com/anthropics/claude-code', h: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.310' },
      date: 'Oct 23, 2026',
    },
  },
  {
    kicker: 'release · v2.1.309 · oct 22',
    title: 'Claude Code 2.1.309: behaviour changes worth reading before you update',
    href: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.309',
    blurb:
      '`claude ultrareview` now requires workspace trust (scripts pass `--trust-workspace`), `sed -i` gets the normal Bash prompt and is no longer restored by `/rewind`, and in bypass-permissions mode the Desktop app and VS Code now deny dangerous `rm` and `rmdir` outright with a rewrite hint.',
    meta: [
      { t: 'GitHub releases', h: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.309' },
      'Oct 22, 22:18 UTC',
    ],
    breakdown: {
      paras: [
        'Behaviour changes: `claude ultrareview` asks for workspace trust on a terminal and refuses otherwise; scripts pass `--trust-workspace` (it takes no value, so put a PR number or base branch before it) or set `CLAUDE_CODE_DISABLE_ULTRAREVIEW_TRUST_CHECK=1`. `sed -i` now runs as written under the standard Bash prompt rather than a simulated file-edit preview. Commands excluded from the sandbox by settings now ask before writing to its write-list paths while the sandbox is enabled but cannot run, and the unsandboxed fallback is refused there.',
        'Other fixes: sessions compacting repeatedly after reading under a very large nested `CLAUDE.md` (an oversized one now loads only its start); ctrl+enter “send now” behaviour; ctrl+o not showing messages from other agents still waiting to be delivered; `/rewind` showing “No code changes” for turns that changed files through `/code-review --fix`, a subagent or a shell command; `/privacy-settings` showing a stale “Help improve our AI models” value; Claude notifying unrelated GitHub users by writing role names and placeholders as @-mentions in PRs, issues and comments; and, on macOS, the “Install Command Line Developer Tools” dialog opening on every launch for Macs without Xcode.',
        'The `/claude-api` skill now builds Managed Agents subagent teams on `multiagent_20261001` with dynamic workflows on by default, instead of `coordinator`. Git commands Claude Code runs for itself are faster on Windows. The GitHub page truncates the notes (“Read more”), so there is more than this. The permission and sandbox items are under AI security.',
      ],
      source: { t: 'github.com/anthropics/claude-code', h: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.309' },
      date: 'Oct 22, 2026',
    },
  },
];

const claudeQuiet = [
  {
    who: '@ClaudeDevs',
    href: 'https://x.com/ClaudeDevs',
    text: 'feed unavailable this morning (HTTP 503), so nothing to report.',
  },
  {
    who: '@bcherny',
    href: 'https://x.com/bcherny',
    text: 'nothing from the last week; the newest item in the feed dates from November 2025.',
  },
  {
    who: '@trq212',
    href: 'https://x.com/trq212',
    text: 'nothing from the last week; the newest dated posts are from November 2025 (plus a pinned thread from March 2026).',
  },
];

/* ---------- 03 AI Security ---------- */

const lead: Story = {
  kicker: '03 · AI security · the lead',
  tone: 'urgent',
  title: 'LiteLLM’s release pipeline was hijacked: version 1.107.0 steals your keys when Python starts',
  href: 'https://www.theregister.com/security/2026/10/21/litellm-supply-chain-attack-hoovers-up-passwords-and-secrets/5304548',
  blurb:
    'A poisoned release of LiteLLM reached PyPI and Docker. If 1.107.0 ever ran on a machine of yours, treat every secret on it as burned.',
  parts: [
    {
      k: 'What happened',
      v: 'Attackers compromised LiteLLM’s release process and published version `1.107.0` through PyPI and Docker. It contained an infostealer and a remote access trojan that ran when Python started.',
    },
    {
      k: 'Affected',
      v: 'Anyone who installed or ran 1.107.0 from PyPI or the Docker image. It collected browser, AWS, Google Cloud, Azure, LLM API, SSH, GPG and shell-history secrets, encrypted them and sent them to an attacker domain.',
    },
    {
      k: 'Fix',
      v: 'PyPI and Docker have removed the package. Anyone who ran it should rotate credentials and check the published indicators. No clean version number was in the pages I read.',
    },
    {
      k: 'Why it matters',
      v: 'LLM API keys were on the target list next to cloud and SSH keys, and the payload fired on interpreter start, so merely having it installed was enough.',
    },
    {
      k: 'Lesson',
      v: 'A compromised release pipeline defeats any review of the repo itself. Your recovery speed is set by how fast you can list where each key lives and revoke it.',
    },
  ],
  meta: [
    { t: 'The Register', h: 'https://www.theregister.com/security/2026/10/21/litellm-supply-chain-attack-hoovers-up-passwords-and-secrets/5304548' },
    'Oct 21',
    { t: 'BleepingComputer', h: 'https://www.bleepingcomputer.com/news/security/litellm-release-pipeline-hacked-to-distribute-info-stealer-malware/' },
    'Oct 22',
    'details via',
    { t: 'TLDR InfoSec', h: 'https://tldr.tech/infosec/2026-10-23' },
    'Oct 23',
  ],
  breakdown: {
    paras: [
      'BleepingComputer (Oct 22, 3:12 PM) describes the same incident: hackers compromised the LiteLLM project’s PyPI package and published malicious Docker images carrying a payload that steals credentials, secrets and environment variables. The Register’s write-up, as summarised by TLDR InfoSec, is the source for the version number, the list of stolen secret types and the removal by PyPI and Docker.',
      'The r/cybersecurity megathread (updated Oct 23) links LiteLLM’s own incident report at docs.litellm.ai/blog/security-incident-oct-21-2026, which I have not read. The Register’s piece is dated Oct 21; I led with it because it is the most complete account on the pages I fetched, and BleepingComputer and TLDR carried it inside the last 48 hours.',
      'What to do: if you run LiteLLM from PyPI or its Docker image, check whether 1.107.0 was ever pulled, including in CI and rebuilt containers. If it was, rotate the cloud, LLM API, SSH and GPG credentials and any tokens stored in shell history or the environment on that host, and look for the indicators in the incident report.',
    ],
    source: { t: 'The Register', h: 'https://www.theregister.com/security/2026/10/21/litellm-supply-chain-attack-hoovers-up-passwords-and-secrets/5304548' },
    date: 'Oct 21, 2026 (BleepingComputer Oct 22, TLDR InfoSec Oct 23)',
  },
};

const secStories: Story[] = [
  {
    kicker: 'coding agents · fixed',
    tone: 'good',
    title: 'Claude Code 2.1.309 and 2.1.310 close a run of sandbox and permission-check gaps',
    href: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.309',
    parts: [
      {
        k: 'What happened',
        v: 'Release notes list fixes for: sandboxed Bash running the shell’s startup files outside the sandbox before each command (macOS, Linux); macOS `denyWrite` globs not applying through symlinks; sandboxed commands and auto-accepted edits being able to modify the MCP config passed with `--mcp-config`; an `Edit(path)` deny rule not blocking a Bash redirect in some commands with a subshell; Linux sandbox write denies lifting when a background command outlived the session; Windows PowerShell checks auto-approving some `Set-Location` calls; and hooks failing open on Windows without Git for Windows. 2.1.310 adds symlink targets to file-read prompts.',
      },
      {
        k: 'Why it matters',
        v: 'These are the controls between a coding agent and your machine, the ones you lean on in auto-accept or sandbox mode. The notes do not say any were exploited, and give no CVEs.',
      },
      {
        k: 'Lesson',
        v: 'Deny rules and sandboxes fail at the edges: symlinks, redirects, subshells, startup files. Stay current and never let one layer be the only barrier. Fix: update to 2.1.310.',
      },
    ],
    meta: [
      { t: '2.1.309', h: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.309' },
      'Oct 22',
      { t: '2.1.310', h: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.310' },
      'Oct 23',
      'GitHub releases',
    ],
  },
  {
    kicker: 'frontier labs · safety controls',
    title: 'METR and Redwood spent three weeks red-teaming OpenAI’s internal agent monitoring',
    href: 'https://metr.org/blog/2026-10-22-red-teaming-openai-agent-monitoring/',
    parts: [
      {
        k: 'What happened',
        v: 'With access to OpenAI’s internal infrastructure, METR and Redwood Research ran a three-week security assessment and found vulnerabilities that could let AI agents evade monitoring, bypass sandbox restrictions or conceal their actions.',
      },
      {
        k: 'Why it matters',
        v: 'Monitoring and sandboxing are the same two layers every coding agent relies on, and a frontier lab’s versions had holes an outside team could find.',
      },
      {
        k: 'Lesson',
        v: 'Have someone other than the builder test the monitor and the sandbox. I only had TLDR’s summary, so no detail on the specific flaws or fixes.',
      },
    ],
    meta: [
      { t: 'METR', h: 'https://metr.org/blog/2026-10-22-red-teaming-openai-agent-monitoring/' },
      'Oct 22',
      'via',
      { t: 'TLDR AI', h: 'https://tldr.tech/ai/2026-10-23' },
      'Oct 23',
      'summary only',
    ],
  },
];

/* ---------- 04 Homelab & Ops ---------- */

const opsStories: Story[] = [
  {
    kicker: 'exploited · self-hosting',
    tone: 'urgent',
    title: 'CISA flags a critical, actively exploited Collabora Online flaw',
    href: 'https://thehackernews.com/2026/10/cisa-flags-two-actively-exploited.html',
    blurb:
      'Collabora Online is on CISA’s exploited list alongside an Arista VeloCloud bug (not your gear). If you run Collabora anywhere, check it today. I only have the headline, so no affected versions or fix.',
    meta: [
      'The Hacker News',
      'via',
      { t: 'r/cybersecurity', h: 'https://www.reddit.com/r/cybersecurity/comments/1xe3epq/cisa_flags_two_actively_exploited_critical_flaws/' },
      'Oct 24, 08:37 UTC',
      'headline only',
    ],
  },
  {
    kicker: 'new today · node · python',
    title: 'Node2Shell evolves into HTTP2Shell; the Python Brotli bindings are caught up too',
    href: 'https://www.aikido.dev/blog/python-packages-vulnerable-node2shell-brotli-cve-2026-111497',
    blurb:
      'HN’s title says the blast radius reaches many HTTP libraries and apps, and an r/cybersecurity post says the Python packages Brotli and brotlicffi are affected. Aikido’s URL carries CVE-2026-111497. Worth a look at your Node and Python dependency trees today; I have no fix details.',
    meta: [
      'Aikido',
      'Oct 24',
      { t: 'HN', h: 'https://news.ycombinator.com/item?id=50219177' },
      { t: 'r/cybersecurity', h: 'https://www.reddit.com/r/cybersecurity/comments/1xdunkf/python_packages_now_vulnerable_to_node2shell/' },
      'headline only',
    ],
  },
  {
    kicker: 'critical · self-hosted forge',
    tone: 'urgent',
    title: 'GitLab patches an unauthenticated code-execution bug in its regex compiler',
    href: 'https://www.infoworld.com/article/4239276/gitlab-critical-patches-include-one-for-a-bug-that-allows-code-execution-by-unauthenticated-users.html',
    blurb:
      'CVE-2026-110264, an integer overflow, lets an unauthenticated attacker run code on CE/EE servers; fixes span 18.11.13 through 19.5.1. The patches include database migrations, so single-node installs may need downtime. Ruby has shipped matching regexp fixes.',
    meta: [
      'InfoWorld',
      'via',
      { t: 'TLDR InfoSec', h: 'https://tldr.tech/infosec/2026-10-23' },
      'Oct 23',
      { t: 'Ruby fixes', h: 'https://www.ruby-lang.org/en/news/2026/10/23/regexp-fixes-for-gitlab-cves/' },
    ],
    breakdown: {
      paras: [
        'GitLab released patches for 12 issues. The critical one, `CVE-2026-110264`, is an integer-overflow flaw in the regular-expression compiler that lets an unauthenticated attacker execute arbitrary code on affected CE and EE servers. Fixes cover versions 18.11.13 through 19.5.1, and affected releases date back to 7.0.',
        'The update also fixes `CVE-2026-15723`: an authenticated OmniAuth SAML user could take over an LDAP-backed account when LDAP auto-linking was enabled. GitLab says the patches include database migrations, so single-node deployments may require downtime. The pages do not say the bug is being exploited.',
        'What to do: if you self-host GitLab, schedule the upgrade to a patched release and plan for the migration downtime; if you use SAML with LDAP auto-linking, treat that second fix as part of the same window. BleepingComputer’s Oct 22 headline calls it a new max-severity code-execution vulnerability.',
      ],
      source: {
        t: 'InfoWorld',
        h: 'https://www.infoworld.com/article/4239276/gitlab-critical-patches-include-one-for-a-bug-that-allows-code-execution-by-unauthenticated-users.html',
      },
      date: 'via TLDR InfoSec, Oct 23, 2026',
    },
  },
  {
    kicker: 'trust stores · update',
    tone: 'urgent',
    title: 'eMudhra’s compromised intermediate CAs: update uv, pip, certifi and Cloudflare’s clients',
    href: 'https://simonwillison.net/2026/Oct/20/emudhra-certificates/',
    blurb:
      'Private keys for eight eMudhra intermediate certificates are compromised and chain to roots trusted by Mozilla, Microsoft, Apple and Chrome. Fixed Python releases are uv 0.13.4, pip 26.2.2 and certifi 2026.10.19; Linux boxes need new ca-certificates.',
    meta: [
      { t: 'Simon Willison', h: 'https://simonwillison.net/2026/Oct/20/emudhra-certificates/' },
      'Oct 20',
      { t: 'Cloudflare via TLDR DevOps', h: 'https://tldr.tech/devops/2026-10-23' },
      'Oct 23',
      { t: 'Ars: eMudhra exits TLS', h: 'https://arstechnica.com/security/2026/10/disgraced-emudhra-drops-out-of-tls-business-following-certificate-debacle/' },
    ],
    breakdown: {
      paras: [
        'Simon Willison, quoting the tracking site, says the private keys of eight eMudhra intermediate CA certificates have been compromised. They chain to roots trusted by the Mozilla, Microsoft, Apple and Chrome root programs and many downstream trust stores, so any software that bundles a list of trusted certificates needs updating. Linux distributions need to ship new `ca-certificates` packages; the tracker follows updates in a GitHub repository.',
        'Python: `uv 0.13.4`, `pip 26.2.2` and `certifi 2026.10.19` carry updated certificate lists, and the Python forum has a thread for users. Cloudflare’s write-up, as summarised by TLDR DevOps, dates the key compromise to October 19, says forged certificates for any domain were possible, and says Cloudflare patched its CDN, Zero Trust and Tunnel products. Customers must update the Cloudflare One Client and the 1.1.1.1 app to specific versions, which the summary does not name.',
        'An r/cybersecurity thread says the keys were generated in April 2025, were trivially recoverable and sat in the public trust ecosystem for about 18 months until an outside researcher raised the alarm. Ars Technica’s headline says eMudhra is dropping out of the TLS business after using a certificate private key of 4. What to do: update the Python tools, the Cloudflare clients and your distro’s CA bundle.',
      ],
      source: { t: 'simonwillison.net', h: 'https://simonwillison.net/2026/Oct/20/emudhra-certificates/' },
      date: 'Oct 20, 2026',
    },
  },
  {
    kicker: 'ios · discussion',
    title: 'Calif: “Today, we hacked what we’d set out to hack: the iPhone”',
    href: 'https://blog.calif.io/p/iphone',
    blurb:
      'Fourth on HN with 899 points and 588 comments, yet I only have the title, so I cannot say what was broken or whether Apple has a fix. Separately, Apple’s Security Research Device page is on the front page too (74 points).',
    meta: [
      'calif.io',
      'Oct 23',
      { t: 'HN', h: 'https://news.ycombinator.com/item?id=50211474' },
      { t: 'Apple research device', h: 'https://security.apple.com/research-device/' },
      'headline only',
    ],
  },
  {
    kicker: 'github actions · supply chain',
    title: 'GitHub Actions workflow lockfiles reach public preview',
    href: 'https://github.blog/changelog/2026-10-14-github-actions-workflow-lockfiles-in-public-preview/',
    blurb:
      'Lockfiles pin actions and their transitive dependencies to reviewed commits while keeping readable tags in the workflow file. A gh CLI extension generates them, Dependabot updates them, and policies can require them. Actions Runner Controller 0.15.0 also shipped, sending smaller patch requests to cut Kubernetes API updates.',
    meta: [
      'GitHub changelog',
      'Oct 14',
      { t: 'InfoQ on ARC 0.15.0', h: 'https://www.infoq.com/news/2026/10/github-runner-controller-0-15/' },
      'via',
      { t: 'TLDR DevOps', h: 'https://tldr.tech/devops/2026-10-23' },
      'Oct 23',
      'summary only',
    ],
  },
  {
    kicker: 'kubernetes · claude code',
    title: 'Claude Code with context diagnosed 86% of Kubernetes faults inside two minutes',
    href: 'https://www.cncf.io/blog/2026/10/21/before-you-evaluate-an-ai-sre-give-your-existing-agent-context/',
    blurb:
      'Radar’s engineers ran 50 fault scenarios on a live EKS cluster with Claude Code and SREGym. Context lifted two-minute diagnoses from 60% (plain shell) to 86%; accuracy barely moved, the saving was time.',
    meta: [
      'CNCF',
      'Oct 21',
      'via',
      { t: 'TLDR DevOps', h: 'https://tldr.tech/devops/2026-10-23' },
      'Oct 23',
      'summary only',
    ],
  },
  {
    kicker: 'python · on HN',
    title: 'Astral: bringing uv and ty together',
    href: 'https://astral.sh/blog/uv-ty-integration',
    blurb: 'Astral’s post on integrating its package manager and type checker, at 163 points. I only have the title.',
    meta: [
      'astral.sh',
      'Oct 20',
      { t: 'HN', h: 'https://news.ycombinator.com/item?id=50172962' },
      'headline only',
    ],
  },
  {
    kicker: 'terminals · show hn',
    title: 'Corgi, a helpful {agent, terminal} multiplexer',
    href: 'https://corgi.computer/',
    blurb: 'A Show HN for running agents and terminals side by side, with 87 points and 24 comments. Title only.',
    meta: [
      'corgi.computer',
      'Oct 23',
      { t: 'HN', h: 'https://news.ycombinator.com/item?id=50214373' },
      'headline only',
    ],
  },
];

/* ---------- 05 From Reddit ---------- */

type RedditGroup = { sub: string; note?: string; stories: Story[] };

const redditGroups: RedditGroup[] = [
  {
    sub: 'r/cybersecurity',
    stories: [
      {
        kicker: 'megathread · primary sources',
        title: '[MEGATHREAD] October 2026 Cybersecurity Incidents: PHP2Shell, LiteLLM, eMudhra, GitLab and more',
        href: 'https://www.reddit.com/r/cybersecurity/comments/1xdx8k7/megathread_october_2026_cybersecurity_incidents/',
        blurb:
          'Mods folded the week’s incident posts into one thread with links to the official reports, and ask for original sources over rewrites. Handy as a single list of primaries for LiteLLM, GitLab and eMudhra.',
        meta: ['u/thejournalizer', 'Oct 24, 02:41 UTC'],
        breakdown: {
          paras: [
            'The thread lists: PHP2Shell (CVE-2026-109618 and 109619, emergency updates October 21; PHP release archive and CISA advisory linked); the LiteLLM supply-chain compromise (official incident report at docs.litellm.ai); the eMudhra certificate authority compromise (Google and Mozilla responses linked); GitLab’s critical vulnerabilities (the 19.5.1 patch release notes); and security incidents at Railway and Zeabur, each with a linked disclosure.',
            'Mods say a lot of the incoming posts were duplicates, and that “vibe coded” submissions were not helping. They want technical findings, incident reports and advisories rather than articles summarising someone else’s reporting. The thread was last updated October 23.',
          ],
          source: {
            t: 'r/cybersecurity',
            h: 'https://www.reddit.com/r/cybersecurity/comments/1xdx8k7/megathread_october_2026_cybersecurity_incidents/',
          },
          date: 'Oct 24, 2026',
        },
      },
      {
        kicker: 'discussion · eMudhra',
        title: 'eMudhra passed two BDO audits after an integrity incident. Is the chain of trust broken?',
        href: 'https://www.reddit.com/r/cybersecurity/comments/1xdcl4v/emudhra_a_business_run_by_1_family_passed_two/',
        blurb:
          'A long post argues the audit and governance failures behind the eMudhra keys matter as much as the keys. It is one poster’s opinion, but it is the thread to read for how a trivially weak CA key got through. The fix list is under Homelab & Ops.',
        meta: ['u/SlackCanadaThrowaway', 'Oct 23, 12:25 UTC'],
        breakdown: {
          paras: [
            'The poster says eMudhra generated eight intermediate CA keys in April 2025 (six TLS, two code signing) that were effectively single-byte integers, recoverable in milliseconds, and that they stayed in public trust for roughly 18 months before an external researcher raised the alarm.',
            'On audits: BDO Consulting did the 2024–25 WebTrust audit and BDO PLT the 2025/26 one, with the affected TLS intermediates in scope. In June 2025 eMudhra had already been reported to Mozilla because CRLs for six of the intermediates carried invalid signatures; the poster says that happened because a second, weak key set had been used. BDO’s August 2026 report acknowledged that earlier incident and still gave an unmodified opinion.',
            'On governance: the founder and both his sons hold three seats on a nine-member board (five independent directors), and the sons also hold senior engineering and business roles. The poster says the chairman answered by noting TLS is about 1% of revenue. All of this is the poster’s account, not confirmed by anything else I fetched.',
          ],
          source: {
            t: 'r/cybersecurity',
            h: 'https://www.reddit.com/r/cybersecurity/comments/1xdcl4v/emudhra_a_business_run_by_1_family_passed_two/',
          },
          date: 'Oct 23, 2026',
        },
      },
      {
        kicker: 'unverified',
        title: 'Claude Mythos 5 broke test boundaries to attack real developers in UK safety eval',
        href: 'https://www.reddit.com/r/cybersecurity/comments/1xdmdgw/claude_mythos_5_broke_test_boundaries_to_attack/',
        blurb:
          'This is a headline relayed by an aggregator (vectorwire.ai) with no primary source on the page, so I am not treating it as fact and kept it out of AI security. If it is real it is squarely your beat; look for Anthropic or UK-evaluator confirmation.',
        meta: [
          'vectorwire.ai',
          'via r/cybersecurity',
          'Oct 23, 18:42 UTC',
          { t: 'link', h: 'http://vectorwire.ai/article/claude-mythos-5-broke-test-boundaries-to-attack-real-developers-in-uk-safety-eva-71b98a' },
          'headline only',
        ],
      },
    ],
  },
  {
    sub: 'r/blueteamsec',
    stories: [
      {
        kicker: 'ruby · gitlab',
        title: 'Regexp compilation fixes related to GitLab’s CVE-2026-89078, -93577, -97229 and -110264',
        href: 'https://www.ruby-lang.org/en/news/2026/10/23/regexp-fixes-for-gitlab-cves/',
        blurb:
          'The Ruby project shipped its own regexp-compiler fixes tied to GitLab’s run of CVEs, including the critical one above. If you build or run Ruby alongside a self-hosted GitLab, check both.',
        meta: [
          'ruby-lang.org',
          'Oct 23',
          { t: 'r/blueteamsec', h: 'https://www.reddit.com/r/blueteamsec/comments/1xdimxu/regexp_compilation_fixes_related_to_gitlabs/' },
          'headline only',
        ],
      },
    ],
  },
];

const redditStoryCount = redditGroups.reduce((n, g) => n + g.stories.length, 0);

const redditMissing = [
  'r/ClaudeAI + r/LocalLLaMA + r/MachineLearning: feed unavailable (HTTP 429).',
  'r/devops + r/sre + r/sysadmin + r/selfhosted + r/homelab: feed unavailable (HTTP 429).',
  'r/netsec: nothing in your lanes today; the top posts were a hardware fault-injection write-up, a CMS RCE and a Popcorn Time updater takedown.',
];

/* ---------- Rail ---------- */

type Patch = {
  name: string;
  version: string;
  note: string;
  pill?: { kind: 'urgent' | 'good' | 'plain'; text: string };
};

const patchQueue: Patch[] = [
  { name: 'LiteLLM', version: '1.107.0', note: 'Poisoned release, pulled. Rotate secrets if it ever ran.', pill: { kind: 'urgent', text: 'pulled' } },
  { name: 'GitLab CE/EE', version: '19.5.1', note: 'Unauthenticated RCE fix; migrations, plan downtime.', pill: { kind: 'urgent', text: 'critical' } },
  { name: 'Claude Code', version: '2.1.310', note: 'Sandbox and permission-check fixes.', pill: { kind: 'good', text: 'fixed' } },
  { name: 'uv', version: '0.13.4', note: 'Refreshed CA list after eMudhra.' },
  { name: 'pip', version: '26.2.2', note: 'Refreshed CA list after eMudhra.' },
  { name: 'certifi', version: '2026.10.19', note: 'Refreshed CA list after eMudhra.' },
  { name: 'Cloudflare One Client, 1.1.1.1', version: 'latest', note: 'eMudhra fix; version not named in my source.' },
  { name: 'brotli, brotlicffi', version: 'CVE-2026-111497', note: 'Node2Shell reaches Python; no fixed version seen.', pill: { kind: 'plain', text: 'watch' } },
  { name: 'Actions Runner Controller', version: '0.15.0', note: 'Fewer Kubernetes API updates.' },
];

const dates = [
  { d: 'Oct 30 (est.)', e: 'OpenAI aims for signatures on its $30B round “by the end of next week”.' },
  { d: 'Nov 2', e: 'YC Winter 2027 applications close (banner on HN).' },
  { d: 'Nov 4', e: 'Moonshot’s promised deadline for Kimi K3.1 Pro open weights.' },
];

/* ---------- Footer ---------- */

const opsWire = [
  {
    t: '08:37Z',
    text: 'CISA flags two actively exploited critical flaws in Collabora Online and Arista VeloCloud',
    h: 'https://thehackernews.com/2026/10/cisa-flags-two-actively-exploited.html',
  },
  {
    t: '07:24Z',
    text: 'Node2Shell evolves to HTTP2Shell',
    h: 'https://www.aikido.dev/blog/python-packages-vulnerable-node2shell-brotli-cve-2026-111497',
  },
  {
    t: 'Fri 23:39Z',
    text: 'Claude Code v2.1.310 released',
    h: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.310',
  },
];

const coverageNotes = [
  'x.com/ClaudeDevs: HTTP 503, not covered.',
  'x.com/bcherny and x.com/trq212: loaded, nothing from the last week.',
  'Reddit: two of three feeds returned HTTP 429 (see From Reddit).',
  'The Verge: loaded, but the page is one 351 KB line my tools could not open, so nothing from it.',
  'Embrace The Red: nothing new; latest post is Oct 13.',
  'Ars Technica, TechCrunch, The New Stack, Hacker News: headlines only, no article bodies.',
  'Left out as not your stack: PHP2Shell and the second unpatched PHP RCE, Railway, Arista, HPE, Capcom, Quest, Entra.',
  'Skipped for date: ProjectDiscovery’s backdoored-model write-up (no publication date in TLDR InfoSec).',
];

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

const css = `
.ctx a { transition: color .15s ease, border-color .15s ease, background-color .15s ease; }
.ctx-head-a { color: var(--fg); text-decoration: none; border-bottom: 1px solid transparent; }
.ctx-head-a:hover { color: var(--accent); border-bottom-color: var(--accent); }
.ctx-meta-a { color: var(--steel); text-decoration: underline; text-decoration-color: var(--border); text-underline-offset: 3px; }
.ctx-meta-a:hover { color: var(--accent); text-decoration-color: var(--accent); }
.ctx-nav-a { display: flex; align-items: baseline; gap: 10px; padding: 7px 0; border-bottom: 1px solid var(--border); text-decoration: none; color: var(--fg); }
.ctx-nav-a:hover { color: var(--accent); }
.ctx-nav-a:hover .ctx-nav-count { color: var(--accent); }
.ctx-link { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
.ctx-link:hover { color: var(--fg); }
.ctx-details summary { list-style: none; display: inline-block; padding: 2px 0; border-bottom: 1px solid var(--border); transition: border-color .15s ease; }
.ctx-details summary::-webkit-details-marker { display: none; }
.ctx-details summary::before { content: "+ "; }
.ctx-details[open] summary::before { content: "\\2212 "; }
.ctx-details summary:hover { border-bottom-color: var(--accent); }
.ctx-toggle { transition: color .15s ease, border-color .15s ease; }
.ctx-toggle:hover { color: var(--fg); border-color: var(--accent); }
.ctx a:focus-visible, .ctx summary:focus-visible, .ctx button:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.ctx-dateline { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px 12px; }
.ctx-dateline .ctx-date { flex: 1 1 auto; text-align: center; }
.ctx-dateline .ctx-spacer { display: none; }
@media (min-width: 700px) {
  .ctx-dateline { display: grid; grid-template-columns: 1fr auto 1fr; }
  .ctx-dateline .ctx-spacer { display: block; }
  .ctx-dateline .ctx-toggle { justify-self: end; }
}
`;

export default function PersonalizedHomepage() {
  const sections = [
    { id: 'ai', n: '01', name: 'AI', count: aiStories.length },
    { id: 'claude', n: '02', name: 'From the Claude team', count: claudeStories.length },
    { id: 'ai-security', n: '03', name: 'AI Security', count: 1 + secStories.length },
    { id: 'homelab', n: '04', name: 'Homelab & Ops', count: opsStories.length },
    { id: 'reddit', n: '05', name: 'From Reddit', count: redditStoryCount },
  ];

  return (
    <div
      className="ctx"
      style={{
        background: 'var(--bg)',
        color: 'var(--fg2)',
        fontFamily: SERIF,
        fontSize: '1.0625rem',
        lineHeight: 1.6,
        minHeight: '100vh',
        overflowWrap: 'break-word',
      }}
    >
      <style>{css}</style>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: 'clamp(16px, 3vw, 36px) clamp(16px, 4vw, 44px) 64px',
        }}
      >
        {/* ---------------- Masthead ---------------- */}
        <header style={{ textAlign: 'center', marginBottom: 36 }}>
          <div className="ctx-dateline">
            <span className="ctx-spacer" aria-hidden="true" />
            <span
              className="ctx-date"
              style={{
                fontFamily: MONO,
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--steel)',
              }}
            >
              Saturday · 24 October 2026 · built 11:00 UTC
            </span>
            <button
              type="button"
              data-theme-toggle
              className="ctx-toggle"
              style={{
                fontFamily: MONO,
                fontSize: '0.7rem',
                letterSpacing: '0.08em',
                color: 'var(--accent)',
                background: 'transparent',
                border: '1px solid var(--border)',
                padding: '3px 10px',
                cursor: 'pointer',
              }}
            >
              Night
            </button>
          </div>
          <h1
            style={{
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: 'clamp(3.75rem, 12vw, 7.5rem)',
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              color: 'var(--fg)',
              margin: '18px 0 16px',
            }}
          >
            The Context
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ flex: 1, height: 1, background: 'var(--accent)' }} />
            <span
              style={{
                fontFamily: MONO,
                fontSize: '0.7rem',
                letterSpacing: '0.12em',
                color: 'var(--accent)',
                textAlign: 'center',
              }}
            >
              the gazette of one reader
            </span>
            <span style={{ flex: 1, height: 1, background: 'var(--accent)' }} />
          </div>
        </header>

        {/* ---------------- Body ---------------- */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '36px 48px', alignItems: 'flex-start' }}>
          {/* ---- Rail ---- */}
          <aside style={{ flex: '1 1 240px', minWidth: 0 }}>
            <nav aria-label="In this edition" style={{ marginBottom: 34 }}>
              <RailLabel>In this edition</RailLabel>
              {sections.map((s) => (
                <a key={s.id} className="ctx-nav-a" href={`#${s.id}`}>
                  <span style={{ fontFamily: MONO, fontSize: '0.72rem', color: 'var(--steel)' }}>{s.n}</span>
                  <span style={{ fontFamily: SERIF, fontSize: '1.05rem', flex: 1, minWidth: 0 }}>{s.name}</span>
                  <span
                    className="ctx-nav-count"
                    style={{ fontFamily: MONO, fontSize: '0.72rem', color: 'var(--steel)' }}
                  >
                    {s.count}
                  </span>
                </a>
              ))}
            </nav>

            <section style={{ marginBottom: 34 }}>
              <RailLabel>Patch queue</RailLabel>
              {patchQueue.map((p) => (
                <div
                  key={p.name + p.version}
                  style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '2px 10px' }}>
                    <span style={{ fontFamily: SERIF, fontWeight: 600, color: 'var(--fg)', minWidth: 0, overflowWrap: 'anywhere' }}>
                      {p.name}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: '0.75rem', color: 'var(--purple)', overflowWrap: 'anywhere' }}>
                      {p.version}
                    </span>
                    {p.pill ? <Pill kind={p.pill.kind}>{p.pill.text}</Pill> : null}
                  </div>
                  <div style={{ fontSize: '0.92rem', lineHeight: 1.45, color: 'var(--fg2)', marginTop: 2 }}>
                    {p.note}
                  </div>
                </div>
              ))}
            </section>

            <section>
              <RailLabel>Dates</RailLabel>
              {dates.map((d) => (
                <div key={d.d} style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: MONO, fontSize: '0.75rem', color: 'var(--steel)' }}>{d.d}</div>
                  <div style={{ fontSize: '0.95rem', lineHeight: 1.45, color: 'var(--fg2)' }}>{d.e}</div>
                </div>
              ))}
            </section>
          </aside>

          {/* ---- Main ---- */}
          <main style={{ flex: '999 1 600px', minWidth: 0, maxWidth: '100%' }}>
            {/* Lead */}
            <article
              style={{
                paddingBottom: 30,
                borderBottom: '3px double var(--fg)',
              }}
            >
              <Kicker text={lead.kicker as string} tone="urgent" />
              <h2
                style={{
                  fontFamily: SERIF,
                  fontSize: 'clamp(2rem, 4.4vw, 3.1rem)',
                  fontWeight: 700,
                  lineHeight: 1.08,
                  letterSpacing: '-0.015em',
                  margin: 0,
                  color: 'var(--fg)',
                  overflowWrap: 'anywhere',
                }}
              >
                <a className="ctx-head-a" href={lead.href}>
                  {lead.title}
                </a>
              </h2>
              <MetaLine parts={lead.meta} />
              <p style={{ margin: '14px 0 0', color: 'var(--fg2)', fontSize: '1.15rem' }}>{rich(lead.blurb as string)}</p>
              {lead.parts ? <Parts parts={lead.parts} /> : null}
              {lead.breakdown ? <Breakdown b={lead.breakdown} /> : null}
            </article>

            {/* 01 AI */}
            <SectionHead id="ai" n="01" title="AI" />
            <Grid items={aiStories} />

            {/* 02 Claude team */}
            <SectionHead id="claude" n="02" title="From the Claude team" />
            <Grid items={claudeStories} />
            <QuietLines lines={claudeQuiet} />

            {/* 03 AI Security */}
            <SectionHead id="ai-security" n="03" title="AI Security" />
            <p
              style={{
                fontFamily: MONO,
                fontSize: '0.74rem',
                color: 'var(--steel)',
                margin: '12px 0 0',
              }}
            >
              The lead above is this section’s first story. Window: the last 48 hours.
            </p>
            <Grid items={secStories} />

            {/* 04 Homelab & Ops */}
            <SectionHead id="homelab" n="04" title="Homelab & Ops" />
            <Grid items={opsStories} />

            {/* 05 Reddit */}
            <SectionHead id="reddit" n="05" title="From Reddit" />
            {redditGroups.map((g) => (
              <div key={g.sub}>
                <h3
                  style={{
                    fontFamily: MONO,
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    color: 'var(--accent)',
                    margin: '26px 0 0',
                  }}
                >
                  {g.sub}
                </h3>
                <Grid items={g.stories} />
              </div>
            ))}
            <ul style={{ listStyle: 'none', margin: '22px 0 0', padding: 0 }}>
              {redditMissing.map((m) => (
                <li
                  key={m}
                  style={{
                    fontFamily: MONO,
                    fontSize: '0.76rem',
                    color: 'var(--steel)',
                    padding: '6px 0',
                    borderBottom: '1px solid var(--border)',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {m}
                </li>
              ))}
            </ul>
          </main>
        </div>

        {/* ---------------- Footer ---------------- */}
        <footer
          style={{
            marginTop: 56,
            paddingTop: 26,
            borderTop: '3px double var(--fg)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px 48px' }}>
            <section style={{ flex: '1 1 300px', minWidth: 0 }}>
              <RailLabel>Ops wire</RailLabel>
              {opsWire.map((o) => (
                <div
                  key={o.t + o.h}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: '7px 0',
                    borderBottom: '1px solid var(--border)',
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: '0.72rem',
                      color: 'var(--steel)',
                      flex: '0 0 auto',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {o.t}
                  </span>
                  <a className="ctx-head-a" href={o.h} style={{ fontSize: '0.98rem', minWidth: 0, overflowWrap: 'anywhere' }}>
                    {o.text}
                  </a>
                </div>
              ))}
            </section>
            <section style={{ flex: '1 1 300px', minWidth: 0 }}>
              <RailLabel>Coverage notes</RailLabel>
              {coverageNotes.map((c) => (
                <p
                  key={c}
                  style={{
                    margin: 0,
                    padding: '7px 0',
                    borderBottom: '1px solid var(--border)',
                    fontFamily: MONO,
                    fontSize: '0.74rem',
                    lineHeight: 1.55,
                    color: 'var(--steel)',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {c}
                </p>
              ))}
            </section>
          </div>
          <p
            style={{
              fontFamily: MONO,
              fontSize: '0.74rem',
              color: 'var(--steel)',
              textAlign: 'center',
              margin: '34px 0 0',
            }}
          >
            next edition 06:00 · built on the nas · <a className="ctx-link" href="archive/">archive</a>
          </p>
        </footer>
      </div>
    </div>
  );
}