import type { Schemas } from '@shared/api';

/** Найденный материал и источники совпадения: кадр, текст, речь, лицо. */
export type SearchHit = Schemas['SearchHit'];
export type SearchMatch = Schemas['SearchMatch'];
export type MatchSource = Schemas['MatchSource'];

export const MATCH_LABELS: Record<MatchSource, string> = {
  visual: 'похожий кадр',
  text: 'описание',
  speech: 'речь',
  face: 'лицо',
};
