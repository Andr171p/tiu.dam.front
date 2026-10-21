import { create } from 'zustand';
import {
  fetchAsset,
  invalidateAssets,
  uploadFile,
  type Asset,
} from '@entities/asset';
import { describeError } from '@shared/api';
import { storage } from '@shared/lib/storage';

/**
 * queued → uploading → processing (превью, прокси, AI-теги) → ready.
 * failed — файл сохранён, но обработать не удалось (доступен для скачивания);
 * error — загрузка не удалась, можно повторить.
 */
export type UploadStatus =
  'queued' | 'uploading' | 'processing' | 'ready' | 'failed' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  collectionId: string;
  status: UploadStatus;
  /** 0..1 переданных байтов */
  progress: number;
  /** Локальное превью изображения до появления серверного */
  previewUrl: string | null;
  asset: Asset | null;
  error: string | null;
}

interface UploadState {
  items: UploadItem[];
  dialogOpen: boolean;
  /** Коллекция, в которую загружаем: последняя выбранная запоминается */
  collectionId: string | null;
}

const LAST_COLLECTION_KEY = 'tiu-dam.upload.collection';

export const useUploads = create<UploadState>()(() => ({
  items: [],
  dialogOpen: false,
  collectionId: storage.read<string | null>(LAST_COLLECTION_KEY, null),
}));

/** Параллельных загрузок: больше — меньше пользы и больше нагрузки на канал */
const CONCURRENCY = 3;
/** Как часто проверять, готовы ли превью и AI-теги */
const PROCESSING_POLL_MS = 4000;

let active = 0;
const controllers = new Map<string, AbortController>();

function update(id: string, patch: Partial<UploadItem>) {
  useUploads.setState(({ items }) => ({
    items: items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  }));
}

const current = (id: string) =>
  useUploads.getState().items.find((item) => item.id === id);

function settle(item: UploadItem, asset: Asset) {
  const { status } = asset.version;
  update(item.id, { asset, status });
  if (status === 'processing')
    setTimeout(() => void poll(item.id), PROCESSING_POLL_MS);
}

async function poll(id: string) {
  const item = current(id);
  if (!item?.asset || item.status !== 'processing') return;
  try {
    settle(item, await fetchAsset(item.asset.id));
  } catch {
    // Сбой опроса не отменяет загрузку: попробуем позже
    setTimeout(() => void poll(id), PROCESSING_POLL_MS * 2);
  }
}

async function run(item: UploadItem) {
  const controller = new AbortController();
  controllers.set(item.id, controller);
  try {
    const asset = await uploadFile(
      item.file,
      { collectionId: item.collectionId },
      {
        signal: controller.signal,
        onProgress: (progress) => update(item.id, { progress }),
      },
    );
    invalidateAssets();
    settle(item, asset);
  } catch (error) {
    if (!controller.signal.aborted)
      update(item.id, { status: 'error', error: describeError(error) });
  } finally {
    controllers.delete(item.id);
  }
}

function pump() {
  while (active < CONCURRENCY) {
    const next = useUploads
      .getState()
      .items.find((item) => item.status === 'queued');
    if (!next) return;

    active += 1;
    update(next.id, { status: 'uploading', progress: 0 });
    void run(next).finally(() => {
      active -= 1;
      pump();
    });
  }
}

export function openUploadDialog(collectionId?: string) {
  useUploads.setState((state) => ({
    dialogOpen: true,
    collectionId: collectionId ?? state.collectionId,
  }));
}

export function closeUploadDialog() {
  useUploads.setState({ dialogOpen: false });
}

export function chooseUploadCollection(collectionId: string) {
  storage.write(LAST_COLLECTION_KEY, collectionId);
  useUploads.setState({ collectionId });
}

export function enqueueUploads(collectionId: string, files: File[]) {
  const added: UploadItem[] = files.map((file) => ({
    id: crypto.randomUUID(),
    file,
    collectionId,
    status: 'queued',
    progress: 0,
    previewUrl: file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : null,
    asset: null,
    error: null,
  }));
  useUploads.setState(({ items }) => ({ items: [...added, ...items] }));
  pump();
}

export function retryUpload(id: string) {
  update(id, { status: 'queued', progress: 0, error: null });
  pump();
}

export function cancelUpload(id: string) {
  controllers.get(id)?.abort();
  const item = current(id);
  if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
  useUploads.setState(({ items }) => ({
    items: items.filter((entry) => entry.id !== id),
  }));
}

const isSettled = (item: UploadItem) =>
  item.status === 'ready' ||
  item.status === 'failed' ||
  item.status === 'error';

/** Убирает завершённые загрузки из списка. */
export function clearFinishedUploads() {
  const { items } = useUploads.getState();
  items
    .filter(isSettled)
    .forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
  useUploads.setState({ items: items.filter((item) => !isSettled(item)) });
}

/** Загрузки, которые ещё идут: для индикатора на кнопке «Загрузить». */
export function useActiveUploads(): { active: number; total: number } {
  const items = useUploads((state) => state.items);
  return {
    active: items.filter((item) => !isSettled(item)).length,
    total: items.length,
  };
}
