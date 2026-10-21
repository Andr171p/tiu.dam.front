export interface Range {
  start: number;
  end: number;
}

/**
 * Появления человека — отдельные кадры с таймкодами. Склеиваем соседние кадры
 * в отрезки: на таймлайне видно, когда человек в кадре.
 */
export function mergeTimecodes(timecodes: number[], duration: number): Range[] {
  if (duration <= 0) return [];
  const pad = Math.max(1, duration / 96);
  const gap = Math.max(4, duration / 20);
  const ranges: Range[] = [];

  for (const time of [...timecodes].sort((a, b) => a - b)) {
    const last = ranges.at(-1);
    if (last && time - pad - last.end <= gap)
      last.end = Math.min(duration, time + pad);
    else
      ranges.push({
        start: Math.max(0, time - pad),
        end: Math.min(duration, time + pad),
      });
  }
  return ranges;
}

/** Деления шкалы: шаг подбирается так, чтобы подписей было 4–8. */
export function rulerTicks(duration: number): number[] {
  if (duration <= 0) return [0];
  const steps = [10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];
  const step = steps.find((candidate) => duration / candidate <= 6) ?? 3600;
  const ticks: number[] = [];
  for (let tick = 0; tick < duration - step / 3; tick += step) ticks.push(tick);
  return [...ticks, duration];
}
