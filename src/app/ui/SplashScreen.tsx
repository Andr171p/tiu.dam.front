import { Logo } from '@shared/ui/logo';
import { Notice } from '@shared/ui/notice';
import { Spinner } from '@shared/ui/spinner';
import styles from './SplashScreen.module.scss';

/** Пока восстанавливается сессия или грузится чанк страницы. */
export function SplashScreen({ error }: { error?: string | null }) {
  return (
    <div className={styles.splash}>
      <Logo />
      {error ? (
        <Notice
          action={
            <button
              type="button"
              className={styles.retry}
              onClick={() => window.location.reload()}
            >
              Повторить
            </button>
          }
        >
          {error}
        </Notice>
      ) : (
        <Spinner size={24} label="Загрузка" />
      )}
    </div>
  );
}
