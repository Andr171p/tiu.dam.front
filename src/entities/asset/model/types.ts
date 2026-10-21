import type { Schemas } from '@shared/api';

/** Материал медиатеки со всеми полями: карточка материала. */
export type Asset = Schemas['AssetResponse'];
/** Материал в списках и выдаче поиска. */
export type AssetSummary = Schemas['AssetSummary'];
export type AssetKind = Schemas['AssetKind'];
export type AssetVersion = Schemas['VersionResponse'];
export type License = Schemas['LicenseResponse'];
export type LicenseInput = Schemas['LicenseDTO'];
export type LicenseStatus = Schemas['LicenseStatus'];
export type LicenseType = Schemas['LicenseType'];
export type UsageChannel = Schemas['UsageChannel'];
export type MetadataValue = Schemas['MetadataValue'];
export type AssetUpdate = Schemas['UpdateAssetDTO'];

/** Фильтр ленты материалов: `GET /assets`. */
export interface AssetQuery {
  collectionId?: string;
  kinds?: AssetKind[];
  tags?: string[];
  personId?: string;
  createdBy?: string;
  /** `none` — без лицензии */
  license?: LicenseStatus | 'none';
  trashed?: boolean;
  sort?: 'created_at' | 'updated_at';
}
