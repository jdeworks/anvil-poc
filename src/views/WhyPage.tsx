import { useViewStore } from "../stores/view-store";
import { Card } from "../components/ui";

export function WhyPage() {
  const setView = useViewStore((s) => s.setView);
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">
          The problem isn't access. It's relevance.
        </h1>
        <p className="mt-3 text-lg text-fg-muted">
          New papers, preprints and blog posts go live every day. Almost none of
          them matter for your work. anvil reads the firehose so you only see the
          few that do, and tells you whether they're even true.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat
            n="20,000+"
            l="new papers a month on arXiv alone (a record ~24,000 in Oct 2024)"
            s="arXiv"
            url="https://blog.arxiv.org/2024/11/04/arxiv-sets-new-record-for-monthly-submissions-again/"
          />
          <Stat
            n="~20%"
            l="of the work week lost just searching for information"
            s="McKinsey"
            url="https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy"
          />
          <Stat
            n="30 to 60 min"
            l="to read a single paper"
            s="Tenopir & King"
            url="https://www.scientificamerican.com/article/scientists-reading-fewer-papers-for-first-time-in-35-years/"
          />
        </div>
      </header>

      <div className="space-y-4">
        <Card>
          <h3 className="mb-1 text-lg font-semibold">There is too much to read</h3>
          <p className="text-sm leading-relaxed text-fg-muted">
            Keeping up with one narrow subfield is already more than a full-time
            job. Across the topics a real team cares about, nobody can read it
            all. The result is that important work gets missed and noise gets
            shared.
          </p>
        </Card>

        <Card>
          <h3 className="mb-1 text-lg font-semibold">
            Popular is not the same as valuable
          </h3>
          <p className="text-sm leading-relaxed text-fg-muted">
            The LinkedIn feed, Hacker News and the rest optimize for engagement,
            not for what changes how you build. A thread can go viral while the
            paper that actually affects your architecture sits unread. What is
            interesting to the algorithm and what is valuable to you rarely line
            up.
          </p>
        </Card>

        <Card>
          <h3 className="mb-1 text-lg font-semibold">Relevance is personal</h3>
          <p className="text-sm leading-relaxed text-fg-muted">
            A result that is a breakthrough for one team is irrelevant to the
            next. Relevance depends on your stack, your constraints and your
            goals. anvil scores every source against your context, so a paper can
            rank high for you and be filtered out for someone else. Filtering out
            the noise is the point.
          </p>
        </Card>

        <Card>
          <h3 className="mb-1 text-lg font-semibold">And is it even true?</h3>
          <p className="text-sm leading-relaxed text-fg-muted">
            Plenty of confident claims do not hold up. anvil pulls out each claim
            and checks it against independent sources rather than taking it at
            face value. Where a claim really matters, or a customer asks, it can
            be put through an experiment to test it directly.
          </p>
        </Card>
      </div>

      <div className="mt-10 flex gap-3">
        <button
          onClick={() => setView("sources")}
          className="cursor-pointer rounded-lg bg-accent px-6 py-2.5 font-medium text-accent-fg"
        >
          See it on real sources
        </button>
        <button
          onClick={() => setView("how-it-works")}
          className="cursor-pointer rounded-lg border border-line px-6 py-2.5 font-medium text-fg-muted hover:text-fg"
        >
          How it works
        </button>
      </div>
    </div>
  );
}

function Stat({ n, l, s, url }: { n: string; l: string; s: string; url?: string }) {
  return (
    <div className="rounded-lg border border-line bg-canvas-alt p-3">
      <div className="text-xl font-bold tabular-nums text-accent">{n}</div>
      <div className="mt-0.5 text-xs">{l}</div>
      <div className="mt-0.5 text-xs text-fg-muted">
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="hover:underline">
            {s}
          </a>
        ) : (
          s
        )}
      </div>
    </div>
  );
}
