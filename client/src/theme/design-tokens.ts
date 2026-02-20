export const designTokens = {
  colors: {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceElevated: '#243447',
    card: '#111827',
    border: '#334155',
    mutedText: '#94a3b8',
    foreground: '#e2e8f0',
    primaryGradient: {
      cyan: '#22d3ee',
      blue: '#3b82f6',
      violet: '#8b5cf6',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#f43f5e',
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
    soft: '0 8px 24px rgba(2, 6, 23, 0.35)',
    medium: '0 16px 40px rgba(2, 6, 23, 0.45)',
    strong: '0 22px 56px rgba(2, 6, 23, 0.55)',
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
