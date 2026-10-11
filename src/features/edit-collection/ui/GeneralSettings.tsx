import { Globe, Lock, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { can, type Collection } from '@entities/collection';
import { routes } from '@shared/config/routes';
import { formText } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { Dialog, DialogActions } from '@shared/ui/dialog';
import { TextAreaField, TextField } from '@shared/ui/field';
import { Segmented } from '@shared/ui/segmented';
import { useDeleteCollection, useUpdateCollection } from '../model/mutations';
import styles from './settings.module.scss';

type Visibility = Collection['visibility'];

const VISIBILITY = [
  { value: 'private' as const, label: 'Приватная', icon: Lock },
  { value: 'public' as const, label: 'Публичная', icon: Globe },
];

export function GeneralSettings({ collection }: { collection: Collection }) {
  const [visibility, setVisibility] = useState<Visibility>(
    collection.visibility,
  );
  const [confirm, setConfirm] = useState(false);
  const update = useUpdateCollection(collection.id);
  const remove = useDeleteCollection(collection.id);
  const navigate = useNavigate();
  const isOwner = can(collection, 'manage');

  return (
    <div className={styles.stack}>
      <form
        className={styles.card}
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const description = formText(form, 'description');
          update.mutate({
            name: formText(form, 'name'),
            description: description || null,
            ...(isOwner &&
              visibility !== collection.visibility && { visibility }),
          });
        }}
      >
        <h2 className={styles.cardTitle}>Основное</h2>
        <TextField
          label="Название"
          name="name"
          defaultValue={collection.name}
          required
          maxLength={255}
        />
        <TextAreaField
          label="Описание"
          name="description"
          defaultValue={collection.description ?? ''}
          rows={3}
        />

        <div className={styles.field}>
          <span className={styles.label}>Видимость</span>
          {isOwner ? (
            <Segmented
              label="Видимость"
              options={VISIBILITY}
              value={visibility}
              onChange={setVisibility}
            />
          ) : (
            <span className={styles.hint}>
              {collection.visibility === 'public' ? 'Публичная' : 'Приватная'}
            </span>
          )}
          <span className={styles.hint}>
            {visibility === 'public'
              ? 'Просматривать могут все вошедшие пользователи. Оригиналы скачивают только участники, остальным доступно превью с водяным знаком.'
              : 'Коллекцию видят только владелец и участники.'}
            {!isOwner && ' Изменить видимость может только владелец.'}
          </span>
        </div>

        <div className={styles.actions}>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={update.isPending}
          >
            Сохранить
          </Button>
        </div>
      </form>

      {isOwner && (
        <section className={styles.danger}>
          <div>
            <h2 className={styles.cardTitle}>Удаление коллекции</h2>
            <p className={styles.hint}>
              Коллекция и её активы исчезнут из списка и поиска. Файлы останутся
              в хранилище.
            </p>
          </div>
          <Button
            variant="danger"
            icon={Trash2}
            onClick={() => setConfirm(true)}
          >
            Удалить коллекцию
          </Button>
        </section>
      )}

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Удалить коллекцию?"
        description={`«${collection.name}» и все её активы будут недоступны.`}
      >
        <DialogActions>
          <Button onClick={() => setConfirm(false)}>Отмена</Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() =>
              remove.mutate(undefined, {
                onSuccess: () =>
                  void navigate(routes.home(), { replace: true }),
              })
            }
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
