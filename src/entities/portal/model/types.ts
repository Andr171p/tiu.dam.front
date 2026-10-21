import type { Schemas } from '@shared/api';

/** Контент-портал: мини-сайт из блоков — обложка, текст, галерея, файлы. */
export type Portal = Schemas['PortalResponse'];
export type PortalAccess = Schemas['PortalAccess'];
export type PortalBlock = Schemas['BlockDTO'];
export type PortalTheme = Schemas['ThemeDTO'];
export type PortalInput = Schemas['CreatePortalDTO'];
export type PortalUpdate = Schemas['UpdatePortalDTO'];

/** Опубликованная страница портала: блоки уже содержат материалы со ссылками. */
export type PublicPortal = Schemas['PublicPortal'];
export type PublicBlock = Schemas['PublicBlock'];
export type PublicAsset = Schemas['PublicAsset'];

export const ACCESS_LABELS: Record<PortalAccess, string> = {
  public: 'Всем по ссылке',
  password: 'По паролю',
  employees: 'Только сотрудникам ТИУ',
};

export const BLOCK_LABELS: Record<NonNullable<PortalBlock['type']>, string> = {
  hero: 'Обложка',
  text: 'Текст',
  gallery: 'Галерея',
  files: 'Файлы для скачивания',
};
