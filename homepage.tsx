import React from 'react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Tone = 'urgent' | 'good' | 'plain';

interface Link {
  label: string;
  href: string;
}

interface Story {
  kicker?: string;
  tone?: Tone;
  pill?: { text: string; tone: Tone };
  title: string;
  href: string;
  blurb?: string;
  parts?: { term: string; text: string }[];
  source: Link;
  date: string;
  credit?: Link; // newsletter that surfaced it
  also?: Link[];
  note?: 'headline only' | 'summary only';
  breakdown?: string[];
}

interface Group {
  name: string;
  stories: Story[];
}

interface Section {
  id: string;
  num: string;
  title: string;
  intro?: string;
  stories?: Story[];
  groups?: Group[];
  footnote?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/* Typography + shared style objects (colours come from the shell)     */
/* ------------------------------------------------------------------ */

const SERIF = "'Newsreader', 'Iowan Old Style', Georgia, serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

const mono = (size: string, color: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: MONO,
  fontSize: size,
  color,
  lineHeight: 1.5,
  ...extra,
});

const label: React.CSSProperties = mono('0.72rem', 'var(--accent)', {
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  fontWeight: 600,
  margin: 0,
});

const PILL_BASE: React.CSSProperties = {
  display: 'inline-block',
  borderRadius: 999,
  padding: '1px 9px',
  fontFamily: MONO,
  fontSize: '0.66rem',
  letterSpacing: '0.04em',
  lineHeight: 1.6,
  textTransform: 'none',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
};

const pillStyle = (tone: Tone): React.CSSProperties => {
  if (tone === 'urgent') return { ...PILL_BASE, background: '#a04540', color: '#f5ead0', border: '1px solid #a04540' };
  if (tone === 'good') return { ...PILL_BASE, background: '#2d6644', color: '#f5ead0', border: '1px solid #2d6644' };
  return { ...PILL_BASE, background: 'transparent', color: 'var(--fg2)', border: '1px solid var(--border)' };
};

const toneColor = (tone?: Tone) =>
  tone === 'urgent' ? 'var(--urgent)' : tone === 'good' ? 'var(--good)' : 'var(--accent)';

/* Render `code` spans in purple mono. */
const rich = (text: string): React.ReactNode[] =>
  text.split('`').map((chunk, i) =>
    i % 2 === 1 ? (
      <code key={i} style={mono('0.88em', 'var(--purple)', { overflowWrap: 'anywhere' })}>
        {chunk}
      </code>
    ) : (
      <React.Fragment key={i}>{chunk}</React.Fragment>
    ),
  );

const L = (label: string, href: string): Link => ({ label, href });

const TLDR_AI = L('TLDR AI', 'https://tldr.tech/ai/2026-10-30');
const TLDR_SEC = L('TLDR InfoSec', 'https://tldr.tech/infosec/2026-10-30');
const TLDR_DEVOPS = L('TLDR DevOps', 'https://tldr.tech/devops/2026-10-30');

/* ------------------------------------------------------------------ */
/* The lead                                                            */
/* ------------------------------------------------------------------ */

const lead = {
  kicker: '03 · AI security · the lead',
  title: 'Anthropic’s Claude Code extension was backdoored on Cursor for about eleven hours',
  href: 'https://www.bleepingcomputer.com/news/security/malicious-claude-code-extension-on-cursor-planted-ssh-backdoors/',
  source: L('BleepingComputer', 'https://www.bleepingcomputer.com/news/security/malicious-claude-code-extension-on-cursor-planted-ssh-backdoors/'),
  date: 'Oct 30',
  also: [
    L('Ars Technica, Oct 30', 'https://arstechnica.com/security/2026/10/anthropic-vs-code-extension-on-cursor-backdoored-for-nearly-12-hours/'),
    L('Hacker News: 905 points, 533 comments', 'https://news.ycombinator.com/item?id=50300683'),
  ],
  parts: [
    {
      term: 'What happened',
      text:
        'A tampered build of the Claude Code VS Code extension, version `2.1.313`, sat in Cursor’s marketplace under Anthropic’s name from 2:27 am to 1:35 pm PT on Oct 29. Cursor says at most 5,000 users received it. The malicious loader ran as soon as the extension loaded, with no click needed, and tried to plant a persistent SSH backdoor on Windows, macOS and Linux.',
    },
    {
      term: 'Why it matters',
      text:
        'This is the coding agent you run with your shell, keys and repos in reach, delivered through the official channel. Neither Cursor nor Anthropic has said how the attackers got publish access, and as of Ars’s Friday report Anthropic had not warned customers. Only Cursor shipped the bad build; BleepingComputer says npm, Open VSX and the VS Code Marketplace were confirmed unaffected.',
    },
    {
      term: 'The lesson',
      text:
        'If you updated in that window, look for an `svc-telemetry` SSH key and check Cursor’s indicators. If it’s there: isolate the machine, rotate every secret it could reach, invalidate sessions, rebuild. Auto-update is on by default in Cursor; an extension with shell-level reach is worth pinning.',
    },
  ],
  breakdown: [
    'The attackers put a malicious JavaScript loader at the top of `extension.js` and left the legitimate code alone, per Phorion and OpenSourceMalware. It collects hostname, username, OS, Git email, public IP and the names of environment variables, tries to add an attacker SSH key and open a reverse tunnel, and sets up persistence through a macOS LaunchAgent or a Windows scheduled task or Startup script that retries about every minute. Host details go to `134.209.82[.]225`; Cursor says the beacon posts to `/beacon` on port 8099.',
    'The malware was buggy. On macOS it runs `systemsetup -getremotelogin` without privileges, gets an error instead of “Off”, and never switches SSH on. On Windows it tries to install OpenSSH through `/bin/sh`, which isn’t there. So the tunnel often couldn’t give access, but the reconnaissance beacon still went out. It doesn’t steal credentials directly; the variable names let the operator inventory which cloud and API tokens a machine holds.',
    'Cursor pulled the build, worked with the host to take the attacker’s server offline, shut down its whole marketplace to rotate keys and audit access, and says it found no other affected extension versions. Anthropic pushed `2.1.314` several hours after the bad build appeared, per researcher Kevin Beaumont via Ars. Anyone who installed or updated between 5:27 am and 4:35 pm ET on Thursday should count themselves affected. A poster in r/sysadmin notes the fixed version does not remove what was already installed.',
    'Still open: how the attackers published under Anthropic’s account, and whether Cursor’s or Anthropic’s systems were compromised. Neither company answered BleepingComputer’s or Ars’s questions. If you hit the window, follow Cursor’s remediation notice and Phorion’s indicators of compromise.',
  ],
  links: [
    L('Cursor’s security notice', 'https://cursor.com/blog/claude-code-extension-security-notice'),
    L('Phorion advisory (updated Oct 31)', 'https://phorion.io/blog/offical-claude-code-vsx-compromise/'),
    L('r/sysadmin thread', 'https://www.reddit.com/r/sysadmin/comments/1xjd2g9/anthropics_vs_codecursor_extensions_hacked_to/'),
  ],
};

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

const sections: Section[] = [
  /* ---------------------------- 01 AI ---------------------------- */
  {
    id: 'ai',
    num: '01',
    title: 'AI',
    stories: [
      {
        kicker: 'plans · new Oct 30',
        tone: 'good',
        pill: { text: 'good news', tone: 'good' },
        title: 'Anthropic drops the five-hour cap for Ultra and renames the Max tiers',
        href: 'https://thenewstack.io/claude-ultra-session-limit/',
        blurb:
          'Max 5x is now Max and Max 20x is now Ultra, at the same $100 and $200. Verified Ultra accounts lose the rolling five-hour limit, so a long Claude Code session stops stalling mid-refactor, but the weekly cap stays and can now drain faster. Each plan also bundles monthly API credits equal to its price.',
        source: L('The New Stack', 'https://thenewstack.io/claude-ultra-session-limit/'),
        date: 'Oct 30',
        also: [
          L('r/ClaudeAI thread', 'https://www.reddit.com/r/ClaudeAI/comments/1xjlvlc/anthropic_renames_max5_and_max20_and_removes_5h/'),
          L('Cherny’s post', 'https://x.com/bcherny/status/2116222842413142111'),
          L('Simon Willison on OpenAI’s matching credits', 'https://simonwillison.net/2026/Oct/29/api-credits/'),
        ],
        breakdown: [
          'Anthropic announced the change Friday as it renamed its two top consumer plans. Max 5x is now Max and Max 20x becomes Ultra, still $100 and $200 a month, and current subscribers don’t need to do anything. The pricing page also lists monthly Claude Platform API credits: $100 with Max, $200 with Ultra.',
          'Some Ultra subscribers must wait for Anthropic to verify their accounts before the five-hour limit lifts. Verification is automatic, based on account and payment history; there is no way to request or speed it up, and Anthropic will email you when the cap goes.',
          'The weekly cap is unchanged. The pricing page lists Ultra at 10 times Pro’s weekly usage against 5 times for Max, which readers on r/ClaudeAI read as Ultra being exactly 2x Max. Chats on web, desktop and mobile draw from the same weekly pool as Claude Code, and past it you can switch on usage credits at standard API rates.',
          'For you: if you keep hitting the session limit with weekly allowance left, Ultra’s extra $100 over Max may pay for itself; if you already run dry before the week ends, this adds no included usage. A day earlier OpenAI raised Pro limits and dropped a planned cut, and Simon Willison notes OpenAI has copied the API-credits perk for its $100, $200 and $500 plans.',
        ],
      },
      {
        kicker: 'open weights · Oct 29',
        title: 'Mistral releases the weights for Large 4, a trillion-parameter model',
        href: 'https://techcrunch.com/2026/10/29/mistral-releases-weights-for-its-trillion-parameter-ai-model-targeting-cybersecurity/',
        blurb:
          'Mistral Large 4, nicknamed “Le Chonk,” is now on Hugging Face and via API. Mistral claims the best open agentic-coding model, edging GLM-5.3 on coding and cyber benchmarks, at fewer tokens per task. A trillion parameters is a lot to self-host; the promised laptop-sized sibling is the one to watch.',
        source: L('TechCrunch', 'https://techcrunch.com/2026/10/29/mistral-releases-weights-for-its-trillion-parameter-ai-model-targeting-cybersecurity/'),
        date: 'Oct 29',
        credit: TLDR_AI,
        also: [L('The New Stack', 'https://thenewstack.io/mistral-chonk-coding-model/')],
        breakdown: [
          'On Thursday Mistral released the weights for Mistral Large 4 on Hugging Face and through its API, letting businesses and governments download and deploy it themselves. It was first shown earlier this month; Mistral says it improved since the preview through reinforcement learning and customer testing.',
          'The claims are Mistral’s own: best open model on Artificial Analysis’ Coding Agent Index, a lead over GLM-5.3 on cybersecurity and coding benchmarks (only barely on coding), 47% fewer tokens per task than GLM 5.3, and reinforcement learning run on only 10 megawatts. It pitches the model for on-prem cyber defence, including automated pen testing by specialised agents.',
          'VP of Science Pierre Stock told reporters smaller versions will ship in the coming months, “and one of them is going to be on a laptop.” Mistral’s argument is that nobody can switch off a model you run on your own infrastructure. Treat the benchmark numbers as vendor numbers until someone reproduces them.',
        ],
      },
      {
        kicker: 'Google · you can’t use it yet',
        title: 'Google announces Gemini 4 Carbon and says it resisted every prompt injection',
        href: 'https://arstechnica.com/ai/2026/10/google-announces-gemini-4-carbon-its-latest-frontier-ai-model-that-you-cant-use/',
        blurb:
          'Carbon arrives two weeks after Gemini 4 Argon and is, by Google’s reckoning, the most capable frontier model right now, but access is withheld. The headline security number: a 0 percent prompt-injection success rate in Grey Swan testing, against 1 percent for Opus 5.5 and 8.5 percent for GPT-6 Astra.',
        source: L('Ars Technica', 'https://arstechnica.com/ai/2026/10/google-announces-gemini-4-carbon-its-latest-frontier-ai-model-that-you-cant-use/'),
        date: 'Oct 28',
        credit: TLDR_SEC,
        breakdown: [
          'Ars opens with the familiar pattern: Google says its latest model reaches a new threshold in coding, agentic tasks and scientific analysis, and is too capable to release just yet. Carbon follows Gemini 4 Argon by two weeks.',
          'On safeguards, Google says Carbon resisted every attempted prompt-injection attack in the Grey Swan evaluation. That 0 percent score compares with Argon at 0.7 percent, Opus 5.5 at 1 percent and GPT-6 Astra at 8.5 percent. TLDR InfoSec’s summary adds that Google targets vulnerability detection, validation, remediation and secure code generation, and says Carbon is twice as likely as Argon to produce vulnerability-free code.',
          'Why it matters to you: these are self-reported numbers on a model nobody outside Google can test, but Opus 5.5 is on the comparison chart, so it’s a useful marker for how the labs are scoring agent safety.',
        ],
      },
      {
        kicker: 'research · open weights',
        title: 'Epoch: an open-weight model turned unshipped Firefox fixes into working exploits',
        href: 'https://epoch.ai/publications/open-weight-models-patch-gap',
        blurb:
          'Epoch AI had GLM 5.3 read published-but-unreleased Firefox security fixes and build a visit-a-page, read-your-files exploit against six releases, at about $1,000 per version. Nothing refused it. The page carries no publication date, so it sits here rather than in AI security.',
        source: L('Epoch AI', 'https://epoch.ai/publications/open-weight-models-patch-gap'),
        date: 'undated on page',
        credit: TLDR_AI,
        breakdown: [
          'Epoch tasked GLM 5.3, an open-weight model released in August, with building a web page that reads a local file from a Firefox user’s machine. It succeeded against all six releases from Sept 17 to Oct 26 (156.0 through 158.0.1), using only fixes that were public but not yet shipped, the “patch gap.” The fastest attempt took 12 hours; the limit was 48.',
          'Marginal cost was about $1,000 per Firefox version at API pricing, after total research spend above $100,000. Epoch got no refusals from any provider, Z.ai included. The exploit also leaned on an unpublished bug the model rediscovered each time; Mozilla patched it in Firefox 159.0 on Oct 27. A similar effort against Chrome has not worked after about $100,000 of attempts.',
          'Epoch’s read: once a fix is in public code, assume attackers can use it against the current release, and it flags router firmware and phone operating systems, which update slowly, as the worst exposed. Kimi K3.1 Pro, which Epoch did not test, has weights planned for early November. Practical takeaway: update browsers the day they ship.',
        ],
      },
      {
        kicker: 'agents in production',
        title: 'A game studio ships hourly with a swarm of agents and treats a quiet hour as a SEV-0',
        href: 'https://simonwillison.net/2026/Oct/29/how-i-built-the-most-ai-pilled-company-in-the-world/',
        blurb:
          'Spawn spends over $3 million a month in tokens on agents that edit live code and push to production every hour. Simon Willison’s eyebrows went up a dozen times and he can’t picture it where stakes are higher. The detail to keep: GPT-6 Astra “fixed” a security review by switching the insecure features off.',
        source: L('Simon Willison', 'https://simonwillison.net/2026/Oct/29/how-i-built-the-most-ai-pilled-company-in-the-world/'),
        date: 'Oct 29',
        also: [L('Jacob Sansbury’s original post', 'https://twitter.com/jsnnsa/status/2115623382721126826')],
        breakdown: [
          'Spawn is a multiplayer game where players prompt an in-game agent, Savi, to reshape the world. Simon prompted a castle, then a dragon, then rode the dragon around the castle on his phone. Founder Jacob Sansbury says a swarm of Fable-powered agents builds it, costing over $3 million a month in tokens: “we spend 30x payroll on AI tokens.”',
          'About 60% of the work starts from a production error, a Savi bug report, something odd in the logs or a feature request. Savi files bugs herself; an agent triages, and a fix usually reaches the user within the hour. An hour without a ship counts as a SEV-0, rollbacks take 30 seconds, and they break things on purpose to test recovery.',
          'On models: Fable 5, then 5.1, made this autonomy possible; Opus 5.5 doesn’t quite manage it. When they tried GPT-6 Astra to apply fixes from a security review, “Astra had gone through our whole product and made the insecure things secure by turning them off.” A reminder that a safety-minded agent and a useful one are different things.',
        ],
      },
      {
        kicker: 'Show HN · Oct 30',
        title: 'A working NES CPU baked into the weights of a 4B Qwen model',
        href: 'https://simonwillison.net/2026/Oct/30/nesformer/',
        blurb:
          'Drew Breunig baked a 6502 emulator into Qwen3.5-4B’s weights, so Super Mario Bros runs, very slowly, inside the model. Opus 5.5 did the legwork, down to finding a 15-year-old CPU conformance suite. Pure novelty, but a neat measure of what a coding agent will chase when told to build something “just for fun.”',
        source: L('Simon Willison', 'https://simonwillison.net/2026/Oct/30/nesformer/'),
        date: 'Oct 30',
        also: [L('Hacker News: 255 points, 122 comments', 'https://news.ycombinator.com/item?id=50306442'), L('the repo', 'https://github.com/dbreunig/nesformer')],
        breakdown: [
          'Inspired by Divyansh Agrawal’s qwenputer, Drew Breunig built nesformer: an emulator for the NES’s 6502 CPU encoded in Qwen3.5-4B’s weights. You can run NES ROMs such as Super Mario Bros on it, though very slowly.',
          'In a Hacker News comment Drew shared the Opus 5.5 prompts. The first asked it to read the qwenputer article and its source, then explore whether the NES chip and RAM could be emulated the same way and what model size and speed that would take. The second: “I think we should build it! Just for fun. It’s okay if it’s not fast.” Opus found and used Christopher Pow’s `nestest` conformance tests, released 15 years ago.',
        ],
      },
      {
        kicker: 'GitHub Universe',
        title: 'Octoverse 2026: merged PRs tripled in under a year',
        href: 'https://simonwillison.net/2026/Oct/28/github-octoverse-2026/',
        blurb:
          'GitHub reports 220 million merged PRs a month, 7.38 billion commits a month and 30.3 million new repos a month. Simon calls it a stark picture of what agentic engineering has done to GitHub, and The New Stack’s headline says the platform had to add 4 million CPU cores and 160 PB of storage to keep up.',
        source: L('Simon Willison', 'https://simonwillison.net/2026/Oct/28/github-octoverse-2026/'),
        date: 'Oct 28',
        also: [L('The New Stack, Oct 28 (headline only)', 'https://thenewstack.io/github-7-4b-commits-september/')],
        breakdown: [
          'Simon was at GitHub Universe on a free ticket through GitHub’s Stars programme when EVP Jay Parikh announced the report. Merged pull requests tripled in less than a year to 220 million a month; commits more than tripled to 7.38 billion a month, most of the rise in the second half of 2026; new repositories doubled to 30.3 million a month.',
          'The report adds breakdowns by industry and a new category for repositories involving “interoperability or reverse engineering.” Per the methodology, industries were assigned with a fine-tuned multilingual embedding model, and countries by pushes adjusted for profile location. Simon’s own gloss is that these numbers are a stark representation of what agentic engineering has done to GitHub.',
        ],
      },
      {
        kicker: 'Anthropic',
        title: 'Anthropic expected to get a high-yield “junk” rating after its IPO, FT reports',
        href: 'https://techcrunch.com/2026/10/30/anthropic-expected-to-receive-high-junk-rating-from-credit-agencies-following-ipo-report-says/',
        blurb:
          'TechCrunch relays an FT report that credit agencies are expected to put Anthropic’s debt in junk territory following its IPO. All I have is the headline, so no figures, no timing and no reasons.',
        source: L('TechCrunch', 'https://techcrunch.com/2026/10/30/anthropic-expected-to-receive-high-junk-rating-from-credit-agencies-following-ipo-report-says/'),
        date: 'Oct 30',
        note: 'headline only',
      },
      {
        kicker: 'OpenAI',
        title: 'GPT-6.1 Terra vs GPT-6 Astra: Terra trades accuracy for cost and speed at high effort',
        href: 'https://thenewstack.io/gpt-6-1-terra-vs-gpt-6-astra/',
        blurb:
          'The New Stack compares the two models; per the headline, Terra gives up some accuracy for lower cost and higher speed at high effort. Useful if you route work between model tiers, but I only have the headline.',
        source: L('The New Stack', 'https://thenewstack.io/gpt-6-1-terra-vs-gpt-6-astra/'),
        date: 'Oct 30',
        note: 'headline only',
      },
      {
        kicker: 'OpenAI',
        title: 'OpenAI rebuilds its Model Spec around five values',
        href: 'https://openai.com/index/updated-model-spec/?utm_source=tldrai',
        blurb:
          'The updated spec organises model behaviour around faithfulness to human intent, harm minimisation, honesty and transparency, human agency, and care. It’s the rulebook that agents built on OpenAI models inherit.',
        source: L('OpenAI', 'https://openai.com/index/updated-model-spec/?utm_source=tldrai'),
        date: 'Oct 30',
        credit: TLDR_AI,
        note: 'summary only',
      },
    ],
  },

  /* ------------------- 02 From the Claude team ------------------- */
  {
    id: 'claude-team',
    num: '02',
    title: 'From the Claude team',
    stories: [
      {
        kicker: 'release · Oct 31',
        pill: { text: 'new today', tone: 'plain' },
        title: 'Claude Code v2.1.316: an ultrathink off-switch, and a deadline for Opus 4.8 fast mode',
        href: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.316',
        blurb:
          'Tagged at 01:01 UTC. New environment variables disable the `ultrathink` keyword and set subagent effort, and fast mode on Opus 4.8 is deprecated as of Oct 30 and removed Nov 30, with Opus 5.5 as the way out. The fix worth having on macOS and Linux: shell commands no longer linger when Claude Code exits by itself.',
        source: L('GitHub releases', 'https://github.com/anthropics/claude-code/releases/tag/v2.1.316'),
        date: 'Oct 31',
        breakdown: [
          'New: `CLAUDE_CODE_DISABLE_ULTRATHINK` turns the keyword off, `CLAUDE_CODE_SUBAGENT_EFFORT` sets the effort subagents run at when nothing else names one, and `CLAUDE_CODE_DISABLE_LOOPED_CROSS_CERT_DROP` keeps cross-certificates that certify each other in a loop, for private CAs that need them. In VS Code, `ultrathink` now runs its turn at `xhigh` effort and shows in a rainbow, as in the terminal.',
          'Deprecated: fast mode for Opus 4.8, as of Oct 30. It is removed Nov 30; after that, fast-mode requests on Opus 4.8 return an error and do not fall back to standard Opus 4.8. Migrate to Opus 5.5 to keep the speedup.',
          'Fixed: shell commands left running on macOS and Linux after Claude Code exits on its own; bash aliases with line breaks and functions whose names start with a dash being garbled; scripts stopping after the first command when `SHELLOPTS` is exported; `--restricted` sessions uploading files from outside the working directories when a Read allow rule covered them; requests hanging on cut-off compressed responses. Much of the rest concerns the Claude apps gateway for organisations, and Slack and cloud-session features.',
          'Do: update, and put the Opus 4.8 fast-mode migration on the calendar before Nov 30.',
        ],
      },
      {
        kicker: 'release · Oct 30',
        title: 'Claude Code v2.1.314 adds a switch to block writes outside your working directories',
        href: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.314',
        blurb:
          '`permissions.blockWritesOutsideWorkingDirectories` makes Write, Edit and NotebookEdit refuse paths outside the working directories in every permission mode, which is a cheap guardrail for an agent with your home directory in reach. Idle compaction reaches VS Code and Claude Desktop, and `claude -p` now exits 1 instead of 0 when startup fails.',
        source: L('GitHub releases', 'https://github.com/anthropics/claude-code/releases/tag/v2.1.314'),
        date: 'Oct 30',
        breakdown: [
          'Also new: idle compaction in VS Code and Claude Desktop’s Code tab, where a conversation of 200K+ tokens left idle is summarised and the summary is used on your next message if the prompt cache has expired. Gateway upstreams get an optional `groups` list and a `guardrail_trace` option.',
          'Fixed: `claude -p` exiting 0 with no output on a failed start; sandbox protections not applying to a worktree entered by `claude -p --resume` or `--continue`; hooks matching Bash not running on shell commands started by the Monitor tool (they can block or ask, but not approve or rewrite); a settings file excluded with `--setting-sources` still supplying some settings; `~/.claude/skills/.trash` and `~/.claude/plugins/.trash` growing without limit (now about 1024 entries each); a PreCompact hook with huge output breaking compaction (now cut at 10,000 characters).',
          'The release page truncates its notes at “Read more,” so this is the part shown on the listing, not the full changelog.',
        ],
      },
      {
        kicker: '@trq212 · Oct 24',
        title: 'Thariq has left Anthropic after more than a year on Claude Code',
        href: 'https://x.com/trq212/status/2113844051938054167',
        blurb:
          'He says he loved the work, believes in the mission and the “race to the top,” trusts the colleagues still at the wheel, and wants a break before something new. His follow list for Claude Code content: @addyosmani, @lydiahallie, @_catwu, @ClaudeDevs and @bcherny. This post is seven days old, the edge of the week window, and his newest.',
        source: L('x.com/trq212', 'https://x.com/trq212/status/2113844051938054167'),
        date: 'Oct 24',
        breakdown: [
          'The post, in his words: he’s left Anthropic “after more than a year of working on Claude Code and seeing it scale larger than I ever imagined,” loved working there and believes deeply in the mission, “and most of all, the idea of a race to the top.” His colleagues are “the most talented, thoughtful, competent, and earnest people I have ever met. I am glad they are at the wheel.”',
          'He thanks the community on X and says it’s time for “a bit of a break before diving into something new.” Nothing newer than this in his feed, whose older items are from 2025 and earlier. Why it matters to you: his feed was a regular source of Claude Code and Agent SDK tips; the accounts he names above are where he points readers instead.',
        ],
      },
    ],
    footnote: (
      <>
        <strong style={{ fontWeight: 600 }}>@bcherny:</strong> nothing in the last week. The newest item in his feed is from Nov 13, 2025. The New Stack says he posted about the Ultra cap change (
        <a className="lk" href="https://x.com/bcherny/status/2116222842413142111">that post</a>), but it wasn’t in the feed I received, so I can’t say what he wrote.{' '}
        <strong style={{ fontWeight: 600 }}>@ClaudeDevs:</strong> feed unavailable, HTTP 503 on two attempts.
      </>
    ),
  },

  /* ------------------------ 03 AI security ------------------------ */
  {
    id: 'ai-security',
    num: '03',
    title: 'AI Security',
    intro: 'Last 48 hours only, dated. The lead above counts toward this section.',
    stories: [
      {
        kicker: 'supply chain · self-hosted inference',
        pill: { text: 'still live', tone: 'urgent' },
        tone: 'urgent',
        title: 'A Hugging Face cryptomining campaign is back within days, and a fake Solana kit targets coding agents',
        href: 'https://www.bleepingcomputer.com/news/security/hugging-face-malware-campaign-returns-to-hijack-gpus-for-crypto-mining/',
        blurb: 'Two separate traps for people running models and agents, reported together.',
        parts: [
          {
            term: 'What happened',
            text:
              'Pluto Security found 31 malicious Hugging Face repos across seven accounts. The top one, `qwen2-tiny`, has no model in it and reached 28,412 downloads by Oct 28; its code installs a miner and sometimes a reverse shell. A second wave appeared within days of the first takedown. Separately, Air Security flagged a GitHub repo whose only install step is a PowerShell one-liner that installs the NetSupport RAT, aimed at AI coding agents.',
          },
          {
            term: 'Why it matters',
            text:
              'The models target GPU hosts running self-hosted inference servers such as Xinference and GPUStack, through `trust_remote_code`, which runs a model’s own Python the moment it loads. The flagship scanned clean while collecting those downloads. The fake kit ranks first when AI coding agents search for a Solana starter, and its payload shows a fake “try again in 72 hours” error.',
          },
          {
            term: 'The lesson',
            text:
              'Don’t enable `trust_remote_code` on a model you haven’t read. If you did, treat the machine as compromised, rotate reachable credentials, and know that killing the miner doesn’t remove the backdoors. Never let an agent paste a README’s install one-liner unreviewed. Hugging Face disabled the flagship, but a near-identical copy under another account was still live when BleepingComputer checked.',
          },
        ],
        source: L('BleepingComputer', 'https://www.bleepingcomputer.com/news/security/hugging-face-malware-campaign-returns-to-hijack-gpus-for-crypto-mining/'),
        date: 'Oct 29',
        breakdown: [
          'Pluto traced the campaign through a test account whose leftover backup files pointed to the operator’s main accounts. It reported the first wave to Hugging Face and China’s ModelScope, and both removed the accounts. Nineteen second-wave repositories were still live eight days after the report, and hours after Pluto reported them the operator published another model whose script can break out of a container and take over the server underneath.',
          'Hugging Face scans uploads with antivirus and partner tools from Protect AI and JFrog, which Pluto says look for known malware and unsafe formats rather than what a model’s Python does. JFrog reported the flagship payload was “not a machine-learning model.” The operator’s wallet had received roughly $5,000 in Pearl (PRL); while researchers watched, nine machines that looked like a shared research GPU cluster started mining at once and dropped off six minutes later. Pluto attributes it to a financially motivated, Chinese-speaking operator.',
          'The Solana repo, `SolanaUpdateTools/solana-starter-kit`, dates from November 2025 and has 286 stars; its README is the only file. The Windows-only command builds a URL from fragments, runs a script in memory and installs NetSupport Manager configured to call home. The payload URL returned 404 when Air checked, but the repository was still live.',
        ],
      },
      {
        kicker: 'secrets · AI services',
        title: '26,400 working keys found in public Gitee repos, 1,348 of them OpenAI’s',
        href: 'https://thehackernews.com/2026/10/26400-valid-cloud-and-ai-credentials.html',
        blurb: 'A researcher’s scan of 7.25 million repositories is a reminder that a leaked AI key keeps working until someone revokes it.',
        parts: [
          {
            term: 'What happened',
            text:
              'Ben Zimmermann scanned 7.25 million public Gitee repositories and found 26,400 credentials that still worked: 9,473 Alibaba Cloud AccessKey pairs, 3,805 YouTube keys, 3,170 DeepSeek, 1,489 Zhipu BigModel, 1,348 OpenAI, and one active org-admin credential for an unnamed enterprise AI platform.',
          },
          {
            term: 'Why it matters',
            text:
              'The scanners read full commit history, so keys deleted later were still found. OpenAI says a compromised key lets someone else burn your quota, with surprise charges and interrupted access. At publication he hadn’t confirmed any had been revoked.',
          },
          {
            term: 'The lesson',
            text:
              'Deleting a key or rewriting history doesn’t revoke it; revoke at the provider and set spend limits. One scanner is not enough: TruffleHog and Kingfisher each found about half the total and only 1,001 overlapped.',
          },
        ],
        source: L('The Hacker News', 'https://thehackernews.com/2026/10/26400-valid-cloud-and-ai-credentials.html'),
        date: 'Oct 29',
        credit: TLDR_SEC,
        breakdown: [
          'Zimmermann reported the results on Oct 28, working with MongoDB’s Kingfisher team, and sent vendors with the most exposed keys a list of their credentials; he did not contact the developers. The scan ran about a month but he gave no dates, so it’s unclear how long ago the keys were tested or whether anyone else used them. By commit date, 12,242 credentials came from 2025; some date to the late 2000s.',
          'Gitee’s rate was 3.64 working credentials per 1,000 repositories, above earlier scans of GitLab (3.11) and Bitbucket (2.39), though those used only TruffleHog and the figures aren’t directly comparable. Provider guidance in the article: rotate OpenAI keys from the API Keys page and set spend limits; for Google and YouTube keys, rotate, update apps, delete the old key and add API restrictions.',
        ],
      },
    ],
  },

  /* ----------------------- 04 Homelab & Ops ----------------------- */
  {
    id: 'homelab-ops',
    num: '04',
    title: 'Homelab & Ops',
    stories: [
      {
        kicker: 'kernel · check this weekend',
        pill: { text: 'no exploitation reported', tone: 'plain' },
        title: 'Linux kernel TCP flaw CVE-2026-98432: Anthropic’s model turned it into remote root',
        href: 'https://www.bleepingcomputer.com/news/security/critical-linux-kernel-flaw-allows-remote-root-attacks-on-mptcp-servers/',
        blurb:
          'A use-after-free in the kernel’s IPv4 TCP code, rated 9.8 by the Linux CNA but 5.9 by Red Hat, reaches back to kernel 4.4. Debian 12 and 13 have fixes; Ubuntu and RHEL are still pending. If you run Go 1.24 or later services on Linux, MPTCP listeners may be on without you knowing.',
        source: L('BleepingComputer', 'https://www.bleepingcomputer.com/news/security/critical-linux-kernel-flaw-allows-remote-root-attacks-on-mptcp-servers/'),
        date: 'Oct 30',
        credit: TLDR_SEC,
        breakdown: [
          'The bug is a race in how the kernel handles TCP connection requests: a retransmitted SYN processed on another CPU reads data that the finished handshake has already handed off, causing a use-after-free. Triggering it needs no authentication, but Red Hat calls the race complex and rates it a denial-of-service issue. Anthropic researchers showed more: an unreleased Claude model built an exploit that bypassed KASLR and ran commands as root on a server with a Multipath TCP listener, in about 53 minutes.',
          'Affected: kernels back to 4.4. Ubuntu 22.04, 24.04, 26.04 and 26.10 were still vulnerable on Oct 30 with fixes in progress; RHEL 8, 9 and 10 and Rocky 8 to 10 are affected (RHEL 7 is not). Debian is fixed in `6.1.190-1` (12) and `6.12.113-1` (13). Oracle Linux, Amazon Linux and SUSE have fixes for some kernels. macOS is unaffected.',
          'The Go detail matters for a homelab: since Go 1.24, MPTCP is enabled by default for Linux TCP listeners when the kernel supports it, so some Go-based services have MPTCP listeners their admins never turned on. Disabling MPTCP alone is not enough, since ordinary TCP can trigger the bug.',
          'Do: install your distro’s kernel update when it lands. Until then, restrict access to trusted networks or addresses; CIQ suggests temporarily dropping IPv4 TCP packets that carry IP options with nftables (its guidance has examples). No exploitation in the wild has been confirmed.',
        ],
      },
      {
        kicker: 'GitHub Actions · Oct 28',
        title: 'GitHub Agentic Workflows is generally available',
        href: 'https://github.blog/changelog/2026-10-28-github-agentic-workflows-generally-available',
        blurb:
          'You write automation in Markdown and it compiles to ordinary Actions YAML, so it reuses your runner groups and policies. GA adds self-hosted ARC runners with Docker-in-Docker, a model router and micro-VM isolation for agents. The default engine needs a Copilot licence; you can bring your own coding agent.',
        source: L('GitHub changelog', 'https://github.blog/changelog/2026-10-28-github-agentic-workflows-generally-available'),
        date: 'Oct 28',
        credit: TLDR_DEVOPS,
        breakdown: [
          'Workflows are written as natural-language Markdown files and compiled to standard Actions YAML, so they run on existing runner groups under existing policy constraints. They’re aimed at reasoning-based chores like issue triage and CI failure analysis, with Copilot or your own coding agent behind each workflow.',
          'Since the public preview: Actions Runner Controller and Docker-in-Docker support on self-hosted runners; `gh aw forecast` is out of experimental and includes threat-detection credits and monthly ranges for AI credit spend; a refreshed model inventory with per-workflow providers; a model router that optimises for task type and difficulty; and agents that can run in a Cloud Hypervisor or NVX micro-VM, with enclaves to stop data leaking across repositories.',
          'It’s generally available on github.com for Free, Team and Enterprise. Using the default GitHub Copilot CLI engine requires a Copilot licence. If you’re hardening Actions at the same time, see the Pwn Request item below.',
        ],
      },
      {
        kicker: 'Kubernetes · Oct 27',
        title: 'Kubernetes starts a working group to define what a well-behaved workload is',
        href: 'https://kubernetes.io/blog/2026/10/27/announcing-workload-conformance-wg/',
        blurb:
          'The Workload Conformance WG will write a spec and tests for how workloads behave at runtime: surviving a node drain, avoiding removed APIs, not asking for privileges they don’t need. It targets a stable first spec within two to three release cycles and wants input from people who run clusters.',
        source: L('Kubernetes blog', 'https://kubernetes.io/blog/2026/10/27/announcing-workload-conformance-wg/'),
        date: 'Oct 27',
        credit: TLDR_DEVOPS,
        breakdown: [
          'Certified Kubernetes tests the cluster and Kubernetes AI Conformance tests whether a cluster can run AI and ML workloads, but nothing tests the workloads themselves, so operators still check each application by hand before maintenance or an upgrade. The group’s charter promises a spec of workload behaviour per Kubernetes minor version, a way to test each requirement, and upstream tooling.',
          'Scope includes security, resilience during disruptions, resource use, networking, storage, API usage and observability, but specific requirements aren’t agreed. One rule is set: every requirement needs an objective test a binary can run. Application logic is out of scope, as are packaging formats and vendor tools. SIG Architecture will own the result, with SIG Apps bringing the application view.',
          'For a homelab cluster it is the checklist you currently run in your head. The group meets every other Wednesday at 15:00 UTC and is on Kubernetes Slack in `#wg-workload-conformance`; it is looking for real examples of what broke during upgrades.',
        ],
      },
      {
        kicker: 'WireGuard · HN 136 points',
        title: 'Firezone releases sanstun, a sans-IO WireGuard in Rust',
        href: 'https://www.firezone.dev/blog/introducing-sanstun',
        blurb:
          'After more than two years patching boringtun, Firezone built a userspace WireGuard that does no internal buffering and encodes protocol rules in its types. It lets you hand encryption work to other threads. A look under the hood of the layer VPN and mesh tools sit on.',
        source: L('Firezone blog', 'https://www.firezone.dev/blog/introducing-sanstun'),
        date: 'Oct 30',
        also: [L('Hacker News thread', 'https://news.ycombinator.com/item?id=50310398')],
        breakdown: [
          'Sans-IO means designing so that IO and side effects stay separate from state and logic, which makes components compose and test well. Firezone says it started on `boringtun`, but keeping API compatibility with upstream got harder as its product needs grew, and it kept feature-flagging internal buffering. The conclusion after two-plus years of patches: don’t buffer in the library at all.',
          'The API maps WireGuard’s protocol to types. One `Interface` is identified by a single key and holds many `Tunnel`s; constructors for messages such as `HandshakeInitiation` are crate-private, so you can’t build a broken one. For parallelism it splits bookkeeping from the actual crypto: `PendingEncapsulate` implements `Send` and can move to another thread.',
          'The code examples are in Rust, though the post says sans-IO isn’t Rust-specific. I only had part of the page, so check the benchmarks yourself before relying on any speedup figure.',
        ],
      },
      {
        kicker: 'GitHub Actions',
        title: 'The Pwn Request reckoning: what still works against GitHub Actions',
        href: 'https://www.wiz.io/blog/github-actions-security-pwn-request-reckoning?utm_source=tldrdevops',
        blurb:
          'GitHub’s coming 2026 changes make `pull_request_target` attacks harder, but gaps remain around old checkout versions, script injection and unprotected triggers like `issue_comment`. Pinning to a SHA older than the July 2026 backport bypasses the new protections. Worth an audit of your own workflows.',
        source: L('Wiz', 'https://www.wiz.io/blog/github-actions-security-pwn-request-reckoning?utm_source=tldrdevops'),
        date: 'Oct 30',
        credit: TLDR_DEVOPS,
        note: 'summary only',
      },
      {
        kicker: 'terminals · Bash',
        title: 'How researchers could have backdoored Bash through GNU Savannah',
        href: 'https://www.hacktron.ai/blog/hacking-gnu-savannah?utm_source=tldrinfosec',
        blurb:
          'An unescaped email address in a shell command gave any registered user code execution on Savannah’s backend, and Hacktron used it to impersonate the Bash maintainer and reach a page that would have allowed pushes to upstream Bash. The FSF has fixed all 26 reported flaws. The lesson is for anyone who runs a forge: pass arguments as arrays, never shell strings.',
        source: L('Hacktron', 'https://www.hacktron.ai/blog/hacking-gnu-savannah?utm_source=tldrinfosec'),
        date: 'Oct 30',
        credit: TLDR_SEC,
        note: 'summary only',
      },
      {
        kicker: 'agents · Kubernetes',
        title: 'The 5 essential layers of AI agent sandboxing on Kubernetes',
        href: 'https://thenewstack.io/ai-agent-sandboxing-kubernetes/',
        blurb: 'The New Stack’s layered take on isolating coding agents in a cluster. Relevant if you run agents next to things you care about, but I have the headline only.',
        source: L('The New Stack', 'https://thenewstack.io/ai-agent-sandboxing-kubernetes/'),
        date: 'Oct 29',
        note: 'headline only',
      },
      {
        kicker: 'MCP',
        title: 'Why MCP servers should tell agents what to do next',
        href: 'https://thenewstack.io/aws-mcp-agent-observability/',
        blurb: 'An argument for MCP servers that return guidance with their results, rather than leaving the agent to guess. The only part I have is the headline.',
        source: L('The New Stack', 'https://thenewstack.io/aws-mcp-agent-observability/'),
        date: 'Oct 29',
        note: 'headline only',
      },
    ],
  },

  /* ------------------------- 05 From Reddit ------------------------- */
  {
    id: 'reddit',
    num: '05',
    title: 'From Reddit',
    intro: 'The feeds carry no scores or comment counts, so picks are by substance, not volume.',
    groups: [
      {
        name: 'r/ClaudeAI',
        stories: [
          {
            kicker: 'unverified · Nov 3',
            title: 'Claude now watermarks everything it writes, and you can’t check your own text',
            href: 'https://www.reddit.com/r/ClaudeAI/comments/1xjqyv2/claude_now_watermarks_everything_it_writes_and/',
            blurb:
              'A poster says that from Nov 3 Anthropic’s invisible text watermark extends to Mythos 5, Opus 4.7, Opus 4.6 and Sonnet 4.6, worldwide and with no opt-out for paying users. If true, text you polish with Claude carries a mark only regulators and enterprises can read. I haven’t checked it against the help page the post cites.',
            source: L('r/ClaudeAI, u/Mainfurr', 'https://www.reddit.com/r/ClaudeAI/comments/1xjqyv2/claude_now_watermarks_everything_it_writes_and/'),
            date: 'Oct 30',
            also: [L('cited help page', 'https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content')],
            breakdown: [
              'The post says every model released since August already has the watermark, and the extension to the older models lands Nov 3. Detection is a private preview for regulators, media, researchers, educators and “enterprises with compliance obligations,” so the people being judged can’t test their own text.',
              'The poster’s arguments: proofreading or translating with Claude marks the text, and Anthropic’s own help page admits a detected mark doesn’t mean Claude wrote the content, only that it touched it; the mark lives in word choice, so rephrasing through another model removes it; and research on watermark stealing suggests the pattern can be learned. They expect third-party “AI detectors” to start using it.',
              'This is one user’s reading and I haven’t verified it. If it affects how you use Claude for writing, read the cited help page first.',
            ],
          },
          {
            kicker: 'router firmware',
            title: 'Close to cancelling Max over the safety classifier flagging OpenWRT work',
            href: 'https://www.reddit.com/r/ClaudeAI/comments/1xjmtad/im_close_to_cancelling_my_max_subscription_due_to/',
            blurb:
              'A reverse engineer says the cyber classifier keeps flagging and refusing a legitimate job, porting OpenWRT to a UniFi U6 Pro, and the usual prompt workarounds no longer help. Worth knowing if your homelab work sits near “security-adjacent.”',
            source: L('r/ClaudeAI', 'https://www.reddit.com/r/ClaudeAI/comments/1xjmtad/im_close_to_cancelling_my_max_subscription_due_to/'),
            date: 'Oct 30',
            breakdown: [
              'The poster does reverse engineering work and says Claude has been useful, and that they got used to the safety classifier misfiring on anything vaguely security-adjacent, usually fixable by changing the prompt. They say it has worsened steadily.',
              'Today they were trying to port OpenWRT to a Unifi U6 Pro, extending the life of equipment they own, a use they note right-to-repair law in the EU and EEA protects. Claude kept flagging the sessions as cyber and refusing, and none of the usual workarounds worked after hours of effort.',
              'It’s a single venting post and the feed shows no Anthropic response, but it describes the cyber classifier getting in the way of ordinary work on a device the poster owns.',
            ],
          },
          {
            kicker: 'terms · EU / EEA',
            title: 'EU users: Pro and Max terms say “Non-commercial use only,” and support can’t explain it',
            href: 'https://www.reddit.com/r/ClaudeAI/comments/1xjgb5p/eu_users_promax_terms_say_noncommercial_use_only/',
            blurb:
              'In the EEA and Switzerland the consumer terms for Free, Pro and Max exclude commercial use; the US terms don’t. A Claude Code user who wants to sell what they built got two support replies that confirmed nothing. Relevant if you ship side projects from a personal plan.',
            source: L('r/ClaudeAI', 'https://www.reddit.com/r/ClaudeAI/comments/1xjgb5p/eu_users_promax_terms_say_noncommercial_use_only/'),
            date: 'Oct 30',
            breakdown: [
              'The poster asked support whether selling a project built with Claude Code on Max is allowed, and whether switching to a commercial plan before selling would cover code written under Max. Reply one: Anthropic doesn’t claim ownership of outputs as long as you comply with the consumer terms, which contain the clause. Reply two: support can’t confirm either point and pointed back to the terms.',
              'Another EU user reportedly got a support reply saying upgrading before you start selling is likely enough. The poster says EU users they know ignore the clause, cancel, or move to Team, where no seat matches Max 20x’s usage. They ask anyone with a clear answer from Anthropic to share it.',
            ],
          },
          {
            kicker: 'harness engineering',
            title: 'How to build a harness that actually improves your agent, from 57 papers',
            href: 'https://www.reddit.com/r/ClaudeAI/comments/1xjcfjs/how_to_build_a_harness_that_actually_improves/',
            blurb:
              'The distilled advice: keep the instruction file short, use fewer sharper tools, enforce rules with scripts rather than prose, and prune what you can’t prove helps. If you maintain a `CLAUDE.md` or `AGENTS.md`, it’s a ready-made checklist.',
            source: L('r/ClaudeAI, u/Marmelab', 'https://www.reddit.com/r/ClaudeAI/comments/1xjcfjs/how_to_build_a_harness_that_actually_improves/'),
            date: 'Oct 30',
            breakdown: [
              'The poster surveyed 57 publications on harnesses for coding agents. Cited headline: the same model can differ up to 6x in performance depending on harness design. Practices: mine past sessions for patterns and turn corrections into rules; delete any rule you can’t show helps; keep the main instruction file to around 100 lines that act as a table of contents, which is where OpenAI landed after a giant file failed.',
              'On tools: Vercel is cited as removing 80% of its agent’s tools and going from 80% to 100% success, with token use down by more than half and latency from 724 to 141 seconds; Microsoft reportedly cut 100 tools to 5. On enforcement: one cited study found only 4 to 16 percent of written security rules had any effect, so back rules with git hooks, linters and scripts. These figures are the poster’s citations; I haven’t checked them.',
            ],
          },
        ],
      },
      {
        name: 'r/LocalLLaMA',
        stories: [
          {
            kicker: 'quant benchmark spat',
            title: 'Unsloth and ISTA trade blows over DeepSeek-V4.1-Flash GGUF accuracy',
            href: 'https://www.reddit.com/r/LocalLLaMA/comments/1xjfuqh/introducing_deepseekv41flash1017_dynamic_v31/',
            blurb:
              'Unsloth says it couldn’t reproduce ISTA’s claimed accuracy recovery, and that its Dynamic v3.1 quants beat ISTA’s on nearly every metric. ISTA replied that the gap is a benchmark setting: a 32K reasoning cap versus its 128K. Before you download a quant, check which budget the numbers used.',
            source: L('r/LocalLLaMA, Unsloth', 'https://www.reddit.com/r/LocalLLaMA/comments/1xjfuqh/introducing_deepseekv41flash1017_dynamic_v31/'),
            date: 'Oct 30',
            also: [L('ISTA’s reply', 'https://www.reddit.com/r/LocalLLaMA/comments/1xjkjla/ista_deepseekv41flash1017_gsqrco_quants_comparison/')],
            breakdown: [
              'Unsloth benchmarked ISTA’s GSQ-RCO GGUFs on seven benchmarks and says AIME25 recovery was about 91.88%, not the 100% ISTA reported. In its table the `UD-IQ1_M` quant (250.4 GB) averages 85.55 over six benchmarks, against 81.78 for `GSQ-RCO IQ1_M` (231.3 GB); the Q8 reference is 87.68 at 508.4 GB. It ran each benchmark at least three times, AIME25 sixteen.',
              'ISTA’s reply says its runs used a 128K output budget and reasoning effort 50 for a 763B-parameter, 1M-context model, while Unsloth capped reasoning at 32K tokens, and that this explains the variance. It invited anyone with the compute to reproduce with its settings and said it is running the comparisons itself.',
              'Unsloth’s post says the model runs on 128GB of RAM or unified memory, or 64GB with engram offloading, but the quants in its own table are 233 to 508 GB, so presumably that relies on offloading I didn’t see explained.',
            ],
          },
          {
            kicker: 'llama.cpp · Apple Silicon',
            title: 'DFlash2 drafting for Qwen3.8-Flash-Next beats MTP by 17% on average',
            href: 'https://www.reddit.com/r/LocalLLaMA/comments/1xjlgm4/psa_upgrade_flash_next_to_dflash2_if_you_havent/',
            blurb:
              'With llama.cpp v0.8.0 supporting DFlash2, one user measured a 17% geometric-mean speedup over MTP on an M5 Max, with a regression only on prose. If you run local models for coding or lists, it’s a free upgrade to test.',
            source: L('r/LocalLLaMA, u/returnity', 'https://www.reddit.com/r/LocalLLaMA/comments/1xjlgm4/psa_upgrade_flash_next_to_dflash2_if_you_havent/'),
            date: 'Oct 30',
            breakdown: [
              'The poster quantised the drafter themselves and ran it in llama.cpp v0.8.0, the first release supporting DFlash2 for Flash Next. Results on Q4_K_XL: code 80.5 to 95.1 tokens per second (+18%), lists 91.4 to 127 (+39%), prose 53.8 to 51.9 (−3%), 6k context +19%; geometric mean 75.1 to 87.9 (+17%).',
              'Settings used: `n-max = 3, p-min = 0.75` for MTP and `n-max = 5, p-min = 0.75` for DFlash2, after a parameter sweep. At 25K context DFlash2 roughly equals MTP while MTP stays flat. The Q4_0 draft head is about 350MB against 2.2GB for the MTP head, but the compute buffer cancels out the VRAM saving. Unlike the 3.8 27B version, images work. Your settings will differ.',
            ],
          },
        ],
      },
      {
        name: 'r/selfhosted',
        stories: [
          {
            kicker: 'discussion',
            title: 'What happens to your self-hosted data when you’re gone?',
            href: 'https://www.reddit.com/r/selfhosted/comments/1xjcv7t/what_happens_to_your_selfhosted_data_when_youre/',
            blurb:
              'A de-Googled self-hoster with ten-plus years of family photos in Immich asks what plan others have if they’re hit by a bus. A homelab is a bus-factor problem, and this thread is where people compare answers.',
            source: L('r/selfhosted, u/Freika', 'https://www.reddit.com/r/selfhosted/comments/1xjcv7t/what_happens_to_your_selfhosted_data_when_youre/'),
            date: 'Oct 30',
            breakdown: [
              'The server holds 10+ years of Immich photos, location history, trips and scanned documents. If the poster died, family would inherit “a box humming in the corner,” with no idea how to log in, what’s on it or when the domain expires. Google and iCloud at least offer legacy-contact processes; the poster has largely de-Googled and has no plan B.',
              'Questions: do you have a printed “if I’m gone” document, shared credentials, Vaultwarden emergency access or something else; could your family actually get the photos out without a nerd friend; and if you’ve decided not to bother, why. I can’t tell how the thread answered, as the feed has no comment counts or replies.',
            ],
          },
        ],
      },
      {
        name: 'r/homelab',
        stories: [
          {
            kicker: 'build · k8s + Ceph',
            title: 'A 10-inch rack built to test an open-source VMware and Proxmox replacement',
            href: 'https://www.reddit.com/r/homelab/comments/1xjn8tu/10_inch_homelab_ignore_gnocchi/',
            blurb:
              'Four ThinkCentres run Superphenix, a hyperconverged stack with Kubernetes, VMs, Ceph and Kube-OVN, controlled from a UI, with a Debian NAS on a JBOD. The author has worked on the project for two and a half years and wants people to install it and give feedback.',
            source: L('r/homelab, u/SkalaSystems', 'https://www.reddit.com/r/homelab/comments/1xjn8tu/10_inch_homelab_ignore_gnocchi/'),
            date: 'Oct 30',
            breakdown: [
              'The rack holds four ThinkCentres (32GB RAM, 4 cores, 256GB NVMe each) on a dumb switch, plus a mini-ITX NAS on standard Debian connected to a JBOD, linked to the switch with LACP. A USB camera runs Frigate with 12 hours of retention and no AI detection. Cable management cost about $30; the ThinkCentres sit in 3D-printed holders.',
              'Superphenix, on the four nodes, aims to replace stacks like VMware or Proxmox and handles Kubernetes, VMs, Ceph storage and OVS/OVN networking with Kube-OVN as the CNI. Install docs are linked from the post if you want to try it on spare hardware.',
            ],
          },
          {
            kicker: 'build · Proxmox + OPNsense + Unraid',
            title: 'A job-gap homelab: OPNsense router, Proxmox compute and an Unraid NAS',
            href: 'https://www.reddit.com/r/homelab/comments/1xjko67/homelab_to_help_with_funemployment_boredom/',
            blurb:
              'A product designer between jobs built a Minisforum OPNsense and Proxmox box, an M720q compute node, a Dell Wyse running EspoCRM for a house-call tech side business, and an Unraid NAS. The reasoning for Unraid over TrueNAS is the useful part: cheap, unpaired expansion.',
            source: L('r/homelab, u/ponchofreedo', 'https://www.reddit.com/r/homelab/comments/1xjko67/homelab_to_help_with_funemployment_boredom/'),
            date: 'Oct 30',
            breakdown: [
              'The Minisforum UN100D runs Proxmox with OPNsense as the router, isolating the office from the home network; a Lenovo M720q (32GB RAM, 1TB SSD) runs most services except Jellyfin, Immich and the arr stack; the Dell Wyse 5070 on Debian runs EspoCRM, kept apart from personal data; a D-Link managed switch handles the VLANs.',
              'The NAS is a spare-parts Ryzen 5 3600 build on Unraid with an LSI 9207-8i HBA, two WD Red Plus 8TB drives plus a shucked Barracuda, mirrored NVMe for appdata and an Optane for the Docker image store. The author picked Unraid over TrueNAS or HexOS because paired-drive expansion is too expensive, and plans k3s later.',
            ],
          },
        ],
      },
      {
        name: 'r/devops',
        stories: [
          {
            kicker: 'discussion',
            title: 'Which is more used in industry: Argo CD or Flux?',
            href: 'https://www.reddit.com/r/devops/comments/1xjx85h/which_is_more_used_in_industry_argocd_or_flux/',
            blurb:
              'A poster three-quarters through migrating from Argo CD to Flux wants to know which to invest in. Handy if you’re choosing a GitOps controller for a homelab cluster; the answers are in the thread, not the feed.',
            source: L('r/devops, u/ferriematthew', 'https://www.reddit.com/r/devops/comments/1xjx85h/which_is_more_used_in_industry_argocd_or_flux/'),
            date: 'Oct 31',
            breakdown: [
              'The migration has been hard: they used Claude and ChatGPT to parse “an absolute mountain of error logs” and fix bugs introduced the first time round. They’re too far in to back out, but want to know which platform is more common so they spend learning time on the right one.',
              'They stress the AI use was for log parsing and deciding what to do; all the code is handwritten. The feed carries only the question, so I can’t summarise any answers.',
            ],
          },
        ],
      },
      {
        name: 'r/sysadmin',
        stories: [
          {
            kicker: 'agents · access',
            title: 'The C-suite wants to give Grok access to everything. Would you?',
            href: 'https://www.reddit.com/r/sysadmin/comments/1xjcst2/csuite_staff_want_me_to_give_grok_access_to/',
            blurb:
              'A one-person IT shop at a ~300-person regulated company describes executives uploading HR data to Grok and asking for full M365 cloud-app access. An operations director reports Grok took over her computer and downloaded Linux. A preview of the agent-permissions arguments coming for everyone.',
            source: L('r/sysadmin, u/Far-Turnover-2356', 'https://www.reddit.com/r/sysadmin/comments/1xjcst2/csuite_staff_want_me_to_give_grok_access_to/'),
            date: 'Oct 30',
            breakdown: [
              'The poster says leadership has discovered AI agents and ignores advice on risk: the CEO wants to upload the entire HR database to Grok for a dashboard, an operations director reports Grok took over her computer and downloaded Linux, and another director wants Grok to have full cloud-app access to the M365 tenant.',
              'In edits they say they manage all IT alone for about 300 employees, report to the director of an unrelated department, and that the head of HR is the data protection officer and “clueless.” They’re in a heavily regulated industry and keeping evidence of their warnings. The feed shows no replies.',
            ],
          },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Rail data                                                           */
/* ------------------------------------------------------------------ */

const patchQueue: { name: string; version: string; note: string; pill?: { text: string; tone: Tone } }[] = [
  {
    name: 'Claude Code (CLI)',
    version: 'v2.1.316',
    note: 'Out 01:01 UTC today. Ultrathink off-switch; Opus 4.8 fast mode ends Nov 30.',
    pill: { text: 'new', tone: 'plain' },
  },
  {
    name: 'Claude Code for VS Code, via Cursor',
    version: '2.1.313',
    note: 'Backdoored build. 2.1.314 is clean. Look for an svc-telemetry SSH key.',
    pill: { text: 'urgent', tone: 'urgent' },
  },
  {
    name: 'Linux kernel',
    version: 'CVE-2026-98432',
    note: 'Debian 12: 6.1.190-1, Debian 13: 6.12.113-1. Ubuntu and RHEL pending.',
    pill: { text: 'patch pending', tone: 'plain' },
  },
  {
    name: 'Go',
    version: '1.24+',
    note: 'MPTCP on by default for Linux listeners; relevant to the kernel bug.',
  },
  {
    name: 'Opus 4.8 fast mode',
    version: 'Opus 4.8',
    note: 'Deprecated Oct 30. Move to Opus 5.5 before it errors out.',
    pill: { text: 'deprecated', tone: 'plain' },
  },
];

const dates: { when: string; what: string }[] = [
  { when: 'Nov 3', what: 'Reported, not verified: Anthropic’s text watermark extends to Mythos 5, Opus 4.7, Opus 4.6 and Sonnet 4.6.' },
  { when: 'Early Nov', what: 'Kimi K3.1 Pro weights planned, per Epoch AI.' },
  { when: 'Nov 30', what: 'Opus 4.8 fast mode removed; requests will error, not fall back.' },
  { when: 'Every other Wed, 15:00 UTC', what: 'Kubernetes Workload Conformance WG meets.' },
];

const opsWire: { when: string; text: string; href: string }[] = [
  {
    when: 'Oct 31 · 01:01 UTC',
    text: 'Claude Code v2.1.316 tagged on GitHub',
    href: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.316',
  },
  {
    when: 'Oct 30 · 17:34 UTC',
    text: 'r/ClaudeAI: five-hour limits removed for Max 20x',
    href: 'https://www.reddit.com/r/ClaudeAI/comments/1xjlvlc/anthropic_renames_max5_and_max20_and_removes_5h/',
  },
  {
    when: 'Oct 30 · 17:09 EDT',
    text: 'Ars Technica: Anthropic VS Code extension on Cursor backdoored',
    href: 'https://arstechnica.com/security/2026/10/anthropic-vs-code-extension-on-cursor-backdoored-for-nearly-12-hours/',
  },
];

const coverage: React.ReactNode[] = [
  <>
    <a className="lk" href="https://x.com/ClaudeDevs">x.com/ClaudeDevs</a>: failed, HTTP 503, on two attempts.
  </>,
  <>
    <a className="lk" href="https://x.com/bcherny">x.com/bcherny</a>: nothing new; newest post in the feed is from Nov 13, 2025.
  </>,
  <>
    <a className="lk" href="https://x.com/trq212">x.com/trq212</a>: one post in about a week (Oct 24), shown above; nothing since.
  </>,
  <>
    <a className="lk" href="https://old.reddit.com/r/netsec+cybersecurity+blueteamsec/top/?t=day">r/netsec, r/cybersecurity, r/blueteamsec</a>: failed, HTTP 429, on two attempts. Not covered.
  </>,
  <>
    <a className="lk" href="https://old.reddit.com/r/ClaudeAI+LocalLLaMA+MachineLearning/top/?t=day">r/MachineLearning</a>: nothing in the day’s top posts; the other two subs came through on the second try.
  </>,
  <>
    <a className="lk" href="https://embracethered.com/blog/">Embrace The Red</a>: nothing new; latest post is Oct 13.
  </>,
  <>
    <a className="lk" href="https://www.theverge.com/ai-artificial-intelligence">The Verge AI</a>: loaded, but arrived as two unbroken lines I couldn’t parse. Nothing used.
  </>,
  <>
    The three TLDR issues are yesterday’s (Oct 30); today’s aren’t out yet. Doublepulsar returned 403, Dark Reading wouldn’t parse, and Wiz arrived unreadable, so those items rest on the sources that did load or on TLDR’s summary.
  </>,
];

/* ------------------------------------------------------------------ */
/* Views                                                               */
/* ------------------------------------------------------------------ */

const sectionCount = (s: Section): number => {
  const n = s.stories ? s.stories.length : (s.groups || []).reduce((a, g) => a + g.stories.length, 0);
  return s.id === 'ai-security' ? n + 1 : n; // the lead lives in this section
};

const metaStyle: React.CSSProperties = mono('0.74rem', 'var(--steel)', { margin: '10px 0 0', letterSpacing: '0.01em' });

const MetaLine: React.FC<{ s: Story }> = ({ s }) => {
  const bits: React.ReactNode[] = [
    <a key="src" className="lk" href={s.source.href}>{s.source.label}</a>,
    <span key="date">{s.date}</span>,
  ];
  if (s.credit) {
    bits.push(
      <span key="credit">
        via <a className="lk" href={s.credit.href}>{s.credit.label}</a>
      </span>,
    );
  }
  (s.also || []).forEach((a, i) =>
    bits.push(
      <span key={'also' + i}>
        also <a className="lk" href={a.href}>{a.label}</a>
      </span>,
    ),
  );
  if (s.note) bits.push(<span key="note">{s.note}</span>);
  return (
    <p style={metaStyle}>
      {bits.map((b, i) => (
        <React.Fragment key={i}>
          {i > 0 ? ' · ' : ''}
          {b}
        </React.Fragment>
      ))}
    </p>
  );
};

const Breakdown: React.FC<{ s: Story }> = ({ s }) => {
  if (!s.breakdown || s.breakdown.length === 0) return null;
  const sources: Link[] = s.also || [];
  return (
    <details className="ctx-details" style={{ marginTop: 12 }}>
      <summary style={mono('0.72rem', 'var(--accent)', { textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600 })}>
        Full breakdown
      </summary>
      <div style={{ marginTop: 10, borderLeft: '1px solid var(--border)', paddingLeft: 14 }}>
        {s.breakdown.map((p, i) => (
          <p key={i} style={{ margin: '0 0 0.8em', color: 'var(--fg2)', fontSize: '1rem' }}>
            {rich(p)}
          </p>
        ))}
        <p style={mono('0.74rem', 'var(--steel)', { margin: '0.4em 0 0' })}>
          Source: <a className="lk" href={s.source.href}>{s.source.label}</a>, {s.date}
          {s.credit ? (
            <>
              {' '}· via <a className="lk" href={s.credit.href}>{s.credit.label}</a>
            </>
          ) : null}
          {sources.map((a, i) => (
            <React.Fragment key={i}>
              {' '}· <a className="lk" href={a.href}>{a.label}</a>
            </React.Fragment>
          ))}
        </p>
      </div>
    </details>
  );
};

const Parts: React.FC<{ parts: { term: string; text: string }[] }> = ({ parts }) => (
  <dl className="ctx-dl" style={{ margin: '12px 0 0' }}>
    {parts.map((p, i) => (
      <React.Fragment key={i}>
        <dt style={label}>{p.term}</dt>
        <dd style={{ margin: 0, color: 'var(--fg2)', fontSize: '1rem' }}>{rich(p.text)}</dd>
      </React.Fragment>
    ))}
  </dl>
);

const StoryView: React.FC<{ s: Story }> = ({ s }) => (
  <article style={{ padding: '22px 0 24px', borderBottom: '1px solid var(--border)', minWidth: 0 }}>
    {(s.kicker || s.pill) && (
      <div style={mono('0.72rem', toneColor(s.tone), { textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'flex', flexWrap: 'wrap', gap: '4px 10px', alignItems: 'center' })}>
        {s.kicker && <span>{s.kicker}</span>}
        {s.pill && <span style={pillStyle(s.pill.tone)}>{s.pill.text}</span>}
      </div>
    )}
    <h3 style={{ fontFamily: SERIF, fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.2, margin: '0 0 8px', color: 'var(--fg)', letterSpacing: '-0.01em' }}>
      <a className="hl" href={s.href}>{s.title}</a>
    </h3>
    {s.blurb && <p style={{ margin: 0, color: 'var(--fg2)' }}>{rich(s.blurb)}</p>}
    {s.parts && <Parts parts={s.parts} />}
    <MetaLine s={s} />
    <Breakdown s={s} />
  </article>
);

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
  gap: '0 36px',
};

const SectionView: React.FC<{ s: Section }> = ({ s }) => (
  <section id={s.id} style={{ marginTop: 48, scrollMarginTop: 16 }}>
    <header style={{ display: 'flex', alignItems: 'baseline', gap: 14, borderBottom: '1px solid var(--fg)', paddingBottom: 6 }}>
      <span style={mono('0.9rem', 'var(--accent)', { fontWeight: 600, letterSpacing: '0.06em' })}>{s.num}</span>
      <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(1.6rem, 3vw, 2.1rem)', lineHeight: 1.1, margin: 0, color: 'var(--fg)', letterSpacing: '-0.01em' }}>
        {s.title}
      </h2>
    </header>
    {s.intro && <p style={mono('0.74rem', 'var(--steel)', { margin: '10px 0 0' })}>{s.intro}</p>}
    {s.stories && (
      <div style={gridStyle}>
        {s.stories.map((st, i) => (
          <StoryView key={i} s={st} />
        ))}
      </div>
    )}
    {s.groups &&
      s.groups.map((g) => (
        <div key={g.name} style={{ marginTop: 22 }}>
          <h3 style={{ ...label, borderBottom: '1px solid var(--border)', paddingBottom: 4, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span>{g.name}</span>
            <span style={{ color: 'var(--steel)' }}>{g.stories.length}</span>
          </h3>
          <div style={gridStyle}>
            {g.stories.map((st, i) => (
              <StoryView key={i} s={st} />
            ))}
          </div>
        </div>
      ))}
    {s.footnote && <p style={mono('0.76rem', 'var(--steel)', { margin: '16px 0 0', paddingTop: 12, borderTop: '1px solid var(--border)' })}>{s.footnote}</p>}
  </section>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const CSS = `
.ctx a { transition: color .15s ease, text-decoration-color .15s ease, border-color .15s ease; }
.ctx a.hl { color: var(--fg); text-decoration: none; }
.ctx a.hl:hover, .ctx a.hl:focus-visible { color: var(--accent); text-decoration: underline; text-decoration-color: var(--accent); text-underline-offset: 4px; }
.ctx a.lk { color: var(--accent); text-decoration: underline; text-decoration-color: var(--border); text-underline-offset: 3px; }
.ctx a.lk:hover, .ctx a.lk:focus-visible { text-decoration-color: var(--accent); }
.ctx a.navrow { display: flex; align-items: baseline; gap: 10px; padding: 7px 0; border-bottom: 1px solid var(--border); color: var(--fg); text-decoration: none; }
.ctx a.navrow:hover .navname, .ctx a.navrow:focus-visible .navname { color: var(--accent); }
.ctx summary { cursor: pointer; list-style: none; display: inline-block; transition: color .15s ease; }
.ctx summary::-webkit-details-marker { display: none; }
.ctx summary::before { content: '+ '; }
.ctx details[open] > summary::before { content: '\\2212  '; }
.ctx summary:hover, .ctx summary:focus-visible { color: var(--fg); }
.ctx .ctx-dl { display: grid; grid-template-columns: minmax(0, 9.5rem) minmax(0, 1fr); gap: 12px 22px; }
.ctx .ctx-dl dt { padding-top: 0.25rem; }
.ctx button[data-theme-toggle] { transition: color .15s ease, border-color .15s ease; }
.ctx button[data-theme-toggle]:hover { color: var(--accent); border-color: var(--accent); }
@media (max-width: 560px) {
  .ctx .ctx-dl { grid-template-columns: minmax(0, 1fr); gap: 0; }
  .ctx .ctx-dl dd { margin-bottom: 12px !important; }
}
@media (prefers-reduced-motion: reduce) {
  .ctx a, .ctx summary, .ctx button { transition: none !important; }
}
`;

export default function PersonalizedHomepage() {
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
        overflowWrap: 'anywhere',
      }}
    >
      <style>{CSS}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(16px, 3vw, 36px) clamp(16px, 4vw, 44px) 64px' }}>
        {/* ------------------------- Masthead ------------------------- */}
        <header style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 12px' }}>
            <span style={{ flex: '1 1 0', minWidth: 0 }} aria-hidden="true" />
            <span
              style={mono('0.72rem', 'var(--steel)', {
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                flex: '0 1 auto',
                textAlign: 'center',
              })}
            >
              Saturday · October 31, 2026 · built 11:00 UTC
            </span>
            <span style={{ flex: '1 1 0', minWidth: '4.2rem', textAlign: 'right' }}>
              <button
                type="button"
                data-theme-toggle
                style={mono('0.68rem', 'var(--fg2)', {
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 3,
                  padding: '2px 9px',
                  cursor: 'pointer',
                  letterSpacing: '0.08em',
                })}
              >
                Night
              </button>
            </span>
          </div>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontStyle: 'italic',
              fontSize: 'clamp(3.75rem, 12vw, 7.5rem)',
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              color: 'var(--fg)',
              margin: '14px 0 14px',
            }}
          >
            The Context
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ flex: 1, height: 1, background: 'var(--accent)' }} />
            <span style={mono('0.72rem', 'var(--accent)', { letterSpacing: '0.12em', whiteSpace: 'nowrap' })}>the gazette of one reader</span>
            <span style={{ flex: 1, height: 1, background: 'var(--accent)' }} />
          </div>
        </header>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '36px 48px', marginTop: 32 }}>
          {/* --------------------------- Rail --------------------------- */}
          <aside style={{ flex: '1 1 240px', minWidth: 0 }}>
            <nav aria-label="In this edition">
              <h2 style={{ ...label, borderBottom: '1px solid var(--fg)', paddingBottom: 6 }}>In this edition</h2>
              {sections.map((s) => (
                <a key={s.id} className="navrow" href={'#' + s.id}>
                  <span style={mono('0.74rem', 'var(--steel)', { minWidth: '1.6rem' })}>{s.num}</span>
                  <span className="navname" style={{ fontFamily: SERIF, fontSize: '1.05rem', flex: 1, transition: 'color .15s ease' }}>{s.title}</span>
                  <span style={mono('0.74rem', 'var(--steel)')}>{sectionCount(s)}</span>
                </a>
              ))}
            </nav>

            <div style={{ marginTop: 32 }}>
              <h2 style={{ ...label, borderBottom: '1px solid var(--fg)', paddingBottom: 6 }}>Patch queue</h2>
              {patchQueue.map((p, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '2px 10px' }}>
                    <span style={{ fontFamily: SERIF, fontWeight: 600, color: 'var(--fg)', fontSize: '1.02rem' }}>{p.name}</span>
                    <span style={mono('0.74rem', 'var(--purple)')}>{p.version}</span>
                    {p.pill && <span style={pillStyle(p.pill.tone)}>{p.pill.text}</span>}
                  </div>
                  <div style={{ fontSize: '0.92rem', lineHeight: 1.45, color: 'var(--fg2)', marginTop: 2 }}>{p.note}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 32 }}>
              <h2 style={{ ...label, borderBottom: '1px solid var(--fg)', paddingBottom: 6 }}>Dates</h2>
              {dates.map((d, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={mono('0.74rem', 'var(--steel)', { textTransform: 'uppercase', letterSpacing: '0.08em' })}>{d.when}</div>
                  <div style={{ fontSize: '0.95rem', lineHeight: 1.45, color: 'var(--fg2)' }}>{d.what}</div>
                </div>
              ))}
            </div>
          </aside>

          {/* --------------------------- Main --------------------------- */}
          <main style={{ flex: '999 1 600px', minWidth: 0 }}>
            <article style={{ paddingBottom: 28, borderBottom: '3px double var(--fg)' }}>
              <div style={mono('0.78rem', 'var(--urgent)', { textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', flexWrap: 'wrap', gap: '4px 12px', alignItems: 'center' })}>
                <span>{lead.kicker}</span>
                <span style={pillStyle('urgent')}>urgent</span>
              </div>
              <h2
                style={{
                  fontFamily: SERIF,
                  fontWeight: 700,
                  fontSize: 'clamp(2rem, 4.4vw, 3.1rem)',
                  lineHeight: 1.08,
                  letterSpacing: '-0.02em',
                  color: 'var(--fg)',
                  margin: '10px 0 12px',
                }}
              >
                <a className="hl" href={lead.href}>{lead.title}</a>
              </h2>
              <p style={{ ...metaStyle, margin: '0 0 16px' }}>
                <a className="lk" href={lead.source.href}>{lead.source.label}</a> · {lead.date}
                {lead.also.map((a, i) => (
                  <React.Fragment key={i}>
                    {' '}· also <a className="lk" href={a.href}>{a.label}</a>
                  </React.Fragment>
                ))}
              </p>
              <Parts parts={lead.parts} />
              <details className="ctx-details" style={{ marginTop: 16 }}>
                <summary style={mono('0.72rem', 'var(--accent)', { textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600 })}>
                  Full breakdown
                </summary>
                <div style={{ marginTop: 10, borderLeft: '1px solid var(--border)', paddingLeft: 14 }}>
                  {lead.breakdown.map((p, i) => (
                    <p key={i} style={{ margin: '0 0 0.8em', color: 'var(--fg2)', fontSize: '1rem' }}>{rich(p)}</p>
                  ))}
                  <p style={mono('0.74rem', 'var(--steel)', { margin: '0.4em 0 0' })}>
                    Source: <a className="lk" href={lead.source.href}>{lead.source.label}</a>, {lead.date}
                    {lead.also.map((a, i) => (
                      <React.Fragment key={i}>
                        {' '}· <a className="lk" href={a.href}>{a.label}</a>
                      </React.Fragment>
                    ))}
                    {lead.links.map((a, i) => (
                      <React.Fragment key={'l' + i}>
                        {' '}· <a className="lk" href={a.href}>{a.label}</a>
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              </details>
            </article>

            {sections.map((s) => (
              <SectionView key={s.id} s={s} />
            ))}
          </main>
        </div>

        {/* -------------------------- Footer -------------------------- */}
        <footer style={{ marginTop: 64, borderTop: '3px double var(--fg)', paddingTop: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px 48px' }}>
            <div style={{ flex: '1 1 280px', minWidth: 0 }}>
              <h2 style={{ ...label, borderBottom: '1px solid var(--fg)', paddingBottom: 6 }}>Ops wire</h2>
              {opsWire.map((o, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={mono('0.72rem', 'var(--steel)', { letterSpacing: '0.04em' })}>{o.when}</div>
                  <a className="hl" href={o.href} style={{ fontSize: '1rem' }}>{o.text}</a>
                </div>
              ))}
            </div>
            <div style={{ flex: '1 1 340px', minWidth: 0 }}>
              <h2 style={{ ...label, borderBottom: '1px solid var(--fg)', paddingBottom: 6 }}>Coverage notes</h2>
              {coverage.map((c, i) => (
                <p key={i} style={{ margin: 0, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.92rem', lineHeight: 1.5, color: 'var(--fg2)' }}>
                  {c}
                </p>
              ))}
            </div>
          </div>
          <p style={mono('0.74rem', 'var(--steel)', { margin: '28px 0 0', textAlign: 'center', letterSpacing: '0.04em' })}>
            next edition 06:00 · built on the nas · <a className="lk" href="archive/">archive</a>
          </p>
        </footer>
      </div>
    </div>
  );
}