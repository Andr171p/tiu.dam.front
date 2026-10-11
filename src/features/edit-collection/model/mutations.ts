import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionKeys, type Collection } from '@entities/collection';
import { api, describeError, unwrap, type Schemas } from '@shared/api';
import { toast } from '@shared/ui/toast';

function useApplyCollection() {
  const queryClient = useQueryClient();
  return (collection: Collection) => {
    queryClient.setQueryData(collectionKeys.detail(collection.id), collection);
    void queryClient.invalidateQueries({
      queryKey: [...collectionKeys.all, 'list'],
    });
  };
}

export function useUpdateCollection(collectionId: string) {
  const apply = useApplyCollection();

  return useMutation({
    mutationFn: (body: Schemas['UpdateCollectionDTO']) =>
      unwrap(
        api.PATCH('/api/user/v1/collections/{collection_id}', {
          params: { path: { collection_id: collectionId } },
          body,
        }),
      ),
    onSuccess: (collection) => {
      apply(collection);
      toast.success('Коллекция сохранена');
    },
    onError: (error) => toast.error(describeError(error)),
  });
}

export function useDeleteCollection(collectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      unwrap(
        api.DELETE('/api/user/v1/collections/{collection_id}', {
          params: { path: { collection_id: collectionId } },
        }),
      ),
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: collectionKeys.detail(collectionId),
      });
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      toast.success('Коллекция удалена');
    },
    onError: (error) => toast.error(describeError(error)),
  });
}
