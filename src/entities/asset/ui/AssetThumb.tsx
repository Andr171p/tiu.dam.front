import clsx from 'clsx';
import {
  CircleAlert,
  File,
  FileText,
  Image,
  Music,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Spinner } from '@shared/ui/spinner';
import type { AssetKind, AssetSummary } from '../model/types';
import styles from './AssetThumb.module.scss';

const KIND_ICONS: Record<AssetKind, LucideIcon> = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  other: File,
};

interface AssetThumbProps {
  asset: Pick<AssetSummary, 'kind' | 'title' | 'version'>;
  /** preview — крупное превью ~2048 px, thumbnail — миниатюра ~480 px */
  size?: 'thumbnail' | 'preview';
  className?: string;
  children?: ReactNode;
}

/** Превью материала; без превью — значок типа, во время обработки — индикатор. */
export function AssetThumb({
  asset,
  size = 'thumbnail',
  className,
  children,
}: AssetThumbProps) {
  const { status, urls } = asset.version;
  const src = urls[size] ?? urls.thumbnail;
  const [broken, setBroken] = useState<string | null>(null);
  const Icon = KIND_ICONS[asset.kind];

  return (
    <span className={clsx(styles.thumb, className)}>
      {src && broken !== src ? (
        <img src={src} alt="" loading="lazy" onError={() => setBroken(src)} />
      ) : status === 'processing' ? (
        <span className={styles.placeholder}>
          <Spinner size={20} />
          <span>Обрабатывается</span>
        </span>
      ) : status === 'failed' ? (
        <span className={styles.placeholder}>
          <CircleAlert size={24} strokeWidth={1.5} aria-hidden />
          <span>Только скачивание</span>
        </span>
      ) : (
        <span className={styles.placeholder}>
          <Icon size={32} strokeWidth={1.3} aria-hidden />
        </span>
      )}
      {children}
    </span>
  );
}
