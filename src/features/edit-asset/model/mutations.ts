import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assetKeys, type Asset } from '@entities/asset';
import { collectionKeys } from '@entities/collection';
import { api, describeError, unwrap, type Schemas } from '@shared/api';
import { toast } from '@shared/ui/toast';

export type AssetChanges = Schemas['UpdateAssetDTO'];

/** После изменения актива: свежие данные в кеше, списки и счётчики коллекций — перезапросить. */
function useApplyAsset() {
  const queryClient = useQueryClient();
  return (asset: Asset) => {
    queryClient.setQueryData(assetKeys.detail(asset.id), asset);
    void queryClient.invalidateQueries({
      queryKey: [...assetKeys.all, 'list'],
    });
    void queryClient.invalidateQueries({ queryKey: collectionKeys.all });
  };
}

export function useUpdateAsset(assetId: string, successMessage = 'Сохранено') {
  const apply = useApplyAsset();

  return useMutation({
    mutationFn: (body: AssetChanges) =>
      unwrap(
        api.PATCH('/api/user/v1/assets/{asset_id}', {
          params: { path: { asset_id: assetId } },
          body,
        }),
      ),
    onSuccess: (asset) => {
      apply(asset);
      toast.success(successMessage);
    },
  });
}

export function useSetTags(assetId: string) {
  const apply = useApplyAsset();

  return useMutation({
    mutationFn: (tags: string[]) =>
      unwrap(
        api.PUT('/api/user/v1/assets/{asset_id}/tags', {
          params: { path: { asset_id: assetId } },
          body: { tags },
        }),
      ),
    onSuccess: apply,
    onError: (error) => toast.error(describeError(error)),
  });
}

export function useDeleteAsset(assetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      unwrap(
        api.DELETE('/api/user/v1/assets/{asset_id}', {
          params: { path: { asset_id: assetId } },
        }),
      ),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: assetKeys.detail(assetId) });
      void queryClient.invalidateQueries({
        queryKey: [...assetKeys.all, 'list'],
      });
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      toast.success('Актив удалён');
    },
    onError: (error) => toast.error(describeError(error)),
  });
}
