import clsx from 'clsx';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './Tag.module.scss';

export type TagTone =
  'accent' | 'ai' | 'success' | 'warning' | 'danger' | 'neutral' | 'surface';

interface TagProps {
  /** Синий — выбранное, фиолетовый — AI, белый — поверх медиа */
  tone?: TagTone;
  icon?: ReactNode;
  /** Снятие фильтра: «Фото ×» */
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
  children: ReactNode;
}

/** Метка 28 px: статус, AI-тег, активный фильтр, длительность видео. */
export function Tag({
  tone = 'neutral',
  icon,
  onRemove,
  removeLabel = 'Убрать',
  className,
  children,
}: TagProps) {
  return (
    <span className={clsx(styles.tag, styles[tone], className)}>
      {icon}
      {children}
      {onRemove && (
        <button
          type="button"
          className={styles.remove}
          aria-label={removeLabel}
          onClick={onRemove}
        >
          <X size={12} strokeWidth={2} aria-hidden />
        </button>
      )}
    </span>
  );
}
