import { create } from 'zustand';
import { api } from '@shared/api';
import { usePolling, useRequest } from '@shared/lib/hooks';
import { registerStoreReset } from '@shared/lib/store-reset';
import type { Asset, AssetUpdate } from './types';

interface AssetsState {
  byId: Record<string, Asset>;
  /** Растёт после изменений, влияющих на списки: загрузка, корзина, перенос */
  revision: number;
}

/** Открытые материалы: карточку читают просмотр, панель и действия одновременно. */
export const useAssets = create<AssetsState>()(() => ({
  byId: {},
  revision: 0,
}));

registerStoreReset(() => useAssets.setState(useAssets.getInitialState(), true));

/** Пока файл обрабатывается, карточку перечитываем: появятся превью и AI-теги */
const PROCESSING_POLL_MS = 4000;

export function setAsset(asset: Asset) {
  useAssets.setState(({ byId }) => ({ byId: { ...byId, [asset.id]: asset } }));
}

export async function fetchAsset(
  id: string,
  signal?: AbortSignal,
): Promise<Asset> {
  const asset = await api.get<Asset>(`/assets/${id}`, { signal });
  setAsset(asset);
  return asset;
}

export async function updateAsset(
  id: string,
  changes: AssetUpdate,
): Promise<Asset> {
  const asset = await api.patch<Asset>(`/assets/${id}`, { body: changes });
  setAsset(asset);
  invalidateAssets();
  return asset;
}

/** Ленты материалов перезагрузятся: изменился состав или порядок. */
export function invalidateAssets() {
  useAssets.setState(({ revision }) => ({ revision: revision + 1 }));
}

/** Карточка материала с загрузкой и опросом, пока идёт обработка файла. */
export function useAsset(id: string) {
  const asset = useAssets((state) => state.byId[id]);
  const request = useRequest((signal) => fetchAsset(id, signal), [id]);

  usePolling(
    request.reload,
    asset?.version.status === 'processing',
    PROCESSING_POLL_MS,
  );

  return {
    asset,
    status: request.status,
    error: request.error,
    httpStatus: request.httpStatus,
    reload: request.reload,
  };
}
