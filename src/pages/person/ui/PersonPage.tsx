import { Pencil, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { FaceAvatar, type Person } from '@entities/person';
import { useCurrentUser } from '@entities/session';
import { AssetBrowser } from '@widgets/asset-browser';
import { api, describeError } from '@shared/api';
import { routes } from '@shared/config/routes';
import { formText } from '@shared/lib/format';
import { useRequest } from '@shared/lib/hooks';
import { Breadcrumbs } from '@shared/ui/breadcrumbs';
import { Button } from '@shared/ui/button';
import { confirmAction, Dialog, DialogActions } from '@shared/ui/dialog';
import { EmptyState } from '@shared/ui/empty-state';
import { TextAreaField, TextField } from '@shared/ui/field';
import { Skeleton } from '@shared/ui/skeleton';
import { toast } from '@shared/ui/toast';
import styles from './PersonPage.module.scss';

function EditPersonDialog({
  person,
  onClose,
  onSaved,
}: {
  person: Person;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      await api.patch(`/people/${person.id}`, {
        body: {
          name: formText(form, 'name'),
          description: formText(form, 'description') || null,
        },
      });
      onSaved();
      onClose();
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open onClose={onClose} title="Человек в справочнике">
      <form className="stack" onSubmit={(event) => void submit(event)}>
        <TextField
          label="Имя и фамилия"
          name="name"
          required
          defaultValue={person.name}
        />
        <TextAreaField
          label="Описание"
          name="description"
          rows={3}
          defaultValue={person.description ?? ''}
          placeholder="Должность, подразделение"
        />
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="primary" loading={pending}>
            Сохранить
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

/** Человек и все материалы, где он подписан или распознан. */
export function PersonPage() {
  const { personId = '' } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const person = useRequest(
    (signal) => api.get<Person>(`/people/${personId}`, { signal }),
    [personId],
  );

  if (person.status === 'error')
    return <EmptyState title="Человек не найден" description={person.error} />;
  if (!person.data) return <Skeleton height={160} />;

  const current = person.data;
  const editable = current.createdBy === user.id || user.isAdmin;

  const remove = () =>
    confirmAction({
      title: `Удалить «${current.name}» из справочника?`,
      description: 'Подписи лиц снимутся, материалы останутся.',
      confirmLabel: 'Удалить',
      tone: 'danger',
      onConfirm: async () => {
        await api.delete(`/people/${current.id}`);
        void navigate(routes.people());
      },
    });

  return (
    <div className={styles.page}>
      <Breadcrumbs
        back={{ to: routes.people(), label: 'Люди' }}
        current={current.name}
      />
      <header className={styles.header}>
        <span className={styles.cover}>
          <FaceAvatar src={current.coverUrl} name={current.name} />
        </span>
        <div className={styles.text}>
          <h1 className={styles.name}>{current.name}</h1>
          {current.description && (
            <p className={styles.description}>{current.description}</p>
          )}
        </div>
        {editable && (
          <div className={styles.actions}>
            <Button icon={Pencil} onClick={() => setEditing(true)}>
              Изменить
            </Button>
            <Button variant="ghost" icon={Trash2} onClick={remove}>
              Удалить
            </Button>
          </div>
        )}
      </header>

      <AssetBrowser
        title="Материалы с человеком"
        scope={{ personId: current.id }}
        empty={
          <EmptyState
            title="Материалов пока нет"
            description="Распознавание идёт в фоне: новые фото и видео появятся здесь автоматически."
          />
        }
      />

      {editing && (
        <EditPersonDialog
          person={current}
          onClose={() => setEditing(false)}
          onSaved={person.reload}
        />
      )}
    </div>
  );
}
