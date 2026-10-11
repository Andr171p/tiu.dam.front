/** Прямоугольник в долях ориентированного (повёрнутого) изображения, 0..1. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Adjustments {
  /** Проценты, 100 — без изменений */
  brightness: number;
  contrast: number;
  saturation: number;
}

export interface EditState {
  rotation: 0 | 90 | 180 | 270;
  flipX: boolean;
  flipY: boolean;
  crop: Rect;
  adjustments: Adjustments;
}

export const FULL_FRAME: Rect = { x: 0, y: 0, width: 1, height: 1 };

export const INITIAL_STATE: EditState = {
  rotation: 0,
  flipX: false,
  flipY: false,
  crop: FULL_FRAME,
  adjustments: { brightness: 100, contrast: 100, saturation: 100 },
};

export function isPristine(state: EditState): boolean {
  return JSON.stringify(state) === JSON.stringify(INITIAL_STATE);
}

/** Размер изображения после поворота. */
export function orientedSize(
  image: { width: number; height: number },
  rotation: EditState['rotation'],
) {
  return rotation % 180 === 0
    ? { width: image.width, height: image.height }
    : { width: image.height, height: image.width };
}

export function filterOf({
  brightness,
  contrast,
  saturation,
}: Adjustments): string {
  return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
}

/**
 * Рисует изображение с поворотом, отражением, кадрированием и коррекцией.
 * Один и тот же код для превью (масштаб < 1) и для экспорта в полном разрешении.
 */
export function render(
  canvas: HTMLCanvasElement,
  image: ImageBitmap,
  state: EditState,
  { scale = 1, crop = state.crop }: { scale?: number; crop?: Rect } = {},
) {
  const oriented = orientedSize(image, state.rotation);
  const cropPx = {
    x: crop.x * oriented.width,
    y: crop.y * oriented.height,
    width: crop.width * oriented.width,
    height: crop.height * oriented.height,
  };

  canvas.width = Math.max(1, Math.round(cropPx.width * scale));
  canvas.height = Math.max(1, Math.round(cropPx.height * scale));

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D недоступен');

  context.save();
  context.filter = filterOf(state.adjustments);
  context.imageSmoothingQuality = 'high';
  context.scale(scale, scale);
  context.translate(-cropPx.x, -cropPx.y);
  context.translate(oriented.width / 2, oriented.height / 2);
  context.rotate((state.rotation * Math.PI) / 180);
  context.scale(state.flipX ? -1 : 1, state.flipY ? -1 : 1);
  context.drawImage(
    image,
    -image.width / 2,
    -image.height / 2,
    image.width,
    image.height,
  );
  context.restore();
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const MIN_SIZE = 0.05;

/** Кадр с заданными пропорциями (в пикселях), вписанный по центру. */
export function cropForAspect(
  aspect: number | null,
  image: { width: number; height: number },
): Rect {
  if (!aspect) return FULL_FRAME;
  const imageAspect = image.width / image.height;
  if (aspect > imageAspect) {
    const height = imageAspect / aspect;
    return { x: 0, y: (1 - height) / 2, width: 1, height };
  }
  const width = aspect / imageAspect;
  return { x: (1 - width) / 2, y: 0, width, height: 1 };
}

export type Handle = 'move' | 'nw' | 'ne' | 'sw' | 'se';

/**
 * Новый кадр после перетаскивания: перемещение или угол. С фиксированными пропорциями
 * высота следует за шириной. Кадр всегда остаётся внутри изображения.
 */
export function dragCrop(
  start: Rect,
  handle: Handle,
  dx: number,
  dy: number,
  aspect: number | null,
  image: { width: number; height: number },
): Rect {
  if (handle === 'move') {
    return {
      ...start,
      x: clamp(start.x + dx, 0, 1 - start.width),
      y: clamp(start.y + dy, 0, 1 - start.height),
    };
  }

  const west = handle === 'nw' || handle === 'sw';
  const north = handle === 'nw' || handle === 'ne';

  let left = west
    ? clamp(start.x + dx, 0, start.x + start.width - MIN_SIZE)
    : start.x;
  let right = west
    ? start.x + start.width
    : clamp(start.x + start.width + dx, start.x + MIN_SIZE, 1);
  let top = north
    ? clamp(start.y + dy, 0, start.y + start.height - MIN_SIZE)
    : start.y;
  let bottom = north
    ? start.y + start.height
    : clamp(start.y + start.height + dy, start.y + MIN_SIZE, 1);

  if (aspect) {
    // Пропорции в долях: учитываем, что доли по осям считаются от разных сторон
    const relative = (aspect * image.height) / image.width;
    let height = (right - left) / relative;
    const maxHeight = north ? bottom : 1 - top;
    if (height > maxHeight) {
      height = maxHeight;
      const width = height * relative;
      if (west) left = right - width;
      else right = left + width;
    }
    if (north) top = bottom - height;
    else bottom = top + height;
  }

  return { x: left, y: top, width: right - left, height: bottom - top };
}
