export const darkTheme = {
  name: 'dark',
  colors: {
    background: {
      primary: '#0a0e1a',
      secondary: '#0f172a',
      tertiary: '#1e293b',
      elevated: '#334155',
    },
    text: {
      primary: '#ffffff',
      secondary: '#94a3b8',
      muted: '#64748b',
      inverse: '#0a0e1a',
    },
    border: {
      default: '#1e293b',
      light: '#334155',
      accent: '#3b82f6',
    },
    accent: {
      primary: '#3b82f6',
      secondary: '#6366f1',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#06b6d4',
    },
    button: {
      primary: {
        bg: '#3b82f6',
        text: '#ffffff',
        hover: '#2563eb',
      },
      secondary: {
        bg: '#374151',
        text: '#d1d5db',
        hover: '#4b5563',
        border: '#4b5563',
      },
    },
    input: {
      bg: '#1e293b',
      border: '#334155',
      text: '#ffffff',
      placeholder: '#64748b',
      focus: '#3b82f6',
    },
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
    md: '0 4px 12px rgba(0, 0, 0, 0.4)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
  },
} as const;

export const lightTheme = {
  name: 'light',
  colors: {
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      elevated: '#e2e8f0',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#94a3b8',
      inverse: '#ffffff',
    },
    border: {
      default: '#e2e8f0',
      light: '#cbd5e1',
      accent: '#3b82f6',
    },
    accent: {
      primary: '#3b82f6',
      secondary: '#6366f1',
      success: '#16a34a',
      warning: '#d97706',
      danger: '#dc2626',
      info: '#0891b2',
    },
    button: {
      primary: {
        bg: '#3b82f6',
        text: '#ffffff',
        hover: '#2563eb',
      },
      secondary: {
        bg: '#f1f5f9',
        text: '#475569',
        hover: '#e2e8f0',
        border: '#cbd5e1',
      },
    },
    input: {
      bg: '#ffffff',
      border: '#cbd5e1',
      text: '#0f172a',
      placeholder: '#94a3b8',
      focus: '#3b82f6',
    },
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.05)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
  },
} as const;

export type Theme = typeof darkTheme;
export type ThemeMode = 'dark' | 'light';

export const themes = {
  dark: darkTheme,
  light: lightTheme,
} as const;