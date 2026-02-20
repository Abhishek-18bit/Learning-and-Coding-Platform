import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        surfaceElevated: 'var(--color-surface-elevated)',
        card: 'var(--color-card)',
        border: 'var(--color-border)',
        muted: 'var(--color-muted)',
        foreground: 'var(--color-foreground)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        primaryCyan: 'var(--color-primary-cyan)',
        primaryBlue: 'var(--color-primary-blue)',
        primaryViolet: 'var(--color-primary-violet)',
      },
      borderRadius: {
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        medium: 'var(--shadow-medium)',
        strong: 'var(--shadow-strong)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },
    },
  },
};

export default config;
