import { useInfiniteQuery } from '@tanstack/react-query';
import {
  File,
  FileText,
  ImageIcon,
  LayoutGrid,
  SearchX,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { AssetCard, type AssetKind } from '@entities/asset';
import { api, unwrap } from '@shared/api';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { SearchInput } from '@shared/ui/search-input';
import { Segmented } from '@shared/ui/segmented';
import { Skeleton } from '@shared/ui/skeleton';
import styles from './SearchPage.module.scss';

type KindFilter = AssetKind | 'all';

const KINDS = [
  { value: 'all' as const, label: 'Всё', icon: LayoutGrid },
  { value: 'image' as const, label: 'Изображения', icon: ImageIcon },
  { value: 'document' as const, label: 'Документы', icon: FileText },
  { value: 'other' as const, label: 'Другое', icon: File },
];

const EXAMPLES = [
  'студенты в аудитории',
  'главный корпус зимой',
  'выпускной',
  'логотип на синем фоне',
];
const PAGE_SIZE = 30;

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [draft, setDraft] = useState(query);
  const [kind, setKind] = useState<KindFilter>('all');

  const results = useInfiniteQuery({
    queryKey: ['search', query, kind],
    queryFn: ({ pageParam, signal }) =>
      unwrap(
        api.POST('/api/user/v1/search', {
          body: {
            query,
            kinds: kind === 'all' ? [] : [kind],
            limit: PAGE_SIZE,
            offset: pageParam,
          },
          signal,
        }),
      ),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.hasMore ? last.offset + last.limit : undefined,
    enabled: query.length > 0,
  });

  const submit = (value: string) => {
    const trimmed = value.trim();
    setDraft(trimmed);
    setSearchParams(trimmed ? { q: trimmed } : {});
  };

  const items = results.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Поиск по смыслу</h1>
        <p className={styles.subtitle}>
          <Sparkles size={15} aria-hidden /> Опишите, что должно быть на
          изображении — подписи и теги не обязательны
        </p>
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            submit(draft);
          }}
        >
          <SearchInput
            size="lg"
            value={draft}
            onChange={setDraft}
            placeholder="Например: студенты на выпускном у главного корпуса"
            autoFocus
          />
        </form>
        {!query && (
          <div className={styles.examples}>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                className={styles.example}
                onClick={() => submit(example)}
              >
                {example}
              </button>
            ))}
          </div>
        )}
      </section>

      {query && (
        <>
          <div className={styles.toolbar}>
            <Segmented
              label="Тип файлов"
              options={KINDS}
              value={kind}
              onChange={setKind}
            />
          </div>

          {results.isPending ? (
            <div className={styles.grid}>
              {Array.from({ length: 10 }, (_, index) => (
                <Skeleton
                  key={index}
                  height="auto"
                  radius={14}
                  className={styles.skeleton}
                />
              ))}
            </div>
          ) : items.length ? (
            <>
              <div className={styles.grid}>
                {items.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              </div>
              {results.hasNextPage && (
                <div className={styles.more}>
                  <Button
                    loading={results.isFetchingNextPage}
                    onClick={() => void results.fetchNextPage()}
                  >
                    Показать ещё
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={SearchX}
              title="Ничего не нашлось"
              description="Попробуйте описать изображение другими словами или проверьте фильтр по типу."
            />
          )}
        </>
      )}
    </div>
  );
}
