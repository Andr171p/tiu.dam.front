import { LogOut } from 'lucide-react';
import { Link } from 'react-router';
import { logout, useCurrentUser } from '@entities/session';
import { SmartSearch } from '@features/smart-search';
import { UploadButton } from '@features/upload-assets';
import { routes } from '@shared/config/routes';
import { initials } from '@shared/lib/format';
import { Logo } from '@shared/ui/logo';
import { Menu, MenuItem } from '@shared/ui/menu';
import { usePopover } from '@shared/ui/popover';
import styles from './AppHeader.module.scss';

function UserMenu() {
  const user = useCurrentUser();
  const { triggerProps, popoverProps } = usePopover();

  return (
    <>
      <button type="button" className={styles.user} {...triggerProps}>
        <span className={styles.userText}>
          <span className={styles.userName}>{user.displayName}</span>
          <span className={styles.userRole}>
            {user.isAdmin ? 'Администратор' : (user.email ?? 'Сотрудник')}
          </span>
        </span>
        <span className={styles.avatar} aria-hidden>
          {initials(user.displayName)}
        </span>
      </button>
      <Menu {...popoverProps} placement="bottom-end">
        <MenuItem icon={LogOut} onSelect={logout}>
          Выйти
        </MenuItem>
      </Menu>
    </>
  );
}

/** Шапка: логотип, умный поиск, загрузка и профиль. */
export function AppHeader() {
  return (
    <header className={styles.header}>
      <Link
        to={routes.library()}
        className={styles.brand}
        aria-label="Медиатека — на главную"
      >
        <Logo />
      </Link>
      <SmartSearch />
      <div className={styles.actions}>
        <UploadButton />
        <UserMenu />
      </div>
    </header>
  );
}
