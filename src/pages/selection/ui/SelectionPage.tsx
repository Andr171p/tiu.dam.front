import { Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AssetCard, type AssetSummary } from '@entities/asset';
import { useCurrentUser } from '@entities/session';
import { upsertSelection, type Selection } from '@entities/selection';
import {
  deleteSelection,
  removeFromSelection,
  SelectionDialog,
} from '@features/manage-selection';
import { api, describeError } from '@shared/api';
import { routes } from '@shared/config/routes';
import { plural } from '@shared/lib/format';
import { useRequest } from '@shared/lib/hooks';
import { Breadcrumbs } from '@shared/ui/breadcrumbs';
import { Button, IconButton } from '@shared/ui/button';
import { confirmAction } from '@shared/ui/dialog';
import { EmptyState } from '@shared/ui/empty-state';
import { Notice } from '@shared/ui/notice';
import { PageHeader } from '@shared/ui/page-header';
import { Skeleton } from '@shared/ui/skeleton';
import { toast } from '@shared/ui/toast';
import styles from './SelectionPage.module.scss';

/** Подборка: материалы из доступных пользователю коллекций в заданном порядке. */
export function SelectionPage() {
  const { selectionId = '' } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const selection = useRequest(
    async (signal) => {
      const loaded = await api.get<Selection>(`/selections/${selectionId}`, {
        signal,
      });
      upsertSelection(loaded);
      return loaded;
    },
    [selectionId],
  );
  const assets = useRequest(
    (signal) =>
      api.get<AssetSummary[]>(`/selections/${selectionId}/assets`, { signal }),
    [selectionId],
  );

  if (selection.status === 'error')
    return (
      <EmptyState title="Подборка не найдена" description={selection.error} />
    );
  if (!selection.data) return <Skeleton height={240} />;

  const current = selection.data;
  const owner = current.ownerId === user.id || user.isAdmin;

  const remove = async (asset: AssetSummary) => {
    try {
      await removeFromSelection(current.id, [asset.id]);
      assets.reload();
      selection.reload();
    } catch (error) {
      toast.error(describeError(error));
    }
  };

  const destroy = () =>
    confirmAction({
      title: `Удалить подборку «${current.name}»?`,
      description: 'Материалы останутся в своих коллекциях.',
      confirmLabel: 'Удалить',
      tone: 'danger',
      onConfirm: async () => {
        await deleteSelection(current.id);
        void navigate(routes.selections());
      },
    });

  return (
    <div className={styles.page}>
      <Breadcrumbs
        back={{ to: routes.selections(), label: 'Подборки' }}
        current={current.name}
      />
      <PageHeader
        title={current.name}
        description={
          current.description ??
          `${plural(current.assetCount, ['материал', 'материала', 'материалов'])}${current.shared ? ' · общая' : ''}`
        }
        actions={
          owner && (
            <>
              <Button icon={Pencil} onClick={() => setEditing(true)}>
                Изменить
              </Button>
              <Button icon={Trash2} variant="ghost" onClick={destroy}>
                Удалить
              </Button>
            </>
          )
        }
      />

      {assets.status === 'error' && <Notice>{assets.error}</Notice>}
      {!assets.data ? (
        <Skeleton height={212} />
      ) : assets.data.length === 0 ? (
        <EmptyState
          title="В подборке пусто"
          description="Добавляйте материалы из их карточек: «⋯» → «Добавить в подборку»."
        />
      ) : (
        <div className={styles.grid}>
          {assets.data.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              action={
                owner && (
                  <IconButton
                    icon={X}
                    label="Убрать из подборки"
                    variant="secondary"
                    onClick={() => void remove(asset)}
                  />
                )
              }
            />
          ))}
        </div>
      )}

      {editing && (
        <SelectionDialog
          open
          selection={current}
          onClose={() => setEditing(false)}
          onSaved={selection.reload}
        />
      )}
    </div>
  );
}
