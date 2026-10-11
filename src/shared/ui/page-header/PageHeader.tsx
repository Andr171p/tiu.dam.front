import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styles from './PageHeader.module.scss';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Ссылка «назад»: родительский раздел */
  back?: { to: string; label: string };
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({
  title,
  description,
  back,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {back && (
        <Link to={back.to} className={styles.back}>
          <ArrowLeft size={14} aria-hidden />
          {back.label}
        </Link>
      )}
      <div className={styles.row}>
        <div className={styles.text}>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {children}
    </header>
  );
}
