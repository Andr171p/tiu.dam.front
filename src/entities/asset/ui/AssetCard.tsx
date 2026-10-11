import clsx from 'clsx';
import { CircleAlert, Loader, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router';
import { routes } from '@shared/config/routes';
import {
  hasFailed,
  isProcessing,
  worstSeverity,
  type Asset,
} from '../model/types';
import { AssetThumb } from './AssetThumb';
import styles from './AssetCard.module.scss';

export function AssetCard({ asset }: { asset: Asset }) {
  const processing = isProcessing(asset);
  const failed = hasFailed(asset);
  const severity = worstSeverity(asset.issues);

  return (
    <Link
      to={routes.asset(asset.id)}
      className={styles.card}
      title={asset.title}
    >
      <AssetThumb
        asset={asset}
        className={clsx(styles.thumb, processing && styles.dimmed)}
      />

      {processing && (
        <span className={clsx(styles.status, styles.processing)}>
          <Loader size={13} className={styles.spin} aria-hidden />
          Обработка
        </span>
      )}
      {failed && (
        <span className={clsx(styles.status, styles.failed)}>
          <CircleAlert size={13} aria-hidden />
          Не принят
        </span>
      )}
      {!processing &&
        !failed &&
        (severity === 'error' || severity === 'warning') && (
          <span
            className={clsx(styles.issue, styles[severity])}
            title={asset.issues.map((issue) => issue.message).join('\n')}
          >
            <TriangleAlert size={13} aria-hidden />
          </span>
        )}

      <span className={styles.caption}>
        <span className={styles.title}>{asset.title}</span>
        {asset.tags.length > 0 && (
          <span className={styles.tags}>
            {asset.tags
              .slice(0, 3)
              .map((tag) => `#${tag.name}`)
              .join(' ')}
          </span>
        )}
      </span>
    </Link>
  );
}
