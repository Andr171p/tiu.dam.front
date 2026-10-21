import { RotateCcw } from 'lucide-react';
import { restoreAsset } from '@features/manage-asset';
import { AssetBrowser } from '@widgets/asset-browser';
import { IconButton } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { PageHeader } from '@shared/ui/page-header';
import styles from './TrashPage.module.scss';

/** Корзина: материалы хранятся 30 дней, затем удаляются автоматически. */
export function TrashPage() {
  return (
    <div className={styles.page}>
      <PageHeader
        title="Корзина"
        description="Через 30 дней материалы удаляются навсегда. Восстановить можно с правом загрузки в коллекцию."
      />
      <AssetBrowser
        title="Удалённые материалы"
        scope={{ trashed: true }}
        empty={<EmptyState title="Корзина пуста" />}
        action={(asset) => (
          <IconButton
            icon={RotateCcw}
            label="Восстановить"
            variant="secondary"
            onClick={() => void restoreAsset(asset.id)}
          />
        )}
      />
    </div>
  );
}
