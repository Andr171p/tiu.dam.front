import type { Schemas } from '@shared/api';

export type Asset = Schemas['AssetResponse'];
export type AssetVersion = Schemas['VersionResponse'];
export type AssetKind = Asset['kind'];
export type License = Schemas['License-Output'];
export type LicenseType = License['type'];
export type Issue = Schemas['Issue'];
export type ImageMeta = Schemas['ImageMeta'];
export type DocumentMeta = Schemas['DocumentMeta'];

export const KIND_LABELS: Record<AssetKind, string> = {
  image: 'Изображения',
  document: 'Документы',
  other: 'Другое',
};

export const LICENSE_LABELS: Record<LicenseType, string> = {
  'all-rights-reserved': 'Все права защищены',
  cc0: 'CC0 — общественное достояние',
  'cc-by': 'CC BY — с указанием автора',
  'cc-by-sa': 'CC BY-SA — с указанием автора, на тех же условиях',
  'cc-by-nd': 'CC BY-ND — без производных',
  'cc-by-nc': 'CC BY-NC — некоммерческое',
  'cc-by-nc-sa': 'CC BY-NC-SA — некоммерческое, на тех же условиях',
  'cc-by-nc-nd': 'CC BY-NC-ND — некоммерческое, без производных',
  'public-domain': 'Общественное достояние',
  custom: 'Особые условия',
};

/** Обработка ещё идёт: первая версия или новая, ожидающая проверки. */
export function isProcessing(asset: Asset): boolean {
  return asset.pendingVersion?.status === 'processing';
}

export function hasFailed(asset: Asset): boolean {
  return asset.pendingVersion?.status === 'failed';
}

export function worstSeverity(issues: Issue[]): Issue['severity'] | null {
  if (issues.some((issue) => issue.severity === 'error')) return 'error';
  if (issues.some((issue) => issue.severity === 'warning')) return 'warning';
  return issues.length ? 'info' : null;
}

/** Версия для показа: текущая, а пока её нет — обрабатываемая. */
export function displayVersion(asset: Asset): AssetVersion | null {
  return asset.currentVersion ?? asset.pendingVersion ?? null;
}
