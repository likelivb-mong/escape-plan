// Dark mode only — no theme switching needed.
// This file is kept as a minimal stub so existing imports don't break.

export type Theme = 'dark';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useTheme() {
  return { theme: 'dark' as const };
}
