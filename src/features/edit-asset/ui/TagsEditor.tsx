import { Sparkles } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { updateAsset, type Asset } from '@entities/asset';
import { describeError } from '@shared/api';
import { routes } from '@shared/config/routes';
import { plural } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { Tag } from '@shared/ui/tag';
import { toast } from '@shared/ui/toast';
import styles from './TagsEditor.module.scss';

/** Теги и описание от ИИ. Правка тегов — обычное обновление материала. */
export function TagsEditor({
  asset,
  editable,
}: {
  asset: Asset;
  editable: boolean;
}) {
  const [draft, setDraft] = useState<string[] | null>(null);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);

  const addFromInput = () => {
    const tags = input
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
    if (tags.length === 0) return;
    setDraft((current) => [...new Set([...(current ?? []), ...tags])]);
    setInput('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addFromInput();
    }
    if (event.key === 'Backspace' && !input && draft?.length)
      setDraft(draft.slice(0, -1));
  };

  const save = async () => {
    if (!draft) return;
    setPending(true);
    try {
      await updateAsset(asset.id, {
        tags: input.trim() ? [...draft, input.trim()] : draft,
      });
      setDraft(null);
      setInput('');
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h3 className={styles.title}>AI-теги</h3>
        <Sparkles
          size={20}
          strokeWidth={1.7}
          className={styles.spark}
          aria-hidden
        />
      </header>

      {draft ? (
        <div className={styles.editor}>
          {draft.map((tag) => (
            <Tag
              key={tag}
              tone="ai"
              removeLabel={`Убрать тег «${tag}»`}
              onRemove={() => setDraft(draft.filter((item) => item !== tag))}
            >
              {tag}
            </Tag>
          ))}
          <input
            className={styles.input}
            value={input}
            placeholder="Новый тег"
            aria-label="Новый тег"
            autoFocus
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            onBlur={addFromInput}
          />
        </div>
      ) : asset.tags.length > 0 ? (
        <div className={styles.tags}>
          {asset.tags.map((tag) => (
            <Link
              key={tag}
              to={`${routes.library()}?${new URLSearchParams({ tag }).toString()}`}
              className={styles.tagLink}
              title="Все материалы с этим тегом"
            >
              <Tag tone="ai">{tag}</Tag>
            </Link>
          ))}
        </div>
      ) : (
        <p className={styles.hint}>
          {asset.version.status === 'processing'
            ? 'Теги появятся после обработки файла.'
            : 'Тегов пока нет.'}
        </p>
      )}

      {asset.caption && !draft && (
        <p className={styles.caption}>{asset.caption}</p>
      )}

      {!draft && asset.tags.length > 0 && (
        <p className={styles.hint}>
          {plural(asset.tags.length, ['тег', 'тега', 'тегов'])} · предложены ИИ,
          проверьте перед публикацией
        </p>
      )}

      {editable &&
        (draft ? (
          <div className={styles.actions}>
            <Button
              variant="primary"
              loading={pending}
              onClick={() => void save()}
            >
              Сохранить теги
            </Button>
            <Button variant="link" onClick={() => setDraft(null)}>
              Отмена
            </Button>
          </div>
        ) : (
          <div className={styles.actions}>
            <Button variant="link" onClick={() => setDraft(asset.tags)}>
              Изменить
            </Button>
          </div>
        ))}
    </section>
  );
}
