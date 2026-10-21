import { FileText } from 'lucide-react';
import { AssetThumb, fileFormat, type Asset } from '@entities/asset';
import type { Face } from '@entities/person';
import { plural } from '@shared/lib/format';
import { ImageStage } from './ImageStage';
import { MediaPlayer } from './MediaPlayer';
import styles from './AssetViewer.module.scss';

interface AssetViewerProps {
  asset: Asset;
  /** Лица на кадре: рамки поверх изображения, участники в видео */
  faces?: Face[];
  onFaceClick?: (face: Face) => void;
  startAt?: number;
}

/** PDF и прочие файлы: превью первой страницы или карточка формата. */
function DocumentPreview({ asset }: { asset: Asset }) {
  const { urls, status, meta } = asset.version;

  if (urls.preview)
    return (
      <div className={styles.media}>
        <img
          src={urls.preview}
          alt={asset.title}
          className={styles.pagePreview}
        />
      </div>
    );

  if (status === 'processing')
    return (
      <AssetThumb asset={asset} size="preview" className={styles.placeholder} />
    );

  return (
    <div className={styles.media}>
      <div className={styles.document}>
        <FileText size={48} strokeWidth={1.2} aria-hidden />
        <span>
          {fileFormat(asset)}
          {meta?.pageCount &&
            ` · ${plural(meta.pageCount, ['страница', 'страницы', 'страниц'])}`}
        </span>
        <span className={styles.documentHint}>
          Предпросмотра нет — скачайте файл.
        </span>
      </div>
    </div>
  );
}

/** Просмотр материала по типу: изображение, видео, аудио, документ или файл. */
export function AssetViewer({
  asset,
  faces = [],
  onFaceClick,
  startAt,
}: AssetViewerProps) {
  switch (asset.kind) {
    case 'image':
      return (
        <ImageStage asset={asset} faces={faces} onFaceClick={onFaceClick} />
      );
    case 'video':
    case 'audio':
      return <MediaPlayer asset={asset} faces={faces} startAt={startAt} />;
    default:
      return <DocumentPreview asset={asset} />;
  }
}
