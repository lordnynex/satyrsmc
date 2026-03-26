import type { ReactNode } from "react";
import React, { createContext, use, useEffect, useState } from "react";

type Mode = "dark" | "light";

interface ThemeContextValue {
  mode: Mode;
  setMode: (m: Mode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ProviderProps) => {
  // Force dark mode — light mode will be added by updating theme-dark.css tokens
  const [mode, setMode] = useState<Mode>("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const value: ThemeContextValue = {
    mode,
    setMode,
    toggleMode: () => setMode((m) => (m === "dark" ? "light" : "dark")),
  };

  return <ThemeContext value={value}>{children}</ThemeContext>;
};

export function useTheme() {
  const ctx = use(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
