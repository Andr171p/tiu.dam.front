import clsx from 'clsx';
import { Ban, ImageIcon, ImageUp, Save, Type } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import {
  useUpdateSettings,
  type Collection,
  type Watermark,
} from '@entities/collection';
import { describeError, uploadFile } from '@shared/api';
import { Button } from '@shared/ui/button';
import { TextField } from '@shared/ui/field';
import { Segmented } from '@shared/ui/segmented';
import { Slider } from '@shared/ui/slider';
import { toast } from '@shared/ui/toast';
import {
  ANCHORS,
  fontSizeForWidth,
  markBox,
  type Placement,
} from '../lib/geometry';
import styles from './WatermarkEditor.module.scss';

type Mode = 'none' | 'text' | 'image';

const MODES = [
  { value: 'none' as const, label: 'Нет', icon: Ban },
  { value: 'text' as const, label: 'Текст', icon: Type },
  { value: 'image' as const, label: 'Логотип', icon: ImageIcon },
];

const DEFAULT_PLACEMENT: Placement = {
  x: 0.85,
  y: 0.9,
  scale: 0.2,
  opacity: 0.5,
};
const FONT_FAMILY = '"DejaVu Sans", Verdana, Arial, sans-serif';

const percent = (value: number) => `${Math.round(value * 100)}%`;

/** Размер элемента в пикселях: нужен, чтобы ограничить знак рамкой кадра, как на сервере. */
function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}

export function WatermarkEditor({ collection }: { collection: Collection }) {
  const current = collection.settings.watermark;
  const [mode, setMode] = useState<Mode>(current?.type ?? 'none');
  const [text, setText] = useState(
    current?.type === 'text' ? current.text : '© ТИУ',
  );
  const [color, setColor] = useState(
    current?.type === 'text' ? current.color : '#FFFFFF',
  );
  const [objectId, setObjectId] = useState(
    current?.type === 'image' ? current.objectId : null,
  );
  const [imageUrl, setImageUrl] = useState(collection.watermarkUrl ?? null);
  const [placement, setPlacement] = useState<Placement>(
    current?.placement ?? DEFAULT_PLACEMENT,
  );
  const [uploading, setUploading] = useState(false);
  const [aspect, setAspect] = useState(1.5);

  const [stageRef, frame] = useSize<HTMLDivElement>();
  const [markRef, mark] = useSize<HTMLDivElement>();
  const fileInput = useRef<HTMLInputElement>(null);
  const update = useUpdateSettings(
    collection,
    'Водяной знак сохранён: превью перерисовываются в фоне',
  );

  const markWidth = frame.width * placement.scale;
  const box = markBox(placement, frame, mark);

  const moveTo = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPlacement((value) => ({
      ...value,
      x: Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1),
      y: Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1),
    }));
  };

  const uploadMark = async (file: File) => {
    setUploading(true);
    try {
      const stored = await uploadFile(file);
      setObjectId(stored.id);
      setImageUrl(URL.createObjectURL(file));
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setUploading(false);
    }
  };

  const watermark = (): Watermark | null => {
    if (mode === 'text')
      return { type: 'text', text: text.trim(), color, placement };
    if (mode === 'image' && objectId)
      return { type: 'image', objectId, placement };
    return null;
  };

  const canSave =
    mode === 'none' ||
    (mode === 'text' ? text.trim().length > 0 : Boolean(objectId));

  return (
    <section className={styles.editor}>
      <div className={styles.preview}>
        <div
          ref={stageRef}
          className={styles.stage}
          style={{ aspectRatio: aspect }}
          onPointerDown={(event) => {
            if (mode === 'none') return;
            event.currentTarget.setPointerCapture(event.pointerId);
            moveTo(event);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              moveTo(event);
          }}
        >
          {collection.stats.coverUrl ? (
            <img
              src={collection.stats.coverUrl}
              alt=""
              className={styles.sample}
              draggable={false}
              onLoad={(event) =>
                setAspect(
                  event.currentTarget.naturalWidth /
                    event.currentTarget.naturalHeight,
                )
              }
            />
          ) : (
            <div className={styles.placeholder} />
          )}

          {mode !== 'none' && (
            <div
              ref={markRef}
              className={styles.mark}
              style={{
                left: box.left,
                top: box.top,
                opacity: placement.opacity,
                width: mode === 'image' ? markWidth : undefined,
              }}
            >
              {mode === 'text' ? (
                <span
                  className={styles.text}
                  style={{
                    color,
                    fontSize: fontSizeForWidth(text, markWidth, FONT_FAMILY),
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {text}
                </span>
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  draggable={false}
                  className={styles.markImage}
                />
              ) : (
                <span className={styles.empty}>Загрузите логотип</span>
              )}
            </div>
          )}
        </div>
        <p className={styles.hint}>
          Перетащите знак по кадру. Оригиналы не изменяются: знак наносится
          только на превью для просмотра.
        </p>
      </div>

      <div className={styles.controls}>
        <Segmented
          label="Тип водяного знака"
          options={MODES}
          value={mode}
          onChange={setMode}
        />

        {mode === 'text' && (
          <div className={styles.group}>
            <TextField
              label="Текст"
              value={text}
              maxLength={120}
              onChange={(event) => setText(event.target.value)}
            />
            <label className={styles.color}>
              <span>Цвет</span>
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value.toUpperCase())}
              />
              <code>{color}</code>
            </label>
          </div>
        )}

        {mode === 'image' && (
          <div className={styles.group}>
            <Button
              icon={ImageUp}
              loading={uploading}
              onClick={() => fileInput.current?.click()}
            >
              {objectId ? 'Заменить изображение' : 'Загрузить PNG'}
            </Button>
            <span className={styles.hint}>
              Лучше всего — PNG с прозрачным фоном.
            </span>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/webp,image/svg+xml,image/jpeg"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadMark(file);
                event.target.value = '';
              }}
            />
          </div>
        )}

        {mode !== 'none' && (
          <>
            <div className={styles.group}>
              <span className={styles.label}>Положение</span>
              <div className={styles.anchors}>
                {ANCHORS.map((anchor) => (
                  <button
                    key={`${anchor.x}-${anchor.y}`}
                    type="button"
                    aria-label={`Позиция ${anchor.x}, ${anchor.y}`}
                    className={clsx(
                      styles.anchor,
                      Math.abs(anchor.x - placement.x) < 0.05 &&
                        Math.abs(anchor.y - placement.y) < 0.05 &&
                        styles.active,
                    )}
                    onClick={() =>
                      setPlacement((value) => ({ ...value, ...anchor }))
                    }
                  />
                ))}
              </div>
            </div>
            <Slider
              label="Размер"
              min={0.05}
              max={1}
              step={0.01}
              value={placement.scale}
              format={percent}
              onChange={(scale) =>
                setPlacement((value) => ({ ...value, scale }))
              }
            />
            <Slider
              label="Непрозрачность"
              min={0.05}
              max={1}
              step={0.01}
              value={placement.opacity}
              format={percent}
              onChange={(opacity) =>
                setPlacement((value) => ({ ...value, opacity }))
              }
            />
          </>
        )}

        {update.error && (
          <p className={styles.error}>{describeError(update.error)}</p>
        )}
        <Button
          variant="primary"
          icon={Save}
          disabled={!canSave}
          loading={update.isPending}
          onClick={() => update.mutate({ watermark: watermark() })}
        >
          Сохранить
        </Button>
      </div>
    </section>
  );
}
