import {
  FlipHorizontal2,
  FlipVertical2,
  RotateCcw,
  RotateCw,
  Save,
  Undo2,
} from 'lucide-react';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import { useAddVersion, type Asset } from '@entities/asset';
import { describeError } from '@shared/api';
import { Button, IconButton } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { Segmented } from '@shared/ui/segmented';
import { Slider } from '@shared/ui/slider';
import { Spinner } from '@shared/ui/spinner';
import {
  cropForAspect,
  dragCrop,
  FULL_FRAME,
  INITIAL_STATE,
  isPristine,
  orientedSize,
  render,
  type EditState,
  type Handle,
  type Rect,
} from '../model/transform';
import { useSourceImage } from '../model/use-source-image';
import styles from './ImageEditor.module.scss';

type AspectKey = 'free' | '1:1' | '4:3' | '3:2' | '16:9';

const ASPECTS: { value: AspectKey; label: string; ratio: number | null }[] = [
  { value: 'free', label: 'Свободно', ratio: null },
  { value: '1:1', label: '1:1', ratio: 1 },
  { value: '4:3', label: '4:3', ratio: 4 / 3 },
  { value: '3:2', label: '3:2', ratio: 3 / 2 },
  { value: '16:9', label: '16:9', ratio: 16 / 9 },
];

const EXPORT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const HANDLES: Handle[] = ['nw', 'ne', 'sw', 'se'];

const percent = (value: number) =>
  `${value - 100 > 0 ? '+' : ''}${value - 100}`;

function editedName(filename: string, type: string): string {
  const base = filename.replace(/\.[^.]+$/, '');
  return `${base}-edit.${EXTENSIONS[type] ?? 'jpg'}`;
}

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error('Не удалось сохранить изображение')),
      type,
      0.92,
    ),
  );
}

interface ImageEditorProps {
  asset: Asset;
  onSaved: () => void;
}

/** Базовый редактор на canvas: правка сохраняется новой версией актива, оригинал не меняется. */
export function ImageEditor({ asset, onSaved }: ImageEditorProps) {
  const version = asset.currentVersion;
  const source = useSourceImage(asset.id, version?.id);
  const addVersion = useAddVersion(asset.id);

  const [state, setState] = useState<EditState>(INITIAL_STATE);
  const [aspect, setAspect] = useState<AspectKey>('free');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const drag = useRef<{
    handle: Handle;
    x: number;
    y: number;
    start: Rect;
  } | null>(null);

  const bitmap = source.data?.bitmap;
  const oriented = useMemo(
    () =>
      bitmap ? orientedSize(bitmap, state.rotation) : { width: 1, height: 1 },
    [bitmap, state.rotation],
  );
  const ratio = ASPECTS.find((item) => item.value === aspect)?.ratio ?? null;

  useLayoutEffect(() => {
    if (!stageRef.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setStage({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  // Превью: весь кадр без кадрирования, вписанный в рабочую область
  const scale =
    Math.min(1, stage.width / oriented.width, stage.height / oriented.height) ||
    0;
  useEffect(() => {
    if (bitmap && canvasRef.current && scale > 0) {
      render(canvasRef.current, bitmap, state, { scale, crop: FULL_FRAME });
    }
  }, [bitmap, state, scale]);

  const rotate = (delta: 90 | -90) =>
    setState((current) => {
      const rotation = ((((current.rotation + delta) % 360) + 360) %
        360) as EditState['rotation'];
      return {
        ...current,
        rotation,
        crop: bitmap
          ? cropForAspect(ratio, orientedSize(bitmap, rotation))
          : FULL_FRAME,
      };
    });

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    const canvas = canvasRef.current;
    if (!current || !canvas) return;
    const dx = (event.clientX - current.x) / canvas.clientWidth;
    const dy = (event.clientY - current.y) / canvas.clientHeight;
    setState((value) => ({
      ...value,
      crop: dragCrop(current.start, current.handle, dx, dy, ratio, oriented),
    }));
  };

  /** Ручка кадра — в data-handle: один обработчик на рамку и все углы. */
  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      handle: (event.currentTarget.dataset.handle ?? 'move') as Handle,
      x: event.clientX,
      y: event.clientY,
      start: state.crop,
    };
  };

  const save = async () => {
    if (!bitmap || !source.data || !version) return;
    const type = EXPORT_TYPES.has(source.data.type)
      ? source.data.type
      : 'image/jpeg';
    const canvas = document.createElement('canvas');
    render(canvas, bitmap, state);
    const blob = await toBlob(canvas, type);
    const file = new File([blob], editedName(version.originalFilename, type), {
      type,
    });
    addVersion.mutate(
      { file, sourceVersionId: version.id },
      { onSuccess: onSaved },
    );
  };

  if (source.isError) {
    return (
      <EmptyState
        icon={Undo2}
        title="Не удалось открыть оригинал"
        description={describeError(source.error)}
      />
    );
  }

  const { crop } = state;

  return (
    <div className={styles.editor}>
      <div ref={stageRef} className={styles.stage}>
        {!bitmap ? (
          <Spinner size={28} className={styles.spinner} />
        ) : (
          <div
            className={styles.canvasWrap}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          >
            <canvas ref={canvasRef} className={styles.canvas} />
            <div
              className={styles.crop}
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.width * 100}%`,
                height: `${crop.height * 100}%`,
              }}
              data-handle="move"
              onPointerDown={onPointerDown}
            >
              <span className={styles.grid} />
              {HANDLES.map((handle) => (
                <span
                  key={handle}
                  className={`${styles.handle} ${styles[handle]}`}
                  data-handle={handle}
                  onPointerDown={onPointerDown}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <aside className={styles.panel}>
        <section className={styles.section}>
          <h3 className={styles.title}>Поворот и отражение</h3>
          <div className={styles.buttons}>
            <IconButton
              icon={RotateCcw}
              label="Повернуть влево"
              variant="secondary"
              size="md"
              onClick={() => rotate(-90)}
            />
            <IconButton
              icon={RotateCw}
              label="Повернуть вправо"
              variant="secondary"
              size="md"
              onClick={() => rotate(90)}
            />
            <IconButton
              icon={FlipHorizontal2}
              label="Отразить по горизонтали"
              variant="secondary"
              size="md"
              onClick={() =>
                setState((value) => ({ ...value, flipX: !value.flipX }))
              }
            />
            <IconButton
              icon={FlipVertical2}
              label="Отразить по вертикали"
              variant="secondary"
              size="md"
              onClick={() =>
                setState((value) => ({ ...value, flipY: !value.flipY }))
              }
            />
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.title}>Кадрирование</h3>
          <Segmented
            label="Пропорции"
            options={ASPECTS}
            value={aspect}
            onChange={(value) => {
              setAspect(value);
              const next =
                ASPECTS.find((item) => item.value === value)?.ratio ?? null;
              setState((current) => ({
                ...current,
                crop: cropForAspect(next, oriented),
              }));
            }}
          />
          {bitmap && (
            <span className={styles.hint}>
              {Math.round(crop.width * oriented.width)} ×{' '}
              {Math.round(crop.height * oriented.height)} px
            </span>
          )}
        </section>

        <section className={styles.section}>
          <h3 className={styles.title}>Коррекция</h3>
          {(['brightness', 'contrast', 'saturation'] as const).map((key) => (
            <Slider
              key={key}
              label={
                {
                  brightness: 'Яркость',
                  contrast: 'Контраст',
                  saturation: 'Насыщенность',
                }[key]
              }
              min={0}
              max={200}
              value={state.adjustments[key]}
              format={percent}
              onChange={(value) =>
                setState((current) => ({
                  ...current,
                  adjustments: { ...current.adjustments, [key]: value },
                }))
              }
            />
          ))}
        </section>

        <div className={styles.footer}>
          <p className={styles.hint}>
            Результат сохранится новой версией, оригинал останется в истории.
            Метаданные EXIF не переносятся.
          </p>
          <div className={styles.buttons}>
            <Button
              icon={Undo2}
              disabled={isPristine(state)}
              onClick={() => {
                setState(INITIAL_STATE);
                setAspect('free');
              }}
            >
              Сбросить
            </Button>
            <Button
              variant="primary"
              icon={Save}
              disabled={!bitmap || isPristine(state)}
              loading={addVersion.isPending}
              onClick={() => void save()}
            >
              Сохранить версию
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
