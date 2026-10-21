import type { Schemas } from '@shared/api';

export type EditRecipe = Schemas['EditRecipe'];
export type Filter = Schemas['Filter'];
export type Rotation = 0 | 90 | 180 | 270;

/** Прямоугольник в долях кадра после поворота, 0..1. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextLayer {
  id: string;
  text: string;
  /** Центр надписи в долях итогового кадра */
  x: number;
  y: number;
  /** Высота шрифта — доля высоты кадра */
  size: number;
  color: string;
  bold: boolean;
  shadow: boolean;
}

export interface EditorState {
  rotate: Rotation;
  flipHorizontal: boolean;
  flipVertical: boolean;
  crop: Rect;
  /** Пропорции кадра (ширина / высота); null — свободно */
  aspect: number | null;
  /** −1..1, 0 — без изменений */
  adjustments: { brightness: number; contrast: number; saturation: number };
  filter: Filter;
  /** Вписать в рамку; увеличение сервер не выполняет */
  resize: { width: number | null; height: number | null };
  texts: TextLayer[];
  format: 'jpeg' | 'png' | 'webp';
  quality: number;
}

export const FULL_FRAME: Rect = { x: 0, y: 0, width: 1, height: 1 };

export const INITIAL_STATE: EditorState = {
  rotate: 0,
  flipHorizontal: false,
  flipVertical: false,
  crop: FULL_FRAME,
  aspect: null,
  adjustments: { brightness: 0, contrast: 0, saturation: 0 },
  filter: 'none',
  resize: { width: null, height: null },
  texts: [],
  format: 'jpeg',
  quality: 90,
};

export const ASPECTS: { label: string; value: number | null }[] = [
  { label: 'Свободно', value: null },
  { label: '1 : 1', value: 1 },
  { label: '4 : 3', value: 4 / 3 },
  { label: '16 : 9', value: 16 / 9 },
];

export const FILTERS: { value: Filter; label: string }[] = [
  { value: 'none', label: 'Без фильтра' },
  { value: 'grayscale', label: 'Ч/б' },
  { value: 'sepia', label: 'Сепия' },
  { value: 'warm', label: 'Тёплый' },
  { value: 'cool', label: 'Холодный' },
  { value: 'vintage', label: 'Винтаж' },
];

const isFullFrame = (crop: Rect) =>
  crop.x <= 0 && crop.y <= 0 && crop.width >= 1 && crop.height >= 1;

export const isPristine = (state: EditorState) =>
  JSON.stringify({ ...state, aspect: null }) === JSON.stringify(INITIAL_STATE);

/** Рецепт для сервера: он применит его к оригиналу в полном разрешении. */
export function toRecipe(state: EditorState): EditRecipe {
  const round = (value: number) => Math.round(value * 10_000) / 10_000;
  const { width, height } = state.resize;

  return {
    rotate: state.rotate,
    flipHorizontal: state.flipHorizontal,
    flipVertical: state.flipVertical,
    crop: isFullFrame(state.crop)
      ? null
      : {
          x: round(state.crop.x),
          y: round(state.crop.y),
          width: round(Math.min(state.crop.width, 1 - state.crop.x)),
          height: round(Math.min(state.crop.height, 1 - state.crop.y)),
        },
    resize: width || height ? { width, height } : null,
    adjustments: state.adjustments,
    filter: state.filter,
    texts: state.texts
      .filter((layer) => layer.text.trim())
      .map(({ id: _, ...layer }) => ({
        ...layer,
        x: round(layer.x),
        y: round(layer.y),
      })),
    format: state.format,
    quality: state.quality,
  };
}

export interface Size {
  width: number;
  height: number;
}

/** Размер после поворота: на 90° и 270° стороны меняются местами. */
export const orientedSize = (size: Size, rotate: Rotation): Size =>
  rotate % 180 === 0 ? size : { width: size.height, height: size.width };

/** Итоговый размер в пикселях: кадрирование, затем вписывание в рамку без увеличения. */
export function resultSize(original: Size, state: EditorState): Size {
  const oriented = orientedSize(original, state.rotate);
  const cropped = {
    width: Math.max(1, Math.round(oriented.width * state.crop.width)),
    height: Math.max(1, Math.round(oriented.height * state.crop.height)),
  };
  const scale = Math.min(
    1,
    state.resize.width ? state.resize.width / cropped.width : 1,
    state.resize.height ? state.resize.height / cropped.height : 1,
  );
  return {
    width: Math.max(1, Math.round(cropped.width * scale)),
    height: Math.max(1, Math.round(cropped.height * scale)),
  };
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Кадр с пропорциями `aspect` (в пикселях), вписанный по центру. */
export function cropForAspect(aspect: number | null, image: Size): Rect {
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

const MIN_SIZE = 0.05;

/**
 * Новый кадр после перетаскивания рамки или угла. С заданными пропорциями
 * высота следует за шириной; кадр всегда остаётся внутри изображения.
 */
export function dragCrop(
  start: Rect,
  handle: Handle,
  dx: number,
  dy: number,
  aspect: number | null,
  image: Size,
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
    // Пропорции в долях: доли по осям считаются от разных сторон изображения
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

/** CSS-приближение коррекции Pillow `ImageEnhance(…).enhance(1 + value)`. */
export function cssFilter(state: EditorState): string {
  const { brightness, contrast, saturation } = state.adjustments;
  const parts = [
    `brightness(${1 + brightness})`,
    `contrast(${1 + contrast})`,
    `saturate(${1 + saturation})`,
  ];
  if (state.filter === 'grayscale') parts.push('grayscale(1)');
  if (state.filter === 'sepia') parts.push('sepia(1)');
  if (state.filter === 'vintage') parts.push('saturate(0.6) contrast(0.85)');
  return parts.join(' ');
}

/** Тонировка фильтров — смешение с цветом, как `Image.blend` на сервере. */
export const FILTER_TINTS: Partial<
  Record<Filter, { color: string; opacity: number }>
> = {
  warm: { color: 'rgb(255 160 60)', opacity: 0.12 },
  cool: { color: 'rgb(60 140 255)', opacity: 0.12 },
  vintage: { color: 'rgb(240 200 140)', opacity: 0.15 },
};
