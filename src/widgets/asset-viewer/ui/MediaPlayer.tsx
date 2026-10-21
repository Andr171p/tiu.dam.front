import { Maximize, Music, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  completeSeek,
  reportPlayback,
  resetPlayback,
  usePlayback,
  type Asset,
} from '@entities/asset';
import { isTime, useAssetComments } from '@entities/comment';
import type { Face } from '@entities/person';
import { formatTimecode } from '@shared/lib/format';
import styles from './AssetViewer.module.scss';

const SPEEDS = [1, 1.5, 2, 0.5];
/** Лицо подсвечивается, если появление ближе этого к текущему моменту, секунды */
const FACE_WINDOW = 2;

interface MediaPlayerProps {
  asset: Asset;
  faces: Face[];
  /** Начать с момента: ссылка из поиска `?t=84` */
  startAt?: number;
}

/** Плеер прокси 720p (или AAC для аудио) с перемоткой, скоростью и отметками обсуждения. */
export function MediaPlayer({ asset, faces, startAt }: MediaPlayerProps) {
  const isVideo = asset.kind === 'video';
  const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const time = usePlayback((state) => state.time);
  const seekRequest = usePlayback((state) => state.seekRequest);
  const comments = useAssetComments(asset.id);
  const { urls, meta } = asset.version;
  const duration =
    usePlayback((state) => state.duration) || meta?.duration || 0;
  const src = isVideo ? (urls.video ?? undefined) : (urls.audio ?? undefined);
  const ratio = meta?.width && meta.height ? meta.width / meta.height : 16 / 9;

  useEffect(() => {
    if (startAt !== undefined && mediaRef.current)
      mediaRef.current.currentTime = startAt;
    return resetPlayback;
  }, [asset.id, startAt]);

  // Запрос перехода от таймлайна, расшифровки или обсуждения
  useEffect(() => {
    const media = mediaRef.current;
    if (seekRequest === null || !media) return;
    media.currentTime = seekRequest;
    completeSeek();
  }, [seekRequest]);

  const toggle = () => {
    const media = mediaRef.current;
    if (!media) return;
    if (media.paused) void media.play();
    else media.pause();
  };

  const moments = comments.items.filter(
    (comment) => isTime(comment.anchor) && !comment.resolvedAt,
  );
  const visibleFaces = faces.filter((face) =>
    face.timecodes.some((timecode) => Math.abs(timecode - time) <= FACE_WINDOW),
  );

  return (
    <div ref={shellRef} className={styles.player}>
      <div className={styles.screen}>
        <div
          className={styles.videoFrame}
          style={{ '--ratio': ratio } as CSSProperties}
          onClick={toggle}
        >
          {isVideo ? (
            <video
              ref={mediaRef}
              src={src}
              poster={urls.preview ?? undefined}
              preload="metadata"
              playsInline
              muted={muted}
              className={styles.video}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(event) =>
                reportPlayback(
                  event.currentTarget.currentTime,
                  event.currentTarget.duration || 0,
                )
              }
              onLoadedMetadata={(event) =>
                reportPlayback(
                  event.currentTarget.currentTime,
                  event.currentTarget.duration || 0,
                )
              }
            />
          ) : (
            <>
              <span className={styles.audioArt}>
                <Music size={48} strokeWidth={1.2} aria-hidden />
              </span>
              <audio
                ref={mediaRef}
                src={src}
                preload="metadata"
                muted={muted}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={(event) =>
                  reportPlayback(
                    event.currentTarget.currentTime,
                    event.currentTarget.duration || 0,
                  )
                }
                onLoadedMetadata={(event) =>
                  reportPlayback(
                    event.currentTarget.currentTime,
                    event.currentTarget.duration || 0,
                  )
                }
              />
            </>
          )}

          {visibleFaces.map((face) => (
            <span
              key={face.id}
              className={styles.participant}
              style={{
                left: `${face.box.x * 100}%`,
                top: `${face.box.y * 100}%`,
                width: `${face.box.width * 100}%`,
                height: `${face.box.height * 100}%`,
              }}
            >
              <span className={styles.participantLabel}>
                {face.personName ?? 'Участник'}
              </span>
            </span>
          ))}
        </div>
        {!src && (
          <p className={styles.screenNote}>
            {asset.version.status === 'processing'
              ? 'Прокси-версия ещё создаётся — воспроизведение появится через несколько минут.'
              : 'Воспроизведение недоступно, скачайте оригинал.'}
          </p>
        )}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.control}
          aria-label={playing ? 'Пауза' : 'Воспроизвести'}
          disabled={!src}
          onClick={toggle}
        >
          {playing ? (
            <Pause size={20} aria-hidden />
          ) : (
            <Play size={20} aria-hidden />
          )}
        </button>
        <span className={styles.clock}>
          {formatTimecode(time)} / {formatTimecode(duration)}
        </span>
        <div className={styles.track}>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={Math.min(time, duration || 0)}
            aria-label="Позиция воспроизведения"
            disabled={!src}
            className={styles.seek}
            style={
              {
                '--progress': `${duration ? (time / duration) * 100 : 0}%`,
              } as CSSProperties
            }
            onChange={(event) => {
              if (mediaRef.current)
                mediaRef.current.currentTime = Number(event.target.value);
            }}
          />
          {duration > 0 &&
            moments.map((comment) => (
              <span
                key={comment.id}
                className={styles.moment}
                style={{
                  left: `${((comment.anchor as { start: number }).start / duration) * 100}%`,
                }}
                aria-hidden
              />
            ))}
        </div>
        <button
          type="button"
          className={styles.control}
          aria-label="Скорость воспроизведения"
          onClick={() => {
            const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
            setSpeed(next);
            if (mediaRef.current) mediaRef.current.playbackRate = next;
          }}
        >
          {speed.toLocaleString('ru-RU')}×
        </button>
        <button
          type="button"
          className={styles.control}
          aria-label={muted ? 'Включить звук' : 'Выключить звук'}
          onClick={() => setMuted((value) => !value)}
        >
          {muted ? (
            <VolumeX size={20} aria-hidden />
          ) : (
            <Volume2 size={20} aria-hidden />
          )}
        </button>
        {isVideo && (
          <button
            type="button"
            className={styles.control}
            aria-label="На весь экран"
            onClick={() => void shellRef.current?.requestFullscreen()}
          >
            <Maximize size={20} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
