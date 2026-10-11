import { Monitor, Moon, Sun } from 'lucide-react';
import {
  setThemePreference,
  useTheme,
  type ThemePreference,
} from '@shared/lib/theme';
import { Segmented } from '@shared/ui/segmented';

const OPTIONS = [
  { value: 'light' as const, label: 'Светлая тема', icon: Sun },
  { value: 'system' as const, label: 'Как в системе', icon: Monitor },
  { value: 'dark' as const, label: 'Тёмная тема', icon: Moon },
];

export function ThemeSwitcher() {
  const preference = useTheme((state) => state.preference);
  return (
    <Segmented<ThemePreference>
      label="Тема оформления"
      iconOnly
      options={OPTIONS}
      value={preference}
      onChange={setThemePreference}
    />
  );
}
