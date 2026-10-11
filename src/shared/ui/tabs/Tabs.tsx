import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import styles from './Tabs.module.scss';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  /** Число или индикатор рядом с подписью */
  badge?: string | number;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Вкладки с подчёркиванием: переключают разделы одного экрана. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: TabsProps<T>) {
  return (
    <div className={clsx(styles.tabs, className)} role="tablist">
      {items.map(({ value: item, label, icon: Icon, badge }) => (
        <button
          key={item}
          type="button"
          role="tab"
          aria-selected={item === value}
          className={clsx(styles.tab, item === value && styles.active)}
          onClick={() => onChange(item)}
        >
          {Icon && <Icon size={15} aria-hidden />}
          {label}
          {badge !== undefined && <span className={styles.badge}>{badge}</span>}
        </button>
      ))}
    </div>
  );
}
