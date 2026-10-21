import {
  useCallback,
  useEffect,
  useEffectEvent,
  useState,
  type DependencyList,
} from 'react';
import { ApiError, describeError, isAbortError } from '../api';

/** Значение, которое обновляется только после паузы `delayMs` — для поиска при вводе. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function useCopyToClipboard(resetAfterMs = 1500) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), resetAfterMs);
    return () => clearTimeout(timer);
  }, [copied, resetAfterMs]);

  const copy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }, []);

  return { copied, copy };
}

export type RequestState<T> =
  | { status: 'loading'; data: T | undefined; error: null; httpStatus: null }
  | { status: 'ready'; data: T; error: null; httpStatus: null }
  | {
      status: 'error';
      data: T | undefined;
      error: string;
      httpStatus: number | null;
    };

interface Settled<T> {
  /** Ключ запроса, на который пришёл ответ */
  key: string | null;
  data: T | undefined;
  failure: unknown;
}

/**
 * Данные экрана, которые не нужны другим экранам: версии, расшифровка, участники.
 * Устаревший запрос отменяется при смене зависимостей; `reload` перечитывает данные.
 * Пока идёт новый запрос, прежние данные остаются доступны — без мигания скелетона.
 */
export function useRequest<T>(
  load: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList,
): RequestState<T> & { reload: () => void } {
  const [revision, setRevision] = useState(0);
  const [settled, setSettled] = useState<Settled<T>>({
    key: null,
    data: undefined,
    failure: null,
  });
  const key = JSON.stringify([...deps, revision]);
  const run = useEffectEvent(load);

  useEffect(() => {
    const controller = new AbortController();
    run(controller.signal).then(
      (data) => setSettled({ key, data, failure: null }),
      (failure: unknown) => {
        if (!isAbortError(failure))
          setSettled((previous) => ({ key, data: previous.data, failure }));
      },
    );
    return () => controller.abort();
  }, [key]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);
  const { data, failure } = settled;

  if (settled.key !== key)
    return { status: 'loading', data, error: null, httpStatus: null, reload };
  if (failure)
    return {
      status: 'error',
      data,
      error: describeError(failure),
      httpStatus: failure instanceof ApiError ? failure.status : null,
      reload,
    };
  return {
    status: 'ready',
    data: data as T,
    error: null,
    httpStatus: null,
    reload,
  };
}

/** Повторяет `tick`, пока `active`: ожидание обработки файла, рендера редактора. */
export function usePolling(
  tick: () => void,
  active: boolean,
  intervalMs: number,
) {
  const onTick = useEffectEvent(tick);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => onTick(), intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs]);
}
