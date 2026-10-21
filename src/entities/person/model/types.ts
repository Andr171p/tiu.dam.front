import type { Schemas } from '@shared/api';

/** Человек из справочника: читают и пополняют все сотрудники. */
export type Person = Schemas['PersonResponse'];
/** Лицо на текущей версии материала: рамка в долях кадра, для видео — таймкоды появлений. */
export type Face = Schemas['FaceResponse'];
