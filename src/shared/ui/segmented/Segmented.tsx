import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import styles from './Segmented.module.scss';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  /** Только иконки: подпись варианта уходит в aria-label и подсказку */
  iconOnly?: boolean;
  className?: string;
}

/** Переключатель из нескольких вариантов: фильтры и режимы. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  iconOnly = false,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      className={clsx(styles.segmented, className)}
      role="radiogroup"
      aria-label={label}
    >
      {options.map(({ value: option, label: text, icon: Icon }) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={option === value}
          aria-label={iconOnly ? text : undefined}
          title={iconOnly ? text : undefined}
          className={clsx(styles.option, option === value && styles.active)}
          onClick={() => onChange(option)}
        >
          {Icon && <Icon size={15} aria-hidden />}
          {!iconOnly && text}
        </button>
      ))}
    </div>
  );
}
