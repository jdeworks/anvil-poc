import { create } from "zustand";

// View-switching (no router - mirrors the auto-audiobook pattern). `sourceId`
// and `contextName` carry the selection into the detail views.
export type AppView =
  | "landing"
  | "why"
  | "sources"
  | "source"
  | "evaluations"
  | "contexts"
  | "context"
  | "roadmap"
  | "how-it-works"
  | "investors"
  | "survey";

interface OpenSourceOpts {
  /** initial tab id to open the source on (e.g. the relevance tab) */
  tab?: string;
  /** context to preselect in the relevance tab */
  contextName?: string;
}

interface ViewState {
  view: AppView;
  sourceId: string | null;
  contextName: string | null;
  /** one-shot deep-link hints consumed by SourcePage on open */
  sourceTab: string | null;
  sourceContext: string | null;
  setView: (view: AppView) => void;
  openSource: (id: string, opts?: OpenSourceOpts) => void;
  openContext: (name: string) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  view: "landing",
  sourceId: null,
  contextName: null,
  sourceTab: null,
  sourceContext: null,
  setView: (view) => set({ view }),
  openSource: (id, opts) =>
    set({
      view: "source",
      sourceId: id,
      sourceTab: opts?.tab ?? null,
      sourceContext: opts?.contextName ?? null,
    }),
  openContext: (name) => set({ view: "context", contextName: name }),
}));
