import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import {
  upsertCollection,
  VISIBILITY_LABELS,
  type Collection,
  type Visibility,
} from '@entities/collection';
import { api, describeError } from '@shared/api';
import { routes } from '@shared/config/routes';
import { formText } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { Dialog, DialogActions } from '@shared/ui/dialog';
import { SelectField, TextAreaField, TextField } from '@shared/ui/field';
import { Notice } from '@shared/ui/notice';

interface CreateCollectionDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateCollectionDialog({
  open,
  onClose,
}: CreateCollectionDialogProps) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const collection = await api.post<Collection>('/collections', {
        body: {
          name: formText(form, 'name'),
          description: formText(form, 'description') || null,
          visibility: formText(form, 'visibility') as Visibility,
        },
      });
      upsertCollection(collection);
      onClose();
      void navigate(routes.collection(collection.id));
    } catch (failure) {
      setError(describeError(failure));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Новая коллекция"
      description="Коллекция — граница доступа: участники и правила загрузки задаются для неё целиком."
    >
      <form onSubmit={(event) => void submit(event)} className="stack">
        <TextField
          label="Название"
          name="name"
          required
          maxLength={200}
          autoFocus
        />
        <TextAreaField label="Описание" name="description" rows={3} />
        <SelectField label="Кто видит" name="visibility" defaultValue="private">
          {(Object.keys(VISIBILITY_LABELS) as Visibility[]).map((value) => (
            <option key={value} value={value}>
              {VISIBILITY_LABELS[value]}
            </option>
          ))}
        </SelectField>
        {error && <Notice>{error}</Notice>}
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="primary" loading={pending}>
            Создать
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
