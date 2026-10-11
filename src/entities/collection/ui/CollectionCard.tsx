import { Globe, ImageIcon, Lock } from 'lucide-react';
import { Link } from 'react-router';
import { routes } from '@shared/config/routes';
import { plural } from '@shared/lib/format';
import { Badge } from '@shared/ui/badge';
import { ROLE_LABELS, type Collection } from '../model/types';
import styles from './CollectionCard.module.scss';

export function CollectionCard({ collection }: { collection: Collection }) {
  const { stats } = collection;
  const isPublic = collection.visibility === 'public';

  return (
    <Link to={routes.collection(collection.id)} className={styles.card}>
      <div className={styles.cover}>
        {stats.coverUrl ? (
          <img
            src={stats.coverUrl}
            alt=""
            loading="lazy"
            className={styles.image}
          />
        ) : (
          <span className={styles.placeholder}>
            <ImageIcon size={28} aria-hidden />
          </span>
        )}
        <Badge
          tone={isPublic ? 'accent' : 'neutral'}
          icon={isPublic ? Globe : Lock}
          className={styles.visibility}
        >
          {isPublic ? 'Публичная' : 'Приватная'}
        </Badge>
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{collection.name}</h3>
        {collection.description && (
          <p className={styles.description}>{collection.description}</p>
        )}
        <div className={styles.meta}>
          <span>
            {plural(stats.assetCount, ['актив', 'актива', 'активов'])}
          </span>
          <span className={styles.dot} />
          <span>{ROLE_LABELS[collection.role] ?? collection.role}</span>
        </div>
      </div>
    </Link>
  );
}
