import { useState } from "react";
import { useViewStore } from "./stores/view-store";
import { Sidebar } from "./components/Sidebar";
import { LandingPage } from "./views/LandingPage";
import { WhyPage } from "./views/WhyPage";
import { SourcesPage } from "./views/SourcesPage";
import { SourcePage } from "./views/SourcePage";
import { EvaluationsPage } from "./views/EvaluationsPage";
import { ContextsPage } from "./views/ContextsPage";
import { RoadmapPage } from "./views/RoadmapPage";
import { HowItWorksPage } from "./views/HowItWorksPage";
import { InvestorsPage } from "./views/InvestorsPage";
import { SurveyPage } from "./components/SurveyPage";

export default function App() {
  const view = useViewStore((s) => s.view);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <div className="hidden sm:flex">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative h-full w-56"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center gap-3 border-b border-line px-3 py-2 sm:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-md border border-line px-2 py-1 text-fg-muted"
          >
            ☰
          </button>
          <span className="text-lg font-bold">anvil</span>
        </div>

        <main className="flex-1 overflow-auto">
          {view === "landing" && <LandingPage />}
          {view === "why" && <WhyPage />}
          {view === "sources" && <SourcesPage />}
          {view === "source" && <SourcePage />}
          {view === "evaluations" && <EvaluationsPage />}
          {(view === "contexts" || view === "context") && <ContextsPage />}
          {view === "roadmap" && <RoadmapPage />}
          {view === "how-it-works" && <HowItWorksPage />}
          {view === "investors" && <InvestorsPage />}
          {view === "survey" && <SurveyPage />}
        </main>
      </div>
    </div>
  );
}
