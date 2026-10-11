import { Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { LICENSE_LABELS, type Asset, type LicenseType } from '@entities/asset';
import { describeError } from '@shared/api';
import { formText } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { SelectField, TextAreaField, TextField } from '@shared/ui/field';
import { useUpdateAsset } from '../model/mutations';
import styles from './forms.module.scss';

const NO_LICENSE = '';

/** Права на актив: тип лицензии, правообладатель, автор, источник, срок. */
export function LicenseForm({ asset }: { asset: Asset }) {
  const update = useUpdateAsset(asset.id, 'Лицензия сохранена');
  const license = asset.license;
  const [type, setType] = useState<LicenseType | typeof NO_LICENSE>(
    license?.type ?? NO_LICENSE,
  );
  const disabled = !asset.canEdit;

  return (
    <form
      key={asset.updatedAt}
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        if (type === NO_LICENSE) return;

        const form = new FormData(event.currentTarget);
        const text = (name: string) => formText(form, name) || null;
        update.mutate({
          license: {
            type,
            holder: text('holder'),
            author: text('author'),
            sourceUrl: text('sourceUrl'),
            terms: text('terms'),
            validUntil: text('validUntil'),
          },
        });
      }}
    >
      <SelectField
        label="Лицензия"
        value={type}
        disabled={disabled}
        onChange={(event) => setType(event.target.value as LicenseType)}
      >
        <option value={NO_LICENSE} disabled>
          Не указана
        </option>
        {Object.entries(LICENSE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>

      <div className={styles.row}>
        <TextField
          label="Правообладатель"
          name="holder"
          defaultValue={license?.holder ?? ''}
          disabled={disabled}
          placeholder="ФГБОУ ВО ТИУ"
        />
        <TextField
          label="Автор"
          name="author"
          defaultValue={license?.author ?? ''}
          disabled={disabled}
        />
      </div>
      <div className={styles.row}>
        <TextField
          label="Источник"
          name="sourceUrl"
          type="url"
          defaultValue={license?.sourceUrl ?? ''}
          disabled={disabled}
          placeholder="https://"
        />
        <TextField
          label="Права действуют до"
          name="validUntil"
          type="date"
          defaultValue={license?.validUntil ?? ''}
          disabled={disabled}
          hint="Пусто — бессрочно"
        />
      </div>
      <TextAreaField
        label="Условия использования"
        name="terms"
        rows={3}
        defaultValue={license?.terms ?? ''}
        disabled={disabled}
        required={type === 'custom'}
        hint={
          type === 'custom' ? 'Для особых условий текст обязателен' : undefined
        }
        error={update.error ? describeError(update.error) : undefined}
      />

      {asset.canEdit && (
        <div className={styles.actions}>
          {license && (
            <Button
              variant="ghost"
              icon={Trash2}
              onClick={() => {
                setType(NO_LICENSE);
                update.mutate({ license: null });
              }}
            >
              Убрать лицензию
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={update.isPending}
            disabled={type === NO_LICENSE}
          >
            Сохранить
          </Button>
        </div>
      )}
    </form>
  );
}
