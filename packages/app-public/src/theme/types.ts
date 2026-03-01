export type Mode = "light" | "dark";

export type ThemeTokens = {
  mode: Mode;
  colors: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  spacing: number[]; // scale, e.g., [0,4,8,12,16,24,32]
  fonts: {
    body: string;
    heading: string;
  };
  fontSizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
    "4xl": string;
  };
};
