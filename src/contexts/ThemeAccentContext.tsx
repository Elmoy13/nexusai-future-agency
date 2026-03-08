import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AccentTheme = "cyan" | "purple" | "green" | "solar";
export type ThemeMode = "dark" | "light";

interface ThemeAccentContextType {
  accent: AccentTheme;
  mode: ThemeMode;
  setAccent: (theme: AccentTheme) => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeAccentContext = createContext<ThemeAccentContextType>({
  accent: "cyan",
  mode: "dark",
  setAccent: () => {},
  setMode: () => {},
});

const accentTokens: Record<AccentTheme, Record<string, string>> = {
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

const darkModeTokens: Record<string, string> = {
  "--background": "210 50% 5%",
  "--foreground": "180 10% 92%",
  "--card": "200 40% 8%",
  "--card-foreground": "180 10% 92%",
  "--popover": "200 40% 8%",
  "--popover-foreground": "180 10% 92%",
  "--secondary": "200 30% 12%",
  "--secondary-foreground": "180 10% 85%",
  "--muted": "200 20% 15%",
  "--muted-foreground": "210 10% 55%",
  "--accent": "160 100% 45%",
  "--accent-foreground": "210 50% 5%",
  "--destructive": "0 84% 60%",
  "--destructive-foreground": "0 0% 98%",
  "--border": "200 30% 15%",
  "--input": "200 30% 15%",
  "--glass-bg": "200 50% 50%",
  "--glass-border": "200 50% 80%",
  "--sidebar-background": "210 50% 5%",
  "--sidebar-foreground": "180 10% 85%",
  "--sidebar-accent": "200 30% 12%",
  "--sidebar-accent-foreground": "180 10% 85%",
  "--sidebar-border": "200 30% 15%",
};

const lightModeTokens: Record<string, string> = {
  "--background": "210 20% 96%",
  "--foreground": "215 25% 15%",
  "--card": "210 20% 99%",
  "--card-foreground": "215 25% 15%",
  "--popover": "210 20% 99%",
  "--popover-foreground": "215 25% 15%",
  "--secondary": "214 20% 92%",
  "--secondary-foreground": "215 20% 30%",
  "--muted": "214 15% 90%",
  "--muted-foreground": "215 12% 50%",
  "--accent": "160 100% 45%",
  "--accent-foreground": "210 50% 5%",
  "--destructive": "0 84% 55%",
  "--destructive-foreground": "0 0% 98%",
  "--border": "214 18% 85%",
  "--input": "214 18% 85%",
  "--glass-bg": "214 30% 60%",
  "--glass-border": "214 30% 75%",
  "--sidebar-background": "210 20% 98%",
  "--sidebar-foreground": "215 20% 30%",
  "--sidebar-accent": "214 20% 94%",
  "--sidebar-accent-foreground": "215 20% 30%",
  "--sidebar-border": "214 18% 88%",
};

export const ThemeAccentProvider = ({ children }: { children: ReactNode }) => {
  const [accent, setAccentState] = useState<AccentTheme>(() => {
    return (localStorage.getItem("nexus-accent") as AccentTheme) || "cyan";
  });
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem("nexus-mode") as ThemeMode) || "dark";
  });

  const setAccent = (theme: AccentTheme) => {
    setAccentState(theme);
    localStorage.setItem("nexus-accent", theme);
  };

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem("nexus-mode", m);
  };

  useEffect(() => {
    const root = document.documentElement;
    const accentVars = accentTokens[accent];
    const modeVars = mode === "dark" ? darkModeTokens : lightModeTokens;

    Object.entries({ ...modeVars, ...accentVars }).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Adjust primary-foreground for light mode readability
    if (mode === "light") {
      root.style.setProperty("--primary-foreground", "0 0% 100%");
      root.style.setProperty("--neon-shadow", "none");
    } else {
      root.style.setProperty("--neon-shadow", `0 0 30px hsl(${accentVars["--cyan-glow"]} / 0.4)`);
    }
  }, [accent, mode]);

  return (
    <ThemeAccentContext.Provider value={{ accent, mode, setAccent, setMode }}>
      {children}
    </ThemeAccentContext.Provider>
  );
};

export const useThemeAccent = () => useContext(ThemeAccentContext);
