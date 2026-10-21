import { api, type Schemas } from '@shared/api';

/**
 * Скачивание оригинала: сервер выдаёт presigned URL с `Content-Disposition: attachment`
 * и исходным именем файла, поэтому переход по ссылке не уводит со страницы.
 */
export async function downloadAsset(assetId: string, versionId?: string) {
  const { url } = await api.get<Schemas['DownloadResponse']>(
    `/assets/${assetId}/download`,
    {
      query: { version_id: versionId },
    },
  );

  const link = document.createElement('a');
  link.href = url;
  link.rel = 'noopener';
  link.click();
}
