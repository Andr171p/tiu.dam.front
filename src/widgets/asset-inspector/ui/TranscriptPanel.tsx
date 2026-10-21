import clsx from 'clsx';
import {
  seekTo,
  usePlayback,
  useTranscript,
  type Asset,
} from '@entities/asset';
import { formatTimecode } from '@shared/lib/format';
import { EmptyState } from '@shared/ui/empty-state';
import { Notice } from '@shared/ui/notice';
import { Skeleton } from '@shared/ui/skeleton';
import styles from './AssetInspector.module.scss';

/** «Текст»: расшифровка речи, клик по фразе — переход к моменту. */
export function TranscriptPanel({ asset }: { asset: Asset }) {
  const { status, transcript, error } = useTranscript(
    asset.id,
    asset.version.id,
  );
  const time = usePlayback((state) => state.time);

  if (status === 'error') return <Notice>{error}</Notice>;
  if (status === 'loading') return <Skeleton height={160} />;
  if (!transcript?.segments.length)
    return (
      <EmptyState
        title={
          asset.version.status === 'processing'
            ? 'Расшифровываем речь…'
            : 'Речи нет'
        }
        description="Расшифровка появляется автоматически после обработки видео и аудио."
      />
    );

  return (
    <ol className={styles.transcript}>
      {transcript.segments.map((segment) => (
        <li key={segment.start}>
          <button
            type="button"
            className={clsx(
              styles.phrase,
              time >= segment.start &&
                time < segment.end &&
                styles.phraseActive,
            )}
            onClick={() => seekTo(segment.start)}
          >
            <span className={styles.phraseTime}>
              {formatTimecode(segment.start)}
            </span>
            <span>{segment.text}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
