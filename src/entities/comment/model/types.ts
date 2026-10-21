import type { Schemas } from '@shared/api';

/** Обсуждение к версии материала; ответы — один уровень. */
export type Comment = Schemas['CommentResponse'];
export type CommentAnchor = Schemas['AnchorDTO'];
/** Область изображения в долях кадра */
export type RegionAnchor = Schemas['RegionDTO'];
/** Момент или отрезок видео в секундах */
export type TimeAnchor = Schemas['TimeRangeDTO'];

export interface NewComment {
  text: string;
  versionId?: string;
  anchor?: CommentAnchor | null;
}

export const isRegion = (
  anchor: CommentAnchor | null | undefined,
): anchor is RegionAnchor => anchor?.type === 'region';

export const isTime = (
  anchor: CommentAnchor | null | undefined,
): anchor is TimeAnchor => anchor?.type === 'time';
