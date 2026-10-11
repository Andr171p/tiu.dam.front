import { useEffect, useEffectEvent, useState } from 'react';

/** Значение, которое обновляется после паузы `delayMs` — для поиска при вводе. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

/** Глобальное сочетание клавиш по физической клавише (работает при любой раскладке). */
export function useHotkey(
  code: string,
  handler: (event: KeyboardEvent) => void,
  { withModifier = false } = {},
) {
  const onHotkey = useEffectEvent(handler);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== code) return;
      if (withModifier && !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      onHotkey(event);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [code, withModifier]);
}
