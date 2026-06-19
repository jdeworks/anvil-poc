// Loaders for the baked demo fixtures under public/demo/. Everything the SPA
// renders comes from here - there is no backend and no /api call anywhere.
import type {
  DemoManifest,
  DemoStats,
  DemoCatalog,
  SourceBundle,
  ContextDetail,
  EvaluationRow,
} from "./types";

/** Base for baked assets: Vite's BASE_URL (the Pages subpath) + "demo/". */
function getBase(): string {
  const base = import.meta.env?.BASE_URL ?? "/";
  return base.replace(/\/$/, "") + "/demo/";
}

/** Resolve a path under public/demo/ to a base-path-aware URL. */
export function demoAssetUrl(relativePath: string): string {
  return getBase() + relativePath.replace(/^\/+/, "");
}

async function fetchJson<T>(relativePath: string): Promise<T> {
  const res = await fetch(demoAssetUrl(relativePath));
  if (!res.ok) throw new Error(`demo fixture not found: ${relativePath}`);
  return (await res.json()) as T;
}

let _manifest: Promise<DemoManifest> | null = null;
export function loadManifest(): Promise<DemoManifest> {
  return (_manifest ??= fetchJson<DemoManifest>("manifest.json"));
}

export function loadStats(): Promise<DemoStats> {
  return fetchJson<DemoStats>("stats.json");
}

export function loadCatalog(): Promise<DemoCatalog> {
  return fetchJson<DemoCatalog>("catalog.json");
}

export function loadEvaluations(): Promise<EvaluationRow[]> {
  return fetchJson<EvaluationRow[]>("evaluations.json");
}

export function loadSource(id: string): Promise<SourceBundle> {
  return fetchJson<SourceBundle>(`source/${id}.json`);
}

export function loadContext(name: string): Promise<ContextDetail> {
  return fetchJson<ContextDetail>(`context/${name}.json`);
}
