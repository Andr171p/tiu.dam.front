import { Save } from 'lucide-react';
import type { Asset } from '@entities/asset';
import { describeError } from '@shared/api';
import { formText } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { TextAreaField, TextField } from '@shared/ui/field';
import { useUpdateAsset } from '../model/mutations';
import styles from './forms.module.scss';

export function AssetDetailsForm({ asset }: { asset: Asset }) {
  const update = useUpdateAsset(asset.id);

  return (
    <form
      key={asset.updatedAt}
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const description = formText(form, 'description');
        update.mutate({
          title: formText(form, 'title'),
          description: description || null,
        });
      }}
    >
      <TextField
        label="Название"
        name="title"
        defaultValue={asset.title}
        required
        maxLength={255}
        disabled={!asset.canEdit}
      />
      <TextAreaField
        label="Описание"
        name="description"
        defaultValue={asset.description ?? ''}
        rows={4}
        maxLength={5000}
        disabled={!asset.canEdit}
        placeholder={
          asset.canEdit
            ? 'Что изображено, где и когда снято, для чего материал'
            : undefined
        }
        error={update.error ? describeError(update.error) : undefined}
      />
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
