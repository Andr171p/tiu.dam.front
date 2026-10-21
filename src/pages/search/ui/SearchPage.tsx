import { ImageIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AssetCard, KIND_FILTERS, type AssetKind } from '@entities/asset';
import {
  clearReference,
  MATCH_LABELS,
  runSearch,
  setReference,
  useSearch,
  type SearchHit,
} from '@entities/search';
import { routes, type SearchMode } from '@shared/config/routes';
import { formatTimecode, plural } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { Chip, ChipGroup } from '@shared/ui/chip';
import { EmptyState } from '@shared/ui/empty-state';
import { InlineSelect } from '@shared/ui/inline-select';
import { Notice } from '@shared/ui/notice';
import { PageHeader } from '@shared/ui/page-header';
import { Skeleton } from '@shared/ui/skeleton';
import { Tag } from '@shared/ui/tag';
import styles from './SearchPage.module.scss';

type Order = 'relevance' | 'newest';

const ORDERS: { value: Order; label: string }[] = [
  { value: 'relevance', label: 'По сходству' },
  { value: 'newest', label: 'Сначала новые' },
];

const REFERENCE_COPY = {
  image: {
    tag: 'Поиск по изображению',
    title: 'Найти похожие кадры',
    text: 'Учитываем объекты, композицию и цвет. Текст уточняет результат.',
  },
  face: {
    tag: 'Поиск по лицу',
    title: 'Найти человека',
    text: 'Ищем фото и видео, где есть человек с референса.',
  },
};

/** Подпись совпадения: «речь · 01:24», «похожий кадр». */
function matchNote(hit: SearchHit): string | undefined {
  const match = hit.matches[0];
  if (!match) return undefined;
  const parts = [MATCH_LABELS[match.source]];
  if (match.timecode != null) parts.push(formatTimecode(match.timecode));
  if (match.snippet) parts.push(`«${match.snippet}»`);
  return parts.join(' · ');
}

function ReferenceCard({ mode }: { mode: Exclude<SearchMode, 'text'> }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reference = useSearch((state) => state.reference);
  const fileRef = useRef<HTMLInputElement>(null);
  const copy = REFERENCE_COPY[mode];

  return (
    <section className={styles.reference}>
      {reference ? (
        <img
          src={reference.previewUrl}
          alt="Референс"
          className={styles.referenceImage}
        />
      ) : (
        <span className={styles.referenceImage}>
          <ImageIcon size={28} strokeWidth={1.5} aria-hidden />
        </span>
      )}
      <div className={styles.referenceText}>
        <Tag tone="accent">{copy.tag.toUpperCase()}</Tag>
        <h2>{copy.title}</h2>
        <p>
          {reference ? copy.text : 'Добавьте изображение, чтобы начать поиск.'}
        </p>
      </div>
      <div className={styles.referenceActions}>
        <Button icon={ImageIcon} onClick={() => fileRef.current?.click()}>
          {reference ? 'Заменить' : 'Выбрать'}
        </Button>
        {reference && (
          <Button
            variant="link"
            className={styles.removeReference}
            onClick={() => {
              clearReference();
              const q = params.get('q');
              void navigate(q ? routes.search({ q }) : routes.library());
            }}
          >
            Удалить референс
          </Button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) setReference(file);
        }}
      />
    </section>
  );
}

/** Результаты умного поиска: по смыслу запроса, по изображению или по лицу. */
export function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';
  const by = params.get('by');
  const mode: SearchMode = by === 'image' || by === 'face' ? by : 'text';
  const { status, hits, error, reference } = useSearch();
  const [kind, setKind] = useState<AssetKind | null>(null);
  const [publishable, setPublishable] = useState(false);
  const [order, setOrder] = useState<Order>('relevance');

  useEffect(() => {
    void runSearch({ mode, query, kinds: kind ? [kind] : [] });
  }, [mode, query, kind, reference]);

  // «Можно публиковать» и порядок — поверх уже авторизованной сервером выдачи
  const visible = hits
    .filter((hit) => !publishable || hit.asset.licenseStatus === 'active')
    .sort((a, b) =>
      order === 'newest'
        ? b.asset.createdAt.localeCompare(a.asset.createdAt)
        : 0,
    );

  return (
    <div className={styles.page}>
      <PageHeader
        title="Результаты поиска"
        description={
          status === 'ready'
            ? `${plural(visible.length, ['материал', 'материала', 'материалов'])} · По смыслу запроса, а не только по названию`
            : query
              ? `«${query}»`
              : undefined
        }
      />

      {mode !== 'text' && <ReferenceCard mode={mode} />}

      <div className={styles.toolbar}>
        <ChipGroup aria-label="Тип материала">
          <Chip selected={!kind} onClick={() => setKind(null)}>
            Все типы
          </Chip>
          {KIND_FILTERS.map((option) => (
            <Chip
              key={option.value}
              selected={kind === option.value}
              onClick={() => setKind(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </ChipGroup>
        {publishable ? (
          <Tag tone="accent" onRemove={() => setPublishable(false)}>
            Можно публиковать
          </Tag>
        ) : (
          <Chip onClick={() => setPublishable(true)}>Можно публиковать</Chip>
        )}
        <InlineSelect
          label="Порядок"
          value={order}
          options={ORDERS}
          onChange={setOrder}
          className={styles.order}
        />
      </div>

      {status === 'error' && <Notice>{error}</Notice>}
      {status === 'idle' && (
        <EmptyState
          title="Что ищем?"
          description="Опишите кадр словами — «студенты в лаборатории» — или добавьте изображение в поле поиска."
        />
      )}
      {status === 'loading' && (
        <div className={styles.grid}>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} height={230} />
          ))}
        </div>
      )}
      {status === 'ready' &&
        (visible.length === 0 ? (
          <EmptyState
            title="Ничего не нашлось"
            description="Попробуйте описать кадр иначе или снимите фильтры."
          />
        ) : (
          <div className={styles.grid}>
            {visible.map((hit) => {
              const timecode = hit.matches.find(
                (match) => match.timecode != null,
              )?.timecode;
              return (
                <AssetCard
                  key={hit.asset.id}
                  asset={hit.asset}
                  to={routes.asset(hit.asset.id, timecode ?? undefined)}
                  note={matchNote(hit)}
                />
              );
            })}
          </div>
        ))}
    </div>
  );
}
