import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styles from './Breadcrumbs.module.scss';

interface BreadcrumbsProps {
  /** Куда ведёт стрелка «назад» */
  back: { to: string; label: string };
  current?: ReactNode;
}

/** «← Медиатека / Будущие инженеры ТИУ» */
export function Breadcrumbs({ back, current }: BreadcrumbsProps) {
  return (
    <nav className={styles.crumbs} aria-label="Навигация">
      <Link to={back.to} className={styles.back}>
        <ArrowLeft size={20} strokeWidth={1.7} aria-hidden />
        {back.label}
      </Link>
      {current && (
        <>
          <span className={styles.separator} aria-hidden>
            /
          </span>
          <span className={styles.current} aria-current="page">
            {current}
          </span>
        </>
      )}
    </nav>
  );
}
