import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';
import { api, unwrap } from '@shared/api';
import { isProcessing, type Asset, type AssetKind } from '../model/types';

export interface AssetFilters {
  kind?: AssetKind;
  tag?: string;
  query?: string;
  status?: 'active' | 'archived';
}

/** Пока что-то обрабатывается, данные опрашиваются: статус меняется в фоне. */
const POLL_INTERVAL_MS = 2000;

export const assetKeys = {
  all: ['assets'] as const,
  list: (collectionId: string, filters: AssetFilters) =>
    [...assetKeys.all, 'list', collectionId, filters] as const,
  detail: (id: string) => [...assetKeys.all, 'detail', id] as const,
  versions: (id: string) => [...assetKeys.all, 'versions', id] as const,
  similar: (id: string) => [...assetKeys.all, 'similar', id] as const,
};

export const assetsQuery = (collectionId: string, filters: AssetFilters) =>
  queryOptions({
    queryKey: assetKeys.list(collectionId, filters),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/api/user/v1/collections/{collection_id}/assets', {
          params: {
            path: { collection_id: collectionId },
            query: { ...filters, limit: 200 },
          },
          signal,
        }),
      ),
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      query.state.data?.items.some(isProcessing) ? POLL_INTERVAL_MS : false,
  });

export const assetQuery = (id: string) =>
  queryOptions({
    queryKey: assetKeys.detail(id),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/api/user/v1/assets/{asset_id}', {
          params: { path: { asset_id: id } },
          signal,
        }),
      ),
    refetchInterval: (query) =>
      query.state.data && isProcessing(query.state.data)
        ? POLL_INTERVAL_MS
        : false,
  });

export const versionsQuery = (id: string) =>
  queryOptions({
    queryKey: assetKeys.versions(id),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/api/user/v1/assets/{asset_id}/versions', {
          params: { path: { asset_id: id } },
          signal,
        }),
      ),
    refetchInterval: (query) =>
      query.state.data?.some((version) => version.status === 'processing')
        ? POLL_INTERVAL_MS
        : false,
  });

export const similarQuery = (id: string) =>
  queryOptions({
    queryKey: assetKeys.similar(id),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/api/user/v1/assets/{asset_id}/similar', {
          params: { path: { asset_id: id }, query: { limit: 12 } },
          signal,
        }),
      ),
    staleTime: 60_000,
  });

export const useAssets = (collectionId: string, filters: AssetFilters) =>
  useQuery(assetsQuery(collectionId, filters));
export const useAsset = (id: string) => useQuery(assetQuery(id));
export const useVersions = (id: string) => useQuery(versionsQuery(id));
export const useSimilarAssets = (asset: Asset) =>
  useQuery({
    ...similarQuery(asset.id),
    enabled: asset.kind === 'image' && asset.currentVersion !== null,
  });
