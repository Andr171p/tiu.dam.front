import { Download, History } from 'lucide-react';
import { useState } from 'react';
import {
  downloadAsset,
  fetchAsset,
  invalidateAssets,
  uploadFile,
  type Asset,
  type AssetVersion,
} from '@entities/asset';
import { UserName } from '@entities/user';
import { api, describeError } from '@shared/api';
import {
  formatBytes,
  formatDateTime,
  formatDimensions,
} from '@shared/lib/format';
import { usePolling, useRequest } from '@shared/lib/hooks';
import { Button, IconButton } from '@shared/ui/button';
import { DropZone } from '@shared/ui/drop-zone';
import { Notice } from '@shared/ui/notice';
import { Progress } from '@shared/ui/progress';
import { Skeleton } from '@shared/ui/skeleton';
import { Tag } from '@shared/ui/tag';
import { toast } from '@shared/ui/toast';
import styles from './VersionsPanel.module.scss';

function describe(version: AssetVersion, versions: AssetVersion[]): string {
  const meta = version.meta;
  const parts = [
    formatBytes(version.file.size),
    meta?.width && meta.height
      ? formatDimensions(meta.width, meta.height)
      : null,
  ];
  const source = versions.find((item) => item.id === version.sourceVersionId);
  if (source) parts.push(`правка версии ${source.number}`);
  return parts.filter(Boolean).join(' · ');
}

/** История версий: оригиналы не меняются, откат делает старую версию текущей. */
export function VersionsPanel({
  asset,
  editable,
}: {
  asset: Asset;
  editable: boolean;
}) {
  const versions = useRequest(
    (signal) =>
      api.get<AssetVersion[]>(`/assets/${asset.id}/versions`, { signal }),
    [asset.id, asset.version.id, asset.versionCount],
  );
  const [upload, setUpload] = useState<{
    name: string;
    progress: number;
  } | null>(null);
  const list = [...(versions.data ?? [])].sort((a, b) => b.number - a.number);

  // Результат редактора появляется после рендера на сервере
  usePolling(
    versions.reload,
    list.some((version) => version.status === 'processing'),
    4000,
  );

  const makeCurrent = async (version: AssetVersion) => {
    try {
      await api.post(`/assets/${asset.id}/versions/${version.id}/make-current`);
      invalidateAssets();
      await fetchAsset(asset.id);
      toast.success(`Версия ${version.number} стала текущей`);
    } catch (error) {
      toast.error(describeError(error));
    }
  };

  const uploadVersion = async ([file]: File[]) => {
    setUpload({ name: file.name, progress: 0 });
    try {
      await uploadFile(
        file,
        { assetId: asset.id },
        {
          onProgress: (progress) => setUpload({ name: file.name, progress }),
        },
      );
      invalidateAssets();
      await fetchAsset(asset.id);
      toast.success('Новая версия загружена и обрабатывается');
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setUpload(null);
    }
  };

  return (
    <div className={styles.panel}>
      {editable &&
        (upload ? (
          <div className={styles.uploading}>
            <span>
              Загрузка «{upload.name}» · {Math.round(upload.progress * 100)}%
            </span>
            <Progress value={upload.progress} label="Загрузка новой версии" />
          </div>
        ) : (
          <DropZone
            title="Загрузить новую версию"
            hint="Того же типа, что и материал: фото → фото"
            onFiles={(files) => void uploadVersion(files)}
          />
        ))}

      {versions.status === 'error' && <Notice>{versions.error}</Notice>}
      {!versions.data && versions.status === 'loading' && (
        <Skeleton height={72} />
      )}

      <ol className={styles.list}>
        {list.map((version) => {
          const current = version.id === asset.version.id;
          return (
            <li
              key={version.id}
              className={current ? styles.current : styles.item}
            >
              <div className={styles.head}>
                <span className={styles.number}>Версия {version.number}</span>
                {current && <Tag tone="accent">Текущая</Tag>}
                {version.status === 'processing' && (
                  <Tag tone="neutral">Обрабатывается</Tag>
                )}
                {version.status === 'failed' && (
                  <Tag tone="warning">Без превью</Tag>
                )}
              </div>
              <p className={styles.meta}>{describe(version, list)}</p>
              <p className={styles.meta}>
                {formatDateTime(version.createdAt)} ·{' '}
                <UserName id={version.createdBy} />
              </p>
              {version.note && <p className={styles.note}>{version.note}</p>}
              <div className={styles.actions}>
                {editable && !current && version.status !== 'processing' && (
                  <Button
                    size="sm"
                    icon={History}
                    onClick={() => void makeCurrent(version)}
                  >
                    Сделать текущей
                  </Button>
                )}
                <IconButton
                  icon={Download}
                  label={`Скачать версию ${version.number}`}
                  onClick={() =>
                    void downloadAsset(asset.id, version.id).catch(
                      (error: unknown) => toast.error(describeError(error)),
                    )
                  }
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
