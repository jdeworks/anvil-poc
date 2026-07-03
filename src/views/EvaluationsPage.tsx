import { useEffect, useState } from "react";
import { useViewStore } from "../stores/view-store";
import { loadEvaluations, loadManifest } from "../lib/demo";
import type { EvaluationRow } from "../lib/types";
import { ErrorNote, Loading, ScoreBadge } from "../components/ui";

function fmtDate(iso: string | null): string {
  if (!iso) return "n/a";
  return iso.slice(0, 10);
}

export function EvaluationsPage() {
  const openSource = useViewStore((s) => s.openSource);
  const [rows, setRows] = useState<EvaluationRow[] | null>(null);
  const [heroes, setHeroes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvaluations().then(setRows).catch((e) => setError(String(e)));
    loadManifest()
      .then((m) => setHeroes(new Set(m.heroes.map((h) => h.id))))
      .catch(() => {});
  }, []);

  if (error) return <div className="p-6"><ErrorNote>{error}</ErrorNote></div>;
  if (!rows) return <Loading />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Evaluations</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Each source scored for relevance against a context, with a full report
          behind every row.
        </p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="min-w-[600px] w-full text-sm">
          <thead className="bg-canvas-alt text-left text-xs uppercase tracking-wider text-fg-muted">
            <tr>
              <th className="px-4 py-2 font-semibold">Title</th>
              <th className="px-4 py-2 font-semibold">Context</th>
              <th className="px-4 py-2 text-right font-semibold">Relevance</th>
              <th className="px-4 py-2 font-semibold">Evaluated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isHero = heroes.has(r.research_object_id);
              return (
                <tr
                  key={`${r.research_object_id}:${r.context_id}:${i}`}
                  onClick={() =>
                    isHero &&
                    openSource(r.research_object_id, {
                      tab: "contexts",
                      contextName: r.context_name,
                    })
                  }
                  className={`border-t border-line ${
                    isHero
                      ? "cursor-pointer hover:bg-canvas-alt"
                      : ""
                  }`}
                >
                  <td className="max-w-[28rem] px-4 py-2.5">
                    {isHero && (
                      <span className="mr-1.5 text-accent" role="img" aria-label="Highlighted source">
                        ★
                      </span>
                    )}
                    <span className={isHero ? "font-medium text-accent" : "font-medium"}>
                      {r.title ?? r.research_object_id.slice(0, 8)}
                    </span>
                    {r.authors?.length > 0 && (
                      <div className="mt-0.5 text-xs text-fg-muted">
                        {r.authors.slice(0, 2).join(", ")}
                        {r.authors.length > 2 ? ` +${r.authors.length - 2}` : ""}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-fg-muted">{r.context_name}</td>
                  <td className="px-4 py-2.5 text-right">
                    <ScoreBadge value={r.score_overall} />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-fg-muted">
                    {fmtDate(r.evaluated_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-fg-muted">
        ★ highlighted sources open their full evaluation; the rest are read-only
        in this demo.
      </p>
    </div>
  );
}
