import { Layers, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@entities/session';
import { loadSelections, useSelections } from '@entities/selection';
import { describeError } from '@shared/api';
import { plural } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { Dialog } from '@shared/ui/dialog';
import { toast } from '@shared/ui/toast';
import { addToSelection } from '../model/selection-actions';
import { SelectionDialog } from './SelectionDialog';
import styles from './AddToSelectionDialog.module.scss';

interface AddToSelectionDialogProps {
  assetIds: string[];
  open: boolean;
  onClose: () => void;
}

/** Добавить материал в свою подборку или создать новую с ним. */
export function AddToSelectionDialog({
  assetIds,
  open,
  onClose,
}: AddToSelectionDialogProps) {
  const user = useCurrentUser();
  const all = useSelections((state) => state.items);
  const own = all.filter(
    (selection) => selection.ownerId === user.id || user.isAdmin,
  );
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) void loadSelections();
  }, [open]);

  const add = async (selectionId: string, name: string) => {
    try {
      await addToSelection(selectionId, assetIds);
      toast.success(`Добавлено в «${name}»`);
      onClose();
    } catch (error) {
      toast.error(describeError(error));
    }
  };

  return (
    <>
      <Dialog
        open={open && !creating}
        onClose={onClose}
        title="Добавить в подборку"
      >
        <ul className={styles.list}>
          {own.map((selection) => (
            <li key={selection.id}>
              <button
                type="button"
                className={styles.item}
                onClick={() => void add(selection.id, selection.name)}
              >
                <Layers size={18} strokeWidth={1.7} aria-hidden />
                <span className={styles.name}>{selection.name}</span>
                <span className={styles.count}>
                  {plural(selection.assetCount, [
                    'материал',
                    'материала',
                    'материалов',
                  ])}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Button icon={Plus} onClick={() => setCreating(true)}>
          Новая подборка
        </Button>
      </Dialog>
      <SelectionDialog
        open={open && creating}
        assetIds={assetIds}
        onClose={() => {
          setCreating(false);
          onClose();
        }}
        onSaved={(selection) =>
          toast.success(`Создана подборка «${selection.name}»`)
        }
      />
    </>
  );
}
