import { Globe, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ACCESS_LABELS, loadPortals, usePortals } from '@entities/portal';
import { CreatePortalDialog } from '@features/manage-portal';
import { routes } from '@shared/config/routes';
import { formatDateTime } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { Notice } from '@shared/ui/notice';
import { PageHeader } from '@shared/ui/page-header';
import { Skeleton } from '@shared/ui/skeleton';
import { Tag } from '@shared/ui/tag';
import styles from './PortalsPage.module.scss';

/** Контент-порталы пользователя: пресс-киты и витрины материалов. */
export function PortalsPage() {
  const { status, items, error } = usePortals();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void loadPortals();
  }, []);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Контент-порталы"
        description="Опубликованные подборки для СМИ, партнёров и команд университета"
        actions={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            Создать портал
          </Button>
        }
      />
      {status === 'error' && <Notice>{error}</Notice>}
      {status === 'loading' && items.length === 0 && <Skeleton height={96} />}
      {status === 'ready' && items.length === 0 && (
        <EmptyState
          title="Порталов пока нет"
          description="Портал собирает галереи из коллекций и подборок — они всегда актуальны."
        />
      )}
      <div className={styles.grid}>
        {items.map((portal) => (
          <Link
            key={portal.id}
            to={routes.portal(portal.id)}
            className={styles.card}
          >
            <span
              className={styles.icon}
              style={{ color: portal.theme.accentColor }}
            >
              <Globe size={24} strokeWidth={1.5} aria-hidden />
            </span>
            <span className={styles.body}>
              <span className={styles.name}>{portal.title}</span>
              <span className={styles.meta}>
                {routes.publicPortal(portal.slug)} · изменён{' '}
                {formatDateTime(portal.updatedAt)}
              </span>
              <span className={styles.tags}>
                <Tag tone={portal.publishedAt ? 'success' : 'neutral'}>
                  {portal.publishedAt ? 'Опубликован' : 'Черновик'}
                </Tag>
                <Tag tone="neutral">{ACCESS_LABELS[portal.access]}</Tag>
              </span>
            </span>
          </Link>
        ))}
      </div>
      {creating && (
        <CreatePortalDialog open onClose={() => setCreating(false)} />
      )}
    </div>
  );
}
