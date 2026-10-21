import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  AssetCard,
  AssetRow,
  KIND_FILTERS,
  useAssetFeed,
  type AssetQuery,
  type AssetSummary,
} from '@entities/asset';
import { plural } from '@shared/lib/format';
import { Button, IconButton } from '@shared/ui/button';
import { Chip, ChipGroup } from '@shared/ui/chip';
import { InlineSelect } from '@shared/ui/inline-select';
import { Menu, MenuItem, MenuLabel, MenuSeparator } from '@shared/ui/menu';
import { Notice } from '@shared/ui/notice';
import { SectionHeader } from '@shared/ui/page-header';
import { usePopover } from '@shared/ui/popover';
import { Skeleton } from '@shared/ui/skeleton';
import { Tag } from '@shared/ui/tag';
import { LICENSE_FILTERS, SORTS, useBrowserFilters } from '../model/filters';
import styles from './AssetBrowser.module.scss';

interface AssetBrowserProps {
  title: string;
  /** Постоянная часть запроса: коллекция, человек, корзина */
  scope?: AssetQuery;
  /** Сколько всего материалов, если известно (без фильтров) */
  total?: number | null;
  empty: ReactNode;
  /** Действие на карточке: восстановить из корзины */
  action?: (asset: AssetSummary) => ReactNode;
}

const PAGE_SIZE = 48;

function FiltersMenu() {
  const { filters, setFilter, clearFilters } = useBrowserFilters();
  const { triggerProps, popoverProps } = usePopover();
  const active =
    Number(Boolean(filters.license)) + Number(Boolean(filters.tag));

  return (
    <>
      <Button icon={SlidersHorizontal} {...triggerProps}>
        Фильтры{active > 0 && ` · ${active}`}
      </Button>
      <Menu {...popoverProps}>
        <MenuLabel>Публикация</MenuLabel>
        {LICENSE_FILTERS.map((option) => (
          <MenuItem
            key={option.value}
            selected={filters.license === option.value}
            onSelect={() =>
              setFilter(
                'license',
                filters.license === option.value ? null : option.value,
              )
            }
          >
            {option.label}
          </MenuItem>
        ))}
        {active > 0 && (
          <>
            <MenuSeparator />
            <MenuItem onSelect={clearFilters}>Сбросить фильтры</MenuItem>
          </>
        )}
      </Menu>
    </>
  );
}

/** Лента материалов с фильтрами, сортировкой и видом «сетка / список». */
export function AssetBrowser({
  title,
  scope,
  total,
  empty,
  action,
}: AssetBrowserProps) {
  const { filters, setFilter, query } = useBrowserFilters();
  const feed = useAssetFeed({ ...scope, ...query }, PAGE_SIZE);
  const filtered = Boolean(filters.kind || filters.license || filters.tag);
  const known = filtered ? null : total;
  const Item = filters.view === 'list' ? AssetRow : AssetCard;
  const license = LICENSE_FILTERS.find(
    (option) => option.value === filters.license,
  );

  return (
    <section className={styles.browser}>
      <SectionHeader
        title={title}
        count={known != null ? known.toLocaleString('ru-RU') : undefined}
      />

      <div className={styles.toolbar}>
        <FiltersMenu />
        <ChipGroup aria-label="Тип материала" className={styles.kinds}>
          <Chip
            selected={!filters.kind}
            onClick={() => setFilter('kind', null)}
          >
            Все типы
          </Chip>
          {KIND_FILTERS.map((kind) => (
            <Chip
              key={kind.value}
              selected={filters.kind === kind.value}
              onClick={() => setFilter('kind', kind.value)}
            >
              {kind.label}
            </Chip>
          ))}
        </ChipGroup>
        {license && (
          <Tag tone="accent" onRemove={() => setFilter('license', null)}>
            {license.label}
          </Tag>
        )}
        {filters.tag && (
          <Tag tone="accent" onRemove={() => setFilter('tag', null)}>
            #{filters.tag}
          </Tag>
        )}
        <div className={styles.end}>
          <InlineSelect
            label="Сортировка"
            value={filters.sort}
            options={SORTS}
            onChange={(sort) => setFilter('sort', sort)}
          />
          <div className={styles.views}>
            <IconButton
              icon={LayoutGrid}
              label="Сеткой"
              size="md"
              variant={filters.view === 'grid' ? 'secondary' : 'ghost'}
              onClick={() => setFilter('view', 'grid')}
            />
            <IconButton
              icon={List}
              label="Списком"
              size="md"
              variant={filters.view === 'list' ? 'secondary' : 'ghost'}
              onClick={() => setFilter('view', 'list')}
            />
          </div>
        </div>
      </div>

      {feed.error && <Notice>{feed.error}</Notice>}

      {feed.status === 'loading' && feed.items.length === 0 ? (
        <div className={filters.view === 'list' ? styles.list : styles.grid}>
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} height={filters.view === 'list' ? 88 : 212} />
          ))}
        </div>
      ) : feed.status === 'ready' && feed.items.length === 0 ? (
        empty
      ) : (
        <div
          className={filters.view === 'list' ? styles.list : styles.grid}
          aria-busy={feed.status === 'loading'}
        >
          {feed.items.map((asset) => (
            <Item key={asset.id} asset={asset} action={action?.(asset)} />
          ))}
        </div>
      )}

      {feed.items.length > 0 && (
        <footer className={styles.footer}>
          <span>
            Показано{' '}
            {plural(feed.items.length, ['материал', 'материала', 'материалов'])}
            {known != null &&
              known > feed.items.length &&
              ` из ${known.toLocaleString('ru-RU')}`}
          </span>
          {feed.hasNext && (
            <Button loading={feed.loadingMore} onClick={feed.loadMore}>
              Показать ещё
            </Button>
          )}
        </footer>
      )}
    </section>
  );
}
