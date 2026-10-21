import { useState } from 'react';
import { PersonCard, searchPeople } from '@entities/person';
import { useDebouncedValue, useRequest } from '@shared/lib/hooks';
import { EmptyState } from '@shared/ui/empty-state';
import { Notice } from '@shared/ui/notice';
import { PageHeader } from '@shared/ui/page-header';
import { SearchField } from '@shared/ui/search-field';
import { Skeleton } from '@shared/ui/skeleton';
import styles from './PeoplePage.module.scss';

/** Справочник людей: пополняется, когда сотрудники подписывают лица на материалах. */
export function PeoplePage() {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query.trim(), 300);
  const people = useRequest(
    (signal) => searchPeople(debounced, signal),
    [debounced],
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title="Люди"
        description="Распознанные и подписанные на фото и видео — по ним ищутся все материалы с человеком"
      />
      <SearchField
        className={styles.search}
        placeholder="Имя или описание"
        aria-label="Найти человека"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {people.status === 'error' && <Notice>{people.error}</Notice>}
      {!people.data ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} height={220} />
          ))}
        </div>
      ) : people.data.length === 0 ? (
        <EmptyState
          title={debounced ? 'Никого не нашли' : 'Справочник пока пуст'}
          description="Подпишите лицо на фото или видео — человек появится здесь, а система найдёт его на других материалах."
        />
      ) : (
        <div className={styles.grid}>
          {people.data.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
