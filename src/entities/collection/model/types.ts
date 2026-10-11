import type { Schemas } from '@shared/api';

export type Collection = Schemas['CollectionResponse'];
export type CollectionSettings = Schemas['CollectionSettings-Output'];
export type CollectionScope = 'all' | 'mine' | 'public';
export type Member = Schemas['MemberResponse'];
export type MemberRole = Member['role'];
export type MetadataField = Schemas['MetadataField-Output'];
export type Watermark = NonNullable<CollectionSettings['watermark']>;
export type Action = Collection['permissions'][number];

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Владелец',
  moderator: 'Модератор',
  member: 'Участник',
  viewer: 'Просмотр',
};

export const can = (collection: Collection, action: Action) =>
  collection.permissions.includes(action);
