import { Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { deletePortal, type Portal } from '@entities/portal';
import { PortalEditor } from '@features/manage-portal';
import { api } from '@shared/api';
import { routes } from '@shared/config/routes';
import { useRequest } from '@shared/lib/hooks';
import { Breadcrumbs } from '@shared/ui/breadcrumbs';
import { Button } from '@shared/ui/button';
import { confirmAction } from '@shared/ui/dialog';
import { EmptyState } from '@shared/ui/empty-state';
import { PageHeader } from '@shared/ui/page-header';
import { Skeleton } from '@shared/ui/skeleton';
import styles from './PortalPage.module.scss';

/** Редактор контент-портала. */
export function PortalPage() {
  const { portalId = '' } = useParams();
  const navigate = useNavigate();
  const portal = useRequest(
    (signal) => api.get<Portal>(`/portals/${portalId}`, { signal }),
    [portalId],
  );

  if (portal.status === 'error')
    return <EmptyState title="Портал не найден" description={portal.error} />;
  if (!portal.data) return <Skeleton height={320} />;

  const current = portal.data;

  const remove = () =>
    confirmAction({
      title: `Удалить портал «${current.title}»?`,
      description:
        'Страница перестанет открываться по ссылке. Материалы останутся в медиатеке.',
      confirmLabel: 'Удалить',
      tone: 'danger',
      onConfirm: async () => {
        await deletePortal(current.id);
        void navigate(routes.portals());
      },
    });

  return (
    <div className={styles.page}>
      <Breadcrumbs
        back={{ to: routes.portals(), label: 'Контент-порталы' }}
        current={current.title}
      />
      <PageHeader
        title={current.title}
        description={
          current.publishedAt
            ? 'Опубликован'
            : 'Черновик — посетители его не видят'
        }
        actions={
          <Button variant="ghost" icon={Trash2} onClick={remove}>
            Удалить
          </Button>
        }
      />
      <PortalEditor key={current.id} portal={current} onSaved={portal.reload} />
    </div>
  );
}
