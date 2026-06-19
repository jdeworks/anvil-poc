import { create } from "zustand";

type Theme = "light" | "dark";

function initial(): Theme {
  try {
    const saved = localStorage.getItem("anvil-poc-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  return "dark";
}

function apply(theme: Theme): void {
  document.documentElement.classList.toggle("light", theme === "light");
}

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const theme = initial();
  apply(theme);
  return {
    theme,
    toggle: () => {
      const next: Theme = get().theme === "dark" ? "light" : "dark";
      apply(next);
      try {
        localStorage.setItem("anvil-poc-theme", next);
      } catch {
        /* ignore */
      }
      set({ theme: next });
    },
  };
});
