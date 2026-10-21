import clsx from 'clsx';
import { Search } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import styles from './SearchField.module.scss';

interface SearchFieldProps extends Omit<ComponentProps<'input'>, 'type'> {
  /** Действие справа внутри поля: поиск по изображению */
  trailing?: ReactNode;
  /** muted — серое поле в шапке, outlined — белое с рамкой на странице */
  appearance?: 'muted' | 'outlined';
}

export function SearchField({
  trailing,
  appearance = 'outlined',
  className,
  ...props
}: SearchFieldProps) {
  return (
    <div className={clsx(styles.field, styles[appearance], className)}>
      <Search size={20} strokeWidth={1.7} className={styles.icon} aria-hidden />
      <input type="search" className={styles.input} {...props} />
      {trailing}
    </div>
  );
}
