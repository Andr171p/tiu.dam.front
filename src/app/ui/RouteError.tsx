import { isRouteErrorResponse, useRouteError } from 'react-router';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import styles from './SplashScreen.module.scss';

/** Непредвиденная ошибка экрана; чаще всего — устаревший чанк после обновления. */
export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  if (!notFound) console.error(error);

  return (
    <div className={styles.splash}>
      <EmptyState
        tone="warning"
        title={notFound ? 'Страница не найдена' : 'Что-то пошло не так'}
        description={
          notFound
            ? 'Проверьте адрес.'
            : 'Обновите страницу. Если ошибка повторится, сообщите в поддержку.'
        }
        action={
          <Button variant="primary" onClick={() => window.location.reload()}>
            Обновить
          </Button>
        }
      />
    </div>
  );
}
