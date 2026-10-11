import clsx from 'clsx';
import { UploadCloud } from 'lucide-react';
import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Button } from '@shared/ui/button';
import { enqueueUploads } from '../model/upload-store';
import styles from './UploadDropzone.module.scss';

interface UploadDropzoneProps {
  collectionId: string;
  /** Разрешено ли загружать: без права зона только показывает содержимое */
  enabled: boolean;
  children: ReactNode;
}

const hasFiles = (event: DragEvent) =>
  event.dataTransfer.types.includes('Files');

/** Перетаскивание файлов на всю область коллекции. */
export function UploadDropzone({
  collectionId,
  enabled,
  children,
}: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  if (!enabled) return <>{children}</>;

  return (
    <div
      className={styles.zone}
      onDragEnter={(event) => {
        if (!hasFiles(event)) return;
        depth.current += 1;
        setDragging(true);
      }}
      onDragLeave={() => {
        depth.current -= 1;
        if (depth.current === 0) setDragging(false);
      }}
      onDragOver={(event) => {
        if (hasFiles(event)) event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        depth.current = 0;
        setDragging(false);
        if (event.dataTransfer.files.length)
          enqueueUploads(collectionId, event.dataTransfer.files);
      }}
    >
      {children}
      <div
        className={clsx(styles.overlay, dragging && styles.visible)}
        aria-hidden
      >
        <div className={styles.target}>
          <UploadCloud size={36} />
          <span>Отпустите, чтобы загрузить в коллекцию</span>
        </div>
      </div>
    </div>
  );
}

/** Кнопка выбора файлов. */
export function UploadButton({ collectionId }: { collectionId: string }) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <>
      <Button
        variant="primary"
        icon={UploadCloud}
        onClick={() => input.current?.click()}
      >
        Загрузить
      </Button>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files?.length)
            enqueueUploads(collectionId, event.target.files);
          event.target.value = '';
        }}
      />
    </>
  );
}
