import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AccentTheme = "cyan" | "purple" | "green" | "solar";

interface ThemeAccentContextType {
  accent: AccentTheme;
  setAccent: (theme: AccentTheme) => void;
}

const ThemeAccentContext = createContext<ThemeAccentContextType>({
  accent: "cyan",
  setAccent: () => {},
});

const themes: Record<AccentTheme, Record<string, string>> = {
  cyan: {
    "--primary": "187 100% 50%",
    "--primary-foreground": "210 50% 5%",
    "--ring": "187 100% 50%",
    "--cyan-glow": "187 100% 50%",
    "--emerald-accent": "160 100% 45%",
    "--sidebar-primary": "187 100% 50%",
    "--sidebar-ring": "187 100% 50%",
  },
  purple: {
    "--primary": "270 100% 65%",
    "--primary-foreground": "270 20% 5%",
    "--ring": "270 100% 65%",
    "--cyan-glow": "270 100% 65%",
    "--emerald-accent": "290 80% 55%",
    "--sidebar-primary": "270 100% 65%",
    "--sidebar-ring": "270 100% 65%",
  },
  green: {
    "--primary": "142 80% 50%",
    "--primary-foreground": "142 30% 5%",
    "--ring": "142 80% 50%",
    "--cyan-glow": "142 80% 50%",
    "--emerald-accent": "160 90% 45%",
    "--sidebar-primary": "142 80% 50%",
    "--sidebar-ring": "142 80% 50%",
  },
  solar: {
    "--primary": "32 100% 55%",
    "--primary-foreground": "32 30% 5%",
    "--ring": "32 100% 55%",
    "--cyan-glow": "32 100% 55%",
    "--emerald-accent": "45 100% 50%",
    "--sidebar-primary": "32 100% 55%",
    "--sidebar-ring": "32 100% 55%",
  },
};

export const ThemeAccentProvider = ({ children }: { children: ReactNode }) => {
  const [accent, setAccentState] = useState<AccentTheme>(() => {
    return (localStorage.getItem("nexus-accent") as AccentTheme) || "cyan";
  });

  const setAccent = (theme: AccentTheme) => {
    setAccentState(theme);
    localStorage.setItem("nexus-accent", theme);
  };

  useEffect(() => {
    const root = document.documentElement;
    const vars = themes[accent];
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [accent]);

  return (
    <ThemeAccentContext.Provider value={{ accent, setAccent }}>
      {children}
    </ThemeAccentContext.Provider>
  );
};

export const useThemeAccent = () => useContext(ThemeAccentContext);
