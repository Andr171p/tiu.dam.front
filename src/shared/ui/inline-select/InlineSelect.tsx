import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import styles from './InlineSelect.module.scss';

interface InlineSelectProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}

/** Выбор без рамки: «Сначала новые ⌄», «По сходству ⌄». */
export function InlineSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: InlineSelectProps<T>) {
  return (
    <span className={clsx(styles.wrapper, className)}>
      <select
        aria-label={label}
        value={value}
        className={styles.select}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={1.7}
        className={styles.icon}
        aria-hidden
      />
    </span>
  );
}
