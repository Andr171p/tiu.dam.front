import clsx from 'clsx';
import { Search, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import styles from './SearchInput.module.scss';

interface SearchInputProps extends Omit<
  ComponentProps<'input'>,
  'onChange' | 'value' | 'size'
> {
  value: string;
  onChange: (value: string) => void;
  size?: 'md' | 'lg';
}

export function SearchInput({
  value,
  onChange,
  size = 'md',
  className,
  ...props
}: SearchInputProps) {
  return (
    <label className={clsx(styles.search, styles[size], className)}>
      <Search
        size={size === 'lg' ? 20 : 16}
        className={styles.icon}
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={styles.input}
        {...props}
      />
      {value && (
        <button
          type="button"
          className={styles.clear}
          aria-label="Очистить"
          onClick={() => onChange('')}
        >
          <X size={14} />
        </button>
      )}
    </label>
  );
}
