import { Outlet, ScrollRestoration } from 'react-router';
import { AppSidebar } from '@widgets/app-sidebar';
import { UploadQueue } from '@widgets/upload-queue';
import { Toaster } from '@shared/ui/toast';
import styles from './AppLayout.module.scss';

export function AppLayout() {
  return (
    <div className={styles.layout}>
      {/* Цветные пятна под стеклом: стеклу есть что размывать */}
      <div className={styles.backdrop} aria-hidden />
      <AppSidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <UploadQueue />
      <Toaster />
      <ScrollRestoration />
    </div>
  );
}
