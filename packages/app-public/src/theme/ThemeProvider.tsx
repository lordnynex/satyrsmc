import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { Mode, ThemeTokens } from './types';

interface ThemeContextValue {
  theme: ThemeTokens;
  mode: Mode;
  setMode: (m: Mode) => void;
  toggleMode: () => void;
  updateTheme: (partial: Partial<ThemeTokens>) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Satyrs palette: deep blue + gold accents in a dark UI
const baseDark: ThemeTokens = {
  mode: 'dark',
  colors: {
    background: '#0b1120',      // dark navy
    surface: '#111827',         // slightly lighter panel
    text: '#f8fafc',            // near-white
    muted: '#94a3b8',
    primary: '#0b4f8a',         // Satyrs blue
    secondary: '#1e293b',
    accent: '#d4af37',          // gold
    border: '#233143'
  },
  radius: { sm: '6px', md: '10px', lg: '18px', full: '999px' },
  spacing: [0,4,8,12,16,20,24,32,48,64],
  fonts: { body: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', heading: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif' },
  fontSizes: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '2rem', '4xl': '2.5rem' }
};

function applyCssVars(theme: ThemeTokens) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme.mode);
  Object.entries(theme.colors).forEach(([k,v]) => root.style.setProperty(`--color-${k}`, v));
  Object.entries(theme.radius).forEach(([k,v]) => root.style.setProperty(`--radius-${k}`, v));
  theme.spacing.forEach((val, idx) => root.style.setProperty(`--space-${idx}`, val + 'px'));
  Object.entries(theme.fontSizes).forEach(([k,v]) => root.style.setProperty(`--font-${k}`, v));
  root.style.setProperty('--font-body', theme.fonts.body);
  root.style.setProperty('--font-heading', theme.fonts.heading);
}

interface ProviderProps { children: ReactNode }
export const ThemeProvider = ({ children }: ProviderProps) => {
  // Force dark mode, disable switching
  const [mode, setMode] = useState<Mode>('dark');
  const [custom, setCustom] = useState<Partial<ThemeTokens>>({});

  const theme = useMemo<ThemeTokens>(() => {
    const base = baseDark;
    return { ...base, ...custom, colors: { ...base.colors, ...(custom.colors||{}) } };
  }, [mode, custom]);

  React.useEffect(() => { applyCssVars(theme); }, [theme]);

  const value: ThemeContextValue = {
    theme,
    mode,
    setMode,
  toggleMode: () => {},
    updateTheme: (partial: Partial<ThemeTokens>) => setCustom((prev: Partial<ThemeTokens>) => ({ ...prev, ...partial }))
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if(!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
