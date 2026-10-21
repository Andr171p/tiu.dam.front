import { useSearchParams } from 'react-router';
import type { AssetKind, AssetQuery, LicenseStatus } from '@entities/asset';

export type View = 'grid' | 'list';
export type LicenseFilter = LicenseStatus | 'none';
type Sort = NonNullable<AssetQuery['sort']>;

export interface BrowserFilters {
  kind: AssetKind | null;
  license: LicenseFilter | null;
  tag: string | null;
  sort: Sort;
  view: View;
}

export const LICENSE_FILTERS: { value: LicenseFilter; label: string }[] = [
  { value: 'active', label: 'Можно публиковать' },
  { value: 'expiring', label: 'Лицензия истекает' },
  { value: 'expired', label: 'Лицензия истекла' },
  { value: 'none', label: 'Нужна проверка' },
];

export const SORTS: { value: Sort; label: string }[] = [
  { value: 'created_at', label: 'Сначала новые' },
  { value: 'updated_at', label: 'Недавно изменённые' },
];

/** Фильтры ленты живут в адресе: ссылкой на отфильтрованную выдачу можно поделиться. */
export function useBrowserFilters() {
  const [params, setParams] = useSearchParams();

  const filters: BrowserFilters = {
    kind: (params.get('kind') as AssetKind | null) ?? null,
    license: (params.get('license') as LicenseFilter | null) ?? null,
    tag: params.get('tag'),
    sort: params.get('sort') === 'updated_at' ? 'updated_at' : 'created_at',
    view: params.get('view') === 'list' ? 'list' : 'grid',
  };

  const setFilter = <K extends keyof BrowserFilters>(
    key: K,
    value: BrowserFilters[K] | null,
  ) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        const isDefault =
          value === null ||
          (key === 'sort' && value === 'created_at') ||
          (key === 'view' && value === 'grid');
        if (isDefault) next.delete(key);
        else next.set(key, String(value));
        return next;
      },
      { replace: true },
    );

  const clearFilters = () =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        ['kind', 'license', 'tag'].forEach((key) => next.delete(key));
        return next;
      },
      { replace: true },
    );

  const query: AssetQuery = {
    kinds: filters.kind ? [filters.kind] : undefined,
    license: filters.license ?? undefined,
    tags: filters.tag ? [filters.tag] : undefined,
    sort: filters.sort,
  };

  return { filters, setFilter, clearFilters, query };
}
