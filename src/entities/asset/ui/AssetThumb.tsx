import clsx from 'clsx';
import { File, FileText, ImageIcon } from 'lucide-react';
import { displayVersion, type Asset } from '../model/types';
import styles from './AssetThumb.module.scss';

const KIND_ICONS = { image: ImageIcon, document: FileText, other: File };

/** Миниатюра актива или пиктограмма типа, если превью нет (документы Office, архивы). */
export function AssetThumb({
  asset,
  className,
}: {
  asset: Asset;
  className?: string;
}) {
  const url = displayVersion(asset)?.renditions.thumbnail;
  const Icon = KIND_ICONS[asset.kind];

  return (
    <span className={clsx(styles.thumb, className)}>
      {url ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          className={styles.image}
        />
      ) : (
        <span className={styles.placeholder}>
          <Icon size={30} strokeWidth={1.5} aria-hidden />
          <span className={styles.extension}>
            {extensionOf(displayVersion(asset)?.originalFilename)}
          </span>
        </span>
      )}
    </span>
  );
}

function extensionOf(filename: string | undefined): string {
  const extension = filename?.split('.').pop();
  return extension && extension !== filename ? extension.toUpperCase() : '';
}
