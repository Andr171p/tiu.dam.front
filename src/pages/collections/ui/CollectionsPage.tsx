import { FolderOpen } from 'lucide-react';
import { useState } from 'react';
import {
  CollectionCard,
  useCollections,
  type CollectionScope,
} from '@entities/collection';
import { useCurrentUser } from '@entities/session';
import { CreateCollectionButton } from '@features/create-collection';
import { useDebouncedValue } from '@shared/lib/hooks';
import { EmptyState } from '@shared/ui/empty-state';
import { PageHeader } from '@shared/ui/page-header';
import { SearchInput } from '@shared/ui/search-input';
import { Segmented } from '@shared/ui/segmented';
import { Skeleton } from '@shared/ui/skeleton';
import styles from './CollectionsPage.module.scss';

const SCOPES = [
  { value: 'all' as const, label: 'Все' },
  { value: 'mine' as const, label: 'Мои' },
  { value: 'public' as const, label: 'Публичные' },
];

export function CollectionsPage() {
  const user = useCurrentUser();
  const [scope, setScope] = useState<CollectionScope>('all');
  const [query, setQuery] = useState('');
  const { data, isPending } = useCollections(
    scope,
    useDebouncedValue(query.trim(), 250),
  );

  const firstName = user.fullName?.split(' ')[0] ?? user.displayName;

  return (
    <div className={styles.page}>
      <PageHeader
        title={`Здравствуйте, ${firstName}`}
        description="Медиатека ТИУ: фотографии, документы и бренд-материалы с контролем версий, лицензий и доступа."
        actions={<CreateCollectionButton />}
      />

      <div className={styles.toolbar}>
        <Segmented
          label="Какие коллекции показать"
          options={SCOPES}
          value={scope}
          onChange={setScope}
        />
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Найти коллекцию"
          className={styles.search}
        />
      </div>

      {isPending ? (
        <div className={styles.grid}>
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} height={260} radius={20} />
          ))}
        </div>
      ) : data?.items.length ? (
        <div className={styles.grid}>
          {data.items.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title={query ? 'Ничего не найдено' : 'Коллекций пока нет'}
          description={
            query
              ? 'Попробуйте изменить запрос.'
              : 'Создайте коллекцию, добавьте участников и загрузите первые материалы.'
          }
          action={!query && <CreateCollectionButton />}
        />
      )}
    </div>
  );
}
