import { Lock, Settings, Upload, Users } from 'lucide-react';
import { useEffect } from 'react';
import { useParams } from 'react-router';
import {
  can,
  loadCollections,
  ROLE_LABELS,
  useCollection,
  useCollections,
  VISIBILITY_LABELS,
} from '@entities/collection';
import { openUploadDialog } from '@features/upload-assets';
import { AssetBrowser } from '@widgets/asset-browser';
import { routes } from '@shared/config/routes';
import { Breadcrumbs } from '@shared/ui/breadcrumbs';
import { Button, ButtonLink } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { PageHeader } from '@shared/ui/page-header';
import { Skeleton } from '@shared/ui/skeleton';
import { Tag } from '@shared/ui/tag';
import styles from './CollectionPage.module.scss';

export function CollectionPage() {
  const { collectionId = '' } = useParams();
  const collection = useCollection(collectionId);
  const status = useCollections((state) => state.status);

  useEffect(() => {
    void loadCollections();
  }, [collectionId]);

  if (!collection) {
    return status === 'ready' ? (
      <EmptyState
        title="Коллекция не найдена"
        description="Возможно, её удалили или у вас нет к ней доступа."
        action={
          <ButtonLink to={routes.collections()}>Все коллекции</ButtonLink>
        }
      />
    ) : (
      <Skeleton height={160} />
    );
  }

  const writable = can(collection, 'write');

  return (
    <div className={styles.page}>
      <Breadcrumbs back={{ to: routes.collections(), label: 'Коллекции' }} />
      <PageHeader
        title={collection.name}
        description={collection.description ?? undefined}
        actions={
          <>
            {can(collection, 'manage') && (
              <ButtonLink
                to={routes.collectionSettings(collection.id)}
                icon={Settings}
              >
                Настройки
              </ButtonLink>
            )}
            {writable && (
              <Button
                variant="primary"
                icon={Upload}
                onClick={() => openUploadDialog(collection.id)}
              >
                Загрузить сюда
              </Button>
            )}
          </>
        }
      />
      <div className={styles.meta}>
        <Tag tone={collection.visibility === 'private' ? 'neutral' : 'accent'}>
          {collection.visibility === 'private' ? (
            <Lock size={12} aria-hidden />
          ) : (
            <Users size={12} aria-hidden />
          )}
          {VISIBILITY_LABELS[collection.visibility]}
        </Tag>
        <span className={styles.role}>
          {can(collection, 'own')
            ? 'Вы владелец'
            : collection.role
              ? `Ваша роль: ${ROLE_LABELS[collection.role].toLowerCase()}`
              : 'Только просмотр'}
        </span>
      </div>

      <AssetBrowser
        title="Материалы"
        scope={{ collectionId: collection.id }}
        total={collection.assetCount}
        empty={
          <EmptyState
            title="В коллекции пока пусто"
            description={
              writable
                ? 'Перетащите сюда фото, видео и документы через «Загрузить сюда».'
                : 'Материалы появятся, когда их загрузят участники коллекции.'
            }
          />
        }
      />
    </div>
  );
}
