import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { Spinner } from '../spinner';
import styles from './Button.module.scss';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
type Size = 'md' | 'sm';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
  block?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  loading = false,
  block = false,
  disabled,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        block && styles.block,
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size={14} /> : Icon && <Icon size={16} aria-hidden />}
      {children}
    </button>
  );
}

interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  icon: LucideIcon;
  /** Подпись для скринридеров и всплывающей подсказки */
  label: string;
  variant?: Variant;
  size?: Size;
  /** Сторона подсказки: снизу — для кнопок у верхнего края окна */
  tooltipBelow?: boolean;
}

export function IconButton({
  icon: Icon,
  label,
  variant = 'ghost',
  size = 'sm',
  tooltipBelow = false,
  type = 'button',
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        styles.button,
        styles.icon,
        styles[variant],
        styles[size],
        className,
      )}
      aria-label={label}
      data-tooltip={label}
      data-tooltip-below={tooltipBelow || undefined}
      {...props}
    >
      <Icon size={size === 'sm' ? 16 : 18} aria-hidden />
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
}

/** Ссылка, оформленная кнопкой: для навигации вместо кнопки внутри ссылки. */
export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        styles.link,
        className,
      )}
      {...props}
    >
      {Icon && <Icon size={16} aria-hidden />}
      {children}
    </Link>
  );
}
