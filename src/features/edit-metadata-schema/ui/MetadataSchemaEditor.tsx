import {
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckSquare,
  Hash,
  List,
  Pencil,
  Plus,
  Save,
  Trash2,
  Type,
} from 'lucide-react';
import { useState } from 'react';
import {
  useUpdateSettings,
  type Collection,
  type MetadataField,
} from '@entities/collection';
import { describeError } from '@shared/api';
import { toFieldKey } from '@shared/lib/format';
import { Badge } from '@shared/ui/badge';
import { Button, IconButton } from '@shared/ui/button';
import { Dialog, DialogActions } from '@shared/ui/dialog';
import {
  Checkbox,
  SelectField,
  TextAreaField,
  TextField,
} from '@shared/ui/field';
import styles from './MetadataSchemaEditor.module.scss';

type FieldType = MetadataField['type'];

const TYPES: Record<FieldType, { label: string; icon: typeof Type }> = {
  text: { label: 'Текст', icon: Type },
  number: { label: 'Число', icon: Hash },
  date: { label: 'Дата', icon: Calendar },
  boolean: { label: 'Да / нет', icon: CheckSquare },
  choice: { label: 'Выбор из списка', icon: List },
};

const emptyField = (): MetadataField => ({
  key: '',
  label: '',
  type: 'text',
  required: false,
  description: null,
  options: [],
  multiple: false,
});

function FieldDialog({
  initial,
  takenKeys,
  onSave,
  onClose,
}: {
  initial: MetadataField | null;
  takenKeys: Set<string>;
  onSave: (field: MetadataField) => void;
  onClose: () => void;
}) {
  const [field, setField] = useState<MetadataField>(initial ?? emptyField());
  const [optionsText, setOptionsText] = useState(field.options.join('\n'));
  const isNew = !initial;
  const key = isNew ? toFieldKey(field.label) : field.key;
  const keyTaken = isNew && takenKeys.has(key);

  return (
    <Dialog
      open
      onClose={onClose}
      title={isNew ? 'Новое поле' : 'Поле метаданных'}
      size="md"
    >
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          const options =
            field.type === 'choice'
              ? [
                  ...new Set(
                    optionsText
                      .split('\n')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  ),
                ]
              : [];
          onSave({
            ...field,
            key,
            options,
            multiple: field.type === 'choice' && field.multiple,
          });
        }}
      >
        <TextField
          label="Подпись"
          value={field.label}
          required
          maxLength={100}
          autoFocus
          placeholder="Дата мероприятия"
          hint={key && `Ключ в API: ${key}`}
          error={keyTaken ? 'Поле с таким ключом уже есть' : undefined}
          onChange={(event) =>
            setField({ ...field, label: event.target.value })
          }
        />
        <SelectField
          label="Тип"
          value={field.type}
          disabled={!isNew}
          hint={
            !isNew
              ? 'Тип существующего поля не меняется: значения уже заполнены'
              : undefined
          }
          onChange={(event) =>
            setField({ ...field, type: event.target.value as FieldType })
          }
        >
          {Object.entries(TYPES).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        {field.type === 'choice' && (
          <>
            <TextAreaField
              label="Варианты"
              hint="По одному в строке"
              rows={4}
              required
              value={optionsText}
              onChange={(event) => setOptionsText(event.target.value)}
            />
            <Checkbox
              label="Можно выбрать несколько"
              checked={field.multiple}
              onChange={(event) =>
                setField({ ...field, multiple: event.target.checked })
              }
            />
          </>
        )}
        <TextField
          label="Подсказка"
          value={field.description ?? ''}
          maxLength={500}
          onChange={(event) =>
            setField({ ...field, description: event.target.value || null })
          }
        />
        <Checkbox
          label="Обязательное"
          description="Актив без значения отмечается как нарушение"
          checked={field.required}
          onChange={(event) =>
            setField({ ...field, required: event.target.checked })
          }
        />
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="primary" disabled={!key || keyTaken}>
            {isNew ? 'Добавить' : 'Готово'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export function MetadataSchemaEditor({
  collection,
}: {
  collection: Collection;
}) {
  const [fields, setFields] = useState(collection.settings.metadataFields);
  const [editing, setEditing] = useState<{ index: number | null } | null>(null);
  const update = useUpdateSettings(collection, 'Схема метаданных сохранена');
  const dirty =
    JSON.stringify(fields) !==
    JSON.stringify(collection.settings.metadataFields);

  const move = (index: number, offset: number) =>
    setFields((current) => {
      const next = [...current];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Кастомные метаданные</h2>
          <p className={styles.hint}>
            Поля, которые заполняют у каждого актива коллекции: мероприятие,
            подразделение, фотограф. По ним же работает поиск.
          </p>
        </div>
        <Button icon={Plus} onClick={() => setEditing({ index: null })}>
          Поле
        </Button>
      </header>

      {fields.length ? (
        <ol className={styles.list}>
          {fields.map((field, index) => {
            const { icon: Icon, label } = TYPES[field.type];
            return (
              <li key={field.key} className={styles.row}>
                <span className={styles.icon}>
                  <Icon size={16} aria-hidden />
                </span>
                <div className={styles.info}>
                  <span className={styles.label}>
                    {field.label}
                    {field.required && (
                      <Badge tone="danger">обязательное</Badge>
                    )}
                  </span>
                  <span className={styles.meta}>
                    {label}
                    {field.type === 'choice' &&
                      `: ${field.options.join(', ')}`}{' '}
                    · {field.key}
                  </span>
                </div>
                <IconButton
                  icon={ArrowUp}
                  label="Выше"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                />
                <IconButton
                  icon={ArrowDown}
                  label="Ниже"
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, 1)}
                />
                <IconButton
                  icon={Pencil}
                  label="Изменить"
                  onClick={() => setEditing({ index })}
                />
                <IconButton
                  icon={Trash2}
                  label="Удалить"
                  onClick={() =>
                    setFields((current) =>
                      current.filter((_, position) => position !== index),
                    )
                  }
                />
              </li>
            );
          })}
        </ol>
      ) : (
        <p className={styles.empty}>
          Полей пока нет: у активов будут только название, описание, теги и
          лицензия.
        </p>
      )}

      <div className={styles.actions}>
        {update.error && (
          <span className={styles.error}>{describeError(update.error)}</span>
        )}
        <Button
          variant="primary"
          icon={Save}
          disabled={!dirty}
          loading={update.isPending}
          onClick={() => update.mutate({ metadataFields: fields })}
        >
          Сохранить схему
        </Button>
      </div>

      {editing && (
        <FieldDialog
          initial={editing.index === null ? null : fields[editing.index]}
          takenKeys={new Set(fields.map((field) => field.key))}
          onClose={() => setEditing(null)}
          onSave={(field) => {
            setFields((current) =>
              editing.index === null
                ? [...current, field]
                : current.map((item, position) =>
                    position === editing.index ? field : item,
                  ),
            );
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}
