import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useViewStore } from "../stores/view-store";
import { loadSource } from "../lib/demo";
import {
  scoreOf,
  type SourceBundle,
  type SourceContent,
  type Trustworthiness,
} from "../lib/types";
import {
  Card,
  DeltaSign,
  ErrorNote,
  Loading,
  Meter,
  noveltyWord,
  Pill,
  qualityWord,
  ScoreBadge,
  Section,
  StrengthSign,
} from "../components/ui";

type Tab = "overview" | "source" | "analysis" | "trust" | "contexts" | "citations";

/** Relevance colour ramp matching anvil: grey < 33, accent 33–66, green > 66. */
function relevanceColor(value: number | null | undefined): string {
  const pct = value == null ? 0 : Math.round(value * 100);
  if (pct >= 66) return "var(--color-success-fg)";
  if (pct >= 33) return "var(--color-accent)";
  return "var(--color-fg-muted)";
}

export function SourcePage() {
  const id = useViewStore((s) => s.sourceId);
  const initialTab = useViewStore((s) => s.sourceTab);
  const initialContext = useViewStore((s) => s.sourceContext);
  const setView = useViewStore((s) => s.setView);
  const [bundle, setBundle] = useState<SourceBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!id) return;
    setBundle(null);
    setError(null);
    setTab((initialTab as Tab) || "overview");
    loadSource(id)
      .then(setBundle)
      .catch((e) => setError(String(e)));
  }, [id, initialTab]);

  if (!id) return <ErrorNote>No source selected.</ErrorNote>;
  if (error) return <div className="p-6"><ErrorNote>{error}</ErrorNote></div>;
  if (!bundle) return <Loading label="Loading analysis…" />;

  const { detail, content, analysis, citations, evaluations } = bundle;
  const kindLabel = { paper: "Paper", url: "Web source", book: "Book" }[bundle.kind];
  const hasContent = !!(
    content?.sections?.length ||
    content?.text ||
    content?.chapters?.length
  );

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "overview", label: "Overview", show: true },
    { id: "source", label: "Source text", show: hasContent },
    { id: "analysis", label: "Analysis", show: !!analysis },
    { id: "trust", label: "Trust signals", show: !!analysis?.trustworthiness },
    { id: "contexts", label: "Relevance", show: !!evaluations?.length },
    { id: "citations", label: "Citations", show: !!citations?.length },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <button
        onClick={() => setView("sources")}
        className="mb-4 text-sm text-fg-muted hover:text-fg"
      >
        ← Data sources
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1">
            <Pill tone="accent">{kindLabel}</Pill>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{detail.title}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {(detail.authors ?? []).join(", ") || "Unknown authors"}
            {detail.year ? ` · ${detail.year}` : ""}
            {detail.page_count ? ` · ${detail.page_count} pp` : ""}
          </p>
          {detail.source_url && (
            <a
              href={detail.source_url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm text-accent hover:underline"
            >
              View original ↗
            </a>
          )}
        </div>
      </div>

      {/* tabs */}
      <div className="mt-5 flex flex-wrap gap-1 border-b border-line">
        {tabs.filter((t) => t.show).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              tab === t.id
                ? "border-accent text-fg"
                : "border-transparent text-fg-muted hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && <Overview bundle={bundle} />}
        {tab === "source" && content && (
          <SourceTab content={content} kind={bundle.kind} />
        )}
        {tab === "analysis" && analysis && <AnalysisTab analysis={analysis} />}
        {tab === "trust" && (
          <TrustTab trust={analysis?.trustworthiness as Trustworthiness} />
        )}
        {tab === "contexts" && (
          <ContextsTab bundle={bundle} initialContext={initialContext} />
        )}
        {tab === "citations" && <CitationsTab bundle={bundle} />}
      </div>
    </div>
  );
}

function Overview({ bundle }: { bundle: SourceBundle }) {
  const { detail, summary, analysis } = bundle;
  return (
    <div className="space-y-6">
      {summary?.summary_text && (
        <Card>
          <div className="mb-2 text-xs uppercase tracking-wider text-fg-muted">
            Summary
          </div>
          <p className="text-sm leading-relaxed">{summary.summary_text}</p>
          {summary.general_claim && (
            <p className="mt-3 border-l-2 border-accent pl-3 text-sm italic text-fg-muted">
              {summary.general_claim}
            </p>
          )}
        </Card>
      )}

      {bundle.kind === "book" && !analysis && (
        <p className="rounded-lg border border-line bg-canvas-alt px-4 py-3 text-sm text-fg-muted">
          anvil analyses books chapter by chapter. The full per-chapter claim
          and trust analysis isn't baked into this static preview — the chapter
          map below shows each chapter's verdict.
        </p>
      )}

      {analysis && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <Meter
              label="Trustworthiness"
              value={scoreOf(analysis.trustworthiness)}
              word={qualityWord(scoreOf(analysis.trustworthiness))}
            />
          </Card>
          <Card>
            <Meter
              label="Novelty"
              value={scoreOf(analysis.novelty)}
              word={noveltyWord(scoreOf(analysis.novelty))}
            />
          </Card>
          <Card>
            <Meter
              label="Reproducibility"
              value={scoreOf(analysis.reproducibility)}
              word={qualityWord(scoreOf(analysis.reproducibility))}
            />
          </Card>
        </div>
      )}

      {detail.abstract && (
        <Card>
          <div className="mb-2 text-xs uppercase tracking-wider text-fg-muted">
            Abstract
          </div>
          <p className="text-sm leading-relaxed text-fg-muted">{detail.abstract}</p>
        </Card>
      )}

      {summary?.key_findings && summary.key_findings.length > 0 && (
        <Card>
          <div className="mb-2 text-xs uppercase tracking-wider text-fg-muted">
            Key findings
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {summary.key_findings.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* book chapters */}
      {detail.clusters && detail.clusters.length > 0 && (
        <Section title={`Chapters (${detail.cluster_count ?? detail.clusters.length})`}>
          <div className="overflow-hidden rounded-lg border border-line">
            <table className="w-full text-sm">
              <tbody>
                {detail.clusters.map((c, i) => (
                  <tr key={i} className="border-t border-line first:border-t-0">
                    <td className="px-4 py-2">{c.title}</td>
                    <td className="px-4 py-2 text-right">
                      {c.summary_verdict && (
                        <Pill
                          tone={
                            c.summary_verdict === "plausible"
                              ? "success"
                              : c.summary_verdict === "questionable"
                                ? "warn"
                                : "neutral"
                          }
                        >
                          {c.summary_verdict}
                        </Pill>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}

function AnalysisTab({ analysis }: { analysis: NonNullable<SourceBundle["analysis"]> }) {
  return (
    <div className="space-y-6">
      {analysis.tool_stack && analysis.tool_stack.length > 0 && (
        <div>
          <div className="mb-2 text-xs uppercase tracking-wider text-fg-muted">
            Tool stack
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.tool_stack.map((t) => (
              <Pill key={t}>{t}</Pill>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 text-xs uppercase tracking-wider text-fg-muted">
          Claims{" "}
          {analysis.claim_total
            ? `(showing ${analysis.claims?.length ?? 0} of ${analysis.claim_total})`
            : ""}
        </div>
        <div className="space-y-2">
          {(analysis.claims ?? []).map((c, i) => (
            <Card key={i} className="!p-4">
              <p className="text-sm">{c.text}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {c.evidence_type && <Pill>{c.evidence_type.replace(/_/g, " ")}</Pill>}
                {c.provenance && <Pill>{c.provenance}</Pill>}
                {c.corroboration_verdict && (
                  <Pill
                    tone={c.corroboration_verdict === "supported" ? "success" : "neutral"}
                  >
                    corroboration: {c.corroboration_verdict}
                  </Pill>
                )}
                {typeof c.evidence_strength === "number" && (
                  <span className="flex items-center gap-1 text-fg-muted">
                    evidence <StrengthSign value={c.evidence_strength} />
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {analysis.methods && analysis.methods.length > 0 && (
        <div>
          <div className="mb-2 text-xs uppercase tracking-wider text-fg-muted">
            Methods
          </div>
          <div className="space-y-2">
            {analysis.methods.map((m, i) => (
              <Card key={i} className="!p-4">
                <div className="text-sm font-medium">{m.name}</div>
                {m.description && (
                  <p className="mt-1 text-xs text-fg-muted">{m.description}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TrustTab({ trust }: { trust: Trustworthiness | undefined }) {
  if (!trust) return <p className="text-sm text-fg-muted">No trust signals.</p>;
  return (
    <div className="space-y-5">
      <Card>
        <Meter
          label="Trustworthiness"
          value={trust.score}
          word={qualityWord(trust.score ?? null)}
        />
      </Card>
      {trust.summary && (
        <Card>
          <p className="text-sm leading-relaxed">{trust.summary}</p>
        </Card>
      )}
      {trust.reasons && trust.reasons.length > 0 && (
        <div>
          <div className="mb-2 text-xs uppercase tracking-wider text-fg-muted">
            Signals
          </div>
          <div className="space-y-2">
            {trust.reasons.map((r, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-line bg-canvas-alt p-3"
              >
                <span className="mt-0.5 w-6 shrink-0 text-center">
                  <DeltaSign delta={r.delta} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{r.label}</div>
                  {r.evidence && (
                    <p className="mt-1 text-xs text-fg-muted">{r.evidence}</p>
                  )}
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-xs text-accent hover:underline"
                    >
                      {r.url}
                    </a>
                  )}
                </div>
                {r.kind && <Pill>{r.kind}</Pill>}
              </div>
            ))}
          </div>
        </div>
      )}
      {trust.claim_corroborations && trust.claim_corroborations.length > 0 && (
        <div>
          <div className="mb-2 text-xs uppercase tracking-wider text-fg-muted">
            Claim corroboration
          </div>
          <div className="space-y-2">
            {trust.claim_corroborations.map((c, i) => (
              <Card key={i} className="!p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm">{c.claim_text}</p>
                  <Pill tone={c.verdict === "supported" ? "success" : "warn"}>
                    {c.verdict}
                  </Pill>
                </div>
                {c.note && <p className="mt-2 text-xs text-fg-muted">{c.note}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Render the evaluation report markdown as a styled web view (no typography plugin).
const MD = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="mb-2 mt-4 text-lg font-semibold text-fg">{children}</h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="mb-2 mt-4 text-base font-semibold text-fg">{children}</h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="mb-1 mt-3 text-sm font-semibold text-fg">{children}</h3>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-2 text-sm leading-relaxed text-fg-muted">{children}</p>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 text-sm text-fg-muted">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 text-sm text-fg-muted">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li className="">{children}</li>,
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-fg">{children}</strong>
  ),
  em: ({ children }: { children?: ReactNode }) => (
    <em className="italic text-fg-muted">{children}</em>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded bg-canvas px-1 py-0.5 font-mono text-xs text-fg">{children}</code>
  ),
  a: ({ id, href, children }: { id?: string; href?: string; children?: ReactNode }) => {
    // Heading anchors (`<a id="...">` with no href) are layout markers, not links.
    if (!href) return <span id={id} />;
    return (
      <a href={href} target="_blank" rel="noreferrer" className="text-accent hover:underline">
        {children}
      </a>
    );
  },
  hr: () => <hr className="my-4 border-line" />,
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="mb-2 border-l-2 border-accent bg-canvas px-3 py-2 text-sm text-fg-muted [&>p]:mb-0">
      {children}
    </blockquote>
  ),
  table: ({ children }: { children?: ReactNode }) => (
    <div className="mb-3 overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: ReactNode }) => (
    <thead className="bg-canvas text-xs uppercase tracking-wider text-fg-muted">
      {children}
    </thead>
  ),
  tbody: ({ children }: { children?: ReactNode }) => (
    <tbody className="divide-y divide-line">{children}</tbody>
  ),
  tr: ({ children }: { children?: ReactNode }) => (
    <tr className="border-t border-line first:border-t-0">{children}</tr>
  ),
  th: ({ children, style }: { children?: ReactNode; style?: CSSProperties }) => (
    <th className="px-3 py-2 font-medium" style={style}>
      {children}
    </th>
  ),
  td: ({ children, style }: { children?: ReactNode; style?: CSSProperties }) => (
    <td className="px-3 py-2 text-fg-muted" style={style}>
      {children}
    </td>
  ),
  details: ({ children }: { children?: ReactNode }) => (
    <details className="mb-3 rounded-lg border border-line bg-canvas px-3 py-2 [&_details]:mt-2">
      {children}
    </details>
  ),
  summary: ({ children }: { children?: ReactNode }) => (
    <summary className="cursor-pointer text-sm text-fg-muted marker:text-fg-muted">
      {children}
    </summary>
  ),
};

function ContextsTab({
  bundle,
  initialContext,
}: {
  bundle: SourceBundle;
  initialContext: string | null;
}) {
  const evals = bundle.evaluations ?? [];
  const startIdx = Math.max(
    0,
    evals.findIndex((e) => e.context_name === initialContext),
  );
  const [open, setOpen] = useState(startIdx);
  if (!evals.length) return <p className="text-sm text-fg-muted">No evaluations.</p>;
  const current = evals[open];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {evals.map((e, i) => (
          <button
            key={i}
            onClick={() => setOpen(i)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              open === i ? "border-accent" : "border-line text-fg-muted"
            }`}
          >
            {e.context_name}
            <ScoreBadge value={e.score_overall} />
          </button>
        ))}
      </div>
      {current?.other_context_scores && current.other_context_scores.length > 0 && (
        <Card>
          <div className="mb-2 text-xs uppercase tracking-wider text-fg-muted">
            Relevance across contexts
          </div>
          <div className="space-y-2">
            {current.other_context_scores.map((o, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm">{o.ctx_name}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((o.score_overall ?? 0) * 100)}%`,
                      background: relevanceColor(o.score_overall),
                    }}
                  />
                </div>
                <span className="w-8 text-right text-sm tabular-nums">
                  {Math.round((o.score_overall ?? 0) * 100)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-fg-muted">
            Low relevance isn't a defect. It means the source was correctly
            filtered as not relevant to that context, which is the point.
          </p>
        </Card>
      )}
      {current?.markdown && (
        <Card>
          <div className="mb-3 text-xs uppercase tracking-wider text-fg-muted">
            Evaluation report · {current.context_name}
          </div>
          {/* Rendered as real page content (flows naturally, no inner scroll). */}
          <ReactMarkdown
            components={MD}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {current.markdown}
          </ReactMarkdown>
          <details className="mt-5 rounded-lg border border-line">
            <summary className="cursor-pointer px-3 py-2 text-xs text-fg-muted">
              Raw markdown
            </summary>
            <pre className="whitespace-pre-wrap border-t border-line px-3 py-2 text-xs leading-relaxed text-fg-muted">
              {current.markdown}
            </pre>
          </details>
        </Card>
      )}
    </div>
  );
}

function SourceTab({
  content,
  kind,
}: {
  content: SourceContent;
  kind: SourceBundle["kind"];
}) {
  // Book: copyrighted, so only short opening-chapter excerpts plus a notice.
  if (kind === "book") {
    return (
      <div className="space-y-4">
        {content.license_note && (
          <div className="rounded-lg border border-warn-border bg-warn-bg px-4 py-3 text-sm text-warn-fg">
            {content.license_note}
          </div>
        )}
        {(content.chapters ?? []).map((c, i) => (
          <Card key={i}>
            <div className="mb-2 text-xs uppercase tracking-wider text-fg-muted">
              {c.title || `Chapter ${i + 1}`}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
              {c.text}
            </p>
          </Card>
        ))}
      </div>
    );
  }

  // Paper / web: the extracted text anvil analysed.
  return (
    <div>
      <p className="mb-3 text-xs text-fg-muted">
        The text anvil extracted from this source and analysed.
      </p>
      <div className="max-h-[560px] space-y-4 overflow-auto rounded-lg border border-line bg-canvas-alt p-5">
        {content.sections && content.sections.length > 0 ? (
          content.sections.map((s, i) => (
            <div key={i}>
              {s.heading && (
                <div className="mb-1 text-sm font-semibold">{s.heading}</div>
              )}
              {s.content && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                  {s.content}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
            {content.text}
          </p>
        )}
      </div>
    </div>
  );
}

function CitationsTab({ bundle }: { bundle: SourceBundle }) {
  const cites = bundle.citations ?? [];
  if (!cites.length) return <p className="text-sm text-fg-muted">No citations.</p>;
  return (
    <div className="space-y-2">
      {cites.map((c, i) => (
        <Card key={i} className="!p-3">
          <div className="flex items-start gap-2">
            {c.kind && <Pill>{c.kind}</Pill>}
            <div className="min-w-0">
              <p className="text-sm">{c.resolved_title || c.raw_text}</p>
              <div className="mt-1 text-xs text-fg-muted">
                {c.resolved_year ? `${c.resolved_year} · ` : ""}
                {c.doi ? `doi:${c.doi}` : ""}
                {c.canonical_url && (
                  <a
                    href={c.canonical_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline"
                  >
                    {" "}
                    link ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
