import { Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Asset } from '@entities/asset';
import { routes } from '@shared/config/routes';
import { Button } from '@shared/ui/button';
import { Dialog, DialogActions } from '@shared/ui/dialog';
import { useDeleteAsset, useUpdateAsset } from '../model/mutations';
import styles from './forms.module.scss';

/** Архивирование и удаление: актив в архиве не виден в коллекции и поиске, но история сохраняется. */
export function AssetActions({ asset }: { asset: Asset }) {
  const [confirm, setConfirm] = useState(false);
  const navigate = useNavigate();
  const archived = asset.status === 'archived';
  const update = useUpdateAsset(
    asset.id,
    archived ? 'Актив восстановлен' : 'Актив перенесён в архив',
  );
  const remove = useDeleteAsset(asset.id);

  if (!asset.canEdit) return null;

  return (
    <div className={styles.actions}>
      <Button
        variant="ghost"
        size="sm"
        icon={archived ? ArchiveRestore : Archive}
        loading={update.isPending}
        onClick={() =>
          update.mutate({ status: archived ? 'active' : 'archived' })
        }
      >
        {archived ? 'Восстановить' : 'В архив'}
      </Button>
      <Button
        variant="danger"
        size="sm"
        icon={Trash2}
        onClick={() => setConfirm(true)}
      >
        Удалить
      </Button>

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Удалить актив?"
        description={`«${asset.title}» и все его версии исчезнут из коллекции и поиска.`}
      >
        <DialogActions>
          <Button onClick={() => setConfirm(false)}>Отмена</Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() =>
              remove.mutate(undefined, {
                onSuccess: () =>
                  void navigate(routes.collection(asset.collectionId), {
                    replace: true,
                  }),
              })
            }
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
