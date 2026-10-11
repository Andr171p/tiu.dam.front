import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Check, ChevronDown, CircleAlert, RotateCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { assetKeys } from '@entities/asset';
import { collectionKeys } from '@entities/collection';
import {
  clearFinishedUploads,
  retryUpload,
  setAssetCreatedHandler,
  useUploads,
  type UploadItem,
  type UploadStatus,
} from '@features/upload-assets';
import { routes } from '@shared/config/routes';
import { formatBytes, plural } from '@shared/lib/format';
import { IconButton } from '@shared/ui/button';
import { Spinner } from '@shared/ui/spinner';
import styles from './UploadQueue.module.scss';

const STATUS_LABELS: Record<UploadStatus, string> = {
  queued: 'В очереди',
  hashing: 'Считаем контрольную сумму',
  uploading: 'Загрузка',
  verifying: 'Проверка целостности',
  creating: 'Создание актива',
  done: 'Загружено, идёт обработка',
  error: 'Ошибка',
};

function Row({ item }: { item: UploadItem }) {
  const finished = item.status === 'done' || item.status === 'error';

  return (
    <li className={styles.row}>
      <span className={clsx(styles.state, styles[item.status])}>
        {item.status === 'done' && <Check size={14} />}
        {item.status === 'error' && <CircleAlert size={14} />}
        {!finished && <Spinner size={13} />}
      </span>
      <div className={styles.info}>
        {item.assetId ? (
          <Link to={routes.asset(item.assetId)} className={styles.name}>
            {item.file.name}
          </Link>
        ) : (
          <span className={styles.name}>{item.file.name}</span>
        )}
        <span className={styles.caption}>
          {item.error ??
            `${STATUS_LABELS[item.status]} · ${formatBytes(item.file.size)}`}
        </span>
        {item.status === 'uploading' && (
          <span className={styles.progress}>
            <span style={{ width: `${Math.round(item.progress * 100)}%` }} />
          </span>
        )}
      </div>
      {item.status === 'error' && (
        <IconButton
          icon={RotateCw}
          label="Повторить"
          onClick={() => retryUpload(item.id)}
        />
      )}
    </li>
  );
}

/** Очередь загрузок: плавающая панель, видна на любом экране, пока идут загрузки. */
export function UploadQueue() {
  const items = useUploads((state) => state.items);
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setAssetCreatedHandler((collectionId) => {
      void queryClient.invalidateQueries({
        queryKey: [...assetKeys.all, 'list', collectionId],
      });
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all });
    });
  }, [queryClient]);

  if (!items.length) return null;

  const pending = items.filter(
    (item) => item.status !== 'done' && item.status !== 'error',
  ).length;
  const failed = items.filter((item) => item.status === 'error').length;

  return (
    <section className={styles.panel} aria-label="Загрузки">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>
            {pending
              ? `Загрузка: ${plural(pending, ['файл', 'файла', 'файлов'])}`
              : 'Загрузки завершены'}
          </h2>
          {failed > 0 && (
            <span className={styles.failed}>
              {plural(failed, ['ошибка', 'ошибки', 'ошибок'])}
            </span>
          )}
        </div>
        <IconButton
          icon={ChevronDown}
          label={collapsed ? 'Развернуть' : 'Свернуть'}
          className={clsx(styles.toggle, collapsed && styles.rotated)}
          onClick={() => setCollapsed((value) => !value)}
        />
        {pending === 0 && (
          <IconButton
            icon={X}
            label="Очистить"
            onClick={clearFinishedUploads}
          />
        )}
      </header>
      {!collapsed && (
        <ul className={styles.list}>
          {items.map((item) => (
            <Row key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}
