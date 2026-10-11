import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './Badge.module.scss';

export type Tone =
  'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  tone?: Tone;
  icon?: LucideIcon;
  className?: string;
  title?: string;
  children: ReactNode;
}

export function Badge({
  tone = 'neutral',
  icon: Icon,
  className,
  title,
  children,
}: BadgeProps) {
  return (
    <span className={clsx(styles.badge, styles[tone], className)} title={title}>
      {Icon && <Icon size={12} aria-hidden />}
      {children}
    </span>
  );
}
