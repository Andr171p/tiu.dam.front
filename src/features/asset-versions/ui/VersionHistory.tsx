import clsx from 'clsx';
import {
  CircleAlert,
  Download,
  History,
  Loader,
  Pencil,
  Upload,
} from 'lucide-react';
import { useRef } from 'react';
import {
  useAddVersion,
  useVersions,
  type Asset,
  type AssetVersion,
} from '@entities/asset';
import { formatBytes, formatRelative } from '@shared/lib/format';
import { Badge } from '@shared/ui/badge';
import { Button, IconButton } from '@shared/ui/button';
import { Skeleton } from '@shared/ui/skeleton';
import { downloadVersion, usePromoteVersion } from '../model/versions';
import styles from './VersionHistory.module.scss';

function VersionRow({
  asset,
  version,
  sourceNumber,
}: {
  asset: Asset;
  version: AssetVersion;
  sourceNumber?: number;
}) {
  const promote = usePromoteVersion(asset.id);
  const current = version.isCurrent;

  return (
    <li className={clsx(styles.row, current && styles.current)}>
      <span className={styles.thumb}>
        {version.renditions.thumbnail ? (
          <img src={version.renditions.thumbnail} alt="" loading="lazy" />
        ) : (
          <span className={styles.number}>v{version.number}</span>
        )}
      </span>

      <div className={styles.info}>
        <div className={styles.title}>
          <span>Версия {version.number}</span>
          {current && <Badge tone="primary">Текущая</Badge>}
          {version.status === 'processing' && (
            <Badge tone="accent" icon={Loader}>
              Обработка
            </Badge>
          )}
          {version.status === 'failed' && (
            <Badge tone="danger" icon={CircleAlert}>
              Не принята
            </Badge>
          )}
        </div>
        <span className={styles.caption}>
          {version.createdBy.displayName} · {formatRelative(version.createdAt)}{' '}
          · {formatBytes(version.sizeBytes)}
        </span>
        {sourceNumber && (
          <span className={styles.caption}>
            <Pencil size={11} aria-hidden /> Отредактирована из версии{' '}
            {sourceNumber}
          </span>
        )}
        {version.error && <span className={styles.error}>{version.error}</span>}
      </div>

      <div className={styles.actions}>
        {asset.canEdit && !current && version.status === 'ready' && (
          <Button
            size="sm"
            variant="ghost"
            icon={History}
            loading={promote.isPending}
            onClick={() => promote.mutate(version.id)}
          >
            Вернуть
          </Button>
        )}
        {version.status === 'ready' && (
          <IconButton
            icon={Download}
            label="Скачать"
            onClick={() => void downloadVersion(asset.id, version.id)}
          />
        )}
      </div>
    </li>
  );
}

export function VersionHistory({ asset }: { asset: Asset }) {
  const versions = useVersions(asset.id);
  const addVersion = useAddVersion(asset.id);
  const input = useRef<HTMLInputElement>(null);
  const numbers = new Map(
    versions.data?.map((version) => [version.id, version.number]),
  );

  return (
    <div className={styles.history}>
      {asset.canEdit && asset.status === 'active' && (
        <>
          <Button
            icon={Upload}
            loading={addVersion.isPending}
            onClick={() => input.current?.click()}
          >
            Загрузить новую версию
          </Button>
          <input
            ref={input}
            type="file"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) addVersion.mutate({ file });
              event.target.value = '';
            }}
          />
        </>
      )}

      {versions.isPending ? (
        <Skeleton height={64} />
      ) : (
        <ol className={styles.list}>
          {versions.data?.map((version) => (
            <VersionRow
              key={version.id}
              asset={asset}
              version={version}
              sourceNumber={
                version.sourceVersionId
                  ? numbers.get(version.sourceVersionId)
                  : undefined
              }
            />
          ))}
        </ol>
      )}
    </div>
  );
}
