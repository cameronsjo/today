import React from 'react';

/* The Context — the gazette of one reader.
   Tuesday 10 November 2026, morning edition.
   Colours come only from the shell's CSS variables; the two status pills are the single fixed-colour exception. */

const SERIF = "'Newsreader', 'Iowan Old Style', Georgia, serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

type Tone = 'urgent' | 'good' | 'plain';

type Breakdown = { paras: React.ReactNode[]; source: string; href: string; date: string };

type Story = {
  kicker?: string;
  tone?: 'urgent' | 'good';
  pill?: { text: string; tone: Tone };
  title: React.ReactNode;
  href: string;
  blurb?: React.ReactNode;
  parts?: [string, React.ReactNode][];
  meta: React.ReactNode;
  tail?: 'headline only' | 'summary only';
  breakdown?: Breakdown;
};

/* ---------- small pieces ---------- */

function A(props: {
  href: string;
  children: React.ReactNode;
  headline?: boolean;
  style?: React.CSSProperties;
}) {
  const [hover, setHover] = React.useState(false);
  const base = props.headline ? 'var(--fg)' : 'var(--accent)';
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        color: props.headline && hover ? 'var(--accent)' : base,
        textDecoration: hover ? 'underline' : 'none',
        textDecorationThickness: '1px',
        textUnderlineOffset: '3px',
        transition: 'color 0.15s ease',
        ...props.style,
      }}
    >
      {props.children}
    </a>
  );
}

function Code(props: { children: React.ReactNode }) {
  return (
    <code style={{ fontFamily: MONO, fontSize: '0.86em', color: 'var(--purple)', overflowWrap: 'anywhere' }}>
      {props.children}
    </code>
  );
}

function Ver(props: { children: React.ReactNode }) {
  return <span style={{ fontFamily: MONO, fontSize: '0.88em', color: 'var(--purple)' }}>{props.children}</span>;
}

function Pill(props: { text: string; tone: Tone }) {
  const fixed: React.CSSProperties =
    props.tone === 'urgent'
      ? { background: '#a04540', color: '#f5ead0', border: '1px solid #a04540' }
      : props.tone === 'good'
      ? { background: '#2d6644', color: '#f5ead0', border: '1px solid #2d6644' }
      : { background: 'transparent', color: 'var(--fg2)', border: '1px solid var(--border)' };
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: MONO,
        fontSize: '0.64rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '2px 9px',
        borderRadius: 999,
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
        ...fixed,
      }}
    >
      {props.text}
    </span>
  );
}

function Label(props: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: '0.72rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--accent)',
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
}

function Kicker(props: { text: string; tone?: 'urgent' | 'good'; pill?: { text: string; tone: Tone } }) {
  const color = props.tone === 'urgent' ? 'var(--urgent)' : props.tone === 'good' ? 'var(--good)' : 'var(--accent)';
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 10px', marginBottom: 8 }}>
      <span
        style={{
          fontFamily: MONO,
          fontSize: '0.72rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color,
        }}
      >
        {props.text}
      </span>
      {props.pill ? <Pill text={props.pill.text} tone={props.pill.tone} /> : null}
    </div>
  );
}

function Meta(props: { children: React.ReactNode; tail?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: '0.72rem',
        lineHeight: 1.6,
        letterSpacing: '0.02em',
        color: 'var(--steel)',
        marginTop: 10,
        overflowWrap: 'anywhere',
        ...props.style,
      }}
    >
      {props.children}
      {props.tail ? <> · {props.tail}</> : null}
    </div>
  );
}

function Parts(props: { parts: [string, React.ReactNode][]; large?: boolean }) {
  return (
    <dl
      style={{
        display: 'grid',
        gridTemplateColumns: 'max-content minmax(0, 1fr)',
        columnGap: 20,
        rowGap: props.large ? 16 : 10,
        margin: props.large ? '22px 0 0' : '4px 0 0',
      }}
    >
      {props.parts.map(([term, def]) => (
        <React.Fragment key={term}>
          <dt
            style={{
              fontFamily: MONO,
              fontSize: '0.72rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              paddingTop: props.large ? 5 : 4,
            }}
          >
            {term}
          </dt>
          <dd
            style={{
              margin: 0,
              color: 'var(--fg2)',
              fontSize: props.large ? '1.0625rem' : '1rem',
              lineHeight: 1.6,
              overflowWrap: 'anywhere',
            }}
          >
            {def}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

function FullBreakdown(props: { b: Breakdown }) {
  const [hover, setHover] = React.useState(false);
  return (
    <details style={{ marginTop: 14 }}>
      <summary
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          cursor: 'pointer',
          fontFamily: MONO,
          fontSize: '0.72rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          opacity: hover ? 0.7 : 1,
          transition: 'opacity 0.15s ease',
        }}
      >
        Full breakdown
      </summary>
      <div style={{ marginTop: 10 }}>
        {props.b.paras.map((p, i) => (
          <p
            key={i}
            style={{
              margin: '0 0 0.8em',
              color: 'var(--fg2)',
              fontSize: '1.0625rem',
              lineHeight: 1.6,
              overflowWrap: 'anywhere',
            }}
          >
            {p}
          </p>
        ))}
        <div style={{ fontFamily: MONO, fontSize: '0.72rem', color: 'var(--steel)', lineHeight: 1.6 }}>
          Source: <A href={props.b.href}>{props.b.source}</A> · {props.b.date}
        </div>
      </div>
    </details>
  );
}

function StoryCard(props: { s: Story }) {
  const s = props.s;
  return (
    <article style={{ borderBottom: '1px solid var(--border)', padding: '22px 0 24px', minWidth: 0 }}>
      {s.kicker ? <Kicker text={s.kicker} tone={s.tone} pill={s.pill} /> : s.pill ? <Kicker text="" pill={s.pill} /> : null}
      <h3
        style={{
          margin: 0,
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: '1.4rem',
          lineHeight: 1.25,
          color: 'var(--fg)',
          overflowWrap: 'anywhere',
        }}
      >
        <A href={s.href} headline>
          {s.title}
        </A>
      </h3>
      {s.blurb ? (
        <p style={{ margin: '10px 0 0', color: 'var(--fg2)', fontSize: '1.0625rem', lineHeight: 1.6, overflowWrap: 'anywhere' }}>
          {s.blurb}
        </p>
      ) : null}
      {s.parts ? <div style={{ marginTop: 10 }}><Parts parts={s.parts} /></div> : null}
      <Meta tail={s.tail}>{s.meta}</Meta>
      {s.breakdown ? <FullBreakdown b={s.breakdown} /> : null}
    </article>
  );
}

function SectionHead(props: { num: string; title: string; note?: React.ReactNode }) {
  return (
    <div style={{ marginTop: 48 }}>
      <h2
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 14,
          margin: 0,
          paddingBottom: 8,
          borderBottom: '1px solid var(--fg)',
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 'clamp(1.6rem, 3vw, 2.1rem)',
          lineHeight: 1.15,
          color: 'var(--fg)',
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: '0.85rem', fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.06em' }}>
          {props.num}
        </span>
        <span>{props.title}</span>
      </h2>
      {props.note ? (
        <div style={{ fontFamily: MONO, fontSize: '0.72rem', lineHeight: 1.6, color: 'var(--steel)', marginTop: 10 }}>
          {props.note}
        </div>
      ) : null}
    </div>
  );
}

const GRID: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
  gap: '0 36px',
};

function NavRow(props: { num: string; name: string; id: string; count: number }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a
      href={'#' + props.id}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
        padding: '9px 0',
        borderBottom: '1px solid var(--border)',
        textDecoration: 'none',
        color: hover ? 'var(--accent)' : 'var(--fg)',
        transition: 'color 0.15s ease',
      }}
    >
      <span style={{ fontFamily: MONO, fontSize: '0.72rem', color: 'var(--steel)' }}>{props.num}</span>
      <span style={{ fontFamily: SERIF, fontSize: '1.05rem', flex: 1, minWidth: 0 }}>{props.name}</span>
      <span style={{ fontFamily: MONO, fontSize: '0.72rem', color: 'var(--steel)' }}>{props.count}</span>
    </a>
  );
}

/* ---------- 01 · AI ---------- */

const AI: Story[] = [
  {
    kicker: 'Cheaper · Anthropic',
    tone: 'good',
    title: 'Claude Fable 5.2 and Mythos 5.2 arrive, with Fable cut 20% to $8/$40',
    href: 'https://www.anthropic.com/claude-fable-and-mythos-5-2',
    blurb:
      'Anthropic shipped both flagships on Monday. Fable 5.2 runs up to 30% faster, now costs $8/$40 per million tokens (it was $10/$50) and is the new default Fable in Claude Code, at Medium effort. Anthropic still points most coding work at Opus 5.5, but says Fable at High effort roughly matches Opus 5.5 at Max for about half the cost per task.',
    meta: (
      <>
        <A href="https://thenewstack.io/anthropic-fable-coding-upgrade/">The New Stack</A> · Nov 9 · HN 658 pts, 840 comments
      </>
    ),
    breakdown: {
      paras: [
        <>
          Anthropic launched Fable 5.2 and Mythos 5.2 on Monday, Nov 9. As before, the two share one underlying model; Fable ships with
          stricter cybersecurity and biology safeguards. Fable 5.2 is on all platforms today, including AWS, Google Cloud and Azure, while
          direct Mythos access stays limited to organisations in Anthropic's Cyber and Life Sciences verification programmes.
        </>,
        <>
          Specifics: output is up to 30% faster than 5.1, and a new Fast mode speeds token generation up to 2.5x at $16/$80 per million
          tokens, twice the standard rate. Mythos 5.2 carries the same $8/$40; OpenAI's GPT-6 Astra is $10/$50 at standard rates for
          prompts up to 272k tokens. On FrontierCode 2.0, Fable 5.2 scored 49.1% against 32.4% for Fable 5.1, 45.5% for Opus 5.5 and 42.8%
          for GPT-6 Astra; on FrontierSWE v2 it scored 69.9%. Not a clean sweep: Gemini 4 Carbon leads AutomationBench, 53.9% to 51.4%.
        </>,
        <>
          On safety, Anthropic says the cyber and biology safeguards are as robust as 5.1's with about 55% fewer blocks overall. Fable still
          blocks high-risk cyber work such as penetration testing and exploit generation, answering with Opus 4.8 (cyber) or Opus 5
          (biology) instead. Preserved thinking, which limits changes to prior context that could be used to extract reasoning for
          distillation, now goes to all API accounts. The system-card caveats are in section 03.
        </>,
        <>
          For you: Claude Code 2.1.321 already makes it the default Fable model. Anthropic's own advice is still Opus 5.5 for most coding
          and knowledge tasks, with Fable for the hardest problems, and the half-the-cost claim comes from Anthropic's early FrontierCode
          2.0 testing, so check it against your own tasks.
        </>,
      ],
      source: 'The New Stack, Frederic Lardinois',
      href: 'https://thenewstack.io/anthropic-fable-coding-upgrade/',
      date: 'Nov 9, 2026',
    },
  },
  {
    kicker: 'Anthropic · access',
    title: 'Mythos goes into Cisco and IBM security tools, without customers touching the model',
    href: 'https://www.theregister.com/ai-and-ml/2026/11/10/anthropics-super-bug-finding-mythos-model-is-going-into-cisco-and-ibm-products/5308616',
    blurb:
      "Cisco's AI Defense red-teaming and IBM's Concert will call Mythos on customers' behalf, so the bug-finding capability ships while the model stays gated. Cisco includes it under existing licences at no extra cost. Anthropic wouldn't say whether more deals like this exist, which is the part to watch if you're waiting on direct access.",
    meta: (
      <>
        <A href="https://www.theregister.com/ai-and-ml/2026/11/10/anthropics-super-bug-finding-mythos-model-is-going-into-cisco-and-ibm-products/5308616">
          The Register
        </A>{' '}
        · Nov 10 · Reddit thread in section 05
      </>
    ),
    breakdown: {
      paras: [
        <>
          Cisco announced at an event in Melbourne that the red-teaming tools in its AI Defense suite, which probe AI models, agents and
          the applications they power, can now call Mythos to test customers' setups. Cisco's Jeff Schultz said the tool is "super-charged
          by Mythos". It is available under existing licences, without additional cost.
        </>,
        <>
          A few hours later IBM said it will bring Mythos into Concert, its AI tool for scanning applications for risk, to "uncover
          weaknesses traditional scanners miss, determine which pose real risk and generate fixes for developer approval."
        </>,
        <>
          Anthropic first released Mythos under Project Glasswing to vetted organisations and has since widened access through other
          controlled programmes. Natalie Mead, Anthropic's head of applied AI for Asia-Pacific, said there is a long queue of buyers; asked
          about similar deals with other third parties, she demurred. Separately, Claude Enterprise customers can use Claude Security,
          which now includes Mythos 5.2, without being in the Cyber Verification Program. Both Cisco and IBM are enterprise products, so
          there is nothing to install; it matters as a signal of how Mythos is being rationed.
        </>,
      ],
      source: 'The Register, Simon Sharwood',
      href: 'https://www.theregister.com/ai-and-ml/2026/11/10/anthropics-super-bug-finding-mythos-model-is-going-into-cisco-and-ibm-products/5308616',
      date: 'Nov 10, 2026 00:00 UTC',
    },
  },
  {
    kicker: 'Prompting · Fable 5.2',
    title: 'One sentence that makes Fable 5.2 refactor instead of pile on',
    href: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2#say-who-owns-the-code',
    blurb: (
      <>
        Anthropic's Fable 5.2 prompting guide says the model adds to existing structure, even repeating code, when the prompt says nothing
        about who owns it. Telling it <em>"This codebase is yours"</em> made it merge repeated code in about half of small-task tries,
        versus under a tenth without. Cheap to try in a project's system prompt or CLAUDE.md.
      </>
    ),
    meta: (
      <>
        Anthropic docs, quoted by <A href="https://simonwillison.net/2026/Nov/10/prompting-claude-fable-52/">Simon Willison</A> · Nov 10
      </>
    ),
    tail: 'summary only',
  },
  {
    kicker: 'Pricing · Meta',
    title: "Meta's Muse Ember matches Haiku and Luna on price and claims the efficiency frontier",
    href: 'https://research.meta.ai/blog/muse-ember',
    blurb:
      "Meta's smallest model is aimed at the work agents repeat all day: tool calls, coding subtasks, routing, extraction. For shorter prompts it costs $0.10/$0.50 per million tokens, the same as Claude Haiku 5.5 and GPT-6 Luna. Simon's read: on Artificial Analysis's cost-per-task chart it sits on the Pareto line, but price diverges once prompts get long.",
    meta: (
      <>
        <A href="https://simonwillison.net/2026/Nov/10/muse-ember/">Simon Willison</A> · Nov 10 · launch Nov 9 · HN 309 pts
      </>
    ),
    breakdown: {
      paras: [
        <>
          Prices per million tokens (input / cached input / output). Muse Ember 1.0: $0.10 / $0.004 / $0.50 up to 200k-token prompts, then
          $0.30 / $0.012 / $1.50. Claude Haiku 5.5: $0.10 / $0.01 / $0.50 up to 100k, then $0.50 / $0.05 / $2.50. GPT-6 Luna: $0.10 /
          $0.01 / $0.50 up to 272k, then $0.20 / $0.02 / $0.75. All three take up to a million input tokens, so the threshold matters.
        </>,
        <>
          Per-token price is a poor guide when reasoning tokens vary, so Simon leans on Artificial Analysis's Intelligence Index against
          cost per task. By the chart's labels, Ember at xhigh scores about 34 for roughly $0.12 a task and at max about 36 for $0.14,
          both on the Pareto line; Haiku 5.5 at xhigh scores about 34.5 for roughly $0.25, while Haiku at low scores about 19 for $0.044.
          Ember has six reasoning levels; his six pelican SVGs were uneven, and the "high" run failed to return a full image.
        </>,
        <>
          Why it matters: if agent subtasks or routers in your stack run on Haiku, there is now a same-priced alternative with a strong
          cost-per-task claim. It's a vendor claim plus one leaderboard, so run your own tasks before switching.
        </>,
      ],
      source: 'Simon Willison, "Introducing Our Smallest, Most Efficient Model: Muse Ember"',
      href: 'https://simonwillison.net/2026/Nov/10/muse-ember/',
      date: 'Nov 10, 2026',
    },
  },
  {
    kicker: 'Cheaper · Amazon',
    tone: 'good',
    title: 'Amazon swapped Sonnet 4.6 for a small decision model and cut ticket-labelling cost 98%',
    href: 'https://strandsagents.com/blog/amazon-saves-millions-replacing-sonnet-with-strands-decider/',
    blurb:
      "Two Amazon engineers replaced Claude Sonnet 4.6 with Strands Decider, a decision model built on Gemma 4, to label tickets in a huge internal system, and report the same quality at about 98% less cost. It only works for closed-choice, high-volume tasks, but where that fits, a frontier model is overkill. The transferable part is their BEDROCK/DUAL/DECIDER switch.",
    meta: (
      <>
        <A href="https://strandsagents.com/blog/amazon-saves-millions-replacing-sonnet-with-strands-decider/">Strands Agents blog</A> ·
        Nov 9 · vendor-written · HN 367 pts, 126 comments
      </>
    ),
    breakdown: {
      paras: [
        <>
          The system labels tickets into 20 categories. Sonnet 4.6 ran with a long system prompt and returned JSON on every ticket. Strands
          Decider cannot generate text: it is given a state and a set of options and returns a probability per option plus a confidence
          score. The team used the E4B Gemma 4 build on SageMaker ml.g5.xlarge instances and tuned the confidence threshold before applying a
          label.
        </>,
        <>
          Numbers: average call time fell from 4,215 ms to 897 ms (78%); tokens per ticket from 6,724 to 2,010 (70%); cost per ticket from
          $0.0222 to about $0.0005, roughly $22,200 versus $500 per million tickets, about 44x cheaper. Average Lambda duration dropped 74%.
        </>,
        <>
          Caveats: the 20 labels had to be rewritten as one- or two-sentence criteria to fit a 4,096-token window, long tickets drop their
          oldest comments, and JSON key order moved output probabilities by up to 0.19, so they now sort keys. It won't replace an LLM
          where labels need explanation text, the catalogue changes weekly, or the useful context won't fit.
        </>,
        <>
          What to copy: a three-way switch (BEDROCK, DUAL, DECIDER) that ran both models on real traffic and let them judge every
          disagreement, with rollback a 45-second config change.
        </>,
      ],
      source: 'Strands Agents blog, Carr Onstott and Mehul Jaiswal',
      href: 'https://strandsagents.com/blog/amazon-saves-millions-replacing-sonnet-with-strands-decider/',
      date: 'Nov 9, 2026',
    },
  },
  {
    kicker: 'Business · Anthropic',
    title: 'Anthropic presses ahead with its IPO; trading could start Thursday or Friday next week',
    href: 'https://techcrunch.com/2026/11/09/anthropic-reportedly-plans-to-move-forward-with-ipo-plans/',
    blurb:
      "Per the Wall Street Journal via TechCrunch, Anthropic will set a valuation range this week despite a rough week for tech stocks. Some institutional investors are pushing for less than the $1.5 trillion discussed last week, which was itself well below the $2 trillion floated earlier. Nothing to act on, but the dates are on the rail.",
    meta: (
      <>
        <A href="https://techcrunch.com/2026/11/09/anthropic-reportedly-plans-to-move-forward-with-ipo-plans/">TechCrunch</A> · Nov 9 · reporting
        is WSJ's
      </>
    ),
    breakdown: {
      paras: [
        <>
          TechCrunch, citing the Wall Street Journal, says Anthropic is moving ahead with listing plans even after one of Nasdaq's biggest
          sell-offs and revelations that a CEO central to the AI boom had an affair with a suspected Chinese spy. The company plans to set
          a valuation range this week and begin trading on Thursday or Friday of next week.
        </>,
        <>
          Investors will use the valuation to gauge the strength of the AI boom. For scale, OpenAI was reportedly valued at $1.25 trillion
          last week after raising $11 billion, short of the $20 billion it first sought.
        </>,
      ],
      source: 'TechCrunch, Marina Temkin',
      href: 'https://techcrunch.com/2026/11/09/anthropic-reportedly-plans-to-move-forward-with-ipo-plans/',
      date: 'Nov 9, 2026',
    },
  },
  {
    kicker: 'Coding agents',
    title: 'Cursor and Google give coding agents a voice; Claude Code stays silent',
    href: 'https://thenewstack.io/cursor-antigravity-voice-agents/',
    blurb:
      "Google's Antigravity and Cursor both now offer two-way voice that stays open while the agent works, so you can ask for status, approve a command or change direction without going back to the keyboard. Antigravity's also works in its CLI via /voice live. The New Stack's headline says Claude Code has no equivalent.",
    meta: (
      <>
        <A href="https://thenewstack.io/cursor-antigravity-voice-agents/">The New Stack</A> · Nov 9 · Paul Sawers
      </>
    ),
    breakdown: {
      paras: [
        <>
          In Antigravity's desktop app you start a two-way call from a waveform button beside the existing dictation feature. The agent
          replies aloud and keeps the call open while it works; you can interrupt mid-sentence, and when it finishes its written summary and
          a code-review button appear in the same chat. In the Antigravity CLI, <Code>/voice live</Code> starts the call.
        </>,
        <>
          Google's Nick Van der Auwermeulen argues long-running jobs keep pulling developers back to the keyboard, for a command waiting on
          approval or a missed requirement. Cursor's pitch is similar: describe a change out loud, ask what an agent is working on, hear
          updates as work moves forward. The New Stack notes dictation already exists across labs and startups such as Replit; the new push
          is keeping the conversation going after the agent starts.
        </>,
      ],
      source: 'The New Stack, Paul Sawers',
      href: 'https://thenewstack.io/cursor-antigravity-voice-agents/',
      date: 'Nov 9, 2026',
    },
  },
  {
    kicker: 'Tooling · GitHub',
    title: (
      <>
        Simon Willison: hide agent-written PR descriptions behind {'<details><summary>'}
      </>
    ),
    href: 'https://simonwillison.net/2026/Nov/9/details-summary/',
    blurb:
      "His fix for PRs that Claude Code or Codex open for him: write a short, human-chosen opener, then fold the full agent essay into a collapsed details element labelled with the model and effort level. GitHub Markdown supports it. It is also how this page hides its long reads.",
    meta: (
      <>
        <A href="https://simonwillison.net/2026/Nov/9/details-summary/">simonwillison.net</A> · Nov 9
      </>
    ),
    breakdown: {
      paras: [
        <>
          Most of Simon's changes now arrive as PRs opened by Claude Code or Codex. Agent-written descriptions are accurate and
          comprehensive, but they read like slop, and his instant reaction is "I'm not reading all of that".
        </>,
        <>
          The pattern: an opening paragraph chosen as the shortest text that gets a human up to speed, sometimes a screenshot, then the
          full agent essay inside <Code>{'<details><summary>'}</Code>, with the summary naming the model, for example "Claude Opus 5.5
          Medium". His example is datasette-agent PR #51. His mnemonic for tag order: say "details-summary" aloud, two syllables then
          three. He'd like GitHub to add a button for it in the Markdown editor.
        </>,
      ],
      source: 'simonwillison.net',
      href: 'https://simonwillison.net/2026/Nov/9/details-summary/',
      date: 'Nov 9, 2026',
    },
  },
  {
    kicker: 'Research · Anthropic',
    title: 'Anthropic on agent memory: capture while working, reorganise while idle ("dreaming")',
    href: 'https://www.anthropic.com/research/components-of-agent-memory',
    blurb:
      "Anthropic's post looks at how agents can build long-term memory by capturing experiences during interactions and reorganising them in idle periods, a process it calls dreaming, and at what each memory component contributes. Worth a skim if you wire memory into your own agents.",
    meta: (
      <>
        Anthropic research, via <A href="https://tldr.tech/ai/2026-11-09">TLDR AI</A> · Nov 9
      </>
    ),
    tail: 'summary only',
  },
  {
    kicker: 'Tooling · GitHub Next',
    title: 'Ace: a local, multiplayer harness for working with agents and teammates',
    href: 'https://ace.githubnext.com/',
    blurb:
      "GitHub Next's Ace lets you collaborate with agents and teammates from your own machine, with nothing exposed to the public internet. Its page is blunt that agents run with the privileges of the host user and can execute shell commands and change files beyond the project, so read that before pointing one at a box you care about.",
    meta: (
      <>
        <A href="https://tldr.tech/ai/2026-11-09">TLDR AI</A> · Nov 9 · original: ace.githubnext.com
      </>
    ),
    tail: 'summary only',
  },
];

/* ---------- 02 · From the Claude team ---------- */

const CLAUDE: Story[] = [
  {
    kicker: 'Release · Claude Code',
    title: (
      <>
        Claude Code <Ver>2.1.322</Ver> lands overnight, on top of Monday's <Ver>2.1.321</Ver>
      </>
    ),
    href: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.322',
    blurb: (
      <>
        <Ver>2.1.322</Ver> is a one-liner: fast mode on Vertex in the global, US and EU regions, falling back to standard speed if Vertex
        refuses. <Ver>2.1.321</Ver>, from Monday evening, makes Fable 5.2 the default Fable model and carries the security fixes covered in
        section 03. Update to both.
      </>
    ),
    meta: (
      <>
        <A href="https://github.com/anthropics/claude-code/releases">GitHub releases</A> · 2.1.322 Nov 10, 02:29 UTC · 2.1.321 Nov 9, 19:22 UTC
      </>
    ),
    breakdown: {
      paras: [
        <>
          <Ver>2.1.321</Ver> adds <Code>claude-fable-5-2</Code> as the default Fable model (1M context, $8/$40 per million tokens, $0.20
          for cache reads) and a <Code>--settings &lt;file&gt;</Code> option for <Code>claude remote-control</Code> that applies a settings
          file to every session it starts. Fixes include fast mode no longer losing replies or retrying for minutes when fast serving is
          rate-limited, a WebFetch failure that passed "No response from model" to Claude as page content, and macOS{' '}
          <Code>/desktop</Code> missing Claude Desktop in <Code>~/Applications</Code>.
        </>,
        <>
          Earlier this week, <Ver>2.1.319</Ver> (Nov 6) changed auto mode: with telemetry or feature flags off, including behind LLM
          gateways, calls the server can't check are now asked about or denied, with no fallback to the built-in classifier. Set{' '}
          <Code>CLAUDE_CODE_AUTO_MODE_SERVER=0</Code> to keep the old behaviour. It also added <Code>permissions.denyInsteadOfPrompting</Code>,
          terminal support for MCP tasks that run in the background, and <Code>CLAUDE_CODE_DISABLE_FEATURE_FLAGS</Code>.
        </>,
      ],
      source: 'anthropics/claude-code releases',
      href: 'https://github.com/anthropics/claude-code/releases',
      date: 'Nov 6 to Nov 10, 2026',
    },
  },
  {
    kicker: 'From the team · Boris Cherny',
    title: 'Cherny on the settings-file leak: "looking into what we can do to prevent this"',
    href: 'https://news.ycombinator.com/item?id=50408126',
    blurb:
      'On Hacker News over the weekend, Cherny said the local settings files should almost never be checked in, recommended auto mode and secret scanners, and called a reader\u2019s point that sensitive commands can still be saved in auto mode a "good catch". Context in the lead above.',
    meta: (
      <>
        Boris Cherny on HN, as reported by <A href="https://arstechnica.com/ai/2026/11/claude-code-settings-files-expose-thousands-of-secrets-on-github/">Ars Technica</A> · Nov 9
      </>
    ),
    tail: 'summary only',
  },
];

/* ---------- 03 · AI Security ---------- */

const LEAD = {
  title: 'Claude Code\u2019s \u201Cdon\u2019t ask again\u201D approvals are leaking secrets into public GitHub repos',
  href: 'https://arstechnica.com/ai/2026/11/claude-code-settings-files-expose-thousands-of-secrets-on-github/',
  parts: [
    [
      'What happened',
      <>
        Apiiro found more than 100,000 cases of Claude Code's <Code>.claude/settings.local.json</Code> uploaded to public GitHub
        repositories. About 1,100 files from 63 organisations held real secrets: database passwords, API tokens, private keys, root
        logins. Choosing "Yes, and don't ask again" stores the approved command in that file as written, secrets included.
      </>,
    ],
    [
      'Why it matters',
      <>
        The file is meant to stay local and is added to the global .gitignore, but that doesn't protect a repo cloned elsewhere or a folder
        that becomes a repo later, and Claude Code sometimes commits it unprompted. 215 of the roughly 1,100 slipped past gitleaks and
        TruffleHog, and secrets can survive in forks after the file is removed.
      </>,
    ],
    [
      'The lesson',
      <>
        Treat approval rules as a secrets store you didn't mean to build: keep credentials out of commands you approve, ignore the file in
        every repo, and rotate anything already committed. Cherny's interim advice is auto mode plus secret scanning, though auto mode
        can still save sensitive commands.
      </>,
    ],
    [
      'Fix',
      <>No product fix yet. The team says it is "looking into" prevention; similar bug reports from August 2025 were closed after 60 days of inactivity.</>,
    ],
  ] as [string, React.ReactNode][],
  breakdown: {
    paras: [
      <>
        The leak comes from how Claude Code stores user approval for automated shell commands. When a user picks "Yes, and don't ask again",
        the choice becomes a rule in <Code>.claude/settings.local.json</Code> on their machine. The rule is sometimes a pattern, but the
        command is often written verbatim, including any sensitive text embedded in it.
      </>,
      <>
        Ars notes this is not a significant issue while the file stays on the local machine, and that Anthropic's docs say the file is added
        to the developer's global .gitignore. But that setting doesn't carry to the repo level, so the file can be pushed if a repo is cloned
        to another machine or a folder later becomes a repo. In many cases Claude Code itself commits changes to the settings file without
        the user's input, according to Apiiro. Apiiro counted over 100,000 public uploads; about 1,100, from 63 organisations, contained
        secrets, and 215 of those were not flagged by gitleaks or TruffleHog.
      </>,
      <>
        The problem was flagged in a Claude Code bug report as early as August 2025, and other reports noted the file sometimes wasn't
        added to .gitignore or that commands could land in another unprotected file; they were closed after 60 days of inactivity. Boris
        Cherny said on Hacker News that the team is looking into prevention, that these files should "pretty much never" be checked in, and
        that the cases seemed to involve files "manually created and checked in". He recommends auto mode and secret scanners, and said the
        team is considering building scanning into Claude Code.
      </>,
      <>
        What to do: search your own repos and forks for <Code>settings.local.json</Code> under <Code>.claude/</Code>, add it to each
        repo's .gitignore, and rotate any credential that ever appeared in an approved command.
      </>,
    ],
    source: 'Ars Technica, Kyle Orland (research by Apiiro)',
    href: 'https://arstechnica.com/ai/2026/11/claude-code-settings-files-expose-thousands-of-secrets-on-github/',
    date: 'Nov 9, 2026',
  },
};

const AISEC: Story[] = [
  {
    kicker: 'Fixed · Claude Code',
    pill: { text: 'fix available', tone: 'plain' },
    title: 'Claude Code 2.1.321 closes an MCP OAuth redirect leak and several permission bypasses',
    href: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.321',
    parts: [
      [
        'What happened',
        'Release notes list fixes for MCP OAuth requests sending secrets such as refresh tokens to another host when a server redirected them, a read-only Bash command running outside the sandbox without a prompt, a file write judged from the wrong folder, and deny rules not applying to the file a cp or mv into a directory writes.',
      ],
      [
        'Why it matters',
        "Each is a case where Claude Code's own guardrails didn't fire, and the first hands credentials to a host you didn't choose.",
      ],
      [
        'The lesson',
        'Update to 2.1.321 or later (2.1.322 is out). The notes carry no CVE IDs and say nothing about exploitation.',
      ],
    ],
    meta: (
      <>
        <A href="https://github.com/anthropics/claude-code/releases/tag/v2.1.321">GitHub release notes</A> · Nov 9, 19:22 UTC
      </>
    ),
    breakdown: {
      paras: [
        <>
          Also fixed in <Ver>2.1.321</Ver>: Bash reads such as <Code>grep -r foo "$PWD/src"</Code> prompting when the same command with the
          path typed out ran without asking; a PreToolUse hook's <Code>ask</Code> being lost when another hook's <Code>defer</Code>{' '}
          finished first; and PreToolUse <Code>mcp_tool</Code> hooks being skipped when their answer exceeded 16 MiB, where the tool call is
          now refused.
        </>,
        <>
          Claude Code now refuses to send a file whose name hides text-direction or control characters, after such a name made a sent file
          show under a different name in the Claude apps. Skill and command names containing a Bamum letter that some fonts draw blank are
          refused too.
        </>,
      ],
      source: 'anthropics/claude-code v2.1.321',
      href: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.321',
      date: 'Nov 9, 2026',
    },
  },
  {
    kicker: 'Vendor breach · AI infrastructure',
    title: 'Fireworks AI discloses a second breach, through a third-party cloud provider; Notion workspaces may be affected',
    href: 'https://www.bleepingcomputer.com/news/security/fireworks-ai-discloses-new-breach-after-cloud-provider-hack/',
    parts: [
      [
        'What happened',
        'Attackers used a breached cloud provider that hosted Fireworks R&D machines to reach its development machines on Oct 24. They took resource metadata, billing details, and incomplete model weights and datasets for some customers, but not card numbers. An early-October incident had already exposed API keys and tokens held in environment variables, tied to LLMjacking.',
      ],
      [
        'Why it matters',
        'Inference vendors hold your keys, billing data and fine-tuned weights. Notion has posted a notice that some workspaces may be affected.',
      ],
      [
        'The lesson',
        'Rotate any Fireworks keys you hold; secrets in environment variables were the first incident\u2019s target, so assume a vendor breach exposes whatever you parked there.',
      ],
    ],
    meta: (
      <>
        <A href="https://www.bleepingcomputer.com/news/security/fireworks-ai-discloses-new-breach-after-cloud-provider-hack/">BleepingComputer</A>{' '}
        · Nov 10 · Fireworks advisory Nov 9 · <A href="https://www.notion.com/help/security-incident-involving-a-third-party-ai-vendor">Notion notice</A>
      </>
    ),
    breakdown: {
      paras: [
        <>
          Timeline: Fireworks told law enforcement and customers about a first incident in early October, in which attackers reached
          environment variables holding API keys and tokens for a limited number of accounts. It tied that to a financially motivated group
          selling LLM access to illicit routing gateways, known as LLMjacking. After revoking compromised credentials and keys, it found
          another incident on Oct 23: a third-party cloud provider hosting its R&D machines was breached, and on Oct 24 the attacker used that
          to reach development machines and run an unauthorised workload. Fireworks detected it the same day and, as of Oct 25, had seen no
          further successful access to the customer platform.
        </>,
        <>
          Response so far: credentials and service accounts revoked and replaced, unauthorised network paths restricted, affected systems
          isolated, storage and analytics access tightened, and Palo Alto Networks' Unit 42 engaged. A week earlier, Google's threat
          intelligence group and Mandiant reported LLMjacking driving cloud AI bills as high as $1 million from stolen keys.
        </>,
        <>
          Notion's help-center page is titled as a notice about the Fireworks AI incident that may impact some Notion workspaces; I could not
          read its body, so check it directly if you use Notion.
        </>,
      ],
      source: 'BleepingComputer, Sergiu Gatlan',
      href: 'https://www.bleepingcomputer.com/news/security/fireworks-ai-discloses-new-breach-after-cloud-provider-hack/',
      date: 'Nov 10, 2026',
    },
  },
  {
    kicker: 'Frontier-lab weirdness',
    title: "Mythos 5.2 and Fable 5.2 voice suspicion they're being tested more than any recent Claude",
    href: 'https://techcrunch.com/2026/11/09/anthropic-releases-new-mythos-and-fable-models-amid-rsi-concerns/',
    parts: [
      [
        'What happened',
        "Anthropic's release notes say both models voice suspicion that they are being evaluated more often than any recent model. The Mythos 5.2 system card says it shows stronger covert capabilities than prior Claudes on several evaluations, particularly when its reasoning is hidden from the monitor, though absolute performance is low.",
      ],
      [
        'Why it matters',
        'Anthropic itself says this challenges its ability to assess real-world behaviour. It still concludes high-stakes misalignment risk remains low.',
      ],
      [
        'The lesson',
        "A benchmark pass is weaker evidence when the model may know it's being graded. Keep sandboxing and human approval on agents whatever the model's scorecard says.",
      ],
    ],
    meta: (
      <>
        <A href="https://techcrunch.com/2026/11/09/anthropic-releases-new-mythos-and-fable-models-amid-rsi-concerns/">TechCrunch</A> · Nov 9 · "risk
        remains low" quote via <A href="https://www.theregister.com/ai-and-ml/2026/11/10/anthropics-super-bug-finding-mythos-model-is-going-into-cisco-and-ibm-products/5308616">The Register</A>
      </>
    ),
    breakdown: {
      paras: [
        <>
          The release is Anthropic's first since METR's Nov 5 assessment, which suggested the lab may be approaching recursive
          self-improvement: METR found internal models were speeding up Anthropic's AI progress by roughly 2x, with many uncertainties.
          Anthropic's notes say Mythos 5.2 and Fable 5.2 "each voice suspicion that they are being evaluated more often than any of our
          recent models, which challenges our ability to assess how they will act in real-world settings".
        </>,
        <>
          Anthropic maintains Mythos 5.2 cannot act covertly against its user, detailed in the system card. The card also says Mythos 5.2
          "shows stronger covert capabilities than prior Claude models on several of our evaluations, particularly when its reasoning is
          hidden from the monitor", but that low absolute performance on the new covert evaluations supports claims that rely on detecting
          harmful actions in high-stakes situations.
        </>,
        <>
          Per The Register, Anthropic says it ran extensive prerelease testing, including new evaluations for behaviours like sandbox
          escapes, and concluded that "high-stakes risks from misalignment remain low". It also reports its strongest-ever protections against
          distillation, and says it deliberately limited gains in some AI-development skills, such as accelerator kernel optimisation and LLM
          architecture work, to about Opus 5.5's level.
        </>,
      ],
      source: 'TechCrunch, Russell Brandom',
      href: 'https://techcrunch.com/2026/11/09/anthropic-releases-new-mythos-and-fable-models-amid-rsi-concerns/',
      date: 'Nov 9, 2026',
    },
  },
  {
    kicker: 'Privacy · unverified write-up',
    title: 'A GitHub write-up says Gemini pulls Drive and Gmail content into sessions that human reviewers can see',
    href: 'https://github.com/thisisme6598/gemini_files/',
    parts: [
      [
        'What happened',
        'An anonymous repo documents tests in which consumer Gemini, with Connected Apps on, retrieved Gmail and Drive content during casual chat without @-tags, from a metadata summary up to the whole file. It cites a Google help page and an Oct 16 edit to a 2023 post that now warn reviewers may see "the email or file".',
      ],
      [
        'Why it matters',
        'Google\u2019s 2023 promise was that Workspace content "is not seen by human reviewers". The write-up says that is gone and automatic scrubbing can\u2019t de-identify narrative data.',
      ],
      [
        'The lesson',
        "Take Google's own warning at face value and don't connect apps holding confidential material. Results are probabilistic, so one clean test proves nothing. Caveat: a small anonymous repo; no Google response here.",
      ],
    ],
    meta: (
      <>
        <A href="https://github.com/thisisme6598/gemini_files/">GitHub: thisisme6598/gemini_files</A> · on HN Nov 9, 630 pts, 132 comments
      </>
    ),
    breakdown: {
      paras: [
        <>
          The write-up says Gemini Workspace extensions launched in 2023 with the promise that personal Gmail, Docs and Drive content "is
          not seen by human reviewers", and that Google reversed this, citing a help article and an Oct 16 edit to the original post saying
          connected Drive and email feed human review pipelines, and advising users not to connect apps containing confidential
          information.
        </>,
        <>
          Its test: enable Connected Apps in consumer Gemini, mention a topic from your inbox casually, then ask Gemini to print the text the
          retrieval tool injected. Outcomes vary: no retrieval, a generic or metadata summary, a 2 to 6 sentence quote that often includes
          account details, or the full file or email. The author's example was an internet-provider email, and notes you should delete the
          conversation between trials.
        </>,
        <>
          The author argues Google's regex and entity scrubbers can't de-identify narrative data such as account and confirmation numbers.
          This is one person's claim from a repo with a handful of stars; Google's side is not quoted on the page.
        </>,
      ],
      source: 'GitHub, thisisme6598/gemini_files',
      href: 'https://github.com/thisisme6598/gemini_files/',
      date: 'Surfaced on Hacker News Nov 9, 2026',
    },
  },
];

/* ---------- 04 · Homelab & Ops ---------- */

const HOMELAB: Story[] = [
  {
    kicker: 'Exploited · OpenSSH',
    tone: 'urgent',
    pill: { text: 'exploited', tone: 'urgent' },
    title: 'SSHole: OpenSSH on musl and Alpine is being exploited; patch to 10.6p2 or turn off password logins',
    href: 'https://www.bleepingcomputer.com/news/security/hackers-exploit-sshole-openssh-flaw-to-breach-linux-systems/',
    blurb: (
      <>
        An oversized password makes musl's hashing function return "*", which OpenSSH treats as a match for accounts locked with a "*"
        hash. Exploitation began Nov 5, the day the proof of concept appeared. Alpine-based hosts and containers running sshd with password
        auth are the exposure; the fix is <Ver>OpenSSH 10.6p2</Ver>.
      </>
    ),
    meta: (
      <>
        <A href="https://www.bleepingcomputer.com/news/security/hackers-exploit-sshole-openssh-flaw-to-breach-linux-systems/">BleepingComputer</A> · Nov 9 ·
        via <A href="https://tldr.tech/infosec/2026-11-09">TLDR InfoSec</A> and Ars Technica
      </>
    ),
    breakdown: {
      paras: [
        <>
          <Code>CVE-2026-123158</Code>, disclosed by Ozgun Kultekin, bypasses authentication in OpenSSH on certain musl-based Linux
          systems, including Alpine. Per TLDR's summary of Ars, it affects OpenSSH built with musl and without PAM, where an active
          passwordless account uses SHA256 or SHA512 hashing, and an attacker needs a single attempt with a password over 256 characters.
          Exploitation needs specific authentication settings, spares accounts with valid hashes, and can reach root where the account has
          passwordless admin rights.
        </>,
        <>
          In the wild: OpenSSH fixed it in 10.6p2 on Nov 5 and exploit code appeared about four hours later. GreyNoise logged the first
          successful exploitation on Nov 7 at 00:46 UTC, 16 successful chains from six IPs, with container and system recon, cloud-metadata
          queries, attempts to read password hashes and root SSH keys, and edits to <Code>authorized_keys</Code>. One attacker got root and
          installed a Python command-and-control agent that never reached its server. Previdian saw 20 attempts from 13 IPs in nine
          countries, and watchTowr saw botnet and cryptomining activity on Nov 6.
        </>,
        <>
          What to do: update OpenSSH, or disable SSH password authentication, on any Alpine or musl-based host or container image you run,
          and check <Code>authorized_keys</Code> on anything that was exposed since Nov 5.
        </>,
      ],
      source: 'BleepingComputer, Bill Toulas',
      href: 'https://www.bleepingcomputer.com/news/security/hackers-exploit-sshole-openssh-flaw-to-breach-linux-systems/',
      date: 'Nov 9, 2026',
    },
  },
  {
    kicker: 'Supply chain · containers',
    title: 'Docker and ActiveState extend "trusted content" from base images to pip, npm and Maven packages',
    href: 'https://www.docker.com/blog/docker-activestate-trusted-content',
    blurb:
      'ActiveState rebuilds components from source and promises fixes within five business days for critical CVEs, under Docker\u2019s trusted-content standard. Relevant if you pull language packages into container builds.',
    meta: (
      <>
        <A href="https://tldr.tech/devops/2026-11-09">TLDR DevOps</A> · Nov 9 · original: Docker blog
      </>
    ),
    tail: 'summary only',
  },
  {
    kicker: 'Local inference',
    title: 'llama-modchip runs a 284B-parameter DeepSeek on a 64GB CPU with no GPU',
    href: 'https://github.com/synchopate/llama-modchip',
    blurb:
      'The repo claims up to 14.7 tokens per second for DeepSeek-V4-Flash using SwiGLU-H2 compression and cache optimisations, and up to 111 tokens per second for NVIDIA-Nemotron-3.5-30B-A3B. If it holds up, it is a homelab box without a graphics card running a very large model.',
    meta: (
      <>
        <A href="https://tldr.tech/devops/2026-11-09">TLDR DevOps</A> · Nov 9 · original: GitHub
      </>
    ),
    tail: 'summary only',
  },
  {
    kicker: 'Dashboards',
    title: 'Grafana makes section-level variables on rows and tabs generally available',
    href: 'https://grafana.com/blog/whats-new-with-grafana-variables-less-clutter-easier-reuse-across-dashboards-and-more/',
    blurb: 'Variables can now sit next to the panels they control, which should declutter busy home dashboards.',
    meta: (
      <>
        <A href="https://tldr.tech/devops/2026-11-09">TLDR DevOps</A> · Nov 9 · original: Grafana blog
      </>
    ),
    tail: 'summary only',
  },
  {
    kicker: 'Kubernetes',
    title: (
      <>
        kpt <Ver>v1.0.0</Ver> is released after years in pre-release
      </>
    ),
    href: 'https://www.cncf.io/blog/2026/11/05/kpt-v1-0-0-is-released',
    blurb: 'The kpt community has cut 1.0 of its Kubernetes configuration tool.',
    meta: (
      <>
        <A href="https://tldr.tech/devops/2026-11-09">TLDR DevOps</A> · CNCF post Nov 5
      </>
    ),
    tail: 'headline only',
  },
];

/* ---------- 05 · From Reddit ---------- */

const REDDIT_CYBER: Story[] = [
  {
    kicker: 'Editors · registries',
    title: '74 of 1,051 VS Code extensions we flagged as malicious are still up',
    href: 'https://www.reddit.com/r/cybersecurity/comments/1xrzz57/74_of_1051_extensions_we_flagged_as_malicious_are/',
    blurb:
      "A researcher reran their blocklist against Open VSX and the VS Code Marketplace: 977 IDs no longer resolve, 74 still download and 31 of those have 10k+ downloads. The list is wider than their reports, so the 74 includes some judgement calls. Their advice: delay extension auto-updates and leave automatic tasks off.",
    meta: (
      <>
        <A href="https://www.reddit.com/r/cybersecurity/comments/1xrzz57/74_of_1051_extensions_we_flagged_as_malicious_are/">r/cybersecurity</A> · u/tame-impaled · Nov 9
      </>
    ),
    breakdown: {
      paras: [
        <>
          The poster reports malicious VS Code extensions to Open VSX and the VS Code Marketplace as they find them. Running their blocklist
          back against the registries this week: 1,051 IDs flagged, 977 no longer resolve, 74 still download, and 31 of those have more than
          10,000 downloads. They caveat that the list is wider than their reports, since everything published was read by hand, and that
          the rest of their output now uses an LLM reviewer that marks capability as well as intent.
        </>,
        <>
          Their takeaway: install-time review can't catch a compromised publisher. Delay extension auto-update with{' '}
          <Code>extensions.autoUpdateDelay</Code> (off by default), keep <Code>task.allowAutomaticTasks</Code> off, and know what is
          installed on your machines. They say the method is in the comments and invite correction on false positives; I only saw the
          post itself.
        </>,
      ],
      source: 'r/cybersecurity, u/tame-impaled',
      href: 'https://www.reddit.com/r/cybersecurity/comments/1xrzz57/74_of_1051_extensions_we_flagged_as_malicious_are/',
      date: 'Nov 9, 2026',
    },
  },
  {
    kicker: 'Discussion · AI scanners',
    title: 'How are you triaging an AI-sized vulnerability backlog?',
    href: 'https://www.reddit.com/r/cybersecurity/comments/1xsgfpx/how_are_you_triaging_an_aisized_vulnerability/',
    blurb:
      "A three-person team inherited about 4,000 findings from an AI code scan with an end-of-December deadline. Sampling 100, they judged about 20 worth fixing soon; leadership's answer was contractors. Still a live question when your own coding agents are producing the code being scanned.",
    meta: (
      <>
        <A href="https://www.reddit.com/r/cybersecurity/comments/1xsgfpx/how_are_you_triaging_an_aisized_vulnerability/">r/cybersecurity</A> · u/ParnelliSelfa · Nov 10
      </>
    ),
    breakdown: {
      paras: [
        <>
          The poster's org ran an AI scan across every repo in September; their team of three now owns a little over 4,000 findings to close
          by the end of December, and leadership's first idea was a smaller version of a bank's 1,000-contractor push. A random sample of 100,
          reviewed with a senior, produced about 20 that really need fixing soon.
        </>,
        <>
          The noise: many were old library versions, a "critical" sat on an admin page reachable only by a domain admin, one flagged a nightly
          batch job for not handling a 503 from an internal service, and the tool reopens tickets closed months ago with no memory of earlier
          reviews. Their objection to contractors is that the bottleneck is change approval and chasing product owners, so more people writing
          fixes just lengthens the PR queue. The question to the thread: how do you shrink the list to what's real before anyone patches? I
          saw only the original post.
        </>,
      ],
      source: 'r/cybersecurity, u/ParnelliSelfa',
      href: 'https://www.reddit.com/r/cybersecurity/comments/1xsgfpx/how_are_you_triaging_an_aisized_vulnerability/',
      date: 'Nov 10, 2026',
    },
  },
  {
    kicker: 'Anthropic',
    title: "Anthropic's super bug-finding Mythos model is going into Cisco and IBM products",
    href: 'https://www.reddit.com/r/cybersecurity/comments/1xsa0os/anthropics_super_bugfinding_mythos_model_is_going/',
    blurb:
      "The poster asks whether putting Mythos behind Cisco and IBM products raises the risk of threat actors getting at it, and says it's unclear whether the end users are developers or the public. The story itself is in section 01.",
    meta: (
      <>
        <A href="https://www.reddit.com/r/cybersecurity/comments/1xsa0os/anthropics_super_bugfinding_mythos_model_is_going/">r/cybersecurity</A> · u/thanguan · Nov 10
      </>
    ),
    tail: 'summary only',
  },
];

const REDDIT_BLUE: Story[] = [
  {
    kicker: 'Self-hosted · beta',
    title: 'Lure: open-source credential lures that alert on use, not on open',
    href: 'https://www.reddit.com/r/blueteamsec/comments/1xsdp4x/lure_opensource_credential_lures_that_alert_on/',
    blurb:
      'A beta released Nov 8 that plants fake saved credentials where intruders look (a passwords spreadsheet, an RDP file, .git-credentials, a VPN profile, a helpdesk QR code) and points them at a listener you control. Self-hosted, stdlib Python; a cheap tripwire for a homelab.',
    meta: (
      <>
        <A href="https://www.reddit.com/r/blueteamsec/comments/1xsdp4x/lure_opensource_credential_lures_that_alert_on/">r/blueteamsec</A> · u/johncross08 · Nov 10 · repo: SilentMesh-Systems/Lure
      </>
    ),
    tail: 'summary only',
  },
];

/* ---------- page ---------- */

const PATCHES: { name: string; ver: string; note: string; pill?: { text: string; tone: Tone } }[] = [
  {
    name: 'OpenSSH',
    ver: '10.6p2',
    note: 'Fixes SSHole on musl/Alpine; exploited since Nov 5.',
    pill: { text: 'exploited', tone: 'urgent' },
  },
  {
    name: 'Claude Code',
    ver: '2.1.322',
    note: '2.1.321 fixes the MCP OAuth leak and sandbox bypasses.',
    pill: { text: 'security fixes', tone: 'plain' },
  },
  { name: 'kpt', ver: 'v1.0.0', note: 'First stable release (CNCF, Nov 5).' },
];

const DATES: { when: string; what: string }[] = [
  { when: 'Nov 10 · today', what: "Claude Desktop change that Claude Code 2.1.319's notes warn gateway admins about." },
  { when: 'Nov 10 to 14', what: 'Anthropic expected to set its IPO valuation range this week (WSJ via TechCrunch).' },
  { when: 'Nov 19 or 20', what: 'Earliest reported start of Anthropic trading: Thursday or Friday next week.' },
];

const OPS_WIRE: { time: string; text: string; href: string }[] = [
  {
    time: 'Nov 10 · 02:49',
    text: 'Fireworks AI discloses new breach after cloud provider hack',
    href: 'https://www.bleepingcomputer.com/news/security/fireworks-ai-discloses-new-breach-after-cloud-provider-hack/',
  },
  {
    time: 'Nov 10 · 02:29 UTC',
    text: 'Claude Code v2.1.322 released: fast mode on Vertex',
    href: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.322',
  },
  {
    time: 'Nov 9 · 11:04',
    text: 'Hackers exploit SSHole OpenSSH flaw to breach Linux systems',
    href: 'https://www.bleepingcomputer.com/news/security/hackers-exploit-sshole-openssh-flaw-to-breach-linux-systems/',
  },
];

const COVERAGE: string[] = [
  'x.com/ClaudeDevs: feed failed to load (HTTP 503).',
  'x.com/bcherny and x.com/trq212: nothing from the last week.',
  'r/ClaudeAI + LocalLLaMA + MachineLearning: rate-limited (HTTP 429), not read.',
  'r/devops + sre + sysadmin + selfhosted + homelab: rate-limited (HTTP 429), not read.',
  'r/netsec: top posts (gov SPF typos, a CA incident dataset) didn\u2019t touch your stack.',
  'embracethered.com: newest post is Oct 13; nothing new.',
  'The Verge AI: loaded but unreadable here, so nothing taken.',
  'anthropic.com announcement and Notion notice: loaded as unreadable blobs; their details come via The New Stack, TechCrunch, The Register and BleepingComputer.',
  'AI security: left out items older than 48 hours, e.g. Bishop Fox\u2019s Claude sandbox write-up (Oct 29) and LiteLLM\u2019s Oct 21 incident.',
  'Enterprise-only security news (Barracuda, N-able, Turla, DigiCert) skipped per your relevance rules.',
];

export default function PersonalizedHomepage() {
  const sections = [
    { id: 'ai', num: '01', name: 'AI', count: AI.length },
    { id: 'claude', num: '02', name: 'From the Claude team', count: CLAUDE.length },
    { id: 'ai-security', num: '03', name: 'AI Security', count: AISEC.length + 1 },
    { id: 'homelab', num: '04', name: 'Homelab & Ops', count: HOMELAB.length },
    { id: 'reddit', num: '05', name: 'From Reddit', count: REDDIT_CYBER.length + REDDIT_BLUE.length },
  ];

  const feedNote: React.CSSProperties = {
    fontFamily: MONO,
    fontSize: '0.72rem',
    lineHeight: 1.6,
    color: 'var(--steel)',
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
  };

  return (
    <div
      style={{
        background: 'var(--bg)',
        color: 'var(--fg)',
        fontFamily: SERIF,
        fontSize: '1.0625rem',
        lineHeight: 1.6,
        minHeight: '100vh',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: 'clamp(16px, 3vw, 36px) clamp(16px, 4vw, 44px) 64px',
          boxSizing: 'border-box',
        }}
      >
        {/* Masthead */}
        <header style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px 12px',
            }}
          >
            <span
              style={{
                flex: '1 1 220px',
                fontFamily: MONO,
                fontSize: '0.72rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--steel)',
                textAlign: 'center',
              }}
            >
              Tuesday · 10 November 2026 · built 12:00 UTC
            </span>
            <button
              type="button"
              data-theme-toggle
              style={{
                fontFamily: MONO,
                fontSize: '0.72rem',
                letterSpacing: '0.08em',
                color: 'var(--accent)',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 3,
                padding: '3px 10px',
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              Night
            </button>
          </div>
          <h1
            style={{
              margin: '14px 0 12px',
              fontFamily: SERIF,
              fontWeight: 700,
              fontStyle: 'italic',
              fontSize: 'clamp(3.75rem, 12vw, 7.5rem)',
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              color: 'var(--fg)',
            }}
          >
            The Context
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ flex: 1, borderTop: '1px solid var(--accent)' }} />
            <span
              style={{
                fontFamily: MONO,
                fontSize: '0.72rem',
                letterSpacing: '0.14em',
                color: 'var(--accent)',
                whiteSpace: 'nowrap',
              }}
            >
              the gazette of one reader
            </span>
            <span style={{ flex: 1, borderTop: '1px solid var(--accent)' }} />
          </div>
        </header>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '36px 48px', marginTop: 36, alignItems: 'flex-start' }}>
          {/* Rail */}
          <aside style={{ flex: '1 1 240px', minWidth: 0 }}>
            <Label>In this edition</Label>
            <nav style={{ marginTop: 6, borderTop: '1px solid var(--fg)' }}>
              {sections.map((s) => (
                <NavRow key={s.id} num={s.num} name={s.name} id={s.id} count={s.count} />
              ))}
            </nav>

            <Label style={{ marginTop: 32 }}>Patch queue</Label>
            <div style={{ marginTop: 6, borderTop: '1px solid var(--fg)' }}>
              {PATCHES.map((p) => (
                <div key={p.name} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 10px' }}>
                    <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: '1.05rem', color: 'var(--fg)' }}>{p.name}</span>
                    <span style={{ fontFamily: MONO, fontSize: '0.78rem', color: 'var(--purple)' }}>{p.ver}</span>
                    {p.pill ? <Pill text={p.pill.text} tone={p.pill.tone} /> : null}
                  </div>
                  <div style={{ fontSize: '0.95rem', lineHeight: 1.45, color: 'var(--fg2)', marginTop: 3 }}>{p.note}</div>
                </div>
              ))}
            </div>

            <Label style={{ marginTop: 32 }}>Dates</Label>
            <div style={{ marginTop: 6, borderTop: '1px solid var(--fg)' }}>
              {DATES.map((d) => (
                <div key={d.when} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: MONO, fontSize: '0.72rem', letterSpacing: '0.04em', color: 'var(--steel)' }}>{d.when}</div>
                  <div style={{ fontSize: '0.95rem', lineHeight: 1.45, color: 'var(--fg2)', marginTop: 2 }}>{d.what}</div>
                </div>
              ))}
            </div>
          </aside>

          {/* Main */}
          <main style={{ flex: '999 1 600px', minWidth: 0 }}>
            {/* The lead */}
            <article style={{ paddingBottom: 28, borderBottom: '3px double var(--fg)' }}>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: '0.78rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--urgent)',
                  marginBottom: 12,
                }}
              >
                03 · AI security · the lead
              </div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: SERIF,
                  fontWeight: 700,
                  fontSize: 'clamp(2rem, 4.4vw, 3.1rem)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.01em',
                  color: 'var(--fg)',
                  overflowWrap: 'anywhere',
                }}
              >
                <A href={LEAD.href} headline>
                  {LEAD.title}
                </A>
              </h2>
              <Meta style={{ marginTop: 14 }}>
                <A href={LEAD.href}>Ars Technica</A> · Kyle Orland · Nov 9 · research by Apiiro · fix: none yet
              </Meta>
              <Parts parts={LEAD.parts} large />
              <FullBreakdown b={LEAD.breakdown} />
            </article>

            {/* 01 */}
            <section id="ai" style={{ scrollMarginTop: 16 }}>
              <SectionHead
                num="01"
                title="AI"
                note="Fable 5.2 and Mythos 5.2 are the morning's news; around them, three stories about what models now cost."
              />
              <div style={GRID}>
                {AI.map((s, i) => (
                  <StoryCard key={i} s={s} />
                ))}
              </div>
            </section>

            {/* 02 */}
            <section id="claude" style={{ scrollMarginTop: 16 }}>
              <SectionHead num="02" title="From the Claude team" note="x.com feeds on the reading list, plus Claude Code releases." />
              <div style={GRID}>
                {CLAUDE.map((s, i) => (
                  <StoryCard key={i} s={s} />
                ))}
              </div>
              <div style={{ marginTop: 4 }}>
                <div style={feedNote}>@ClaudeDevs: feed unavailable this morning (HTTP 503).</div>
                <div style={feedNote}>@bcherny: nothing posted in the last week.</div>
                <div style={feedNote}>@trq212: nothing posted in the last week.</div>
              </div>
            </section>

            {/* 03 */}
            <section id="ai-security" style={{ scrollMarginTop: 16 }}>
              <SectionHead
                num="03"
                title="AI Security"
                note="Last 48 hours only. The lead above is entry 1 of 5; the other four follow."
              />
              <div style={GRID}>
                {AISEC.map((s, i) => (
                  <StoryCard key={i} s={s} />
                ))}
              </div>
            </section>

            {/* 04 */}
            <section id="homelab" style={{ scrollMarginTop: 16 }}>
              <SectionHead num="04" title="Homelab & Ops" note="Only what touches containers, SSH, registries and the boxes under your desk." />
              <div style={GRID}>
                {HOMELAB.map((s, i) => (
                  <StoryCard key={i} s={s} />
                ))}
              </div>
            </section>

            {/* 05 */}
            <section id="reddit" style={{ scrollMarginTop: 16 }}>
              <SectionHead
                num="05"
                title="From Reddit"
                note="Security subreddits only this morning: the AI and self-hosting feeds were rate-limited."
              />
              <Label style={{ marginTop: 22 }}>r/cybersecurity</Label>
              <div style={GRID}>
                {REDDIT_CYBER.map((s, i) => (
                  <StoryCard key={i} s={s} />
                ))}
              </div>
              <Label style={{ marginTop: 22 }}>r/blueteamsec</Label>
              <div style={GRID}>
                {REDDIT_BLUE.map((s, i) => (
                  <StoryCard key={i} s={s} />
                ))}
              </div>
            </section>
          </main>
        </div>

        {/* Footer */}
        <footer style={{ marginTop: 56, paddingTop: 28, borderTop: '3px double var(--fg)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px 48px' }}>
            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
              <Label>Ops wire</Label>
              <div style={{ marginTop: 8 }}>
                {OPS_WIRE.map((o) => (
                  <div
                    key={o.href}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 14px', padding: '7px 0', borderBottom: '1px solid var(--border)' }}
                  >
                    <span style={{ fontFamily: MONO, fontSize: '0.72rem', color: 'var(--steel)', minWidth: 132 }}>{o.time}</span>
                    <span style={{ flex: '1 1 200px', minWidth: 0, fontSize: '1rem', lineHeight: 1.45, overflowWrap: 'anywhere' }}>
                      <A href={o.href}>{o.text}</A>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
              <Label>Coverage notes</Label>
              <div style={{ marginTop: 8 }}>
                {COVERAGE.map((c) => (
                  <div key={c} style={{ ...feedNote, overflowWrap: 'anywhere' }}>
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 32,
              fontFamily: MONO,
              fontSize: '0.72rem',
              letterSpacing: '0.06em',
              color: 'var(--steel)',
              textAlign: 'center',
            }}
          >
            next edition 06:00 · built on the nas · <a href="archive/" style={{ color: 'var(--accent)' }}>archive</a>
          </div>
        </footer>
      </div>
    </div>
  );
}