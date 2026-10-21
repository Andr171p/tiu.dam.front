import clsx from 'clsx';
import type { MouseEvent } from 'react';
import {
  seekTo,
  usePlayback,
  useTranscript,
  type Asset,
} from '@entities/asset';
import type { Face } from '@entities/person';
import { formatTimecode } from '@shared/lib/format';
import { SectionHeader } from '@shared/ui/page-header';
import { mergeTimecodes, rulerTicks } from '../lib/ranges';
import styles from './VideoTimeline.module.scss';

interface VideoTimelineProps {
  asset: Asset;
  faces: Face[];
}

const percent = (value: number, duration: number) =>
  `${(value / duration) * 100}%`;

/** «Сцены и участники»: речь и появления людей на шкале времени, клик — переход к моменту. */
export function VideoTimeline({ asset, faces }: VideoTimelineProps) {
  const time = usePlayback((state) => state.time);
  const duration =
    usePlayback((state) => state.duration) || asset.version.meta?.duration || 0;
  const { transcript } = useTranscript(asset.id, asset.version.id);
  const segments = transcript?.segments ?? [];
  const participants = faces.filter((face) => face.timecodes.length > 0);

  if (duration <= 0) return null;

  const seekByClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    seekTo(((event.clientX - rect.left) / rect.width) * duration);
  };

  return (
    <section className={styles.timeline}>
      <SectionHeader title="Сцены и участники" level="group" />

      <div className={styles.grid}>
        <span />
        <div className={styles.ruler} aria-hidden>
          {rulerTicks(duration).map((tick) => (
            <span key={tick} style={{ left: percent(tick, duration) }}>
              {formatTimecode(tick)}
            </span>
          ))}
        </div>

        <span className={styles.laneLabel}>Речь</span>
        <div className={styles.lane} onClick={seekByClick}>
          {segments.length === 0 && (
            <span className={styles.laneEmpty}>Речь не распознана</span>
          )}
          {segments.map((segment) => (
            <button
              key={segment.start}
              type="button"
              title={segment.text}
              className={clsx(
                styles.segment,
                time >= segment.start &&
                  time < segment.end &&
                  styles.segmentActive,
              )}
              style={{
                left: percent(segment.start, duration),
                width: percent(segment.end - segment.start, duration),
              }}
              onClick={(event) => {
                event.stopPropagation();
                seekTo(segment.start);
              }}
            >
              {segment.text}
            </button>
          ))}
          <span
            className={styles.cursor}
            style={{ left: percent(time, duration) }}
          />
        </div>

        {participants.map((face, index) => (
          <div key={face.id} className={styles.row}>
            <span className={styles.laneLabel}>
              {face.personName ??
                `Участник ${String(index + 1).padStart(2, '0')}`}
            </span>
            <div
              className={clsx(styles.lane, styles.thin)}
              onClick={seekByClick}
            >
              {mergeTimecodes(face.timecodes, duration).map((range) => (
                <span
                  key={range.start}
                  className={styles.appearance}
                  style={{
                    left: percent(range.start, duration),
                    width: percent(range.end - range.start, duration),
                  }}
                />
              ))}
              <span
                className={styles.cursor}
                style={{ left: percent(time, duration) }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
