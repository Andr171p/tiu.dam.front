import clsx from 'clsx';
import {
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  cssFilter,
  dragCrop,
  FILTER_TINTS,
  type EditorState,
  type Handle,
  type Rect,
  type Size,
  type TextLayer,
} from '../model/recipe';
import styles from './ImageEditor.module.scss';

interface EditorStageProps {
  src: string;
  state: EditorState;
  oriented: Size;
  zoom: number;
  /** Рамка кадра редактируется только на вкладке «Обрезка» */
  cropping: boolean;
  /** Надписи перетаскиваются только на вкладке «Разметка» */
  marking: boolean;
  selectedText: string | null;
  onCrop: (crop: Rect) => void;
  onMoveText: (id: string, position: { x: number; y: number }) => void;
  onSelectText: (id: string) => void;
}

const HANDLES: Exclude<Handle, 'move'>[] = ['nw', 'ne', 'sw', 'se'];
const STAGE_PADDING = 32;

/** Начинает перетаскивание: движение указателя в долях `box`. */
function startDrag(
  event: ReactPointerEvent,
  box: Size,
  onMove: (dx: number, dy: number) => void,
) {
  event.preventDefault();
  event.stopPropagation();
  const target = event.currentTarget;
  const { pointerId, clientX, clientY } = event;
  target.setPointerCapture(pointerId);

  const move = (moveEvent: PointerEvent) =>
    onMove(
      (moveEvent.clientX - clientX) / box.width,
      (moveEvent.clientY - clientY) / box.height,
    );
  const stop = () => {
    target.removeEventListener('pointermove', move as EventListener);
    target.removeEventListener('pointerup', stop);
    target.removeEventListener('pointercancel', stop);
  };
  target.addEventListener('pointermove', move as EventListener);
  target.addEventListener('pointerup', stop);
  target.addEventListener('pointercancel', stop);
}

/**
 * Предпросмотр по превью ~2048 px: те же доли кадра, что у оригинала,
 * поэтому результат на сервере совпадает с тем, что видно здесь.
 */
export function EditorStage({
  src,
  state,
  oriented,
  zoom,
  cropping,
  marking,
  selectedText,
  onCrop,
  onMoveText,
  onSelectText,
}: EditorStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState<Size>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) =>
      setAvailable({
        width: entry.contentRect.width - 2 * STAGE_PADDING,
        height: entry.contentRect.height - 2 * STAGE_PADDING,
      }),
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const fit = Math.max(
    0,
    Math.min(
      available.width / oriented.width,
      available.height / oriented.height,
    ),
  );
  const frame = {
    width: oriented.width * fit * zoom,
    height: oriented.height * fit * zoom,
  };
  const sideways = state.rotate % 180 !== 0;
  const crop = state.crop;
  const cropBox = {
    width: crop.width * frame.width,
    height: crop.height * frame.height,
  };
  const tint = FILTER_TINTS[state.filter];

  const dragFrame = (event: ReactPointerEvent, handle: Handle) => {
    const start = crop;
    startDrag(event, frame, (dx, dy) =>
      onCrop(dragCrop(start, handle, dx, dy, state.aspect, oriented)),
    );
  };

  const dragText = (event: ReactPointerEvent, layer: TextLayer) => {
    onSelectText(layer.id);
    if (!marking) return;
    const start = { x: layer.x, y: layer.y };
    startDrag(event, cropBox, (dx, dy) =>
      onMoveText(layer.id, {
        x: Math.min(1, Math.max(0, start.x + dx)),
        y: Math.min(1, Math.max(0, start.y + dy)),
      }),
    );
  };

  return (
    <div ref={stageRef} className={styles.stage}>
      {fit > 0 && (
        <div className={styles.frame} style={frame}>
          <img
            src={src}
            alt=""
            draggable={false}
            className={styles.image}
            style={{
              width: sideways ? frame.height : frame.width,
              height: sideways ? frame.width : frame.height,
              filter: cssFilter(state),
              transform: `translate(-50%, -50%) scale(${state.flipHorizontal ? -1 : 1}, ${
                state.flipVertical ? -1 : 1
              }) rotate(${state.rotate}deg)`,
            }}
          />
          {tint && (
            <div
              className={styles.tint}
              style={{ background: tint.color, opacity: tint.opacity }}
            />
          )}

          <div
            className={clsx(styles.crop, cropping && styles.cropActive)}
            style={{
              left: crop.x * frame.width,
              top: crop.y * frame.height,
              ...cropBox,
            }}
            onPointerDown={
              cropping ? (event) => dragFrame(event, 'move') : undefined
            }
          >
            {cropping && (
              <>
                <span className={styles.thirds} aria-hidden />
                {HANDLES.map((handle) => (
                  <span
                    key={handle}
                    className={clsx(styles.handle, styles[handle])}
                    onPointerDown={(event) => dragFrame(event, handle)}
                  />
                ))}
              </>
            )}

            {state.texts.map((layer) => (
              <span
                key={layer.id}
                className={clsx(
                  styles.textLayer,
                  marking && styles.textMovable,
                  selectedText === layer.id && marking && styles.textSelected,
                )}
                style={{
                  left: `${layer.x * 100}%`,
                  top: `${layer.y * 100}%`,
                  color: layer.color,
                  fontSize: layer.size * cropBox.height,
                  fontWeight: layer.bold ? 700 : 400,
                  textShadow: layer.shadow
                    ? `${layer.size * cropBox.height * 0.06}px ${layer.size * cropBox.height * 0.06}px 0 rgb(0 0 0 / 63%)`
                    : undefined,
                }}
                onPointerDown={(event) => dragText(event, layer)}
              >
                {layer.text || ' '}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
