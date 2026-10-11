import clsx from 'clsx';
import styles from './Avatar.module.scss';

const PALETTE = [
  '#003399',
  '#00a3e0',
  '#198754',
  '#7a3db8',
  '#c2410c',
  '#0f766e',
  '#be185d',
];

function colorOf(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

interface AvatarProps {
  name: string;
  /** Стабильный ключ цвета (id пользователя) */
  seed?: string;
  size?: number;
  className?: string;
}

/** Инициалы на фирменном цвете: фото профиля в DAM не хранятся. */
export function Avatar({ name, seed, size = 28, className }: AvatarProps) {
  return (
    <span
      className={clsx(styles.avatar, className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: colorOf(seed ?? name),
      }}
      title={name}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
