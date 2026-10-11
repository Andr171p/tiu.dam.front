import clsx from 'clsx';
import { CircleAlert, Info, TriangleAlert } from 'lucide-react';
import type { Issue } from '../model/types';
import styles from './IssueList.module.scss';

const ICONS = { error: CircleAlert, warning: TriangleAlert, info: Info };

/** Замечания проверки лицензии и метаданных: сначала ошибки. */
export function IssueList({ issues }: { issues: Issue[] }) {
  const order = { error: 0, warning: 1, info: 2 };
  const sorted = [...issues].sort(
    (a, b) => order[a.severity] - order[b.severity],
  );

  return (
    <ul className={styles.list}>
      {sorted.map((issue) => {
        const Icon = ICONS[issue.severity];
        return (
          <li
            key={issue.code}
            className={clsx(styles.item, styles[issue.severity])}
          >
            <Icon size={16} className={styles.icon} aria-hidden />
            <span>{issue.message}</span>
          </li>
        );
      })}
    </ul>
  );
}
