import { queryOptions, useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@shared/api';
import type { CollectionScope } from '../model/types';

export const collectionKeys = {
  all: ['collections'] as const,
  list: (scope: CollectionScope, query: string) =>
    [...collectionKeys.all, 'list', scope, query] as const,
  detail: (id: string) => [...collectionKeys.all, 'detail', id] as const,
  members: (id: string) => [...collectionKeys.all, 'members', id] as const,
};

export const collectionsQuery = (scope: CollectionScope, query = '') =>
  queryOptions({
    queryKey: collectionKeys.list(scope, query),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/api/user/v1/collections', {
          params: { query: { scope, query: query || undefined, limit: 200 } },
          signal,
        }),
      ),
  });

export const collectionQuery = (id: string) =>
  queryOptions({
    queryKey: collectionKeys.detail(id),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/api/user/v1/collections/{collection_id}', {
          params: { path: { collection_id: id } },
          signal,
        }),
      ),
  });

export const membersQuery = (id: string) =>
  queryOptions({
    queryKey: collectionKeys.members(id),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/api/user/v1/collections/{collection_id}/members', {
          params: { path: { collection_id: id } },
          signal,
        }),
      ),
  });

export const useCollections = (scope: CollectionScope, query?: string) =>
  useQuery(collectionsQuery(scope, query));
export const useCollection = (id: string) =>
  useQuery({ ...collectionQuery(id), enabled: Boolean(id) });
export const useMembers = (id: string) => useQuery(membersQuery(id));
