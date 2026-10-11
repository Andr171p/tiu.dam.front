import { ImageOff } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useAsset } from '@entities/asset';
import { ImageEditor } from '@features/edit-image';
import { routes } from '@shared/config/routes';
import { ButtonLink } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { PageHeader } from '@shared/ui/page-header';
import { Skeleton } from '@shared/ui/skeleton';
import styles from './AssetEditorPage.module.scss';

export function AssetEditorPage() {
  const { assetId = '' } = useParams();
  const asset = useAsset(assetId);
  const navigate = useNavigate();

  if (asset.isError) throw asset.error;
  if (!asset.data) return <Skeleton height="70vh" radius={20} />;

  const current = asset.data;
  const editable =
    current.canEdit && current.kind === 'image' && current.currentVersion;

  return (
    <div className={styles.page}>
      <PageHeader
        back={{ to: routes.asset(current.id), label: current.title }}
        title="Редактор"
        description={
          current.currentVersion
            ? `Версия ${current.currentVersion.number}`
            : undefined
        }
      />
      {editable ? (
        <ImageEditor
          asset={current}
          onSaved={() => void navigate(routes.asset(current.id))}
        />
      ) : (
        <EmptyState
          icon={ImageOff}
          title="Редактирование недоступно"
          description="Редактировать можно готовые изображения, если у вас есть права на актив."
          action={
            <ButtonLink to={routes.asset(current.id)}>К активу</ButtonLink>
          }
        />
      )}
    </div>
  );
}
