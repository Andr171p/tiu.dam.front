import { useState, type FormEvent } from 'react';
import { updateAsset, type Asset } from '@entities/asset';
import { describeError } from '@shared/api';
import { formText } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { Dialog, DialogActions } from '@shared/ui/dialog';
import { TextAreaField, TextField } from '@shared/ui/field';
import { Notice } from '@shared/ui/notice';

interface AssetDetailsDialogProps {
  asset: Asset;
  open: boolean;
  onClose: () => void;
}

export function AssetDetailsDialog({
  asset,
  open,
  onClose,
}: AssetDetailsDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await updateAsset(asset.id, {
        title: formText(form, 'title'),
        description: formText(form, 'description') || null,
      });
      onClose();
    } catch (failure) {
      setError(describeError(failure));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Название и описание">
      <form className="stack" onSubmit={(event) => void submit(event)}>
        <TextField
          label="Название"
          name="title"
          defaultValue={asset.title}
          required
          maxLength={500}
        />
        <TextAreaField
          label="Описание"
          name="description"
          rows={4}
          defaultValue={asset.description ?? ''}
          hint="Описание от ИИ хранится отдельно и не перезаписывается."
        />
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
