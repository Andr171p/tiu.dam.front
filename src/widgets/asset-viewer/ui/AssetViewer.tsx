import {
  CircleAlert,
  Crop,
  Download,
  File,
  FileText,
  Loader,
} from 'lucide-react';
import {
  displayVersion,
  hasFailed,
  isProcessing,
  type Asset,
} from '@entities/asset';
import { downloadVersion } from '@features/asset-versions';
import { routes } from '@shared/config/routes';
import { Button, ButtonLink } from '@shared/ui/button';
import styles from './AssetViewer.module.scss';

export function AssetViewer({ asset }: { asset: Asset }) {
  const version = displayVersion(asset);
  const preview = version?.renditions.preview;
  const processing = isProcessing(asset) && !asset.currentVersion;
  const canEditImage =
    asset.canEdit &&
    asset.kind === 'image' &&
    asset.currentVersion?.renditions.preview;

  return (
    <section className={styles.viewer} aria-label="Просмотр">
      <div className={styles.stage}>
        {preview ? (
          <img src={preview} alt={asset.title} className={styles.image} />
        ) : processing ? (
          <div className={styles.placeholder}>
            <Loader size={36} className={styles.spin} aria-hidden />
            <p>Файл проверяется и обрабатывается…</p>
            <span>Проверяем SHA-256, извлекаем метаданные, готовим превью</span>
          </div>
        ) : (
          <div className={styles.placeholder}>
            {asset.kind === 'document' ? (
              <FileText size={48} aria-hidden />
            ) : (
              <File size={48} aria-hidden />
            )}
            <p>{version?.originalFilename}</p>
            <span>Предпросмотр для этого формата недоступен</span>
          </div>
        )}
      </div>

      {hasFailed(asset) && asset.pendingVersion && (
        <div className={styles.failure} role="alert">
          <CircleAlert size={16} aria-hidden />
          Версия {asset.pendingVersion.number} не принята:{' '}
          {asset.pendingVersion.error}
        </div>
      )}

      {asset.currentVersion && (
        <div className={styles.toolbar}>
          {canEditImage && (
            <ButtonLink
              to={routes.assetEditor(asset.id)}
              variant="glass"
              icon={Crop}
            >
              Редактировать
            </ButtonLink>
          )}
          <Button
            variant="primary"
            icon={Download}
            onClick={() =>
              void downloadVersion(asset.id, asset.currentVersion!.id)
            }
          >
            Скачать
          </Button>
        </div>
      )}
    </section>
  );
}
