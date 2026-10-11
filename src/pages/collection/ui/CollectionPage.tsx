import {
  Archive,
  File,
  FileText,
  Globe,
  ImageIcon,
  LayoutGrid,
  Lock,
  Settings,
  UploadCloud,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { AssetCard, useAssets, type AssetKind } from '@entities/asset';
import { can, ROLE_LABELS, useCollection } from '@entities/collection';
import { UploadButton, UploadDropzone } from '@features/upload-assets';
import { routes } from '@shared/config/routes';
import { plural } from '@shared/lib/format';
import { useDebouncedValue } from '@shared/lib/hooks';
import { Badge } from '@shared/ui/badge';
import { ButtonLink } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { PageHeader } from '@shared/ui/page-header';
import { SearchInput } from '@shared/ui/search-input';
import { Segmented } from '@shared/ui/segmented';
import { Skeleton } from '@shared/ui/skeleton';
import { Switch } from '@shared/ui/field';
import styles from './CollectionPage.module.scss';

type KindFilter = AssetKind | 'all';

const KINDS = [
  { value: 'all' as const, label: 'Все', icon: LayoutGrid },
  { value: 'image' as const, label: 'Изображения', icon: ImageIcon },
  { value: 'document' as const, label: 'Документы', icon: FileText },
  { value: 'other' as const, label: 'Другое', icon: File },
];

export function CollectionPage() {
  const { collectionId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [kind, setKind] = useState<KindFilter>('all');
  const [query, setQuery] = useState('');
  const [archived, setArchived] = useState(false);
  const tag = searchParams.get('tag') ?? undefined;

  const collection = useCollection(collectionId);
  const assets = useAssets(collectionId, {
    kind: kind === 'all' ? undefined : kind,
    query: useDebouncedValue(query.trim(), 250) || undefined,
    status: archived ? 'archived' : 'active',
    tag,
  });

  if (collection.isError) throw collection.error;
  if (!collection.data) return <Skeleton height={120} radius={20} />;

  const current = collection.data;
  const canUpload = can(current, 'contribute') && !archived;
  const isPublic = current.visibility === 'public';

  return (
    <div className={styles.page}>
      <PageHeader
        back={{ to: routes.home(), label: 'Коллекции' }}
        title={current.name}
        description={current.description}
        actions={
          <>
            {can(current, 'moderate') && (
              <ButtonLink
                to={routes.collectionSettings(current.id)}
                icon={Settings}
              >
                Настройки
              </ButtonLink>
            )}
            {canUpload && <UploadButton collectionId={current.id} />}
          </>
        }
      >
        <div className={styles.meta}>
          <Badge
            tone={isPublic ? 'accent' : 'neutral'}
            icon={isPublic ? Globe : Lock}
          >
            {isPublic ? 'Публичная' : 'Приватная'}
          </Badge>
          <Badge tone="primary">{ROLE_LABELS[current.role]}</Badge>
          <span className={styles.count}>
            {plural(current.stats.assetCount, ['актив', 'актива', 'активов'])} ·
            владелец {current.owner.displayName}
          </span>
        </div>
      </PageHeader>

      <div className={styles.toolbar}>
        <Segmented
          label="Тип файлов"
          options={KINDS}
          value={kind}
          onChange={setKind}
        />
        {tag && (
          <button
            type="button"
            className={styles.tag}
            onClick={() => setSearchParams({})}
          >
            #{tag}
            <X size={13} aria-label="Сбросить тег" />
          </button>
        )}
        <div className={styles.spacer} />
        <Switch
          label="Архив"
          checked={archived}
          onChange={(event) => setArchived(event.target.checked)}
        />
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Название актива"
          className={styles.search}
        />
      </div>

      <UploadDropzone collectionId={current.id} enabled={canUpload}>
        {assets.isPending ? (
          <div className={styles.grid}>
            {Array.from({ length: 12 }, (_, index) => (
              <Skeleton
                key={index}
                height="auto"
                radius={14}
                className={styles.skeleton}
              />
            ))}
          </div>
        ) : assets.data?.items.length ? (
          <div className={styles.grid}>
            {assets.data.items.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={archived ? Archive : UploadCloud}
            title={archived ? 'В архиве пусто' : 'Здесь пока ничего нет'}
            description={
              canUpload
                ? 'Перетащите файлы в это окно или нажмите «Загрузить». Целостность каждого файла проверяется по SHA-256.'
                : 'Активы появятся, когда участники коллекции их загрузят.'
            }
          />
        )}
      </UploadDropzone>
    </div>
  );
}
