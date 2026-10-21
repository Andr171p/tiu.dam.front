import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { routes } from '@shared/config/routes';
import {
  formatBytes,
  formatDateTime,
  formatTimecode,
} from '@shared/lib/format';
import { Tag } from '@shared/ui/tag';
import { KIND_LABELS } from '../model/labels';
import type { AssetSummary } from '../model/types';
import { AssetThumb } from './AssetThumb';
import { PublicationBadge } from './PublicationBadge';
import styles from './AssetCard.module.scss';

interface AssetCardProps {
  asset: AssetSummary;
  /** Куда ведёт карточка; по умолчанию — карточка материала */
  to?: string;
  /** Подпись под названием: совпадение в поиске, момент в видео */
  note?: ReactNode;
  /** Действие поверх превью: убрать из подборки, восстановить */
  action?: ReactNode;
}

function Duration({ asset }: { asset: AssetSummary }) {
  const duration = asset.version.meta?.duration;
  if (!duration) return null;
  return (
    <Tag tone="surface" className={styles.duration}>
      {formatTimecode(duration)}
    </Tag>
  );
}

/** Карточка в сетке: превью и название. */
export function AssetCard({ asset, to, note, action }: AssetCardProps) {
  return (
    <article className={styles.card}>
      <Link to={to ?? routes.asset(asset.id)} className={styles.link}>
        <AssetThumb asset={asset} className={styles.thumb}>
          <Duration asset={asset} />
        </AssetThumb>
        <span className={styles.body}>
          <span className={styles.title}>{asset.title}</span>
          {note && <span className={styles.note}>{note}</span>}
        </span>
      </Link>
      {action && <div className={styles.action}>{action}</div>}
    </article>
  );
}

/** Строка в списке: превью, название, тип, размер, дата и статус публикации. */
export function AssetRow({ asset, to, note, action }: AssetCardProps) {
  return (
    <article className={styles.row}>
      <Link to={to ?? routes.asset(asset.id)} className={styles.rowLink}>
        <AssetThumb asset={asset} className={styles.rowThumb} />
        <span className={styles.rowMain}>
          <span className={styles.title}>{asset.title}</span>
          <span className={styles.note}>
            {note ??
              [
                KIND_LABELS[asset.kind],
                formatBytes(asset.version.file.size),
                asset.version.meta?.duration
                  ? formatTimecode(asset.version.meta.duration)
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
          </span>
        </span>
        <span className={styles.rowDate}>
          {formatDateTime(asset.createdAt)}
        </span>
        <PublicationBadge status={asset.licenseStatus} />
      </Link>
      {action && <div className={styles.rowAction}>{action}</div>}
    </article>
  );
}
