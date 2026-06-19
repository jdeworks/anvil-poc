import { useEffect, useState } from "react";
import { useViewStore } from "../stores/view-store";
import { loadManifest, loadStats } from "../lib/demo";
import type { DemoManifest, DemoStats } from "../lib/types";
import { Card, Loading, Pill } from "../components/ui";

const KIND_LABEL: Record<string, string> = {
  paper: "Paper",
  url: "Web source",
  book: "Book",
};

export function LandingPage() {
  const openSource = useViewStore((s) => s.openSource);
  const setView = useViewStore((s) => s.setView);
  const [manifest, setManifest] = useState<DemoManifest | null>(null);
  const [stats, setStats] = useState<DemoStats | null>(null);

  useEffect(() => {
    loadManifest().then(setManifest).catch(() => {});
    loadStats().then(setStats).catch(() => {});
  }, []);

  if (!manifest) return <Loading />;

  const counts = stats?.counts ?? manifest.stats;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Know which sources to trust
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-fg-muted">
          anvil reads papers, books and web sources, extracts their claims, and
          scores trustworthiness, novelty and relevance against your context,
          with the evidence to back every verdict.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => setView("sources")}
            className="rounded-lg bg-accent px-6 py-2.5 font-medium text-accent-fg"
          >
            Explore the analysis
          </button>
          <button
            onClick={() => setView("how-it-works")}
            className="rounded-lg border border-line px-6 py-2.5 font-medium text-fg-muted hover:text-fg"
          >
            How it works
          </button>
        </div>
        <p className="mt-3 text-xs text-fg-muted">
          Static demo · real analysis output · no backend
        </p>
      </section>

      <section className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Sources" value={counts.papers} />
        <Stat label="Evaluations" value={counts.evaluations} />
        {counts.candidates ? (
          <Stat label="Reproduction candidates" value={counts.candidates} />
        ) : (
          <Stat label="Claims extracted" value={counts.papers} />
        )}
      </section>
      <p className="mb-10 text-xs text-fg-muted">
        Proof-of-concept view. The figures here don't reflect the real volume
        already in the system, and the final product may differ.
      </p>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">
          Explore a fully-analysed source
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {manifest.heroes.map((h) => (
            <Card key={h.id} onClick={() => openSource(h.id)}>
              <Pill tone="accent">{KIND_LABEL[h.kind] ?? h.kind}</Pill>
              <div className="mt-2 text-sm font-medium leading-snug">{h.title}</div>
              <div className="mt-3 text-xs font-medium text-accent">Explore →</div>
            </Card>
          ))}
        </div>
      </section>

      {stats?.top_picks && stats.top_picks.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">
            Top relevancy picks
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.top_picks.slice(0, 3).map((t) => (
              <Card key={`${t.ro_id}:${t.context_id}`}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-fg-muted">
                    {t.context_name}
                  </span>
                  <Pill tone="success">{Math.round(t.score_overall * 100)}</Pill>
                </div>
                <div className="text-sm font-medium">{t.title ?? "Untitled"}</div>
                {t.summary_text && (
                  <p className="mt-2 line-clamp-3 text-xs text-fg-muted">
                    {t.summary_text}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-canvas-alt p-5 text-center">
      <div className="text-3xl font-semibold tabular-nums">
        {value.toLocaleString()}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-fg-muted">
        {label}
      </div>
    </div>
  );
}
