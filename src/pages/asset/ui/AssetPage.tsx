import { Archive } from 'lucide-react';
import { useParams } from 'react-router';
import {
  AssetCard,
  KIND_LABELS,
  useAsset,
  useSimilarAssets,
  type Asset,
} from '@entities/asset';
import { useCollection } from '@entities/collection';
import { AssetInspector } from '@widgets/asset-inspector';
import { AssetViewer } from '@widgets/asset-viewer';
import { routes } from '@shared/config/routes';
import { formatRelative } from '@shared/lib/format';
import { Badge } from '@shared/ui/badge';
import { PageHeader } from '@shared/ui/page-header';
import { Skeleton } from '@shared/ui/skeleton';
import styles from './AssetPage.module.scss';

function SimilarAssets({ asset }: { asset: Asset }) {
  const similar = useSimilarAssets(asset);
  if (!similar.data?.length) return null;

  return (
    <section className={styles.similar}>
      <h2 className={styles.sectionTitle}>Похожие изображения</h2>
      <div className={styles.similarGrid}>
        {similar.data.map((item) => (
          <AssetCard key={item.id} asset={item} />
        ))}
      </div>
    </section>
  );
}

export function AssetPage() {
  const { assetId = '' } = useParams();
  const asset = useAsset(assetId);
  const collection = useCollection(asset.data?.collectionId ?? '');

  if (asset.isError) throw asset.error;
  if (!asset.data || !collection.data) {
    return (
      <div className={styles.layout}>
        <Skeleton height="70vh" radius={20} />
        <Skeleton height="70vh" radius={20} />
      </div>
    );
  }

  const current = asset.data;

  return (
    <div className={styles.page}>
      <PageHeader
        back={{
          to: routes.collection(current.collectionId),
          label: collection.data.name,
        }}
        title={current.title}
      >
        <div className={styles.meta}>
          <Badge>{KIND_LABELS[current.kind]}</Badge>
          {current.status === 'archived' && (
            <Badge tone="warning" icon={Archive}>
              В архиве
            </Badge>
          )}
          <span>
            {current.author.displayName} · обновлён{' '}
            {formatRelative(current.updatedAt)}
          </span>
        </div>
      </PageHeader>

      <div className={styles.layout}>
        <AssetViewer asset={current} />
        <AssetInspector
          key={current.id}
          asset={current}
          collection={collection.data}
        />
      </div>

      <SimilarAssets asset={current} />
    </div>
  );
}
