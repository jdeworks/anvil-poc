// Shapes of the baked demo fixtures. These mirror the subset of the anvil API
// responses that the extractor captures (scripts/extract_fixtures.py). Kept
// permissive (optionals) so a re-capture with a slightly different shape degrades
// gracefully rather than crashing the viewer.

export type SourceKind = "paper" | "url" | "book";

export interface HeroRef {
  kind: SourceKind;
  id: string;
  title: string;
  facet: string;
}

export interface ContextRef {
  id: string;
  name: string;
  display_name?: string;
}

export interface DemoManifest {
  id: string;
  title: string;
  description: string;
  generatedAt: string;
  generatedWith: string;
  stats: StatsCounts;
  heroes: HeroRef[];
  contexts: ContextRef[];
}

export interface StatsCounts {
  papers: number;
  evaluations: number;
  contexts: number;
  experiments: number;
  candidates?: number;
}

export interface StatsHighlight {
  ro_id: string;
  title: string;
  general_claim: string;
}

export interface DemoStats {
  counts: StatsCounts;
  highlights: StatsHighlight[];
  top_picks?: TopPick[];
}

export interface TopPick {
  ro_id: string;
  title: string | null;
  score_overall: number;
  summary_text: string | null;
  general_claim: string | null;
  context_name: string;
  context_id: string;
}

// One row in the data-sources table (catalog roster).
export interface CatalogRow {
  id: string;
  kind: SourceKind;
  title: string;
  authors: string[];
  year: number | null;
  facet: string;
  source_type: string;
  score_overall: number | null;
  tldr: string | null;
  added_at: string | null;
  /** true when this row has a baked full source bundle (the 3 heroes). */
  hero: boolean;
}

export interface DemoCatalog {
  items: CatalogRow[];
  total: number;
}

// ── source bundle (one per hero) ───────────────────────────────────────────

export interface Claim {
  text: string;
  section_ref?: string;
  confidence?: number;
  provenance?: string;
  validity_confidence?: number;
  validity_basis?: string;
  evidence_strength?: number;
  evidence_basis?: string;
  evidence_type?: string;
  scope?: number;
  corroboration_verdict?: string;
  corroboration_sources?: string[];
}

export interface Method {
  name: string;
  description?: string;
  confidence?: number;
}

export interface TrustReason {
  label: string;
  delta?: number;
  kind?: string;
  evidence?: string | null;
  url?: string | null;
}

export interface ClaimCorroboration {
  claim_text: string;
  verdict: string;
  sources?: string[];
  note?: string;
}

export interface Trustworthiness {
  score: number;
  base?: number;
  reasons?: TrustReason[];
  claim_corroborations?: ClaimCorroboration[];
  web_status?: string;
  summary?: string;
}

export interface Novelty {
  score: number;
  reasoning?: string;
}

// anvil returns these as either a bare 0–1 number or a {score, …} object.
export type Scored = number | { score: number; [k: string]: unknown };

export interface Analysis {
  status?: string;
  confidence?: number;
  claims?: Claim[];
  methods?: Method[];
  novelty?: Scored | Novelty;
  reproducibility?: Scored;
  trustworthiness?: Scored | Trustworthiness;
  tool_stack?: string[];
  claim_total?: number;
  method_total?: number;
}

/** Normalise a number|{score} into a 0–1 number (or null). */
export function scoreOf(x: Scored | Novelty | Trustworthiness | null | undefined): number | null {
  if (x == null) return null;
  if (typeof x === "number") return x;
  return typeof x.score === "number" ? x.score : null;
}

export interface Summary {
  extractor_method?: string;
  summary_text?: string;
  verdict?: string;
  confidence?: number;
  general_claim?: string;
  key_findings?: string[];
  stats?: Record<string, number>;
}

export interface Citation {
  kind?: string;
  raw_text?: string;
  resolved_title?: string | null;
  resolved_year?: number | null;
  doi?: string | null;
  canonical_url?: string | null;
}

export interface GraphNode {
  id: string;
  type?: string;
  label: string;
  summary?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship?: string;
  weight?: number;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ContextEval {
  context_id: string;
  context_name: string;
  score_overall: number | null;
  markdown?: string;
  other_context_scores?: { ctx_name: string; score_overall: number }[];
}

export interface BookCluster {
  title: string;
  summary_verdict?: string;
  novelty?: number;
  reproducibility?: number;
  relevancy?: number | null;
}

export interface SourceDetail {
  title: string;
  authors?: string[];
  year?: number | null;
  abstract?: string;
  page_count?: number;
  source_type?: string;
  source_url?: string | null;
  detected_language?: string;
  tags?: string[];
  /** book only */
  clusters?: BookCluster[];
  cluster_count?: number;
}

export interface SourceContent {
  text?: string;
  sections?: { heading?: string; level?: number; content?: string }[];
  chapters?: { title?: string; text?: string }[];
  license_note?: string;
}

export interface SourceBundle {
  kind: SourceKind;
  id: string;
  detail: SourceDetail;
  content?: SourceContent | null;
  summary?: Summary | null;
  analysis?: Analysis | null;
  citations?: Citation[];
  graph?: KnowledgeGraph | null;
  evaluations?: ContextEval[];
}

// ── contexts ────────────────────────────────────────────────────────────────

export interface ContextDetail {
  id: string;
  name: string;
  display_name?: string;
  organization?: string | null;
  tech_stack?: {
    languages?: string[];
    frameworks?: string[];
    infrastructure?: string[];
    databases?: string[];
  };
  constraints?: Record<string, string | number>;
  goals?: string[];
  paper_count?: number;
  source_yaml?: string | null;
}

export interface EvaluationRow {
  research_object_id: string;
  title: string | null;
  authors: string[];
  context_name: string;
  context_id: string;
  score_overall: number | null;
  evaluated_at: string | null;
}
