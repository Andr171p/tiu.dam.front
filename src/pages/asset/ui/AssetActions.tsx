import {
  Crop,
  Download,
  FolderInput,
  Layers,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { downloadAsset, type Asset } from '@entities/asset';
import { can } from '@entities/collection';
import { AssetDetailsDialog } from '@features/edit-asset';
import {
  MoveAssetDialog,
  purgeAsset,
  restoreAsset,
  ShareButton,
  trashAsset,
} from '@features/manage-asset';
import { AddToSelectionDialog } from '@features/manage-selection';
import { describeError } from '@shared/api';
import { routes } from '@shared/config/routes';
import { Button, ButtonLink, IconButton } from '@shared/ui/button';
import { Menu, MenuItem, MenuSeparator } from '@shared/ui/menu';
import { usePopover } from '@shared/ui/popover';
import { toast } from '@shared/ui/toast';
import styles from './AssetPage.module.scss';

type Dialog = 'details' | 'move' | 'selection' | null;

export function DownloadButton({ asset }: { asset: Asset }) {
  const [pending, setPending] = useState(false);

  const download = async () => {
    setPending(true);
    try {
      await downloadAsset(asset.id);
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      variant="primary"
      icon={Download}
      loading={pending}
      className={styles.download}
      onClick={() => void download()}
    >
      Скачать
    </Button>
  );
}

/** Действия с материалом: правка, ссылка, перенос, подборки, корзина. */
export function AssetActions({
  asset,
  withEditor,
}: {
  asset: Asset;
  withEditor: boolean;
}) {
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<Dialog>(null);
  const menu = usePopover();
  const writable = can(asset, 'write');
  const trashed = Boolean(asset.trashedAt);

  return (
    <>
      {withEditor && writable && !trashed && asset.kind === 'image' && (
        <ButtonLink to={routes.assetEditor(asset.id)} icon={Crop}>
          Редактировать
        </ButtonLink>
      )}
      <ShareButton assetId={asset.id} />
      <IconButton
        icon={MoreHorizontal}
        label="Ещё действия"
        variant="secondary"
        size="md"
        {...menu.triggerProps}
      />
      <Menu {...menu.popoverProps}>
        {writable && !trashed && (
          <>
            <MenuItem icon={Pencil} onSelect={() => setDialog('details')}>
              Название и описание
            </MenuItem>
            <MenuItem icon={FolderInput} onSelect={() => setDialog('move')}>
              Перенести в коллекцию
            </MenuItem>
          </>
        )}
        <MenuItem icon={Layers} onSelect={() => setDialog('selection')}>
          Добавить в подборку
        </MenuItem>
        {writable && (
          <>
            <MenuSeparator />
            {trashed ? (
              <MenuItem
                icon={RotateCcw}
                onSelect={() => void restoreAsset(asset.id)}
              >
                Восстановить
              </MenuItem>
            ) : (
              <MenuItem
                icon={Trash2}
                tone="danger"
                onSelect={() => void trashAsset(asset.id)}
              >
                В корзину
              </MenuItem>
            )}
          </>
        )}
        {trashed && can(asset, 'manage') && (
          <MenuItem
            icon={Trash2}
            tone="danger"
            onSelect={() =>
              purgeAsset(
                asset.id,
                asset.title,
                () => void navigate(routes.trash()),
              )
            }
          >
            Удалить навсегда
          </MenuItem>
        )}
      </Menu>

      {dialog === 'details' && (
        <AssetDetailsDialog
          asset={asset}
          open
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'move' && (
        <MoveAssetDialog asset={asset} open onClose={() => setDialog(null)} />
      )}
      {dialog === 'selection' && (
        <AddToSelectionDialog
          assetIds={[asset.id]}
          open
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
