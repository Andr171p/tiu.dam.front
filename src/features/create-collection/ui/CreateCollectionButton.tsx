import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe, Lock, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { collectionKeys } from '@entities/collection';
import { api, describeError, unwrap } from '@shared/api';
import { formText } from '@shared/lib/format';
import { routes } from '@shared/config/routes';
import { Button } from '@shared/ui/button';
import { Dialog, DialogActions } from '@shared/ui/dialog';
import { TextAreaField, TextField } from '@shared/ui/field';
import { Segmented } from '@shared/ui/segmented';
import { toast } from '@shared/ui/toast';
import styles from './CreateCollectionButton.module.scss';

type Visibility = 'private' | 'public';

const VISIBILITY_OPTIONS = [
  { value: 'private' as const, label: 'Приватная', icon: Lock },
  { value: 'public' as const, label: 'Публичная', icon: Globe },
];

export function CreateCollectionButton() {
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>('private');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (body: {
      name: string;
      description: string | null;
      visibility: Visibility;
    }) => unwrap(api.POST('/api/user/v1/collections', { body })),
    onSuccess: async (collection) => {
      await queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      setOpen(false);
      void navigate(routes.collection(collection.id));
    },
    onError: (error) => toast.error(describeError(error)),
  });

  return (
    <>
      <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>
        Новая коллекция
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Новая коллекция"
        description="Коллекция — граница доступа: участники, схема метаданных, водяной знак."
      >
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const description = formText(form, 'description');
            create.mutate({
              name: formText(form, 'name'),
              description: description || null,
              visibility,
            });
          }}
        >
          <TextField
            label="Название"
            name="name"
            required
            maxLength={255}
            autoFocus
            placeholder="Выпускной 2026"
          />
          <TextAreaField
            label="Описание"
            name="description"
            maxLength={5000}
            rows={3}
          />
          <div className={styles.visibility}>
            <span className={styles.label}>Видимость</span>
            <Segmented
              label="Видимость"
              options={VISIBILITY_OPTIONS}
              value={visibility}
              onChange={setVisibility}
            />
            <p className={styles.hint}>
              {visibility === 'public'
                ? 'Просматривать могут все сотрудники и студенты, вошедшие в систему.'
                : 'Видят только вы и участники, которых вы добавите.'}
            </p>
          </div>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Отмена</Button>
            <Button type="submit" variant="primary" loading={create.isPending}>
              Создать
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
