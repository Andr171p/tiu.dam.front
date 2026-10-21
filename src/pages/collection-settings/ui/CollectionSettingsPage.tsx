import { useEffect } from 'react';
import { useParams } from 'react-router';
import {
  can,
  loadCollections,
  useCollection,
  useCollections,
} from '@entities/collection';
import {
  DeleteCollection,
  GeneralSettings,
  MetadataSchemaEditor,
  UploadPolicySettings,
} from '@features/edit-collection';
import { MembersPanel } from '@features/manage-members';
import { routes } from '@shared/config/routes';
import { Breadcrumbs } from '@shared/ui/breadcrumbs';
import { ButtonLink } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { PageHeader } from '@shared/ui/page-header';
import { Skeleton } from '@shared/ui/skeleton';
import styles from './CollectionSettingsPage.module.scss';

/** Настройки коллекции: участники, правила загрузки, поля материалов. Нужно право `manage`. */
export function CollectionSettingsPage() {
  const { collectionId = '' } = useParams();
  const collection = useCollection(collectionId);
  const status = useCollections((state) => state.status);

  useEffect(() => {
    void loadCollections();
  }, [collectionId]);

  if (!collection)
    return status === 'ready' ? (
      <EmptyState title="Коллекция не найдена" />
    ) : (
      <Skeleton height={240} />
    );

  if (!can(collection, 'manage'))
    return (
      <EmptyState
        title="Нет доступа к настройкам"
        description="Настройки меняют владелец коллекции и управляющие."
        action={
          <ButtonLink to={routes.collection(collection.id)}>
            К коллекции
          </ButtonLink>
        }
      />
    );

  return (
    <div className={styles.page}>
      <Breadcrumbs
        back={{ to: routes.collection(collection.id), label: collection.name }}
        current="Настройки"
      />
      <PageHeader title="Настройки коллекции" />
      <div className={styles.columns}>
        <div className={styles.column}>
          {/* key: после сохранения форма перечитывает значения коллекции */}
          <GeneralSettings key={collection.updatedAt} collection={collection} />
          <UploadPolicySettings
            key={`policy-${collection.updatedAt}`}
            collection={collection}
          />
          <MetadataSchemaEditor collection={collection} />
        </div>
        <div className={styles.column}>
          <MembersPanel collection={collection} />
          {can(collection, 'own') && (
            <DeleteCollection collection={collection} />
          )}
        </div>
      </div>
    </div>
  );
}
