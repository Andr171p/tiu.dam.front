import { RotateCw } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Logo } from '@shared/ui/logo';
import { Spinner } from '@shared/ui/spinner';
import styles from './SplashScreen.module.scss';

export function SplashScreen({ error }: { error?: string }) {
  return (
    <div className={styles.splash}>
      <div className={styles.glow} aria-hidden />
      <Logo size="lg" />
      {error ? (
        <div className={styles.error}>
          <p>{error}</p>
          <Button
            variant="primary"
            icon={RotateCw}
            onClick={() => window.location.reload()}
          >
            Повторить
          </Button>
        </div>
      ) : (
        <Spinner size={22} className={styles.spinner} />
      )}
    </div>
  );
}
