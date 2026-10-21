import clsx from 'clsx';
import { useEffect } from 'react';
import { Outlet, useMatches } from 'react-router';
import { login, useSession } from '@entities/session';
import { UploadDialog } from '@features/upload-assets';
import { AppHeader, AppSidebar } from '@widgets/app-shell';
import { SplashScreen } from './SplashScreen';
import styles from './AppLayout.module.scss';

export interface RouteHandle {
  /** Во всю ширину, без навигации и полей: просмотр материала и редактор */
  bleed?: boolean;
}

/** Каркас закрытой части: шапка, навигация, загрузка материалов. */
export function AppLayout() {
  const status = useSession((state) => state.status);
  const bleed = useMatches().some(
    (match) => (match.handle as RouteHandle | undefined)?.bleed,
  );

  // Сюда можно попасть гостем только с публичного портала — отправляем на вход
  useEffect(() => {
    if (status === 'anonymous') login();
  }, [status]);

  if (status !== 'authenticated') return <SplashScreen />;

  return (
    <div className={styles.shell}>
      <AppHeader />
      <div className={styles.body}>
        {!bleed && <AppSidebar />}
        <main className={clsx(styles.main, bleed && styles.bleed)}>
          <Outlet />
        </main>
      </div>
      <UploadDialog />
    </div>
  );
}
