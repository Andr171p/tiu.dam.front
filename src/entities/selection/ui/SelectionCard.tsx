import { Layers, Users } from 'lucide-react';
import { Link } from 'react-router';
import { routes } from '@shared/config/routes';
import { formatDateTime, plural } from '@shared/lib/format';
import type { Selection } from '../model/types';
import styles from './SelectionCard.module.scss';

export function SelectionCard({ selection }: { selection: Selection }) {
  return (
    <Link to={routes.selection(selection.id)} className={styles.card}>
      <span className={styles.icon}>
        <Layers size={24} strokeWidth={1.5} aria-hidden />
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{selection.name}</span>
        {selection.description && (
          <span className={styles.description}>{selection.description}</span>
        )}
        <span className={styles.meta}>
          {plural(selection.assetCount, [
            'материал',
            'материала',
            'материалов',
          ])}
          {' · '}
          {formatDateTime(selection.updatedAt)}
          {selection.shared && (
            <span className={styles.shared}>
              <Users size={12} strokeWidth={1.7} aria-hidden />
              Общая
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}
