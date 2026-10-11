import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@shared/api';
import { toast } from '@shared/ui/toast';
import type { Collection, CollectionSettings } from '../model/types';
import { collectionKeys } from './queries';

/** Настройки заменяются целиком: каждая вкладка передаёт только свой раздел. */
export function useUpdateSettings(
  collection: Collection,
  successMessage = 'Настройки сохранены',
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (changes: Partial<CollectionSettings>) =>
      unwrap(
        api.PUT('/api/user/v1/collections/{collection_id}/settings', {
          params: { path: { collection_id: collection.id } },
          body: { ...collection.settings, ...changes },
        }),
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(collectionKeys.detail(updated.id), updated);
      void queryClient.invalidateQueries({
        queryKey: [...collectionKeys.all, 'list'],
      });
      toast.success(successMessage);
    },
  });
}
