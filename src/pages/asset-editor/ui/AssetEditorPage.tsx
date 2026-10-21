import { useParams } from 'react-router';
import { useAsset } from '@entities/asset';
import { can } from '@entities/collection';
import { ImageEditor } from '@features/edit-image';
import { routes } from '@shared/config/routes';
import { ButtonLink } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { Skeleton } from '@shared/ui/skeleton';
import styles from './AssetEditorPage.module.scss';

export function AssetEditorPage() {
  const { assetId = '' } = useParams();
  const { asset, status, error } = useAsset(assetId);

  if (!asset)
    return (
      <div className={styles.state}>
        {status === 'error' ? (
          <EmptyState title="Материал не найден" description={error} />
        ) : (
          <Skeleton height={600} />
        )}
      </div>
    );

  const unavailable =
    asset.kind !== 'image'
      ? 'Редактор работает только с изображениями.'
      : !can(asset, 'write')
        ? 'Править материалы могут редакторы и управляющие коллекции.'
        : asset.trashedAt
          ? 'Материал в корзине — сначала восстановите его.'
          : null;

  if (unavailable)
    return (
      <div className={styles.state}>
        <EmptyState
          title="Редактирование недоступно"
          description={unavailable}
          action={
            <ButtonLink to={routes.asset(asset.id)}>К материалу</ButtonLink>
          }
        />
      </div>
    );

  return <ImageEditor asset={asset} />;
}
