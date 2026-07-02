import { useEffect, useState } from "react";
import { useViewStore } from "../stores/view-store";
import { loadCatalog } from "../lib/demo";
import type { CatalogRow, DemoCatalog } from "../lib/types";
import { ErrorNote, Loading, Pill } from "../components/ui";

const KIND_LABEL: Record<string, string> = {
  paper: "Paper",
  url: "Web",
  book: "Book",
};

export function SourcesPage() {
  const openSource = useViewStore((s) => s.openSource);
  const setView = useViewStore((s) => s.setView);
  const [catalog, setCatalog] = useState<DemoCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [teaser, setTeaser] = useState<CatalogRow | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadCatalog().then(setCatalog).catch((e) => setError(String(e)));
  }, []);

  if (error) return <div className="p-6"><ErrorNote>{error}</ErrorNote></div>;
  if (!catalog) return <Loading />;

  const rows = catalog.items.filter(
    (r) => filter === "all" || r.kind === filter,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Data sources</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {catalog.total.toLocaleString()} sources analysed in the full corpus,
          showing {catalog.items.length}. The three highlighted sources are fully
          explorable in this demo.
        </p>
      </header>

      <div className="mb-3 flex flex-wrap gap-2">
        {["all", "paper", "url", "book"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs ${
              filter === f
                ? "border-accent text-accent"
                : "border-line text-fg-muted hover:text-fg"
            }`}
          >
            {f === "all" ? "All" : KIND_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead className="bg-canvas-alt text-left text-xs uppercase tracking-wider text-fg-muted">
            <tr>
              <th className="px-4 py-2 font-semibold">Title</th>
              <th className="px-4 py-2 font-semibold">Type</th>
              <th className="w-28 px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => (r.hero ? openSource(r.id) : setTeaser(r))}
                className="cursor-pointer border-t border-line transition-colors hover:bg-canvas-alt"
              >
                <td className="max-w-[28rem] px-4 py-2.5 align-top">
                  <div className="flex items-center gap-2">
                    {r.hero && <span className="text-accent">★</span>}
                    <span className="font-medium">{r.title}</span>
                  </div>
                  {r.tldr && (
                    <div className="mt-0.5 line-clamp-1 text-xs text-fg-muted">
                      {r.tldr}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5 align-top">
                  <Pill>{KIND_LABEL[r.kind] ?? r.kind}</Pill>
                </td>
                <td className="px-4 py-2.5 text-right align-top">
                  {r.hero ? (
                    <span className="text-xs font-medium text-accent">Explore →</span>
                  ) : (
                    <span className="text-xs text-fg-muted">🔒</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {teaser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setTeaser(null)}
        >
          <div
            className="max-w-md rounded-xl border border-line bg-canvas-alt p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 text-3xl">🔒</div>
            <h3 className="mb-1 text-lg font-semibold">Not part of the POC preview</h3>
            <p className="mb-2 text-sm text-fg-muted">
              <span className="font-medium text-fg">{teaser.title}</span> has been
              analysed in the full product, but only the three highlighted sources
              ship in this static demo.
            </p>
            <p className="mb-5 text-sm text-fg-muted">
              The full corpus holds {catalog.total.toLocaleString()} analysed
              sources with claims, trust signals, knowledge graphs and
              cross-context scoring.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setTeaser(null);
                  setView("survey");
                }}
                className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-fg"
              >
                Join the waitlist
              </button>
              <button
                onClick={() => setTeaser(null)}
                className="rounded-lg border border-line px-5 py-2 text-sm text-fg-muted hover:text-fg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
