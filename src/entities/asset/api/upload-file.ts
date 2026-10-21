import { api, ApiError, type Schemas } from '@shared/api';
import type { Asset } from '../model/types';

type UploadTicket = Schemas['UploadTicket'];

/** Новый материал в коллекции или новая версия существующего. */
export type UploadTarget = { collectionId: string } | { assetId: string };

interface UploadOptions {
  title?: string;
  /** 0..1 по переданным байтам */
  onProgress?: (ratio: number) => void;
  signal?: AbortSignal;
}

/** PUT по presigned URL через XHR: у fetch нет событий прогресса отправки. */
function put(
  url: string,
  body: Blob,
  headers: Record<string, string>,
  onProgress: (loaded: number) => void,
  signal?: AbortSignal,
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    for (const [name, value] of Object.entries(headers))
      xhr.setRequestHeader(name, value);

    xhr.upload.onprogress = (event) => onProgress(event.loaded);
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve(xhr.getResponseHeader('ETag'))
        : reject(new ApiError(xhr.status, 'Хранилище отклонило файл'));
    xhr.onerror = () => reject(new TypeError('Нет соединения с хранилищем'));
    xhr.onabort = () =>
      reject(new DOMException('Загрузка отменена', 'AbortError'));
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });

    xhr.send(body);
  });
}

/**
 * Загрузка напрямую в хранилище по presigned URL: API не пропускает файл через себя.
 * До 100 МБ — одним PUT, больше — частями (multipart, ETag каждой части подтверждается).
 * Ответ — материал, версия которого ещё обрабатывается (`version.status = processing`).
 */
export async function uploadFile(
  file: File,
  target: UploadTarget,
  { title, onProgress = () => {}, signal }: UploadOptions = {},
): Promise<Asset> {
  const ticket = await api.post<UploadTicket>('/uploads', {
    body: {
      ...target,
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
    },
    signal,
  });

  try {
    const report = (loaded: number) =>
      onProgress(file.size > 0 ? loaded / file.size : 1);

    if (ticket.url) {
      await put(ticket.url, file, ticket.headers, report, signal);
      return await api.post<Asset>(`/uploads/${ticket.uploadId}/complete`, {
        body: { title },
        signal,
      });
    }

    const partSize = ticket.partSize ?? file.size;
    const parts: Schemas['CompletedPartDTO'][] = [];
    for (const part of ticket.parts) {
      const start = (part.partNumber - 1) * partSize;
      const etag = await put(
        part.url,
        file.slice(start, start + partSize),
        {},
        (loaded) => report(start + loaded),
        signal,
      );
      if (!etag)
        throw new ApiError(502, 'Хранилище не подтвердило часть файла');
      parts.push({ partNumber: part.partNumber, etag });
    }

    return await api.post<Asset>(`/uploads/${ticket.uploadId}/complete`, {
      body: { parts, title },
      signal,
    });
  } catch (error) {
    // Брошенную сессию сервер удалит сам через 6 часов, но лучше освободить место сразу
    void api.delete(`/uploads/${ticket.uploadId}`).catch(() => undefined);
    throw error;
  }
}
