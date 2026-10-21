import { useEffect } from 'react';
import { create } from 'zustand';
import { api, describeError } from '@shared/api';
import { registerStoreReset } from '@shared/lib/store-reset';
import type { Face } from './types';

interface FacesOfAsset {
  status: 'loading' | 'ready' | 'error';
  items: Face[];
  error: string | null;
}

interface FacesState {
  byAsset: Record<string, FacesOfAsset>;
}

/** Лица на материале: рамки рисует просмотр, подписи — панель «Участники». */
export const useFaces = create<FacesState>()(() => ({ byAsset: {} }));

registerStoreReset(() => useFaces.setState(useFaces.getInitialState(), true));

const EMPTY: FacesOfAsset = { status: 'loading', items: [], error: null };

export async function loadFaces(assetId: string) {
  try {
    const items = await api.get<Face[]>(`/assets/${assetId}/faces`);
    useFaces.setState(({ byAsset }) => ({
      byAsset: {
        ...byAsset,
        [assetId]: { status: 'ready', items, error: null },
      },
    }));
  } catch (error) {
    useFaces.setState(({ byAsset }) => ({
      byAsset: {
        ...byAsset,
        [assetId]: {
          ...(byAsset[assetId] ?? EMPTY),
          status: 'error',
          error: describeError(error),
        },
      },
    }));
  }
}

export function replaceFace(assetId: string, face: Face) {
  useFaces.setState(({ byAsset }) => {
    const current = byAsset[assetId] ?? EMPTY;
    return {
      byAsset: {
        ...byAsset,
        [assetId]: {
          ...current,
          items: current.items.map((item) =>
            item.id === face.id ? face : item,
          ),
        },
      },
    };
  });
}

export function useAssetFaces(
  assetId: string,
  versionId: string,
): FacesOfAsset {
  const faces = useFaces((state) => state.byAsset[assetId]);

  // Лица считаются для текущей версии: новая версия — новые лица
  useEffect(() => {
    void loadFaces(assetId);
  }, [assetId, versionId]);

  return faces ?? EMPTY;
}
