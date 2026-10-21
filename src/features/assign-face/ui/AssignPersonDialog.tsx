import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import {
  FaceAvatar,
  replaceFace,
  searchPeople,
  type Face,
} from '@entities/person';
import { api, describeError } from '@shared/api';
import { useDebouncedValue, useRequest } from '@shared/lib/hooks';
import { Button } from '@shared/ui/button';
import { Dialog } from '@shared/ui/dialog';
import { SearchField } from '@shared/ui/search-field';
import { Spinner } from '@shared/ui/spinner';
import { toast } from '@shared/ui/toast';
import styles from './AssignPersonDialog.module.scss';

interface AssignPersonDialogProps {
  assetId: string;
  face: Face | null;
  onClose: () => void;
}

/**
 * Подпись лица. Ручная подпись важнее автоматической и запускает
 * распознавание этого человека на остальных материалах.
 */
export function AssignPersonDialog({
  assetId,
  face,
  onClose,
}: AssignPersonDialogProps) {
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState(false);
  const debounced = useDebouncedValue(query.trim(), 250);
  const people = useRequest(
    (signal) => searchPeople(debounced, signal),
    [debounced],
  );

  const assign = async (
    body: { personId: string } | { newPersonName: string },
  ) => {
    if (!face) return;
    setPending(true);
    try {
      const updated = await api.put<Face>(`/faces/${face.id}/person`, { body });
      replaceFace(assetId, updated);
      toast.success(
        `Отмечен: ${updated.personName ?? 'человек'}. Ищем его на других материалах`,
      );
      setQuery('');
      onClose();
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setPending(false);
    }
  };

  const exact = people.data?.some(
    (person) => person.name.toLowerCase() === query.trim().toLowerCase(),
  );

  return (
    <Dialog
      open={face !== null}
      onClose={onClose}
      title="Кто это?"
      description="Выберите человека из справочника или добавьте нового."
    >
      <div className={styles.picker}>
        {face && (
          <div className={styles.face}>
            <img src={face.thumbnailUrl} alt="Лицо на материале" />
          </div>
        )}
        <SearchField
          placeholder="Имя и фамилия"
          aria-label="Найти человека"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ul className={styles.list}>
          {people.status === 'loading' && !people.data && (
            <li className={styles.hint}>
              <Spinner /> Ищем…
            </li>
          )}
          {people.data?.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                className={styles.option}
                disabled={pending}
                onClick={() => void assign({ personId: person.id })}
              >
                <FaceAvatar src={person.coverUrl} name={person.name} />
                <span className={styles.name}>{person.name}</span>
                {person.description && (
                  <span className={styles.description}>
                    {person.description}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        {query.trim() && !exact && (
          <Button
            icon={UserPlus}
            loading={pending}
            onClick={() => void assign({ newPersonName: query.trim() })}
          >
            Добавить «{query.trim()}» в справочник
          </Button>
        )}
      </div>
    </Dialog>
  );
}
