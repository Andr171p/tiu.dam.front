import type { Portal, PortalBlock, PortalUpdate } from '@entities/portal';
import type { Schemas } from '@shared/api';

type Typed<T, K extends string> = Omit<T, 'type'> & { type: K };

/**
 * Блок в редакторе: тип всегда указан (в DTO он необязателен — по умолчанию `hero`)
 * и есть стабильный ключ строки, пока порядок меняется.
 */
export type DraftBlock = (
  | Typed<Schemas['HeroBlockDTO'], 'hero'>
  | Typed<Schemas['TextBlockDTO'], 'text'>
  | Typed<Schemas['GalleryBlockDTO'], 'gallery'>
  | Typed<Schemas['FilesBlockDTO'], 'files'>
) & { key: string };

export type BlockType = DraftBlock['type'];

export interface PortalDraft {
  title: string;
  slug: string;
  description: string;
  access: Portal['access'];
  /** Пустой — пароль не меняется */
  password: string;
  allowDownload: boolean;
  published: boolean;
  accentColor: string;
  logoAssetId: string | null;
  coverAssetId: string | null;
  blocks: DraftBlock[];
}

const toDraftBlock = (block: PortalBlock): DraftBlock =>
  ({
    ...block,
    type: block.type ?? 'hero',
    key: crypto.randomUUID(),
  }) as DraftBlock;

export function toDraft(portal: Portal): PortalDraft {
  return {
    title: portal.title,
    slug: portal.slug,
    description: portal.description ?? '',
    access: portal.access,
    password: '',
    allowDownload: portal.allowDownload,
    published: portal.publishedAt !== null,
    accentColor: portal.theme.accentColor ?? '#034EA2',
    logoAssetId: portal.theme.logoAssetId ?? null,
    coverAssetId: portal.theme.coverAssetId ?? null,
    blocks: portal.blocks.map(toDraftBlock),
  };
}

export function emptyBlock(type: BlockType): DraftBlock {
  const key = crypto.randomUUID();
  switch (type) {
    case 'hero':
      return {
        key,
        type,
        title: 'Заголовок',
        subtitle: null,
        imageAssetId: null,
      };
    case 'text':
      return { key, type, markdown: '' };
    case 'gallery':
      return {
        key,
        type,
        title: 'Медиаматериалы',
        collectionId: null,
        selectionId: null,
        tags: [],
        limit: 60,
      };
    case 'files':
      return { key, type, title: 'Файлы для скачивания', assetIds: [] };
  }
}

export function toUpdate(draft: PortalDraft): PortalUpdate {
  return {
    title: draft.title.trim(),
    slug: draft.slug.trim(),
    description: draft.description.trim() || null,
    access: draft.access,
    password:
      draft.access === 'password' && draft.password
        ? draft.password
        : undefined,
    allowDownload: draft.allowDownload,
    published: draft.published,
    theme: {
      accentColor: draft.accentColor,
      logoAssetId: draft.logoAssetId,
      coverAssetId: draft.coverAssetId,
    },
    blocks: draft.blocks.map(({ key: _, ...block }) => block),
  };
}
