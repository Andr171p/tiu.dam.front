import { Link } from 'react-router';
import { routes } from '@shared/config/routes';
import { initials } from '@shared/lib/format';
import type { Person } from '../model/types';
import styles from './PersonCard.module.scss';

/** Человек из справочника: обложка (лучший кадр лица) и описание. */
export function PersonCard({ person }: { person: Person }) {
  return (
    <Link to={routes.person(person.id)} className={styles.card}>
      <span className={styles.cover}>
        {person.coverUrl ? (
          <img src={person.coverUrl} alt="" loading="lazy" />
        ) : (
          <span className={styles.initials}>{initials(person.name)}</span>
        )}
      </span>
      <span className={styles.name}>{person.name}</span>
      {person.description && (
        <span className={styles.description}>{person.description}</span>
      )}
    </Link>
  );
}

/** Миниатюра лица 36 px: в списке участников, в выборе человека. */
export function FaceAvatar({
  src,
  name,
}: {
  src?: string | null;
  name?: string | null;
}) {
  return (
    <span className={styles.face}>
      {src ? <img src={src} alt="" /> : initials(name ?? '?')}
    </span>
  );
}
