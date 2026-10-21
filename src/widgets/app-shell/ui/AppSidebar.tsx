import clsx from 'clsx';
import {
  Clock,
  Folder,
  Globe,
  LayoutGrid,
  Lock,
  Star,
  Trash2,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { useEffect } from 'react';
import { NavLink } from 'react-router';
import { loadCollections, useCollections } from '@entities/collection';
import { routes } from '@shared/config/routes';
import { Skeleton } from '@shared/ui/skeleton';
import styles from './AppSidebar.module.scss';

interface NavEntry {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const MAIN: NavEntry[] = [
  { to: routes.library(), label: 'Медиатека', icon: LayoutGrid, end: true },
  { to: routes.collections(), label: 'Коллекции', icon: Folder, end: true },
  { to: routes.portals(), label: 'Контент-порталы', icon: Globe },
  { to: routes.selections(), label: 'Подборки', icon: Star },
  { to: routes.recent(), label: 'Недавние', icon: Clock },
];

const WORKSPACE: NavEntry[] = [
  { to: routes.people(), label: 'Люди', icon: UsersRound },
  { to: routes.trash(), label: 'Корзина', icon: Trash2 },
];

/** Сколько коллекций показывать в навигации; остальные — на странице «Коллекции» */
const COLLECTIONS_LIMIT = 8;

const navClass = ({ isActive }: { isActive: boolean }) =>
  clsx(styles.item, isActive && styles.active);

function NavList({
  entries,
  compact = false,
}: {
  entries: NavEntry[];
  compact?: boolean;
}) {
  return (
    <ul className={styles.list}>
      {entries.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            className={(state) =>
              clsx(navClass(state), compact && styles.compact)
            }
          >
            <Icon size={20} strokeWidth={1.6} aria-hidden />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function CollectionsNav() {
  const status = useCollections((state) => state.status);
  const collections = useCollections((state) => state.items);

  useEffect(() => {
    void loadCollections();
  }, []);

  if (status === 'loading' && collections.length === 0)
    return <Skeleton height={120} className={styles.skeleton} />;
  if (collections.length === 0) return null;

  return (
    <>
      <hr className={styles.divider} />
      <h2 className={styles.label}>Коллекции</h2>
      <ul className={styles.list}>
        {collections.slice(0, COLLECTIONS_LIMIT).map((collection) => (
          <li key={collection.id}>
            <NavLink
              to={routes.collection(collection.id)}
              className={({ isActive }) =>
                clsx(styles.collection, isActive && styles.activeText)
              }
            >
              <span className={styles.collectionName}>{collection.name}</span>
              {collection.visibility === 'private' && (
                <Lock
                  size={12}
                  strokeWidth={1.7}
                  aria-label="Только участники"
                />
              )}
            </NavLink>
          </li>
        ))}
        {collections.length > COLLECTIONS_LIMIT && (
          <li>
            <NavLink to={routes.collections()} className={styles.more}>
              Все коллекции · {collections.length}
            </NavLink>
          </li>
        )}
      </ul>
    </>
  );
}

/** Навигация: разделы медиатеки, коллекции и рабочее пространство. */
export function AppSidebar() {
  return (
    <nav className={styles.sidebar} aria-label="Разделы">
      <NavList entries={MAIN} />
      <CollectionsNav />
      <hr className={styles.divider} />
      <h2 className={styles.label}>Рабочее пространство</h2>
      <NavList entries={WORKSPACE} compact />
    </nav>
  );
}
