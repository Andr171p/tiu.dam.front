import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { Spinner } from '../spinner';
import { Tooltip } from '../tooltip';
import styles from './Button.module.scss';

export const SOON_LABEL = 'Скоро';

type Variant = 'primary' | 'secondary' | 'ghost' | 'link' | 'danger';
type Size = 'md' | 'sm';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
  /** Выбранный вариант в группе кнопок */
  selected?: boolean;
  /** Функция ещё не поддерживается API: кнопка неактивна и объясняет это подсказкой */
  soon?: boolean;
  block?: boolean;
}

const iconSize = (size: Size) => (size === 'md' ? 18 : 16);

export function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  loading = false,
  selected = false,
  soon = false,
  block = false,
  disabled,
  type = 'button',
  className,
  children,
  onClick,
  ...props
}: ButtonProps) {
  const button = (
    <button
      type={type}
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        selected && styles.selected,
        block && styles.block,
        className,
      )}
      disabled={disabled || loading}
      aria-pressed={selected || undefined}
      aria-disabled={soon || undefined}
      aria-busy={loading || undefined}
      onClick={soon ? undefined : onClick}
      {...props}
    >
      {loading ? (
        <Spinner size={iconSize(size)} />
      ) : (
        Icon && <Icon size={iconSize(size)} strokeWidth={1.7} aria-hidden />
      )}
      {children}
    </button>
  );

  return soon ? <Tooltip label={SOON_LABEL}>{button}</Tooltip> : button;
}

interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  icon: LucideIcon;
  /** Подпись для скринридеров и подсказки */
  label: string;
  variant?: Variant;
  size?: Size;
  selected?: boolean;
  soon?: boolean;
  tooltip?: boolean;
  tooltipPlacement?: 'top' | 'right-start';
}

export function IconButton({
  icon: Icon,
  label,
  variant = 'ghost',
  size = 'sm',
  selected = false,
  soon = false,
  tooltip = true,
  tooltipPlacement,
  type = 'button',
  className,
  onClick,
  ...props
}: IconButtonProps) {
  const fullLabel = soon ? `${label} · ${SOON_LABEL.toLowerCase()}` : label;

  const button = (
    <button
      type={type}
      className={clsx(
        styles.button,
        styles.icon,
        styles[variant],
        styles[size],
        selected && styles.selected,
        className,
      )}
      aria-label={fullLabel}
      aria-pressed={selected || undefined}
      aria-disabled={soon || undefined}
      onClick={soon ? undefined : onClick}
      {...props}
    >
      <Icon size={size === 'sm' ? 18 : 20} strokeWidth={1.7} aria-hidden />
    </button>
  );

  return tooltip ? (
    <Tooltip label={fullLabel} placement={tooltipPlacement}>
      {button}
    </Tooltip>
  ) : (
    button
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
}

/** Ссылка, оформленная кнопкой: для навигации вместо вложения кнопки в ссылку. */
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
      className={clsx(styles.button, styles[variant], styles[size], className)}
      {...props}
    >
      {Icon && <Icon size={iconSize(size)} strokeWidth={1.7} aria-hidden />}
      {children}
    </Link>
  );
}
