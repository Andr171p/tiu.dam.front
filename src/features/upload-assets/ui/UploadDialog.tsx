import { Check, CircleAlert, Clock, RotateCw, X } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { can, loadCollections, useCollections } from '@entities/collection';
import { routes } from '@shared/config/routes';
import { Button, IconButton } from '@shared/ui/button';
import { Dialog } from '@shared/ui/dialog';
import { DropZone } from '@shared/ui/drop-zone';
import { InlineSelect } from '@shared/ui/inline-select';
import { Progress } from '@shared/ui/progress';
import { toast } from '@shared/ui/toast';
import { acceptOf, describePolicy, rejectReason } from '../lib/policy';
import {
  cancelUpload,
  chooseUploadCollection,
  clearFinishedUploads,
  closeUploadDialog,
  enqueueUploads,
  retryUpload,
  useUploads,
  type UploadItem,
} from '../model/upload-store';
import styles from './UploadDialog.module.scss';

function statusLine(item: UploadItem): {
  text: string;
  tone: 'muted' | 'accent' | 'success' | 'warning' | 'danger';
} {
  switch (item.status) {
    case 'queued':
      return { text: 'В очереди', tone: 'muted' };
    case 'uploading':
      return {
        text: `Загрузка · ${Math.round(item.progress * 100)}%`,
        tone: 'accent',
      };
    case 'processing':
      return {
        text: item.file.type.startsWith('video/')
          ? 'Создание прокси 720p и AI-разметка…'
          : 'Создание превью и AI-тегов…',
        tone: 'accent',
      };
    case 'ready':
      return {
        text: item.asset?.tags.length
          ? 'Загружен · AI-теги готовы'
          : 'Загружен · AI-теги появятся чуть позже',
        tone: 'success',
      };
    case 'failed':
      return {
        text: 'Сохранён без превью · доступен для скачивания',
        tone: 'warning',
      };
    case 'error':
      return { text: item.error ?? 'Не удалось загрузить', tone: 'danger' };
  }
}

function UploadRow({ item }: { item: UploadItem }) {
  const line = statusLine(item);
  const thumbnail = item.asset?.version.urls.thumbnail ?? item.previewUrl;

  return (
    <li className={styles.row}>
      <span className={styles.thumb}>
        {thumbnail && <img src={thumbnail} alt="" />}
      </span>
      <span className={styles.info}>
        <span className={styles.name}>{item.file.name}</span>
        <span className={styles[line.tone]}>{line.text}</span>
        {item.status === 'uploading' && (
          <Progress
            value={item.progress}
            label={`Загрузка ${item.file.name}`}
          />
        )}
      </span>
      <span className={styles.state}>
        {item.status === 'ready' && (
          <Check
            size={20}
            strokeWidth={1.7}
            className={styles.success}
            aria-label="Готово"
          />
        )}
        {(item.status === 'processing' || item.status === 'queued') && (
          <Clock
            size={20}
            strokeWidth={1.7}
            className={styles.accent}
            aria-label="Обработка"
          />
        )}
        {item.status === 'failed' && (
          <CircleAlert
            size={20}
            strokeWidth={1.7}
            className={styles.warning}
            aria-hidden
          />
        )}
        {item.status === 'error' && (
          <IconButton
            icon={RotateCw}
            label="Повторить"
            onClick={() => retryUpload(item.id)}
          />
        )}
        {(item.status === 'queued' ||
          item.status === 'uploading' ||
          item.status === 'error') && (
          <IconButton
            icon={X}
            label="Отменить"
            onClick={() => cancelUpload(item.id)}
          />
        )}
      </span>
    </li>
  );
}

/** Загрузка материалов: файлы уходят прямо в хранилище, превью и AI-теги появляются после обработки. */
export function UploadDialog() {
  const navigate = useNavigate();
  const open = useUploads((state) => state.dialogOpen);
  const items = useUploads((state) => state.items);
  const collectionId = useUploads((state) => state.collectionId);
  const collections = useCollections((state) => state.items);
  const writable = collections.filter((collection) => can(collection, 'write'));
  const target =
    writable.find((collection) => collection.id === collectionId) ??
    writable[0];
  const done = items.filter(
    (item) => item.status === 'ready' || item.status === 'failed',
  ).length;

  useEffect(() => {
    if (open) void loadCollections();
  }, [open]);

  const addFiles = (files: File[]) => {
    if (!target) return;
    const accepted = files.filter((file) => {
      const reason = rejectReason(file, target.uploadPolicy);
      if (reason) toast.error(`«${file.name}» не загружен: ${reason}`);
      return !reason;
    });
    if (target.id !== collectionId) chooseUploadCollection(target.id);
    enqueueUploads(target.id, accepted);
  };

  const close = () => {
    clearFinishedUploads();
    closeUploadDialog();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      size="md"
      title="Загрузка материалов"
      description={
        writable.length > 1 && target ? (
          <InlineSelect
            label="Коллекция"
            value={target.id}
            options={writable.map((collection) => ({
              value: collection.id,
              label: collection.name,
            }))}
            onChange={chooseUploadCollection}
            className={styles.collection}
          />
        ) : (
          (target?.name ?? 'Нет коллекций, в которые вы можете загружать')
        )
      }
    >
      <DropZone
        multiple
        disabled={!target}
        accept={acceptOf(target?.uploadPolicy)}
        title="Перетащите файлы или выберите на компьютере"
        hint={describePolicy(target?.uploadPolicy)}
        onFiles={addFiles}
      />

      {items.length > 0 && (
        <section className={styles.queue}>
          <header className={styles.queueHeader}>
            <h3>Обработка файлов</h3>
            <span>
              {done} из {items.length} готовы
            </span>
          </header>
          <ul className={styles.list}>
            {items.map((item) => (
              <UploadRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}

      <p className={styles.auto}>
        <span className={styles.autoMark}>
          <Check size={10} strokeWidth={3} aria-hidden />
        </span>
        AI-тегирование и прокси-версии создаются автоматически
      </p>

      <footer className={styles.footer}>
        <Button onClick={closeUploadDialog}>Свернуть</Button>
        <Button
          variant="primary"
          onClick={() => {
            close();
            void navigate(
              target ? routes.collection(target.id) : routes.library(),
            );
          }}
        >
          {target ? 'Открыть коллекцию' : 'Открыть медиатеку'}
        </Button>
      </footer>
    </Dialog>
  );
}
