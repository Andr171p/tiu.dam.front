import clsx from 'clsx';
import { Upload } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import styles from './DropZone.module.scss';

interface DropZoneProps {
  title: ReactNode;
  hint?: ReactNode;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  className?: string;
}

/** Пунктирная зона «Перетащите файлы или выберите на компьютере». */
export function DropZone({
  title,
  hint,
  accept,
  multiple = false,
  disabled = false,
  onFiles,
  className,
}: DropZoneProps) {
  const [dragging, setDragging] = useState(false);

  const take = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <label
      className={clsx(
        styles.zone,
        dragging && styles.dragging,
        disabled && styles.disabled,
        className,
      )}
      onDragOver={(event) => {
        if (disabled) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) take(event.dataTransfer.files);
      }}
    >
      <Upload size={25} strokeWidth={1.7} className={styles.icon} aria-hidden />
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className={styles.input}
        onChange={(event) => {
          take(event.target.files);
          // Повторный выбор того же файла тоже должен сработать
          event.target.value = '';
        }}
      />
    </label>
  );
}
