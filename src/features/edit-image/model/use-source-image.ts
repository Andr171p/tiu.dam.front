import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@shared/api';

/**
 * Оригинал версии для редактирования. Загружается в blob: изображение с того же origin
 * не «загрязняет» canvas, и результат можно экспортировать.
 */
export function useSourceImage(assetId: string, versionId: string | undefined) {
  return useQuery({
    queryKey: ['edit-image', 'source', versionId],
    enabled: Boolean(versionId),
    staleTime: Infinity,
    gcTime: 0,
    queryFn: async ({ signal }) => {
      const download = await unwrap(
        api.GET(
          '/api/user/v1/assets/{asset_id}/versions/{version_id}/download',
          {
            params: { path: { asset_id: assetId, version_id: versionId! } },
            signal,
          },
        ),
      );
      const response = await fetch(download.url, { signal });
      if (!response.ok) throw new Error('Не удалось загрузить оригинал');

      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob, {
        imageOrientation: 'from-image',
      });
      return {
        bitmap,
        type: blob.type,
        filename: download.filename,
        isOriginal: download.kind === 'original',
      };
    },
  });
}
