import { useState, type FormEvent } from 'react';
import {
  VISIBILITY_LABELS,
  type Collection,
  type Visibility,
} from '@entities/collection';
import { describeError } from '@shared/api';
import { formText } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { SelectField, TextAreaField, TextField } from '@shared/ui/field';
import { toast } from '@shared/ui/toast';
import { saveCollection } from '../model/save-collection';
import styles from './settings.module.scss';

export function GeneralSettings({ collection }: { collection: Collection }) {
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      await saveCollection(collection.id, {
        name: formText(form, 'name'),
        description: formText(form, 'description') || null,
        visibility: formText(form, 'visibility') as Visibility,
      });
      toast.success('Настройки сохранены');
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <form className={styles.section} onSubmit={(event) => void submit(event)}>
      <h2 className={styles.title}>Основное</h2>
      <TextField
        label="Название"
        name="name"
        defaultValue={collection.name}
        required
      />
      <TextAreaField
        label="Описание"
        name="description"
        rows={3}
        defaultValue={collection.description ?? ''}
      />
      <SelectField
        label="Кто видит"
        name="visibility"
        defaultValue={collection.visibility}
        hint="«Все сотрудники» — читать могут все, загружать и править — только участники."
      >
        {(Object.keys(VISIBILITY_LABELS) as Visibility[]).map((value) => (
          <option key={value} value={value}>
            {VISIBILITY_LABELS[value]}
          </option>
        ))}
      </SelectField>
      <div className={styles.actions}>
        <Button type="submit" variant="primary" loading={pending}>
          Сохранить
        </Button>
      </div>
    </form>
  );
}
