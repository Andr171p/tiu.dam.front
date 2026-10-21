import clsx from 'clsx';
import { useId, type ReactNode } from 'react';
import { SOON_LABEL } from '../button';
import { Tooltip } from '../tooltip';
import styles from './Tabs.module.scss';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  /** Раздел ещё не поддерживается API: вкладка видна, но неактивна */
  soon?: boolean;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

/** Подчёркнутые вкладки панели: «Информация · Версии», «Сцены · Участники · Текст». */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: TabsProps<T>) {
  const id = useId();

  return (
    <div
      role="tablist"
      aria-label={label}
      className={clsx(styles.tabs, className)}
    >
      {items.map((item) => {
        const tab = (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`${id}-${item.value}`}
            aria-selected={item.value === value}
            disabled={item.soon}
            className={styles.tab}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        );
        return item.soon ? (
          <Tooltip key={item.value} label={SOON_LABEL}>
            {tab}
          </Tooltip>
        ) : (
          tab
        );
      })}
    </div>
  );
}

export function TabPanel({ children }: { children: ReactNode }) {
  return (
    <div role="tabpanel" className={styles.panel}>
      {children}
    </div>
  );
}
