import { useViewStore } from "../stores/view-store";

const STEPS = [
  {
    n: "01",
    title: "We watch the firehose, you don't",
    body: "anvil continuously pulls in new work from major publishers, preprint servers and curated feeds, plus the newest papers as they appear. You never upload anything. If we ever miss a source you care about you can point us at it, but that is the exception, not the workflow.",
  },
  {
    n: "02",
    title: "Scored against your context",
    body: "You describe your stack, constraints and goals once. anvil works out which sources are actually relevant to that context and scores them for you, so what matters ranks high and the rest stays out of your way. The same source can be essential for your team and noise for the next.",
  },
  {
    n: "03",
    title: "A short list, not a feed",
    body: "Instead of an endless timeline you get the handful of sources that actually change what you should do, each with the claims, the trust signals and the evidence behind the verdict.",
  },
  {
    n: "04",
    title: "From insight to implementation",
    body: "For the sources that matter, anvil drafts concrete instructions your team or an LLM can follow to apply the change in your own codebase. The point is not just to know, it is to act.",
  },
];

export function HowItWorksPage() {
  const setView = useViewStore((s) => s.setView);
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight">How anvil works</h1>
        <p className="text-fg-muted">
          From the daily flood of new work to a short, actionable list for your team.
        </p>
      </header>

      <div className="space-y-4">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="flex gap-4 rounded-xl border border-line bg-canvas-alt p-5"
          >
            <div className="text-2xl font-bold tabular-nums text-accent">{s.n}</div>
            <div>
              <h3 className="mb-1 text-lg font-semibold">{s.title}</h3>
              <p className="text-sm leading-relaxed text-fg-muted">{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <button
          onClick={() => setView("sources")}
          className="rounded-lg bg-accent px-8 py-3 font-medium text-accent-fg"
        >
          See it on a real source
        </button>
      </div>
    </div>
  );
}
