import { Download } from 'lucide-react';
import { downloadPublicAsset, type PublicAsset } from '@entities/portal';
import { describeError } from '@shared/api';
import {
  formatBytes,
  formatDimensions,
  formatTimecode,
} from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { Dialog } from '@shared/ui/dialog';
import { toast } from '@shared/ui/toast';
import styles from './PortalView.module.scss';

interface PortalAssetDialogProps {
  slug: string;
  asset: PublicAsset | null;
  allowDownload: boolean;
  onClose: () => void;
}

/** Просмотр материала портала и скачивание оригинала, если владелец разрешил. */
export function PortalAssetDialog({
  slug,
  asset,
  allowDownload,
  onClose,
}: PortalAssetDialogProps) {
  const details = asset && [
    asset.width && asset.height
      ? formatDimensions(asset.width, asset.height)
      : null,
    asset.duration ? formatTimecode(asset.duration) : null,
    formatBytes(asset.fileSize),
  ];

  return (
    <Dialog
      open={asset !== null}
      onClose={onClose}
      size="md"
      title={asset?.title ?? ''}
    >
      {asset && (
        <>
          <div className={styles.lightbox}>
            {asset.videoUrl ? (
              <video
                src={asset.videoUrl}
                poster={asset.previewUrl ?? undefined}
                controls
              />
            ) : asset.audioUrl ? (
              <audio src={asset.audioUrl} controls />
            ) : asset.previewUrl ? (
              <img src={asset.previewUrl} alt={asset.title} />
            ) : null}
          </div>
          {asset.description && (
            <p className={styles.lightboxText}>{asset.description}</p>
          )}
          <footer className={styles.lightboxFooter}>
            <span>{details?.filter(Boolean).join(' · ')}</span>
            {allowDownload && (
              <Button
                variant="primary"
                icon={Download}
                onClick={() =>
                  void downloadPublicAsset(slug, asset.id).catch(
                    (error: unknown) => toast.error(describeError(error)),
                  )
                }
              >
                Скачать
              </Button>
            )}
          </footer>
        </>
      )}
    </Dialog>
  );
}
