import { useViewStore } from "../stores/view-store";

const STATS: { value: string; label: string; source: string; url: string }[] = [
  {
    value: "102K → 242K",
    label: "AI publications a year nearly tripled (2013 to 2023); AI is now ~42% of all computer-science research",
    source: "Stanford AI Index 2025",
    url: "https://hai.stanford.edu/ai-index/2025-ai-index-report",
  },
  {
    value: "20,000+ / mo",
    label: "new papers on arXiv alone, with a record ~24,000 in a single month (Oct 2024)",
    source: "arXiv",
    url: "https://blog.arxiv.org/2024/11/04/arxiv-sets-new-record-for-monthly-submissions-again/",
  },
  {
    value: "3.3 million",
    label: "peer-reviewed articles published worldwide in 2022 alone, and rising",
    source: "NSF Science & Engineering Indicators",
    url: "https://ncses.nsf.gov/pubs/nsb202333/",
  },
  {
    value: "~20%",
    label: "of the knowledge-worker week lost just searching for information",
    source: "McKinsey",
    url: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
  },
  {
    value: "30 to 60 min",
    label: "to read a single paper, and researchers get through ~250 a year",
    source: "Tenopir & King",
    url: "https://www.scientificamerican.com/article/scientists-reading-fewer-papers-for-first-time-in-35-years/",
  },
  {
    value: "78%",
    label: "of researchers call publication overload a major challenge",
    source: "Library Philosophy & Practice",
    url: "https://digitalcommons.unl.edu/cgi/viewcontent.cgi?article=13427&context=libphilprac",
  },
];

// Honest framing: discovery and evidence-aggregation are crowded; anvil's edge
// is the combination, not any single row. "Most tools today" describes the field
// fairly (some tools really do aggregate evidence) without strawmanning.
const COMPARISON: [string, string, string][] = [
  ["Relevance", "Topical or interest-based (your saved topics)", "Scored to a team's actual stack and goals"],
  ["Claims", "Aggregate how others cite or agree", "Each key claim checked independently"],
  ["Output", "A feed, a summary, or standalone code", "Guidance to integrate into your codebase"],
  ["Sources", "Mostly academic corpora", "Papers, books and the open web"],
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function InvestorsPage() {
  const setView = useViewStore((s) => s.setView);
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 rounded-lg border border-accent/40 bg-accent/5 px-5 py-3 text-sm">
        <strong className="text-accent">Proof of concept.</strong> You are looking
        at a working prototype with real analysis output, served fully static.
      </div>

      <header className="mb-8 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight">
          Trust and relevance for an AI-written world
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-fg-muted">
          The volume of new research and writing is exploding while the time
          anyone has to read it is flat. anvil reads it all, keeps only what is
          relevant to you, and tells you whether it is even true.
        </p>
      </header>

      <Section title="The pressure, by the numbers">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl border border-line bg-canvas-alt p-4">
              <div className="text-2xl font-bold tabular-nums text-accent">
                {s.value}
              </div>
              <div className="mt-1 text-sm">{s.label}</div>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-xs text-fg-muted hover:underline"
              >
                {s.source}
              </a>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-fg-muted">
          Explosive growth, raw volume, and a fixed human day. The gap between
          what is published and what anyone can actually use keeps widening.
        </p>
      </Section>

      <Section title="The problem">
        <p className="text-sm leading-relaxed text-fg-muted">
          Researchers, analysts and engineers drown in plausible looking sources.
          Existing tools either summarise and hide the reasoning, or rank by
          popularity. Neither tells you whether a specific claim holds up, or
          whether a source matters for your work in particular.
        </p>
      </Section>

      <Section title="Our approach">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Feature
            title="Claim level"
            body="Every claim is pulled out and checked independently against outside sources, not summarised away."
          />
          <Feature
            title="Independent checks"
            body="Key claims are checked against outside sources, and tested directly with an experiment where it matters. Reputation is only a minor signal."
          />
          <Feature
            title="Relevant to you"
            body="Scored against your stack, constraints and goals, then turned into instructions to actually act."
          />
        </div>
      </Section>

      <Section title="Why it defends itself">
        <ul className="space-y-2 text-sm text-fg-muted">
          <li className="rounded-lg border border-line p-3">
            <span className="font-medium text-fg">Relevance is the hard part.</span>{" "}
            Anyone can summarise a paper. Judging whether it matters for a specific
            stack and goals, with evidence to defend the call, is what is hard and
            what compounds as the corpus grows.
          </li>
          <li className="rounded-lg border border-line p-3">
            <span className="font-medium text-fg">From insight to implementation.</span>{" "}
            The output is not a reading list. It is the short list of things that
            matter plus the changes to make, which is where the value lands.
          </li>
        </ul>
      </Section>

      <Section title="Where we fit">
        <p className="mb-3 text-sm leading-relaxed text-fg-muted">
          Discovery and evidence aggregation are mature, crowded layers. Tools
          like Semantic Scholar, Elicit, Consensus and scite find papers and show
          how the literature cites or agrees with a claim, and they do it well. We
          do not try to reinvent that. anvil's place is the connective tissue from
          a source being ingested to a change being shipped: relevance to a
          specific team, independent checks on the key claims, and integration
          guidance for that team's codebase.
        </p>
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="bg-canvas-alt text-left text-xs uppercase tracking-wider text-fg-muted">
              <tr>
                <th className="px-4 py-2">Dimension</th>
                <th className="px-4 py-2">Most tools today</th>
                <th className="px-4 py-2 text-accent">anvil</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([c, a, b]) => (
                <tr key={c} className="border-t border-line">
                  <td className="px-4 py-2 font-medium">{c}</td>
                  <td className="px-4 py-2 text-fg-muted">{a}</td>
                  <td className="px-4 py-2">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="mt-10 text-center">
        <button
          onClick={() => setView("survey")}
          className="rounded-lg bg-accent px-8 py-3 font-medium text-accent-fg"
        >
          Get in touch
        </button>
      </div>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-line bg-canvas-alt p-4">
      <div className="mb-1 text-sm font-semibold">{title}</div>
      <p className="text-xs leading-relaxed text-fg-muted">{body}</p>
    </div>
  );
}
