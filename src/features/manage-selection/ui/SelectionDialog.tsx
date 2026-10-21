import { useState, type FormEvent } from 'react';
import type { Selection } from '@entities/selection';
import { describeError } from '@shared/api';
import { formText } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { Dialog, DialogActions } from '@shared/ui/dialog';
import { Checkbox, TextAreaField, TextField } from '@shared/ui/field';
import { Notice } from '@shared/ui/notice';
import { createSelection, updateSelection } from '../model/selection-actions';

interface SelectionDialogProps {
  open: boolean;
  onClose: () => void;
  /** Без подборки — создание новой */
  selection?: Selection;
  /** Материалы, которые сразу попадут в новую подборку */
  assetIds?: string[];
  onSaved?: (selection: Selection) => void;
}

/** Создание и переименование подборки. */
export function SelectionDialog({
  open,
  onClose,
  selection,
  assetIds,
  onSaved,
}: SelectionDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fields = {
      name: formText(form, 'name'),
      description: formText(form, 'description') || null,
      shared: form.get('shared') === 'on',
    };

    setPending(true);
    setError(null);
    try {
      const saved = selection
        ? await updateSelection(selection.id, fields)
        : await createSelection({ ...fields, assetIds });
      onSaved?.(saved);
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
      title={selection ? 'Подборка' : 'Новая подборка'}
      description="Подборка собирает материалы из разных коллекций — для задачи, публикации или портала."
    >
      <form className="stack" onSubmit={(event) => void submit(event)}>
        <TextField
          label="Название"
          name="name"
          required
          maxLength={200}
          defaultValue={selection?.name}
          autoFocus
        />
        <TextAreaField
          label="Описание"
          name="description"
          rows={3}
          defaultValue={selection?.description ?? ''}
        />
        <Checkbox
          name="shared"
          label="Общая подборка"
          description="Видна всем сотрудникам. Каждый увидит только материалы доступных ему коллекций."
          defaultChecked={selection?.shared}
        />
        {error && <Notice>{error}</Notice>}
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="primary" loading={pending}>
            {selection ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
