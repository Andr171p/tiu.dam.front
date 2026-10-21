import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { api, describeError, isAbortError } from '@shared/api';
import { useAssets } from './asset-store';
import type { AssetQuery, AssetSummary } from './types';

interface CursorPage {
  items: AssetSummary[];
  nextCursor?: string | null;
  hasNext: boolean;
}

interface Feed {
  /** Запрос (фильтр + ревизия), к которому относятся страницы */
  key: string | null;
  items: AssetSummary[];
  cursor: string | null;
  hasNext: boolean;
  error: string | null;
}

const EMPTY: Feed = {
  key: null,
  items: [],
  cursor: null,
  hasNext: false,
  error: null,
};

/**
 * Лента материалов с курсорной пагинацией. Перезагружается при смене фильтра
 * и после изменений материалов (`invalidateAssets`); пока грузится новый фильтр,
 * видны прежние карточки.
 */
export function useAssetFeed(query: AssetQuery, pageSize = 48) {
  const revision = useAssets((store) => store.revision);
  const key = JSON.stringify([query, pageSize, revision]);
  const [feed, setFeed] = useState<Feed>(EMPTY);
  const [loadingMore, setLoadingMore] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchPage = (cursor: string | null, signal: AbortSignal) =>
    api.get<CursorPage>('/assets', {
      query: { ...query, cursor, size: pageSize },
      signal,
    });
  const fetchFirstPage = useEffectEvent((signal: AbortSignal) =>
    fetchPage(null, signal),
  );

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;

    fetchFirstPage(controller.signal).then(
      (page) =>
        setFeed({
          key,
          items: page.items,
          cursor: page.nextCursor ?? null,
          hasNext: page.hasNext,
          error: null,
        }),
      (error: unknown) => {
        if (!isAbortError(error))
          setFeed({ ...EMPTY, key, error: describeError(error) });
      },
    );
    return () => controller.abort();
  }, [key]);

  const current = feed.key === key;

  const loadMore = () => {
    const controller = controllerRef.current;
    if (!controller || !current || !feed.hasNext || loadingMore) return;

    setLoadingMore(true);
    fetchPage(feed.cursor, controller.signal)
      .then(
        (page) =>
          setFeed((previous) => ({
            ...previous,
            items: [...previous.items, ...page.items],
            cursor: page.nextCursor ?? null,
            hasNext: page.hasNext,
          })),
        (error: unknown) => {
          if (!isAbortError(error))
            setFeed((previous) => ({
              ...previous,
              error: describeError(error),
            }));
        },
      )
      .finally(() => setLoadingMore(false));
  };

  return {
    status: !current
      ? 'loading'
      : feed.error && feed.items.length === 0
        ? 'error'
        : 'ready',
    items: feed.items,
    hasNext: current && feed.hasNext,
    loadingMore,
    error: feed.error,
    loadMore,
  } as const;
}
