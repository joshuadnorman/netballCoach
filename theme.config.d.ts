export const themeColors: {
  // Base Colors
  background: { light: string; dark: string };
  foreground: { light: string; dark: string };

  // UI Elements
  card: { light: string; dark: string };
  surface: { light: string; dark: string };
  popover: { light: string; dark: string };

  // Brand Colors
  primary: { light: string; dark: string };
  secondary: { light: string; dark: string };
  muted: { light: string; dark: string };
  accent: { light: string; dark: string };
  destructive: { light: string; dark: string };

  // Borders & Inputs
  border: { light: string; dark: string };
  input: { light: string; dark: string };
  ring: { light: string; dark: string };

  // Status
  success: { light: string; dark: string };
  warning: { light: string; dark: string };
  error: { light: string; dark: string };

  // Custom Netball Colors
  purple: { light: string; dark: string };
  blue: { light: string; dark: string };
  navy: { light: string; dark: string };
  header: { light: string; dark: string };

  // Specific Accents
  lime: { light: string; dark: string };
  grey: { light: string; dark: string };
  teal: { light: string; dark: string };
  pink: { light: string; dark: string };
};

declare const themeConfig: {
  themeColors: typeof themeColors;
};

export default themeConfig;
