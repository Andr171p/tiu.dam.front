import type { TagTone } from '@shared/ui/tag';
import type {
  AssetKind,
  AssetSummary,
  LicenseStatus,
  LicenseType,
  UsageChannel,
} from './types';

export const KIND_LABELS: Record<AssetKind, string> = {
  image: 'Фото',
  video: 'Видео',
  audio: 'Аудио',
  document: 'Документ',
  other: 'Файл',
};

/** Фильтр по типу: «Все типы · Фото · Видео · Документы» */
export const KIND_FILTERS: { value: AssetKind; label: string }[] = [
  { value: 'image', label: 'Фото' },
  { value: 'video', label: 'Видео' },
  { value: 'audio', label: 'Аудио' },
  { value: 'document', label: 'Документы' },
];

interface PublicationStatus {
  label: string;
  tone: TagTone;
}

/**
 * Можно ли публиковать материал — выводится из статуса лицензии на сегодня.
 * Статус всегда обозначен текстом, а не только цветом.
 */
export function publicationStatus(
  status: LicenseStatus | null,
): PublicationStatus {
  switch (status) {
    case 'active':
      return { label: 'Можно публиковать', tone: 'success' };
    case 'expiring':
      return { label: 'Лицензия истекает', tone: 'warning' };
    case 'expired':
      return { label: 'Лицензия истекла', tone: 'danger' };
    case 'not_started':
      return { label: 'Лицензия ещё не действует', tone: 'danger' };
    case null:
      return { label: 'Нужна проверка', tone: 'warning' };
  }
}

export const LICENSE_TYPE_LABELS: Record<LicenseType, string> = {
  own: 'Собственный материал ТИУ',
  royalty_free: 'Royalty-free',
  rights_managed: 'Rights-managed',
  creative_commons: 'Creative Commons',
  editorial: 'Только редакционное использование',
  public_domain: 'Общественное достояние',
};

export const CHANNEL_LABELS: Record<UsageChannel, string> = {
  digital: 'Сайт',
  social: 'Соцсети',
  print: 'Печать',
  press: 'СМИ',
  outdoor: 'Наружная реклама',
  tv: 'ТВ',
};

/** «JPEG», «MP4»: формат файла для подписи под просмотром. */
export function fileFormat(asset: Pick<AssetSummary, 'version'>): string {
  const extension = asset.version.file.name.split('.').pop();
  return (
    extension ??
    asset.version.file.contentType.split('/').pop() ??
    ''
  ).toUpperCase();
}
