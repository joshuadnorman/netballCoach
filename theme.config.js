/** @type {const} */
const themeColors = {
  // Base Colors
  background: { light: 'hsl(0, 0%, 96%)', dark: 'hsl(0, 0%, 9%)' },
  foreground: { light: 'hsl(0, 0%, 9%)', dark: 'hsl(0, 0%, 98%)' },

  // UI Elements
  card: { light: 'hsl(0, 0%, 98%)', dark: 'hsl(0, 0%, 14%)' },
  surface: { light: 'hsl(0, 0%, 98%)', dark: 'hsl(0, 0%, 14%)' }, // Mapping surface to card for backward compatibility
  popover: { light: 'hsl(0, 0%, 89%)', dark: 'hsl(0, 0%, 25%)' },

  // Brand Colors
  primary: { light: 'hsl(161, 93%, 30%)', dark: 'hsl(158, 64%, 51%)' },
  secondary: { light: 'hsl(0, 0%, 32%)', dark: 'hsl(0, 0%, 45%)' },
  muted: { light: 'hsl(0, 0%, 63%)', dark: 'hsl(0, 0%, 45%)' },
  accent: { light: 'hsl(166, 76%, 96%)', dark: 'hsl(178, 84%, 10%)' },
  destructive: { light: 'hsl(0, 72%, 50%)', dark: 'hsl(0, 84%, 60%)' },

  // Borders & Inputs
  border: { light: 'hsl(0, 0%, 83%)', dark: 'hsl(0, 0%, 32%)' },
  input: { light: 'hsl(0, 0%, 83%)', dark: 'hsl(0, 0%, 32%)' },
  ring: { light: 'hsl(161, 93%, 30%)', dark: 'hsl(158, 64%, 51%)' },

  // Status
  success: { light: 'hsl(156, 72%, 45%)', dark: 'hsl(156, 72%, 50%)' },
  warning: { light: 'hsl(45, 93%, 47%)', dark: 'hsl(45, 93%, 47%)' }, // Default warning (Amber)
  error: { light: 'hsl(0, 72%, 50%)', dark: 'hsl(0, 84%, 60%)' }, // Mapping error to destructive

  // Custom Netball Colors
  purple: { light: 'hsl(252, 70%, 60%)', dark: 'hsl(252, 70%, 65%)' },
  blue: { light: 'hsl(217, 91%, 60%)', dark: 'hsl(217, 91%, 65%)' },
  navy: { light: 'hsl(220, 60%, 15%)', dark: 'hsl(220, 50%, 25%)' },
  header: { light: 'hsl(220, 60%, 15%)', dark: 'hsl(220, 50%, 25%)' }, // Mapping header to navy

  // Specific Accents (keeping for backward compatibility)
  lime: { light: 'hsl(82, 77%, 55%)', dark: 'hsl(81, 84%, 67%)' }, // Using chart-4 as lime
  grey: { light: 'hsl(0, 0%, 63%)', dark: 'hsl(0, 0%, 45%)' }, // Using muted
  teal: { light: 'hsl(172, 66%, 50%)', dark: 'hsl(170, 76%, 64%)' }, // Using chart-3
  pink: { light: 'hsl(340, 75%, 60%)', dark: 'hsl(340, 75%, 60%)' }, // Placeholder if needed
};

module.exports = { themeColors };
