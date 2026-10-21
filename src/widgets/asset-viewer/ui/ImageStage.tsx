import clsx from 'clsx';
import { useRef, useState, type PointerEvent } from 'react';
import { AssetThumb, type Asset } from '@entities/asset';
import {
  isRegion,
  useAssetComments,
  type RegionAnchor,
} from '@entities/comment';
import type { Face } from '@entities/person';
import {
  finishDrawing,
  focusComment,
  useAnnotation,
} from '@features/discuss-asset';
import { Tag } from '@shared/ui/tag';
import styles from './AssetViewer.module.scss';

interface ImageStageProps {
  asset: Asset;
  faces: Face[];
  onFaceClick?: (face: Face) => void;
}

/** Слишком маленькое выделение — скорее случайный клик, чем область */
const MIN_REGION = 0.01;

const boxStyle = (box: {
  x: number;
  y: number;
  width: number;
  height: number;
}) => ({
  left: `${box.x * 100}%`,
  top: `${box.y * 100}%`,
  width: `${box.width * 100}%`,
  height: `${box.height * 100}%`,
});

/** Изображение с отметками обсуждения и лицами; в режиме выделения рисует новую область. */
export function ImageStage({ asset, faces, onFaceClick }: ImageStageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const { drawing, draft, focusedId } = useAnnotation();
  const comments = useAssetComments(asset.id);
  const [sketch, setSketch] = useState<RegionAnchor | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const src = asset.version.urls.preview ?? asset.version.urls.thumbnail;
  const { width, height } = asset.version.meta ?? {};
  // Рамка точно по пропорциям кадра: отметки в долях совпадают с изображением
  const frameWidth =
    width && height
      ? `min(100%, calc(var(--media-height) * ${width / height}))`
      : undefined;

  const regions = [...comments.items]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((comment, index) => ({ comment, number: index + 1 }))
    .filter(
      ({ comment }) =>
        isRegion(comment.anchor) &&
        comment.versionId === asset.version.id &&
        !comment.resolvedAt,
    );

  const pointAt = (event: PointerEvent) => {
    const rect = frameRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  };

  const sketchFrom = (
    start: { x: number; y: number },
    end: { x: number; y: number },
  ) => ({
    type: 'region' as const,
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  });

  const drawingHandlers = drawing
    ? {
        onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          origin.current = pointAt(event);
          setSketch(sketchFrom(origin.current, origin.current));
        },
        onPointerMove: (event: PointerEvent) => {
          if (origin.current)
            setSketch(sketchFrom(origin.current, pointAt(event)));
        },
        onPointerUp: () => {
          const region =
            sketch && sketch.width > MIN_REGION && sketch.height > MIN_REGION
              ? sketch
              : null;
          origin.current = null;
          setSketch(null);
          if (region) finishDrawing(region);
        },
      }
    : {};

  const draftRegion = sketch ?? (isRegion(draft) ? draft : null);

  if (!src)
    return (
      <AssetThumb asset={asset} size="preview" className={styles.placeholder} />
    );

  return (
    <div className={styles.media}>
      <div
        ref={frameRef}
        className={clsx(styles.frame, drawing && styles.drawing)}
        style={{ width: frameWidth }}
        {...drawingHandlers}
      >
        <img
          src={src}
          alt={asset.title}
          className={styles.image}
          draggable={false}
        />

        {faces.map((face) => (
          <button
            key={face.id}
            type="button"
            className={styles.face}
            style={boxStyle(face.box)}
            onClick={() => onFaceClick?.(face)}
          >
            <span className={styles.faceLabel}>
              {face.personName ?? 'Кто это?'}
            </span>
          </button>
        ))}

        {regions.map(({ comment, number }) => (
          <span
            key={comment.id}
            className={clsx(
              styles.region,
              focusedId === comment.id && styles.regionFocused,
            )}
            style={boxStyle(comment.anchor as RegionAnchor)}
          >
            <button
              type="button"
              className={styles.regionNumber}
              aria-label={`Обсуждение № ${number}`}
              onClick={() =>
                focusComment(focusedId === comment.id ? null : comment.id)
              }
            >
              {number}
            </button>
          </span>
        ))}

        {draftRegion && (
          <span
            className={clsx(styles.region, styles.regionDraft)}
            style={boxStyle(draftRegion)}
          />
        )}
      </div>

      {(drawing || draftRegion) && (
        <Tag tone="surface" className={styles.mediaLabel}>
          {drawing ? 'Выделите область на изображении' : 'Область комментария'}
        </Tag>
      )}
    </div>
  );
}
