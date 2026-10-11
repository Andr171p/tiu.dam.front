import { api, unwrap } from './client';
import { ApiError } from './errors';
import type { Schemas } from './types';

export type UploadStage = 'hashing' | 'uploading' | 'verifying';

export interface UploadProgress {
  stage: UploadStage;
  /** 0..1 для текущего этапа */
  ratio: number;
}

export async function sha256Hex(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    await file.arrayBuffer(),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

/** PUT по presigned URL через XHR: у fetch нет событий прогресса отправки. */
function putFile(
  target: Schemas['UploadTarget'],
  file: Blob,
  onProgress: (ratio: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(target.method, target.url);
    for (const [name, value] of Object.entries(target.headers))
      xhr.setRequestHeader(name, value);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(
            new ApiError(
              xhr.status,
              xhr.responseText.includes('Checksum')
                ? 'Файл повредился при передаче: контрольная сумма не совпала'
                : 'Хранилище отклонило файл',
            ),
          );
    xhr.onerror = () => reject(new TypeError('Нет соединения с хранилищем'));
    xhr.onabort = () =>
      reject(new DOMException('Загрузка отменена', 'AbortError'));
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });

    xhr.send(file);
  });
}

/**
 * Загрузка файла в хранилище с подтверждением целостности:
 * SHA-256 считается в браузере, входит в подпись URL и сверяется хранилищем и сервером.
 */
export async function uploadFile(
  file: File,
  onProgress: (progress: UploadProgress) => void = () => {},
  signal?: AbortSignal,
): Promise<Schemas['StoredObjectResponse']> {
  onProgress({ stage: 'hashing', ratio: 0 });
  const sha256 = await sha256Hex(file);

  const upload = await unwrap(
    api.POST('/api/user/v1/uploads', {
      body: {
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        sha256,
      },
      signal,
    }),
  );

  await putFile(
    upload.target,
    file,
    (ratio) => onProgress({ stage: 'uploading', ratio }),
    signal,
  );

  onProgress({ stage: 'verifying', ratio: 1 });
  return unwrap(
    api.POST('/api/user/v1/uploads/{upload_id}/complete', {
      params: { path: { upload_id: upload.id } },
      signal,
    }),
  );
}
