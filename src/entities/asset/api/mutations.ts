import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, describeError, unwrap, uploadFile } from '@shared/api';
import { toast } from '@shared/ui/toast';
import { assetKeys } from './queries';

/** Новая версия: загрузка файла с проверкой SHA-256 и привязка к активу. */
export function useAddVersion(assetId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) }),
      queryClient.invalidateQueries({ queryKey: assetKeys.versions(assetId) }),
      queryClient.invalidateQueries({ queryKey: [...assetKeys.all, 'list'] }),
    ]);

  return useMutation({
    mutationFn: async ({
      file,
      sourceVersionId,
    }: {
      file: File;
      sourceVersionId?: string;
    }) => {
      const stored = await uploadFile(file);
      return unwrap(
        api.POST('/api/user/v1/assets/{asset_id}/versions', {
          params: { path: { asset_id: assetId } },
          body: {
            objectId: stored.id,
            originalFilename: file.name,
            sourceVersionId,
          },
        }),
      );
    },
    onSuccess: async (version) => {
      await invalidate();
      toast.info(`Версия ${version.number} загружена и обрабатывается`);
    },
    onError: (error) => toast.error(describeError(error)),
  });
}
