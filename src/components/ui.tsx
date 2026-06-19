import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-line bg-canvas-alt p-5 ${
        onClick ? "cursor-pointer transition-colors hover:border-accent" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Section({
  title,
  children,
  right,
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warn" | "error" | "accent";
}) {
  const tones: Record<string, string> = {
    neutral: "border-line bg-canvas text-fg-muted",
    success: "border-success-border bg-success-bg text-success-fg",
    warn: "border-warn-border bg-warn-bg text-warn-fg",
    error: "border-error-border bg-error-bg text-error-fg",
    accent: "border-accent bg-canvas text-accent",
  };
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/**
 * Relevance (0–1) rendered 0–100 with anvil's real colour ramp: high is green,
 * mid is accent, low is neutral grey. Low relevance is NOT an error - it means
 * the source was correctly filtered as not relevant to that context.
 */
export function ScoreBadge({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <Pill>n/a</Pill>;
  const pct = Math.round(value * 100);
  const tone = pct >= 66 ? "success" : pct >= 33 ? "accent" : "neutral";
  return <Pill tone={tone}>{pct}</Pill>;
}

/** A labelled 0–1 metric as a thin bar (novelty, trust, reproducibility…). */
export function MetricBar({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  const pct = value == null ? 0 : Math.round(value * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-fg-muted">{label}</span>
        <span className="tabular-nums">{value == null ? "n/a" : pct}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * A qualitative meter: label + 5-segment bar + a single word, no number.
 * Use for trust / novelty / reproducibility where a bare score reads as a grade.
 */
export function Meter({
  label,
  value,
  word,
}: {
  label: string;
  value: number | null | undefined;
  word: string;
}) {
  const filled =
    value == null ? 0 : Math.max(0, Math.min(5, Math.round(value * 5)));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-fg-muted">{label}</span>
        <span className="font-medium">{value == null ? "n/a" : word}</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < filled ? "bg-accent" : "bg-canvas"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/** Word for a generic 0–1 quality (trust, reproducibility). */
export function qualityWord(v: number | null): string {
  if (v == null) return "n/a";
  if (v >= 0.75) return "High";
  if (v >= 0.5) return "Moderate";
  if (v >= 0.3) return "Some";
  return "Low";
}

/** Word for novelty (neutral, so a low value does not read as "bad"). */
export function noveltyWord(v: number | null): string {
  if (v == null) return "n/a";
  if (v >= 0.7) return "Highly novel";
  if (v >= 0.4) return "Notable";
  return "Incremental";
}

/** A signed trust delta as symbols: one red − , or 1–3 green + by magnitude. */
export function DeltaSign({ delta }: { delta: number | undefined }) {
  const d = delta ?? 0;
  if (d < 0)
    return <span className="font-mono text-base font-bold text-error-fg">−</span>;
  if (d === 0)
    return <span className="font-mono text-base font-bold text-fg-muted">·</span>;
  const mag = Math.abs(d);
  const plus = mag >= 0.08 ? "+++" : mag >= 0.04 ? "++" : "+";
  return (
    <span className="font-mono text-base font-bold text-success-fg">{plus}</span>
  );
}

/** A 0–1 strength as 1–3 green + (for claim evidence). */
export function StrengthSign({ value }: { value: number | undefined }) {
  const v = value ?? 0;
  const s = v >= 0.66 ? "+++" : v >= 0.33 ? "++" : "+";
  return <span className="font-mono font-bold text-success-fg">{s}</span>;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-20 text-sm text-fg-muted">
      {label}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-error-border bg-error-bg px-4 py-3 text-sm text-error-fg">
      {children}
    </div>
  );
}

export function verdictTone(
  verdict: string | undefined,
): "success" | "warn" | "error" | "neutral" {
  switch (verdict) {
    case "plausible":
      return "success";
    case "implausible":
      return "error";
    case "questionable":
    case "inconclusive":
      return "warn";
    default:
      return "neutral";
  }
}
