import { useEffect } from 'react';
import { create } from 'zustand';
import type { AssetSummary } from '@entities/asset';
import { api, describeError } from '@shared/api';
import { registerStoreReset } from '@shared/lib/store-reset';
import type { Collection } from './types';

interface CollectionsState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  items: Collection[];
  error: string | null;
  /** Обложка — миниатюра последнего материала; null — коллекция пуста */
  covers: Record<string, string | null>;
}

export const useCollections = create<CollectionsState>()(() => ({
  status: 'idle',
  items: [],
  error: null,
  covers: {},
}));

registerStoreReset(() =>
  useCollections.setState(useCollections.getInitialState(), true),
);

const byName = (a: Collection, b: Collection) =>
  a.name.localeCompare(b.name, 'ru');

let pending: Promise<void> | null = null;

/** Коллекции, доступные пользователю. Повторные вызовы во время загрузки объединяются. */
export function loadCollections(): Promise<void> {
  pending ??= (async () => {
    if (useCollections.getState().status !== 'ready')
      useCollections.setState({ status: 'loading', error: null });
    try {
      const items = await api.get<Collection[]>('/collections');
      useCollections.setState({
        status: 'ready',
        items: items.sort(byName),
        error: null,
      });
    } catch (error) {
      useCollections.setState({ status: 'error', error: describeError(error) });
    } finally {
      pending = null;
    }
  })();
  return pending;
}

export function upsertCollection(collection: Collection) {
  useCollections.setState(({ items }) => ({
    items: [
      ...items.filter((item) => item.id !== collection.id),
      collection,
    ].sort(byName),
  }));
}

export function removeCollection(collectionId: string) {
  useCollections.setState(({ items }) => ({
    items: items.filter((item) => item.id !== collectionId),
  }));
}

export function useCollection(
  id: string | null | undefined,
): Collection | undefined {
  return useCollections((state) => state.items.find((item) => item.id === id));
}

const requestedCovers = new Set<string>();

async function loadCover(collectionId: string) {
  try {
    const page = await api.get<{ items: AssetSummary[] }>('/assets', {
      query: { collectionId, size: 1 },
    });
    const cover = page.items[0]?.version.urls.thumbnail ?? null;
    useCollections.setState(({ covers }) => ({
      covers: { ...covers, [collectionId]: cover },
    }));
  } catch {
    requestedCovers.delete(collectionId);
  }
}

/** Обложка карточки коллекции: запрашивается один раз за сессию. */
export function useCollectionCover(
  collectionId: string,
): string | null | undefined {
  const cover = useCollections((state) => state.covers[collectionId]);

  useEffect(() => {
    if (requestedCovers.has(collectionId)) return;
    requestedCovers.add(collectionId);
    void loadCover(collectionId);
  }, [collectionId]);

  return cover;
}
