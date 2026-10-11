import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeState {
  preference: ThemePreference;
}

export const useTheme = create<ThemeState>()(
  persist<ThemeState>(() => ({ preference: 'system' }), {
    name: 'tiu-dam.theme',
  }),
);

export function setThemePreference(preference: ThemePreference) {
  useTheme.setState({ preference });
}

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)');

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference !== 'system') return preference;
  return systemDark().matches ? 'dark' : 'light';
}

/** Проставляет тему на <html> и следит за выбором пользователя и системной темой. */
export function syncThemeWithDocument() {
  const apply = () => {
    document.documentElement.dataset.theme = resolveTheme(
      useTheme.getState().preference,
    );
  };

  apply();
  systemDark().addEventListener('change', apply);
  useTheme.subscribe(apply);
}
