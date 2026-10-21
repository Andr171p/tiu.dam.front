import { ImagePlus } from 'lucide-react';
import { Link } from 'react-router';
import { can, CollectionCard, useCollections } from '@entities/collection';
import { CreateCollectionButton } from '@features/create-collection';
import { openUploadDialog } from '@features/upload-assets';
import { AssetBrowser } from '@widgets/asset-browser';
import { routes } from '@shared/config/routes';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { PageHeader, SectionHeader } from '@shared/ui/page-header';
import { Skeleton } from '@shared/ui/skeleton';
import styles from './LibraryPage.module.scss';

/** Сколько коллекций показывать в «Подборках для ваших задач» */
const FEATURED = 3;

function FeaturedCollections() {
  const status = useCollections((state) => state.status);
  const collections = useCollections((state) => state.items);
  const featured = [...collections]
    .sort((a, b) => (b.assetCount ?? 0) - (a.assetCount ?? 0))
    .slice(0, FEATURED);

  if (status !== 'loading' && featured.length === 0) return null;

  return (
    <section className={styles.featured}>
      <SectionHeader
        level="group"
        title="Подборки для ваших задач"
        actions={
          <Link to={routes.collections()} className={styles.all}>
            Все коллекции →
          </Link>
        }
      />
      <div className={styles.collections}>
        {featured.length === 0
          ? Array.from({ length: FEATURED }, (_, index) => (
              <Skeleton key={index} height={120} />
            ))
          : featured.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
      </div>
    </section>
  );
}

/** Медиатека: весь визуальный контент университета, доступный пользователю. */
export function LibraryPage() {
  const collections = useCollections((state) => state.items);
  const status = useCollections((state) => state.status);
  const total =
    status === 'ready'
      ? collections.reduce(
          (sum, collection) => sum + (collection.assetCount ?? 0),
          0,
        )
      : null;
  const canUpload = collections.some((collection) => can(collection, 'write'));

  return (
    <div className={styles.page}>
      <PageHeader
        title="Медиатека"
        description="Весь визуальный контент университета — в одном месте"
        actions={<CreateCollectionButton />}
      />
      <FeaturedCollections />
      <AssetBrowser
        title="Все материалы"
        total={total}
        empty={
          <EmptyState
            title="Материалов пока нет"
            description={
              canUpload
                ? 'Загрузите фото, видео или документы — превью и AI-теги появятся автоматически.'
                : 'Когда коллеги добавят вас в коллекцию, её материалы появятся здесь.'
            }
            action={
              canUpload && (
                <Button
                  variant="primary"
                  icon={ImagePlus}
                  onClick={() => openUploadDialog()}
                >
                  Загрузить
                </Button>
              )
            }
          />
        }
      />
    </div>
  );
}
