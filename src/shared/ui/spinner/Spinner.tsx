import clsx from 'clsx';
import styles from './Spinner.module.scss';

export function Spinner({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={clsx(styles.spinner, className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Загрузка"
    />
  );
}
