import { useState, type FormEvent } from 'react';
import type { Asset } from '@entities/asset';
import { can, useCollections } from '@entities/collection';
import { describeError } from '@shared/api';
import { formText } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { Dialog, DialogActions } from '@shared/ui/dialog';
import { SelectField } from '@shared/ui/field';
import { Notice } from '@shared/ui/notice';
import { toast } from '@shared/ui/toast';
import { moveAsset } from '../model/asset-actions';

interface MoveAssetDialogProps {
  asset: Asset;
  open: boolean;
  onClose: () => void;
}

/** Перенос в другую коллекцию меняет круг тех, кто видит материал. */
export function MoveAssetDialog({
  asset,
  open,
  onClose,
}: MoveAssetDialogProps) {
  const collections = useCollections((state) => state.items);
  const targets = collections.filter(
    (item) => item.id !== asset.collectionId && can(item, 'write'),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = formText(new FormData(event.currentTarget), 'collectionId');
    setPending(true);
    setError(null);
    try {
      await moveAsset(asset.id, target);
      toast.success('Материал перенесён');
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
      title="Перенести в коллекцию"
      description="Доступ к материалу будет определяться участниками новой коллекции."
    >
      <form className="stack" onSubmit={(event) => void submit(event)}>
        {targets.length > 0 ? (
          <SelectField label="Коллекция" name="collectionId" required>
            {targets.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </SelectField>
        ) : (
          <Notice>Нет других коллекций, в которые вы можете загружать.</Notice>
        )}
        {error && <Notice>{error}</Notice>}
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button
            type="submit"
            variant="primary"
            loading={pending}
            disabled={targets.length === 0}
          >
            Перенести
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
