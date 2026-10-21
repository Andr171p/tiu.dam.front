import { Folder, Lock } from 'lucide-react';
import { Link } from 'react-router';
import { routes } from '@shared/config/routes';
import { plural } from '@shared/lib/format';
import { useCollectionCover } from '../model/collections-store';
import type { Collection } from '../model/types';
import styles from './CollectionCard.module.scss';

/** Карточка коллекции: обложка слева, название и число материалов. */
export function CollectionCard({ collection }: { collection: Collection }) {
  const cover = useCollectionCover(collection.id);

  return (
    <Link to={routes.collection(collection.id)} className={styles.card}>
      <span className={styles.cover}>
        {cover ? (
          <img src={cover} alt="" loading="lazy" />
        ) : (
          <Folder size={28} strokeWidth={1.5} aria-hidden />
        )}
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{collection.name}</span>
        <span className={styles.meta}>
          {collection.assetCount != null &&
            plural(collection.assetCount, [
              'материал',
              'материала',
              'материалов',
            ])}
          {collection.visibility === 'private' && (
            <Lock size={12} strokeWidth={1.7} aria-label="Только участники" />
          )}
        </span>
      </span>
    </Link>
  );
}
