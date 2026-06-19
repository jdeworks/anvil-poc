import { useEffect, useState } from "react";
import { useViewStore } from "../stores/view-store";
import { demoAssetUrl } from "../lib/demo";
import { Card } from "../components/ui";

interface Shot {
  file: string;
  caption: string;
  group?: string;
}

const BUILT = [
  "Claim extraction with provenance and evidence typing",
  "Trustworthiness scoring with author and venue reputation plus independent web corroboration",
  "Independent claim checking against outside sources",
  "Novelty and reproducibility assessment",
  "Per-context relevance scoring so the same source ranks differently per team",
  "Analyse each source once, then evaluate it against everyone (shared analysis, private scoring)",
  "Knowledge graph of sections, claims, methods, datasets and citations",
  "Citation resolution via DOI, Semantic Scholar and web search",
  "Books split into chapters, each analysed on its own",
  "Continuous ingestion from publishers, feeds and preprint servers",
];

const AHEAD = [
  {
    title: "More sources ingested",
    body: "The core tool is roughly 90 percent there. The biggest near-term work is breadth: pulling in more publishers, feeds and preprint servers so less slips through.",
  },
  {
    title: "Automated re-scoring on new work",
    body: "When a new paper is analysed, automatically score it against every team's context and surface it to the teams it is actually relevant to, without anyone asking.",
  },
  {
    title: "Context optimization for monorepos",
    body: "Richer context modelling for large, multi-stack monorepos so relevance scoring stays sharp when one repo spans many concerns.",
  },
  {
    title: "Implementation instructions at scale",
    body: "Generate and track the concrete changes a relevant source implies, so the path from insight to merged code is shorter.",
  },
];

export function RoadmapPage() {
  const setView = useViewStore((s) => s.setView);
  const [shots, setShots] = useState<Shot[]>([]);
  const [zoom, setZoom] = useState<Shot | null>(null);

  useEffect(() => {
    fetch(demoAssetUrl("screenshots/index.json"))
      .then((r) => (r.ok ? r.json() : []))
      .then(setShots)
      .catch(() => setShots([]));
  }, []);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">The road ahead</h1>
        <p className="mt-2 max-w-2xl text-fg-muted">
          This static demo shows three sources end to end. The real product does a
          lot more. The core is roughly 90 percent of a working tool, so the work
          left is mostly breadth and automation rather than new capability.
        </p>
        <p className="mt-3 rounded-lg border border-line bg-canvas-alt px-3 py-2 text-xs text-fg-muted">
          Note: this is a proof-of-concept view. Counts and layouts here do not
          reflect the real volume already in the system, and the final product UI
          will differ.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">
          Already built
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {BUILT.map((b) => (
            <div
              key={b}
              className="flex items-start gap-2 rounded-lg border border-line bg-canvas-alt p-3 text-sm"
            >
              <span className="text-success-fg">✓</span>
              {b}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">
          Product surfaces (click to enlarge)
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {shots.map((s) => (
            <Shotframe key={s.file} shot={s} onZoom={() => setZoom(s)} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">
          Where it's headed
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {AHEAD.map((a) => (
            <div key={a.title} className="rounded-lg border border-line p-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                <span className="text-accent">→</span>
                {a.title}
              </div>
              <p className="text-xs leading-relaxed text-fg-muted">{a.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">
          Found by anvil, scored against itself
        </h2>
        <Card>
          <p className="text-sm leading-relaxed text-fg-muted">
            anvil runs on its own corpus. The paper{" "}
            <span className="font-medium text-fg">
              "If You Want Coherence, Orchestrate a Team of Rivals"
            </span>{" "}
            scored as relevant to anvil's own context, and its multi-agent idea is
            feeding directly into how anvil cross-checks claims from several
            independent angles. The roadmap is partly written by the papers anvil
            surfaces.
          </p>
        </Card>
      </section>

      <Card className="text-center">
        <p className="mb-3 text-sm text-fg-muted">
          Want it pointed at your own stack, or to follow along?
        </p>
        <button
          onClick={() => setView("survey")}
          className="rounded-lg bg-accent px-6 py-2.5 font-medium text-accent-fg"
        >
          Join the waitlist
        </button>
      </Card>

      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoom(null)}
        >
          <figure
            className="flex max-h-full max-w-6xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={demoAssetUrl(`screenshots/${zoom.file}`)}
              alt={zoom.caption}
              className="max-h-[85vh] w-auto rounded-lg border border-line object-contain"
            />
            <figcaption className="mt-2 flex items-center justify-between text-sm text-fg-muted">
              <span>{zoom.caption}</span>
              <button
                onClick={() => setZoom(null)}
                className="rounded-md border border-line px-3 py-1 text-xs hover:text-fg"
              >
                Close (Esc)
              </button>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}

function Shotframe({ shot, onZoom }: { shot: Shot; onZoom: () => void }) {
  const [ok, setOk] = useState(true);
  return (
    <figure
      onClick={onZoom}
      className="group cursor-pointer overflow-hidden rounded-lg border border-line transition-colors hover:border-accent"
    >
      {ok ? (
        <div className="relative">
          <img
            src={demoAssetUrl(`screenshots/${shot.file}`)}
            alt={shot.caption}
            className="block w-full bg-canvas"
            onError={() => setOk(false)}
          />
          <div className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            ⤢ enlarge
          </div>
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center bg-canvas-alt text-xs text-fg-muted">
          screenshot pending
        </div>
      )}
      <figcaption className="border-t border-line bg-canvas-alt px-3 py-2 text-xs text-fg-muted">
        {shot.caption}
      </figcaption>
    </figure>
  );
}
