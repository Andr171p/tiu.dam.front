import type { Schemas } from '@shared/api';

/** Коллекция — граница доступа: у материала ровно одна «домашняя» коллекция. */
export type Collection = Schemas['CollectionResponse'];
export type CollectionRole = Schemas['CollectionRole'];
export type Permission = Schemas['Permission'];
export type Visibility = Schemas['Visibility'];
export type MetadataField = Schemas['MetadataFieldDTO'];
export type MetadataFieldType = Schemas['MetadataFieldType'];
export type UploadPolicy = Schemas['UploadPolicyDTO'];
export type Member = Schemas['MemberResponse'];

/**
 * Права приходят с сервера в ответе (коллекции и материала).
 * UI только скрывает недоступные действия, проверяет сервер.
 */
export function can(
  resource: { permissions: Permission[] } | null | undefined,
  permission: Permission,
): boolean {
  return resource?.permissions.includes(permission) ?? false;
}

export const ROLE_LABELS: Record<CollectionRole, string> = {
  viewer: 'Просмотр',
  editor: 'Редактор',
  manager: 'Управляющий',
};

export const ROLE_DESCRIPTIONS: Record<CollectionRole, string> = {
  viewer: 'Смотрит, скачивает и комментирует',
  editor: 'Загружает и редактирует материалы',
  manager: 'Управляет участниками и настройками',
};

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  private: 'Только участники',
  internal: 'Все сотрудники',
};

export const FIELD_TYPE_LABELS: Record<MetadataFieldType, string> = {
  text: 'Текст',
  number: 'Число',
  date: 'Дата',
  boolean: 'Да / нет',
  choice: 'Выбор из списка',
};
