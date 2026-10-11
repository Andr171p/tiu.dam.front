import clsx from 'clsx';
import { useId, type CSSProperties } from 'react';
import styles from './Slider.module.scss';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Подпись значения: «45%», «+12» */
  format?: (value: number) => string;
  className?: string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = String,
  className,
}: SliderProps) {
  const id = useId();
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <div className={clsx(styles.slider, className)}>
      <div className={styles.header}>
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className={styles.value}>
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className={styles.input}
        style={{ '--progress': `${progress}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
