import clsx from 'clsx';
import styles from './Logo.module.scss';

/** Знак и название продукта. */
export function Logo({
  size = 'md',
  className,
}: {
  size?: 'md' | 'lg';
  className?: string;
}) {
  return (
    <span className={clsx(styles.logo, styles[size], className)}>
      <svg viewBox="0 0 32 32" className={styles.mark} aria-hidden>
        <defs>
          <linearGradient id="tiu-logo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#003399" />
            <stop offset="1" stopColor="#00A3E0" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#tiu-logo)" />
        <rect
          x="7"
          y="7"
          width="11"
          height="11"
          rx="3"
          fill="#fff"
          opacity="0.95"
        />
        <rect
          x="14"
          y="14"
          width="11"
          height="11"
          rx="3"
          fill="#fff"
          opacity="0.55"
        />
      </svg>
      <span className={styles.text}>
        <span className={styles.name}>Медиатека</span>
        <span className={styles.caption}>ТИУ</span>
      </span>
    </span>
  );
}
