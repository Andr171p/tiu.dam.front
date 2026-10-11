import { Save, Settings2 } from 'lucide-react';
import { useState } from 'react';
import type { Asset } from '@entities/asset';
import type { MetadataField } from '@entities/collection';
import { ApiError } from '@shared/api';
import { routes } from '@shared/config/routes';
import { Button, ButtonLink } from '@shared/ui/button';
import { Checkbox, Field, SelectField, TextField } from '@shared/ui/field';
import { useUpdateAsset } from '../model/mutations';
import styles from './forms.module.scss';

type Value = string | number | boolean | string[] | null;
type Values = Record<string, Value>;

function FieldControl({
  field,
  value,
  onChange,
  disabled,
  error,
}: {
  field: MetadataField;
  value: Value;
  onChange: (value: Value) => void;
  disabled: boolean;
  error?: string;
}) {
  const common = {
    label: field.label,
    hint: field.description ?? undefined,
    error,
    disabled,
    required: field.required,
  };

  switch (field.type) {
    case 'number':
      return (
        <TextField
          {...common}
          type="number"
          step="any"
          value={typeof value === 'number' ? value : ''}
          onChange={(event) =>
            onChange(
              event.target.value === '' ? null : Number(event.target.value),
            )
          }
        />
      );
    case 'date':
      return (
        <TextField
          {...common}
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value || null)}
        />
      );
    case 'boolean':
      return (
        <Checkbox
          label={field.label}
          description={field.description}
          checked={value === true}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
      );
    case 'choice':
      if (field.multiple) {
        const selected = Array.isArray(value) ? value : [];
        return (
          <Field {...common}>
            {() => (
              <div className={styles.section}>
                {field.options.map((option) => (
                  <Checkbox
                    key={option}
                    label={option}
                    disabled={disabled}
                    checked={selected.includes(option)}
                    onChange={(event) =>
                      onChange(
                        event.target.checked
                          ? [...selected, option]
                          : selected.filter((item) => item !== option),
                      )
                    }
                  />
                ))}
              </div>
            )}
          </Field>
        );
      }
      return (
        <SelectField
          {...common}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value || null)}
        >
          <option value="">—</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectField>
      );
    default:
      return (
        <TextField
          {...common}
          value={typeof value === 'string' ? value : ''}
          maxLength={2000}
          onChange={(event) => onChange(event.target.value)}
        />
      );
  }
}

/** Кастомные метаданные: форма строится по схеме коллекции, проверяет сервер. */
export function CustomMetaForm({
  asset,
  fields,
  canConfigure,
}: {
  asset: Asset;
  fields: MetadataField[];
  canConfigure: boolean;
}) {
  const [values, setValues] = useState<Values>(() => ({
    ...(asset.customMeta as Values),
  }));
  const update = useUpdateAsset(asset.id, 'Метаданные сохранены');
  const fieldErrors =
    update.error instanceof ApiError ? update.error.fieldErrors : {};

  if (!fields.length) {
    return (
      <div className={styles.section}>
        <p className={styles.empty}>
          В коллекции не настроены поля метаданных.
        </p>
        {canConfigure && (
          <ButtonLink
            to={routes.collectionSettings(asset.collectionId, 'metadata')}
            icon={Settings2}
            size="sm"
          >
            Настроить поля
          </ButtonLink>
        )}
      </div>
    );
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        update.mutate({ customMeta: values });
      }}
    >
      {fields.map((field) => (
        <FieldControl
          key={field.key}
          field={field}
          value={values[field.key] ?? null}
          disabled={!asset.canEdit}
          error={fieldErrors[field.key]}
          onChange={(value) =>
            setValues((current) => ({ ...current, [field.key]: value }))
          }
        />
      ))}
      {asset.canEdit && (
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
      )}
    </form>
  );
}
