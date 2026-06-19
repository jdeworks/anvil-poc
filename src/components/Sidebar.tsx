import { useViewStore, type AppView } from "../stores/view-store";
import { useThemeStore } from "../stores/theme-store";

const NAV: { label: string; view: AppView }[] = [
  { label: "Overview", view: "landing" },
  { label: "Why anvil", view: "why" },
  { label: "Data sources", view: "sources" },
  { label: "Evaluations", view: "evaluations" },
  { label: "Contexts", view: "contexts" },
  { label: "How it works", view: "how-it-works" },
  { label: "Road ahead", view: "roadmap" },
  { label: "For investors", view: "investors" },
  { label: "Feedback", view: "survey" },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const view = useViewStore((s) => s.view);
  const setView = useViewStore((s) => s.setView);
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);

  // "source" and "context" are detail views reached from sources/contexts -
  // highlight their parent nav item.
  const active = (v: AppView) =>
    v === view ||
    (v === "sources" && view === "source") ||
    (v === "contexts" && view === "context");

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-line bg-canvas-alt">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <button
          onClick={() => {
            setView("landing");
            onNavigate?.();
          }}
          className="text-lg font-bold tracking-tight"
        >
          anvil
        </button>
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="rounded-md border border-line px-2 py-1 text-xs text-fg-muted hover:text-fg"
        >
          {theme === "dark" ? "☾" : "☀"}
        </button>
      </div>

      <nav className="flex-1 overflow-auto p-3" aria-label="Pages">
        {NAV.map((item) => (
          <button
            key={item.view}
            onClick={() => {
              setView(item.view);
              onNavigate?.();
            }}
            className={`mb-0.5 block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
              active(item.view)
                ? "bg-canvas text-fg"
                : "text-fg-muted hover:bg-canvas hover:text-fg"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-line p-3 text-xs text-fg-muted">
        <p className="mb-1">Static demo · no backend</p>
        <p>anvil PoC</p>
      </div>
    </aside>
  );
}
