import { useState, type FormEvent } from 'react';
import {
  CHANNEL_LABELS,
  LICENSE_TYPE_LABELS,
  updateAsset,
  type Asset,
  type LicenseType,
  type UsageChannel,
} from '@entities/asset';
import { describeError } from '@shared/api';
import { formText } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { Dialog, DialogActions } from '@shared/ui/dialog';
import {
  Checkbox,
  SelectField,
  TextAreaField,
  TextField,
} from '@shared/ui/field';
import { Notice } from '@shared/ui/notice';
import styles from './forms.module.scss';

interface LicenseDialogProps {
  asset: Asset;
  open: boolean;
  onClose: () => void;
}

/** Права и лицензия: срок, носители, территории. Статус на сегодня вычисляет сервер. */
export function LicenseDialog({ asset, open, onClose }: LicenseDialogProps) {
  const license = asset.license;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (changes: Parameters<typeof updateAsset>[1]) => {
    setPending(true);
    setError(null);
    try {
      await updateAsset(asset.id, changes);
      onClose();
    } catch (failure) {
      setError(describeError(failure));
    } finally {
      setPending(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void save({
      license: {
        type: formText(form, 'type') as LicenseType,
        holder: formText(form, 'holder') || null,
        period: {
          start: formText(form, 'start') || null,
          end: formText(form, 'end') || null,
        },
        channels: form.getAll('channels').map(String) as UsageChannel[],
        territories: formText(form, 'territories')
          .split(',')
          .map((territory) => territory.trim().toUpperCase())
          .filter(Boolean),
        restrictions: formText(form, 'restrictions') || null,
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} size="md" title="Права и лицензия">
      <form className="stack" onSubmit={submit}>
        <div className={styles.grid}>
          <SelectField
            label="Тип"
            name="type"
            defaultValue={license?.type ?? 'own'}
          >
            {(Object.keys(LICENSE_TYPE_LABELS) as LicenseType[]).map((type) => (
              <option key={type} value={type}>
                {LICENSE_TYPE_LABELS[type]}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Автор, правообладатель"
            name="holder"
            defaultValue={license?.holder ?? ''}
            placeholder="Пресс-служба ТИУ"
          />
          <TextField
            label="Действует с"
            name="start"
            type="date"
            defaultValue={license?.period?.start ?? ''}
          />
          <TextField
            label="Действует до"
            name="end"
            type="date"
            defaultValue={license?.period?.end ?? ''}
          />
        </div>

        <fieldset className={styles.fieldset}>
          <legend>
            Разрешено использовать · ничего не отмечено — без ограничений
          </legend>
          <div className={styles.checks}>
            {(Object.keys(CHANNEL_LABELS) as UsageChannel[]).map((channel) => (
              <Checkbox
                key={channel}
                name="channels"
                value={channel}
                label={CHANNEL_LABELS[channel]}
                defaultChecked={license?.channels?.includes(channel)}
              />
            ))}
          </div>
        </fieldset>

        <TextField
          label="Территории"
          name="territories"
          defaultValue={license?.territories?.join(', ') ?? ''}
          placeholder="RU, KZ"
          hint="Коды стран через запятую; пусто — без ограничений."
        />
        <TextAreaField
          label="Условия использования"
          name="restrictions"
          rows={3}
          defaultValue={license?.restrictions ?? ''}
          placeholder="Указывать авторство. Передача третьим лицам требует согласования."
        />

        {error && <Notice>{error}</Notice>}
        <DialogActions>
          {license && (
            <Button
              variant="ghost"
              className={styles.pushLeft}
              disabled={pending}
              onClick={() => void save({ license: null })}
            >
              Убрать лицензию
            </Button>
          )}
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="primary" loading={pending}>
            Сохранить
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
