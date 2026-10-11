import clsx from 'clsx';
import type { CSSProperties } from 'react';
import styles from './Skeleton.module.scss';

interface SkeletonProps {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  radius?: CSSProperties['borderRadius'];
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius,
  className,
}: SkeletonProps) {
  return (
    <span
      className={clsx(styles.skeleton, className)}
      style={{ width, height, borderRadius: radius }}
      aria-hidden
    />
  );
}
