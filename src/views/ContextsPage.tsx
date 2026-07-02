import { useEffect, useState } from "react";
import { useViewStore } from "../stores/view-store";
import { loadContext, loadManifest } from "../lib/demo";
import type { ContextDetail, ContextRef } from "../lib/types";
import { Card, Loading, Pill, Section } from "../components/ui";

export function ContextsPage() {
  const view = useViewStore((s) => s.view);
  const contextName = useViewStore((s) => s.contextName);
  const openContext = useViewStore((s) => s.openContext);
  const setView = useViewStore((s) => s.setView);
  const [contexts, setContexts] = useState<ContextRef[] | null>(null);
  const [detail, setDetail] = useState<ContextDetail | null>(null);

  useEffect(() => {
    loadManifest().then((m) => setContexts(m.contexts)).catch(() => setContexts([]));
  }, []);

  useEffect(() => {
    if (view === "context" && contextName) {
      setDetail(null);
      loadContext(contextName).then(setDetail).catch(() => setDetail(null));
    }
  }, [view, contextName]);

  if (view === "context") {
    if (!detail) return <Loading label="Loading context…" />;
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <button
          onClick={() => setView("contexts")}
          className="mb-4 text-sm text-fg-muted hover:text-fg"
        >
          ← Contexts
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">
          {detail.display_name || detail.name}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Auto-extracted from a real codebase. The stack, constraints and goals
          below were detected from the source, not hand-written, and anvil scores
          every source against them so relevance stays concrete.
          {detail.name === "ctx_anvil_v3" && " This one is anvil itself."}
        </p>
        {detail.organization && (
          <p className="mt-1 text-sm text-fg-muted">
            Organization: {detail.organization}
          </p>
        )}
        {typeof detail.paper_count === "number" && (
          <p className="mt-1 text-sm text-fg-muted">
            {detail.paper_count} sources scored against this context
          </p>
        )}

        {detail.goals && detail.goals.length > 0 && (
          <Section title="Goals">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {detail.goals.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </Section>
        )}

        {detail.tech_stack && (
          <Section title="Tech stack">
            <div className="space-y-2">
              {Object.entries(detail.tech_stack).map(([k, v]) =>
                v && (v as string[]).length ? (
                  <div key={k} className="flex flex-wrap items-center gap-2">
                    <span className="w-28 shrink-0 text-xs uppercase tracking-wider text-fg-muted">
                      {k}
                    </span>
                    {(v as string[]).map((item) => (
                      <Pill key={item}>{item}</Pill>
                    ))}
                  </div>
                ) : null,
              )}
            </div>
          </Section>
        )}

        {detail.constraints && Object.keys(detail.constraints).length > 0 && (
          <Section title="Constraints">
            <div className="flex flex-wrap gap-2">
              {Object.entries(detail.constraints).map(([k, v]) => (
                <Pill key={k}>
                  {k}: {String(v)}
                </Pill>
              ))}
            </div>
          </Section>
        )}

        {detail.source_yaml && (
          <Section title="Context definition (YAML)">
            <details className="rounded-lg border border-line bg-canvas-alt">
              <summary className="cursor-pointer px-4 py-2 text-sm text-fg-muted">
                Show the full context anvil scores against
              </summary>
              <pre className="max-h-[360px] overflow-auto border-t border-line px-4 py-3 text-xs leading-relaxed text-fg-muted">
                {detail.source_yaml}
              </pre>
            </details>
          </Section>
        )}
      </div>
    );
  }

  if (!contexts) return <Loading />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Contexts</h1>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">
          A context describes a team (stack, constraints, goals) so anvil scores
          relevance for them, not in the abstract. Both below were auto-extracted
          from real codebases: anvil's own, and the auto-audiobook project.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {contexts.map((c) => (
          <Card key={c.name} onClick={() => openContext(c.name)}>
            <div className="font-medium">{c.display_name || c.name}</div>
            <div className="mt-2 text-xs font-medium text-accent">View context →</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
