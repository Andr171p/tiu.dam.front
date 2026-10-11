import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Sparkles, Tags, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router';
import { useCurrentUser } from '@entities/session';
import { api, describeError, unwrap, type Schemas } from '@shared/api';
import { routes } from '@shared/config/routes';
import { plural } from '@shared/lib/format';
import { Button, IconButton } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { Switch, TextField } from '@shared/ui/field';
import { PageHeader } from '@shared/ui/page-header';
import { Skeleton } from '@shared/ui/skeleton';
import { toast } from '@shared/ui/toast';
import styles from './AdminTagsPage.module.scss';

type Tag = Schemas['TagResponse'];

const TAGS_KEY = ['admin', 'tags'] as const;

function useTagMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: TAGS_KEY });
  const onError = (error: Error) => toast.error(describeError(error));

  return {
    create: useMutation({
      mutationFn: (body: Schemas['CreateTagDTO']) =>
        unwrap(api.POST('/api/admin/v1/tags', { body })),
      onSuccess,
      onError,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: Schemas['UpdateTagDTO'] & { id: string }) =>
        unwrap(
          api.PATCH('/api/admin/v1/tags/{tag_id}', {
            params: { path: { tag_id: id } },
            body,
          }),
        ),
      onSuccess,
      onError,
    }),
    remove: useMutation({
      mutationFn: (id: string) =>
        unwrap(
          api.DELETE('/api/admin/v1/tags/{tag_id}', {
            params: { path: { tag_id: id } },
          }),
        ),
      onSuccess,
      onError,
    }),
  };
}

function TagRow({ tag }: { tag: Tag }) {
  const { update, remove } = useTagMutations();
  const [prompt, setPrompt] = useState(tag.prompt ?? '');

  return (
    <li className={styles.row}>
      <div className={styles.name}>
        <span>{tag.name}</span>
        <span className={styles.usage}>
          {plural(tag.usageCount, ['актив', 'актива', 'активов'])}
        </span>
      </div>
      <input
        className={styles.prompt}
        value={prompt}
        placeholder="Описание для модели (необязательно)"
        maxLength={200}
        disabled={!tag.autoAssign}
        onChange={(event) => setPrompt(event.target.value)}
        onBlur={() =>
          prompt !== (tag.prompt ?? '') &&
          update.mutate({ id: tag.id, prompt: prompt.trim() || null })
        }
      />
      <Switch
        label="Авто"
        checked={tag.autoAssign}
        onChange={(event) =>
          update.mutate({ id: tag.id, autoAssign: event.target.checked })
        }
      />
      <IconButton
        icon={Trash2}
        label="Удалить тег"
        onClick={() => remove.mutate(tag.id)}
      />
    </li>
  );
}

/** Словарь тегов: какие теги автотегирование назначает по содержимому изображения. */
export function AdminTagsPage() {
  const user = useCurrentUser();
  const [name, setName] = useState('');
  const { create } = useTagMutations();
  const tags = useQuery({
    queryKey: TAGS_KEY,
    queryFn: ({ signal }) => unwrap(api.GET('/api/admin/v1/tags', { signal })),
    enabled: user.isAdmin,
  });

  if (!user.isAdmin) return <Navigate to={routes.home()} replace />;

  const auto = tags.data?.filter((tag) => tag.autoAssign) ?? [];
  const manual = tags.data?.filter((tag) => !tag.autoAssign) ?? [];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Словарь тегов"
        description="Теги с включённым «Авто» назначаются новым изображениям по их содержимому. Описание помогает модели, если одного слова мало: «студенты в аудитории» вместо «лекция»."
      />

      <form
        className={styles.add}
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate(
            { name, autoAssign: true },
            { onSuccess: () => setName('') },
          );
        }}
      >
        <TextField
          label="Новый тег автотегирования"
          value={name}
          maxLength={64}
          onChange={(event) => setName(event.target.value)}
          placeholder="главный корпус"
        />
        <Button
          type="submit"
          variant="primary"
          icon={Plus}
          loading={create.isPending}
          disabled={!name.trim()}
        >
          Добавить
        </Button>
      </form>

      {tags.isPending ? (
        <Skeleton height={200} radius={20} />
      ) : (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Sparkles size={16} aria-hidden /> Автотегирование · {auto.length}
            </h2>
            {auto.length ? (
              <ul className={styles.list}>
                {auto.map((tag) => (
                  <TagRow key={tag.id} tag={tag} />
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Tags}
                title="Словарь пуст"
                description="Добавьте теги — модель начнёт размечать новые изображения."
              />
            )}
          </section>
          {manual.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Пользовательские теги · {manual.length}
              </h2>
              <ul className={styles.list}>
                {manual.map((tag) => (
                  <TagRow key={tag.id} tag={tag} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
