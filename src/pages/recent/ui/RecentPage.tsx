import {
  AssetCard,
  fetchAsset,
  forgetRecentAsset,
  useRecentAssetIds,
  type Asset,
} from '@entities/asset';
import { useCurrentUser } from '@entities/session';
import { isNotFound } from '@shared/api';
import { useRequest } from '@shared/lib/hooks';
import { EmptyState } from '@shared/ui/empty-state';
import { PageHeader } from '@shared/ui/page-header';
import { Skeleton } from '@shared/ui/skeleton';
import styles from './RecentPage.module.scss';

/**
 * Недавно открытые материалы. Карточки перечитываются при показе:
 * ссылки на превью временные, а доступ мог измениться.
 */
export function RecentPage() {
  const user = useCurrentUser();
  const ids = useRecentAssetIds(user.id);
  const assets = useRequest(
    async (signal) => {
      const loaded = await Promise.all(
        ids.map((id) =>
          fetchAsset(id, signal).catch((error: unknown) => {
            // Удалён или доступ закрыт — убираем из списка
            if (isNotFound(error)) forgetRecentAsset(user.id, id);
            return null;
          }),
        ),
      );
      return loaded.filter(
        (asset): asset is Asset => asset !== null && !asset.trashedAt,
      );
    },
    [ids.join(',')],
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title="Недавние"
        description="Материалы, которые вы открывали на этом устройстве"
      />
      {ids.length === 0 ? (
        <EmptyState
          title="Пока пусто"
          description="Откройте любой материал — он появится здесь, чтобы к нему было легко вернуться."
        />
      ) : !assets.data ? (
        <div className={styles.grid}>
          {ids.slice(0, 8).map((id) => (
            <Skeleton key={id} height={212} />
          ))}
        </div>
      ) : (
        <div className={styles.grid}>
          {assets.data.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}
