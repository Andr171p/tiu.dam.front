import { LogIn } from 'lucide-react';
import { useParams } from 'react-router';
import {
  fetchPublicPortal,
  type PortalAccess,
  type PublicPortal,
} from '@entities/portal';
import { login } from '@entities/session';
import { UnlockPortalForm } from '@features/unlock-portal';
import { PortalView } from '@widgets/public-portal';
import { ApiError } from '@shared/api';
import { useRequest } from '@shared/lib/hooks';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { Logo } from '@shared/ui/logo';
import { Spinner } from '@shared/ui/spinner';
import styles from './PublicPortalPage.module.scss';

type Visit =
  | { state: 'open'; portal: PublicPortal }
  | { state: 'locked'; access: PortalAccess };

/** Закрытый портал сервер отдаёт как 401 `portal_locked` с типом доступа в `details`. */
async function visit(slug: string, signal: AbortSignal): Promise<Visit> {
  try {
    return { state: 'open', portal: await fetchPublicPortal(slug, signal) };
  } catch (error) {
    if (error instanceof ApiError && error.code === 'portal_locked') {
      const details = error.details as { access?: PortalAccess } | undefined;
      return { state: 'locked', access: details?.access ?? 'password' };
    }
    throw error;
  }
}

/** Публичная страница портала: открывается без входа, по паролю или для сотрудников. */
export function PublicPortalPage() {
  const { slug = '' } = useParams();
  const result = useRequest((signal) => visit(slug, signal), [slug]);

  if (result.data?.state === 'open')
    return <PortalView slug={slug} portal={result.data.portal} />;

  return (
    <div className={styles.page}>
      <Logo product="portal" title="Медиацентр ТИУ" className={styles.logo} />
      {result.status === 'loading' && (
        <Spinner size={24} label="Загрузка портала" />
      )}
      {result.status === 'error' && (
        <EmptyState
          title={
            result.httpStatus === 404 ? 'Портал не найден' : 'Портал недоступен'
          }
          description={
            result.httpStatus === 404
              ? 'Проверьте адрес: возможно, портал сняли с публикации.'
              : result.error
          }
        />
      )}
      {result.data?.state === 'locked' &&
        (result.data.access === 'password' ? (
          <UnlockPortalForm slug={slug} onUnlocked={result.reload} />
        ) : (
          <EmptyState
            title="Только для сотрудников ТИУ"
            description="Войдите с корпоративной учётной записью, чтобы открыть материалы."
            action={
              <Button variant="primary" icon={LogIn} onClick={login}>
                Войти
              </Button>
            }
          />
        ))}
    </div>
  );
}
