export interface Placement {
  /** Центр знака по горизонтали, 0..1 */
  x: number;
  /** Центр знака по вертикали, 0..1 */
  y: number;
  /** Ширина знака относительно ширины кадра */
  scale: number;
  opacity: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Положение знака в кадре — та же формула, что на сервере: центр в (x, y),
 * но знак целиком остаётся внутри изображения.
 */
export function markBox(
  placement: Placement,
  frame: { width: number; height: number },
  mark: { width: number; height: number },
) {
  return {
    left: clamp(
      placement.x * frame.width - mark.width / 2,
      0,
      frame.width - mark.width,
    ),
    top: clamp(
      placement.y * frame.height - mark.height / 2,
      0,
      frame.height - mark.height,
    ),
  };
}

const MEASURE_SIZE = 100;
let context: CanvasRenderingContext2D | null = null;

/** Кегль, при котором текст займёт заданную ширину. Шрифт близок к серверному DejaVu Sans Bold. */
export function fontSizeForWidth(
  text: string,
  width: number,
  fontFamily: string,
): number {
  context ??= document.createElement('canvas').getContext('2d');
  if (!context || !text) return 16;
  context.font = `700 ${MEASURE_SIZE}px ${fontFamily}`;
  const measured = context.measureText(text).width || 1;
  return Math.max((MEASURE_SIZE * width) / measured, 8);
}

/** Девять опорных точек: углы, середины сторон и центр. */
export const ANCHORS = [0.1, 0.5, 0.9].flatMap((y) =>
  [0.1, 0.5, 0.9].map((x) => ({ x, y })),
);
