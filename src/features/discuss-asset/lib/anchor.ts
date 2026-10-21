import { isRegion, isTime, type CommentAnchor } from '@entities/comment';
import { formatTimecode } from '@shared/lib/format';

/** «Область на изображении», «Момент 01:24», «Отрезок 00:52 — 02:04». */
export function describeAnchor(
  anchor: CommentAnchor | null | undefined,
): string | null {
  if (isRegion(anchor)) return 'Область на изображении';
  if (isTime(anchor))
    return anchor.end != null && anchor.end > anchor.start
      ? `Отрезок ${formatTimecode(anchor.start)} — ${formatTimecode(anchor.end)}`
      : `Момент ${formatTimecode(anchor.start)}`;
  return null;
}
