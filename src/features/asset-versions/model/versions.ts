import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assetKeys } from '@entities/asset';
import { api, describeError, unwrap } from '@shared/api';
import { toast } from '@shared/ui/toast';

function useInvalidateAsset(assetId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) }),
      queryClient.invalidateQueries({ queryKey: assetKeys.versions(assetId) }),
      queryClient.invalidateQueries({ queryKey: [...assetKeys.all, 'list'] }),
    ]);
}

export function usePromoteVersion(assetId: string) {
  const invalidate = useInvalidateAsset(assetId);

  return useMutation({
    mutationFn: (versionId: string) =>
      unwrap(
        api.POST(
          '/api/user/v1/assets/{asset_id}/versions/{version_id}/promote',
          {
            params: { path: { asset_id: assetId, version_id: versionId } },
          },
        ),
      ),
    onSuccess: async (version) => {
      await invalidate();
      toast.success(`Версия ${version.number} стала текущей`);
    },
    onError: (error) => toast.error(describeError(error)),
  });
}

/** Скачивание: ссылка выдаётся сервером под права пользователя и живёт несколько минут. */
export async function downloadVersion(assetId: string, versionId: string) {
  try {
    const download = await unwrap(
      api.GET('/api/user/v1/assets/{asset_id}/versions/{version_id}/download', {
        params: { path: { asset_id: assetId, version_id: versionId } },
      }),
    );
    const link = document.createElement('a');
    link.href = download.url;
    link.download = download.filename;
    link.rel = 'noopener';
    link.click();
    if (download.kind === 'preview')
      toast.info('Оригинал доступен участникам коллекции — скачано превью');
  } catch (error) {
    toast.error(describeError(error));
  }
}
