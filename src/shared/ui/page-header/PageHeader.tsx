import type { ReactNode } from 'react';
import styles from './PageHeader.module.scss';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

/** Заголовок экрана 30 px с пояснением и действиями справа. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}

interface SectionHeaderProps {
  title: ReactNode;
  count?: ReactNode;
  actions?: ReactNode;
  level?: 'section' | 'group';
}

/** Заголовок раздела: «Все материалы 12 486», «Подборки для ваших задач». */
export function SectionHeader({
  title,
  count,
  actions,
  level = 'section',
}: SectionHeaderProps) {
  return (
    <div className={styles.section}>
      <h2
        className={
          level === 'section' ? styles.sectionTitle : styles.groupTitle
        }
      >
        {title}
        {count !== undefined && <span className={styles.count}>{count}</span>}
      </h2>
      {actions}
    </div>
  );
}
