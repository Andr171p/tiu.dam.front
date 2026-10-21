import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  FIELD_TYPE_LABELS,
  type Collection,
  type MetadataField,
  type MetadataFieldType,
} from '@entities/collection';
import { describeError } from '@shared/api';
import { slugify } from '@shared/lib/format';
import { Button, IconButton } from '@shared/ui/button';
import { Checkbox, SelectField, TextField } from '@shared/ui/field';
import { toast } from '@shared/ui/toast';
import { saveCollection } from '../model/save-collection';
import styles from './settings.module.scss';

interface Draft extends MetadataField {
  /** Стабильный ключ строки, пока поле не сохранено */
  draftId: string;
  /** Варианты выбора строкой через запятую — так их удобнее вводить */
  optionsText: string;
}

const toDraft = (field: MetadataField): Draft => ({
  ...field,
  draftId: crypto.randomUUID(),
  optionsText: (field.options ?? []).join(', '),
});

/** Ключ — из подписи, уникальный в схеме: `data_semki`, `data_semki_2`. */
function uniqueKey(label: string, taken: Set<string>): string {
  const base = slugify(label) || 'field';
  const key = /^[a-z]/.test(base) ? base : `field_${base}`;
  let candidate = key;
  for (let index = 2; taken.has(candidate); index += 1)
    candidate = `${key}_${index}`;
  return candidate;
}

/** Кастомные поля материалов коллекции: «Мероприятие», «Дата съёмки», «Фотограф». */
export function MetadataSchemaEditor({
  collection,
}: {
  collection: Collection;
}) {
  const [fields, setFields] = useState(() =>
    collection.metadataSchema.map(toDraft),
  );
  const [pending, setPending] = useState(false);

  const change = (draftId: string, patch: Partial<Draft>) =>
    setFields((list) =>
      list.map((field) =>
        field.draftId === draftId ? { ...field, ...patch } : field,
      ),
    );

  const add = () =>
    setFields((list) => [
      ...list,
      toDraft({
        key: '',
        label: '',
        type: 'text',
        required: false,
        options: [],
        multiple: false,
      }),
    ]);

  const save = async () => {
    const taken = new Set(
      fields.filter((field) => field.key).map((field) => field.key),
    );
    const schema: MetadataField[] = fields
      .filter((field) => field.label.trim())
      .map(({ draftId: _, optionsText, ...field }) => {
        const key = field.key || uniqueKey(field.label, taken);
        taken.add(key);
        return {
          ...field,
          key,
          label: field.label.trim(),
          options:
            field.type === 'choice'
              ? optionsText
                  .split(',')
                  .map((option) => option.trim())
                  .filter(Boolean)
              : [],
        };
      });

    setPending(true);
    try {
      const saved = await saveCollection(collection.id, {
        metadataSchema: schema,
      });
      setFields(saved.metadataSchema.map(toDraft));
      toast.success('Поля сохранены');
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Поля материалов</h2>
      <p className={styles.description}>
        Дополнительные сведения, которые заполняют для каждого материала
        коллекции.
      </p>

      {fields.map((field) => (
        <div key={field.draftId} className={styles.field}>
          <div className={styles.row}>
            <TextField
              label="Подпись"
              value={field.label}
              placeholder="Например, «Мероприятие»"
              onChange={(event) =>
                change(field.draftId, { label: event.target.value })
              }
            />
            <SelectField
              label="Тип"
              value={field.type}
              onChange={(event) =>
                change(field.draftId, {
                  type: event.target.value as MetadataFieldType,
                })
              }
            >
              {(Object.keys(FIELD_TYPE_LABELS) as MetadataFieldType[]).map(
                (type) => (
                  <option key={type} value={type}>
                    {FIELD_TYPE_LABELS[type]}
                  </option>
                ),
              )}
            </SelectField>
            <IconButton
              icon={Trash2}
              label="Удалить поле"
              size="md"
              onClick={() =>
                setFields((list) =>
                  list.filter((item) => item.draftId !== field.draftId),
                )
              }
            />
          </div>
          {field.type === 'choice' && (
            <TextField
              label="Варианты через запятую"
              value={field.optionsText}
              onChange={(event) =>
                change(field.draftId, { optionsText: event.target.value })
              }
            />
          )}
          <div className={styles.fieldOptions}>
            <Checkbox
              label="Обязательное"
              checked={field.required ?? false}
              onChange={(event) =>
                change(field.draftId, { required: event.target.checked })
              }
            />
            {field.type === 'choice' && (
              <Checkbox
                label="Несколько значений"
                checked={field.multiple ?? false}
                onChange={(event) =>
                  change(field.draftId, { multiple: event.target.checked })
                }
              />
            )}
          </div>
        </div>
      ))}

      <div className={styles.actions}>
        <Button icon={Plus} onClick={add}>
          Добавить поле
        </Button>
        <Button variant="primary" loading={pending} onClick={() => void save()}>
          Сохранить
        </Button>
      </div>
    </section>
  );
}
