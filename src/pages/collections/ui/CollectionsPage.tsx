import { useEffect } from 'react';
import {
  CollectionCard,
  loadCollections,
  useCollections,
} from '@entities/collection';
import { CreateCollectionButton } from '@features/create-collection';
import { EmptyState } from '@shared/ui/empty-state';
import { Notice } from '@shared/ui/notice';
import { PageHeader } from '@shared/ui/page-header';
import { Skeleton } from '@shared/ui/skeleton';
import styles from './CollectionsPage.module.scss';

export function CollectionsPage() {
  const { status, items, error } = useCollections();

  useEffect(() => {
    void loadCollections();
  }, []);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Коллекции"
        description="Коллекция задаёт, кто видит и загружает материалы"
        actions={<CreateCollectionButton />}
      />
      {status === 'error' && <Notice>{error}</Notice>}
      {status === 'loading' && items.length === 0 ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} height={120} />
          ))}
        </div>
      ) : items.length === 0 && status === 'ready' ? (
        <EmptyState
          title="Коллекций пока нет"
          description="Создайте коллекцию для подразделения, события или кампании и пригласите коллег."
        />
      ) : (
        <div className={styles.grid}>
          {items.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  );
}
