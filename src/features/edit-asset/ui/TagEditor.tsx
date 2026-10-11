import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Sparkles, X } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import type { Asset } from '@entities/asset';
import { api, unwrap } from '@shared/api';
import { routes } from '@shared/config/routes';
import { useDebouncedValue } from '@shared/lib/hooks';
import { useSetTags } from '../model/mutations';
import styles from './TagEditor.module.scss';

const normalize = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLowerCase();

/** Теги актива: ручные и назначенные автотегированием (с уверенностью). */
export function TagEditor({ asset }: { asset: Asset }) {
  const [draft, setDraft] = useState('');
  const setTags = useSetTags(asset.id);
  const listId = useId();
  const names = asset.tags.map((tag) => tag.name);

  const query = useDebouncedValue(normalize(draft), 200);
  const suggestions = useQuery({
    queryKey: ['tags', 'suggest', query],
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/api/user/v1/tags', { params: { query: { query } }, signal }),
      ),
    enabled: asset.canEdit && query.length > 0,
    staleTime: 30_000,
  });

  const add = (raw: string) => {
    const name = normalize(raw);
    setDraft('');
    if (name && !names.includes(name)) setTags.mutate([...names, name]);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add(draft);
    } else if (event.key === 'Backspace' && !draft && names.length) {
      setTags.mutate(names.slice(0, -1));
    }
  };

  return (
    <div className={styles.editor}>
      <ul className={styles.tags}>
        {asset.tags.map((tag) => (
          <li
            key={tag.name}
            className={clsx(styles.tag, tag.source === 'auto' && styles.auto)}
            title={
              tag.source === 'auto' && tag.confidence != null
                ? `Назначен автоматически, уверенность ${Math.round(tag.confidence * 100)}%`
                : undefined
            }
          >
            {tag.source === 'auto' && (
              <Sparkles size={12} aria-label="Автотег" />
            )}
            <Link
              to={`${routes.collection(asset.collectionId)}?tag=${encodeURIComponent(tag.name)}`}
            >
              {tag.name}
            </Link>
            {asset.canEdit && (
              <button
                type="button"
                className={styles.remove}
                aria-label={`Убрать тег ${tag.name}`}
                onClick={() =>
                  setTags.mutate(names.filter((name) => name !== tag.name))
                }
              >
                <X size={12} />
              </button>
            )}
          </li>
        ))}
        {!asset.tags.length && !asset.canEdit && (
          <li className={styles.empty}>Тегов нет</li>
        )}
      </ul>

      {asset.canEdit && (
        <>
          <input
            className={styles.input}
            value={draft}
            list={listId}
            placeholder="Добавить тег и нажать Enter"
            maxLength={64}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <datalist id={listId}>
            {suggestions.data
              ?.filter((tag) => !names.includes(tag.name))
              .map((tag) => (
                <option key={tag.id} value={tag.name} />
              ))}
          </datalist>
        </>
      )}
    </div>
  );
}
