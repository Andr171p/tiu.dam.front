import clsx from 'clsx';
import styles from './Progress.module.scss';

interface ProgressProps {
  /** 0..1 */
  value: number;
  label: string;
  tone?: 'accent' | 'video' | 'neutral';
  className?: string;
}

/** Тонкая шкала 3–4 px: загрузка, создание прокси, занятое место. */
export function Progress({
  value,
  label,
  tone = 'accent',
  className,
}: ProgressProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={clsx(styles.track, className)}
    >
      <div
        className={clsx(styles.bar, styles[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
