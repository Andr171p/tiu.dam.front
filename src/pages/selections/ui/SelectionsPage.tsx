import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@entities/session';
import {
  loadSelections,
  SelectionCard,
  useSelections,
} from '@entities/selection';
import { SelectionDialog } from '@features/manage-selection';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { Notice } from '@shared/ui/notice';
import { PageHeader, SectionHeader } from '@shared/ui/page-header';
import { Skeleton } from '@shared/ui/skeleton';
import styles from './SelectionsPage.module.scss';

export function SelectionsPage() {
  const user = useCurrentUser();
  const { status, items, error } = useSelections();
  const [creating, setCreating] = useState(false);
  const own = items.filter((selection) => selection.ownerId === user.id);
  const shared = items.filter((selection) => selection.ownerId !== user.id);

  useEffect(() => {
    void loadSelections();
  }, []);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Подборки"
        description="Материалы из разных коллекций — под задачу, публикацию или портал"
        actions={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            Новая подборка
          </Button>
        }
      />
      {status === 'error' && <Notice>{error}</Notice>}
      {status === 'loading' && items.length === 0 && <Skeleton height={88} />}
      {status === 'ready' && items.length === 0 && (
        <EmptyState
          title="Подборок пока нет"
          description="Добавляйте материалы в подборку из карточки материала: «⋯» → «Добавить в подборку»."
        />
      )}

      {own.length > 0 && (
        <section className={styles.section}>
          <SectionHeader level="group" title="Мои" count={own.length} />
          <div className={styles.grid}>
            {own.map((selection) => (
              <SelectionCard key={selection.id} selection={selection} />
            ))}
          </div>
        </section>
      )}
      {shared.length > 0 && (
        <section className={styles.section}>
          <SectionHeader level="group" title="Общие" count={shared.length} />
          <div className={styles.grid}>
            {shared.map((selection) => (
              <SelectionCard key={selection.id} selection={selection} />
            ))}
          </div>
        </section>
      )}

      {creating && <SelectionDialog open onClose={() => setCreating(false)} />}
    </div>
  );
}
