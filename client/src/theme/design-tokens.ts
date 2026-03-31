export const designTokens = {
  colors: {
    background: '#020304',
    surface: '#07080c',
    surfaceElevated: '#0b0d13',
    card: '#0f1118',
    border: '#23283a',
    mutedText: '#9aa5bd',
    foreground: '#f6f8ff',
    primaryGradient: {
      cyan: '#22d3ee',
      blue: '#8b5cf6',
      violet: '#c084fc',
    },
    success: '#10b981',
    warning: '#a855f7',
    error: '#fb7185',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4.5rem',
  },
  radius: {
    xs: '0.25rem',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.625rem',
    xl: '0.75rem',
    '2xl': '1rem',
  },
  shadow: {
    soft: '0 10px 28px rgba(0, 0, 0, 0.38)',
    medium: '0 18px 46px rgba(0, 0, 0, 0.5)',
    strong: '0 24px 60px rgba(0, 0, 0, 0.62)',
  },
  duration: {
    fast: '120ms',
    normal: '220ms',
    slow: '360ms',
  },
  typography: {
    fontFamily: 'Inter',
    h1: 'text-4xl md:text-5xl font-semibold leading-tight tracking-tight',
    h2: 'text-3xl md:text-4xl font-semibold leading-tight tracking-tight',
    h3: 'text-2xl md:text-3xl font-semibold leading-snug tracking-tight',
    body: 'text-base leading-7',
    muted: 'text-sm leading-6',
    code: 'text-sm leading-6',
  },
} as const;

export type DesignTokens = typeof designTokens;
