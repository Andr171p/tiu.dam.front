import clsx from 'clsx';
import { FolderOpen, LogOut, Search, Tags } from 'lucide-react';
import { NavLink } from 'react-router';
import { useCollections } from '@entities/collection';
import { logout, useCurrentUser } from '@entities/session';
import { ThemeSwitcher } from '@features/toggle-theme';
import { routes } from '@shared/config/routes';
import { Avatar } from '@shared/ui/avatar';
import { IconButton } from '@shared/ui/button';
import { Logo } from '@shared/ui/logo';
import { Skeleton } from '@shared/ui/skeleton';
import styles from './AppSidebar.module.scss';

const navClass = ({ isActive }: { isActive: boolean }) =>
  clsx(styles.link, isActive && styles.active);

const MY_COLLECTIONS_LIMIT = 8;

function MyCollections() {
  const { data, isPending } = useCollections('mine');

  return (
    <nav className={styles.section} aria-label="Мои коллекции">
      <h2 className={styles.sectionTitle}>Мои коллекции</h2>
      {isPending &&
        [0, 1, 2].map((index) => (
          <Skeleton key={index} height={28} className={styles.skeleton} />
        ))}
      {data?.items.slice(0, MY_COLLECTIONS_LIMIT).map((collection) => (
        <NavLink
          key={collection.id}
          to={routes.collection(collection.id)}
          className={navClass}
        >
          <span className={styles.swatch}>
            {collection.name.slice(0, 1).toUpperCase()}
          </span>
          <span className={styles.label}>{collection.name}</span>
        </NavLink>
      ))}
      {data?.items.length === 0 && (
        <p className={styles.empty}>Создайте первую коллекцию</p>
      )}
    </nav>
  );
}

export function AppSidebar() {
  const user = useCurrentUser();

  return (
    <aside className={styles.sidebar}>
      <NavLink
        to={routes.home()}
        className={styles.brand}
        aria-label="На главную"
      >
        <Logo />
      </NavLink>

      <nav className={styles.section} aria-label="Разделы">
        <NavLink to={routes.home()} end className={navClass}>
          <FolderOpen size={17} aria-hidden />
          Коллекции
        </NavLink>
        <NavLink to={routes.search()} className={navClass}>
          <Search size={17} aria-hidden />
          Поиск
        </NavLink>
        {user.isAdmin && (
          <NavLink to={routes.adminTags()} className={navClass}>
            <Tags size={17} aria-hidden />
            Словарь тегов
          </NavLink>
        )}
      </nav>

      <MyCollections />

      <footer className={styles.footer}>
        <ThemeSwitcher />
        <div className={styles.profile}>
          <Avatar name={user.displayName} seed={user.id} size={32} />
          <div className={styles.profileText}>
            <span className={styles.profileName}>{user.displayName}</span>
            <span className={styles.profileRole}>
              {user.isAdmin ? 'Администратор' : user.email}
            </span>
          </div>
          <IconButton icon={LogOut} label="Выйти" onClick={logout} />
        </div>
      </footer>
    </aside>
  );
}
