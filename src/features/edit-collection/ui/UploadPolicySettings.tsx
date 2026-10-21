import { useState, type FormEvent } from 'react';
import type { Collection } from '@entities/collection';
import { describeError } from '@shared/api';
import { Button } from '@shared/ui/button';
import { Checkbox, TextField } from '@shared/ui/field';
import { toast } from '@shared/ui/toast';
import { saveCollection } from '../model/save-collection';
import styles from './settings.module.scss';

const TYPES = [
  { pattern: 'image/*', label: 'Фото', description: 'JPEG, PNG, HEIC, WebP…' },
  {
    pattern: 'video/*',
    label: 'Видео',
    description: 'Прокси 720p создаётся автоматически',
  },
  { pattern: 'audio/*', label: 'Аудио', description: 'С расшифровкой речи' },
  {
    pattern: 'application/pdf',
    label: 'PDF',
    description: 'Превью первой страницы',
  },
];

const GB = 1024 ** 3;

export function UploadPolicySettings({
  collection,
}: {
  collection: Collection;
}) {
  const { allowedTypes = [], maxFileSize } = collection.uploadPolicy;
  const anyType = allowedTypes.length === 0 || allowedTypes.includes('*/*');
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const types = form.getAll('types').map(String);
    const sizeGb = Number(form.get('maxFileSize'));

    setPending(true);
    try {
      await saveCollection(collection.id, {
        uploadPolicy: {
          allowedTypes: types.length > 0 ? types : ['*/*'],
          maxFileSize: Math.round(sizeGb * GB),
        },
      });
      toast.success('Правила загрузки сохранены');
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <form className={styles.section} onSubmit={(event) => void submit(event)}>
      <h2 className={styles.title}>Правила загрузки</h2>
      <p className={styles.description}>
        Ничего не отмечено — коллекция принимает любые файлы.
      </p>
      <div className={styles.types}>
        {TYPES.map((type) => (
          <Checkbox
            key={type.pattern}
            name="types"
            value={type.pattern}
            label={type.label}
            description={type.description}
            defaultChecked={!anyType && allowedTypes.includes(type.pattern)}
          />
        ))}
      </div>
      <TextField
        label="Максимальный размер файла, ГБ"
        name="maxFileSize"
        type="number"
        min={0.01}
        step={0.01}
        required
        defaultValue={maxFileSize ? +(maxFileSize / GB).toFixed(2) : 20}
      />
      <div className={styles.actions}>
        <Button type="submit" variant="primary" loading={pending}>
          Сохранить
        </Button>
      </div>
    </form>
  );
}
