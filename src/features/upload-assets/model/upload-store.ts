import { create } from 'zustand';
import {
  api,
  describeError,
  unwrap,
  uploadFile,
  type UploadStage,
} from '@shared/api';

export type UploadStatus =
  'queued' | UploadStage | 'creating' | 'done' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  collectionId: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  assetId?: string;
}

interface UploadState {
  items: UploadItem[];
}

export const useUploads = create<UploadState>()(() => ({ items: [] }));

/** Параллельных загрузок: больше — меньше пользы и больше нагрузки на канал и хеширование. */
const CONCURRENCY = 3;

let active = 0;
let onAssetCreated: (collectionId: string) => void = () => {};

function update(id: string, patch: Partial<UploadItem>) {
  useUploads.setState(({ items }) => ({
    items: items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  }));
}

async function run(item: UploadItem) {
  try {
    const stored = await uploadFile(item.file, ({ stage, ratio }) =>
      update(item.id, {
        status: stage,
        progress: stage === 'uploading' ? ratio : item.progress,
      }),
    );

    update(item.id, { status: 'creating', progress: 1 });
    const asset = await unwrap(
      api.POST('/api/user/v1/collections/{collection_id}/assets', {
        params: { path: { collection_id: item.collectionId } },
        body: { objectId: stored.id, originalFilename: item.file.name },
      }),
    );

    update(item.id, { status: 'done', assetId: asset.id });
    onAssetCreated(item.collectionId);
  } catch (error) {
    update(item.id, { status: 'error', error: describeError(error) });
  }
}

function pump() {
  while (active < CONCURRENCY) {
    const next = useUploads
      .getState()
      .items.find((item) => item.status === 'queued');
    if (!next) return;

    active += 1;
    update(next.id, { status: 'hashing' });
    void run(next).finally(() => {
      active -= 1;
      pump();
    });
  }
}

export function enqueueUploads(collectionId: string, files: Iterable<File>) {
  const added = Array.from(files, (file) => ({
    id: crypto.randomUUID(),
    file,
    collectionId,
    status: 'queued' as const,
    progress: 0,
  }));
  useUploads.setState(({ items }) => ({ items: [...items, ...added] }));
  pump();
}

export function retryUpload(id: string) {
  update(id, { status: 'queued', progress: 0, error: undefined });
  pump();
}

export function clearFinishedUploads() {
  useUploads.setState(({ items }) => ({
    items: items.filter(
      (item) => item.status !== 'done' && item.status !== 'error',
    ),
  }));
}

/** Подписка на появление новых активов: чтобы обновить сетку коллекции. */
export function setAssetCreatedHandler(
  handler: (collectionId: string) => void,
) {
  onAssetCreated = handler;
}
