import { useState, type FormEvent } from 'react';
import { updateAsset, type Asset, type MetadataValue } from '@entities/asset';
import type { MetadataField } from '@entities/collection';
import { describeError } from '@shared/api';
import { formText } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { Checkbox, SelectField, TextField } from '@shared/ui/field';
import { Dialog, DialogActions } from '@shared/ui/dialog';
import { Notice } from '@shared/ui/notice';
import styles from './forms.module.scss';

interface MetadataDialogProps {
  asset: Asset;
  schema: MetadataField[];
  open: boolean;
  onClose: () => void;
}

function readValue(
  form: FormData,
  field: MetadataField,
): MetadataValue | undefined {
  if (field.type === 'boolean') return form.get(field.key) === 'on';
  if (field.type === 'choice' && field.multiple) {
    const values = form.getAll(field.key).map(String);
    return values.length > 0 ? values : undefined;
  }
  const raw = formText(form, field.key);
  if (!raw) return undefined;
  return field.type === 'number' ? Number(raw) : raw;
}

function FieldInput({
  field,
  value,
}: {
  field: MetadataField;
  value: MetadataValue | undefined;
}) {
  switch (field.type) {
    case 'boolean':
      return (
        <Checkbox
          name={field.key}
          label={field.label}
          defaultChecked={value === true}
        />
      );
    case 'choice':
      return field.multiple ? (
        <fieldset className={styles.fieldset}>
          <legend>{field.label}</legend>
          <div className={styles.checks}>
            {(field.options ?? []).map((option) => (
              <Checkbox
                key={option}
                name={field.key}
                value={option}
                label={option}
                defaultChecked={Array.isArray(value) && value.includes(option)}
              />
            ))}
          </div>
        </fieldset>
      ) : (
        <SelectField
          label={field.label}
          name={field.key}
          required={field.required}
          defaultValue={typeof value === 'string' ? value : ''}
        >
          <option value="">—</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectField>
      );
    default:
      return (
        <TextField
          label={field.label}
          name={field.key}
          type={
            field.type === 'number'
              ? 'number'
              : field.type === 'date'
                ? 'date'
                : 'text'
          }
          step={field.type === 'number' ? 'any' : undefined}
          required={field.required}
          defaultValue={
            value === undefined || typeof value === 'boolean'
              ? ''
              : String(value)
          }
        />
      );
  }
}

/** Поля, которые задала коллекция материала. Значения проверяет сервер по схеме. */
export function MetadataDialog({
  asset,
  schema,
  open,
  onClose,
}: MetadataDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const values = asset.metadata as Record<string, MetadataValue>;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const metadata = Object.fromEntries(
      schema.flatMap((field) => {
        const value = readValue(form, field);
        return value === undefined ? [] : [[field.key, value] as const];
      }),
    );

    setPending(true);
    setError(null);
    try {
      await updateAsset(asset.id, { metadata });
      onClose();
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
      size="md"
      title="Сведения о материале"
    >
      <form className="stack" onSubmit={(event) => void submit(event)}>
        {schema.map((field) => (
          <FieldInput key={field.key} field={field} value={values[field.key]} />
        ))}
        {error && <Notice>{error}</Notice>}
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
