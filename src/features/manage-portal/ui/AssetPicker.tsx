import clsx from 'clsx';
import { Check } from 'lucide-react';
import { useState } from 'react';
import {
  AssetThumb,
  useAssetFeed,
  type AssetKind,
  type AssetSummary,
} from '@entities/asset';
import { Button } from '@shared/ui/button';
import { Dialog, DialogActions } from '@shared/ui/dialog';
import { Notice } from '@shared/ui/notice';
import { Skeleton } from '@shared/ui/skeleton';
import styles from './AssetPicker.module.scss';

interface AssetPickerProps {
  open: boolean;
  title: string;
  multiple?: boolean;
  kinds?: AssetKind[];
  initial?: string[];
  onClose: () => void;
  onPick: (assets: AssetSummary[]) => void;
}

/** Выбор материалов из медиатеки: обложка портала, файлы для скачивания. */
export function AssetPicker({
  open,
  title,
  multiple = false,
  kinds,
  initial = [],
  onClose,
  onPick,
}: AssetPickerProps) {
  const feed = useAssetFeed({ kinds }, 60);
  const [picked, setPicked] = useState<Map<string, AssetSummary>>(new Map());
  const isPicked = (id: string) =>
    picked.has(id) || (picked.size === 0 && initial.includes(id));

  const toggle = (asset: AssetSummary) => {
    if (!multiple) {
      onPick([asset]);
      onClose();
      return;
    }
    setPicked((current) => {
      const next = new Map(current);
      if (next.has(asset.id)) next.delete(asset.id);
      else next.set(asset.id, asset);
      return next;
    });
  };

  return (
    <Dialog open={open} onClose={onClose} size="md" title={title}>
      {feed.status === 'error' && <Notice>{feed.error}</Notice>}
      <div className={styles.grid}>
        {feed.status === 'loading' &&
          feed.items.length === 0 &&
          Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} height={96} />
          ))}
        {feed.items.map((asset) => (
          <button
            key={asset.id}
            type="button"
            className={clsx(styles.item, isPicked(asset.id) && styles.picked)}
            aria-pressed={isPicked(asset.id)}
            title={asset.title}
            onClick={() => toggle(asset)}
          >
            <AssetThumb asset={asset} className={styles.thumb} />
            {isPicked(asset.id) && (
              <span className={styles.mark}>
                <Check size={14} strokeWidth={2.5} aria-hidden />
              </span>
            )}
            <span className={styles.title}>{asset.title}</span>
          </button>
        ))}
      </div>
      {feed.hasNext && (
        <Button size="sm" loading={feed.loadingMore} onClick={feed.loadMore}>
          Показать ещё
        </Button>
      )}
      {multiple && (
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button
            variant="primary"
            disabled={picked.size === 0}
            onClick={() => {
              onPick([...picked.values()]);
              onClose();
            }}
          >
            Выбрать {picked.size > 0 ? picked.size : ''}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
