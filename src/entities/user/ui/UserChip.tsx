import type { Schemas } from '@shared/api';
import { Avatar } from '@shared/ui/avatar';
import styles from './UserChip.module.scss';

type User = Schemas['UserResponse'];

export function UserChip({ user, caption }: { user: User; caption?: string }) {
  return (
    <span className={styles.chip}>
      <Avatar name={user.displayName} seed={user.id} size={30} />
      <span className={styles.text}>
        <span className={styles.name}>{user.displayName}</span>
        <span className={styles.caption}>{caption ?? user.email}</span>
      </span>
    </span>
  );
}
