import { Download, ShieldCheck } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import Markdown from 'react-markdown';
import {
  downloadPublicAsset,
  type PublicAsset,
  type PublicBlock,
  type PublicPortal,
} from '@entities/portal';
import { login, useSession } from '@entities/session';
import { describeError, type Schemas } from '@shared/api';
import { env } from '@shared/config/env';
import { formatBytes, plural } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { Chip, ChipGroup } from '@shared/ui/chip';
import { Logo } from '@shared/ui/logo';
import { SearchField } from '@shared/ui/search-field';
import { Tag } from '@shared/ui/tag';
import { toast } from '@shared/ui/toast';
import { PortalAssetDialog } from './PortalAssetDialog';
import styles from './PortalView.module.scss';

type Gallery = Schemas['PublicGallery'];
type Files = Schemas['PublicFiles'];
type Hero = Schemas['PublicHero'];
type Text = Schemas['PublicText'];

const ofType = <T extends PublicBlock>(blocks: PublicBlock[], type: string) =>
  blocks.filter((block) => (block.type ?? 'hero') === type) as T[];

function Galleries({
  galleries,
  onOpen,
}: {
  galleries: Gallery[];
  onOpen: (asset: PublicAsset) => void;
}) {
  const [category, setCategory] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const pool =
    category === null
      ? galleries.flatMap((gallery) => gallery.items)
      : galleries[category].items;
  const unique = [...new Map(pool.map((asset) => [asset.id, asset])).values()];
  const needle = query.trim().toLowerCase();
  const items = needle
    ? unique.filter((asset) =>
        `${asset.title} ${asset.description ?? ''}`
          .toLowerCase()
          .includes(needle),
      )
    : unique;
  const total = new Set(
    galleries.flatMap((gallery) => gallery.items.map((asset) => asset.id)),
  ).size;

  return (
    <section className={styles.materials} id="materials">
      <header className={styles.materialsHeader}>
        <div>
          <h2 className={styles.materialsTitle}>Медиаматериалы</h2>
          <p className={styles.muted}>
            {plural(total, ['материал', 'материала', 'материалов'])}
          </p>
        </div>
        <SearchField
          className={styles.search}
          placeholder="Поиск по пресс-киту"
          aria-label="Поиск по пресс-киту"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </header>

      {galleries.length > 1 && (
        <ChipGroup aria-label="Разделы" className={styles.categories}>
          <Chip selected={category === null} onClick={() => setCategory(null)}>
            Все материалы
          </Chip>
          {galleries.map((gallery, index) => (
            <Chip
              key={index}
              selected={category === index}
              onClick={() => setCategory(index)}
            >
              {gallery.title ?? `Раздел ${index + 1}`}
            </Chip>
          ))}
        </ChipGroup>
      )}

      {items.length === 0 ? (
        <p className={styles.muted}>Ничего не нашлось.</p>
      ) : (
        <div className={styles.grid}>
          {items.map((asset) => (
            <button
              key={asset.id}
              type="button"
              className={styles.card}
              onClick={() => onOpen(asset)}
            >
              <span className={styles.cardImage}>
                {asset.thumbnailUrl && (
                  <img src={asset.thumbnailUrl} alt="" loading="lazy" />
                )}
              </span>
              <span className={styles.cardTitle}>{asset.title}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function FilesList({
  slug,
  block,
  allowDownload,
}: {
  slug: string;
  block: Files;
  allowDownload: boolean;
}) {
  return (
    <section className={styles.files}>
      <h2 className={styles.materialsTitle}>{block.title ?? 'Файлы'}</h2>
      <ul className={styles.fileList}>
        {block.items.map((asset) => (
          <li key={asset.id} className={styles.file}>
            <span className={styles.fileName}>{asset.fileName}</span>
            <span className={styles.muted}>{formatBytes(asset.fileSize)}</span>
            {allowDownload && (
              <Button
                size="sm"
                icon={Download}
                onClick={() =>
                  void downloadPublicAsset(slug, asset.id).catch(
                    (error: unknown) => toast.error(describeError(error)),
                  )
                }
              >
                Скачать
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Опубликованный контент-портал: пресс-кит для СМИ, партнёров и команд университета. */
export function PortalView({
  slug,
  portal,
}: {
  slug: string;
  portal: PublicPortal;
}) {
  const session = useSession();
  const [opened, setOpened] = useState<PublicAsset | null>(null);
  const hero = ofType<Hero>(portal.blocks, 'hero')[0];
  const texts = ofType<Text>(portal.blocks, 'text');
  const galleries = ofType<Gallery>(portal.blocks, 'gallery');
  const files = ofType<Files>(portal.blocks, 'files');
  const heroImage = hero?.image ?? portal.cover;

  return (
    <div
      className={styles.portal}
      style={
        {
          '--color-accent': portal.accentColor,
          '--color-accent-text': portal.accentColor,
          '--color-accent-icon': portal.accentColor,
          '--color-focus': portal.accentColor,
        } as CSSProperties
      }
    >
      <header className={styles.header}>
        <Logo product="portal" title={portal.title} />
        <nav className={styles.nav}>
          {texts.length > 0 && <a href="#about">О портале</a>}
          <a href="#terms">Правила использования</a>
        </nav>
        {session.status === 'authenticated' ? (
          <span className={styles.muted}>{session.user?.displayName}</span>
        ) : (
          <Button onClick={login}>Войти</Button>
        )}
      </header>

      <main className={styles.main}>
        {hero && (
          <section className={styles.hero}>
            <div className={styles.heroText}>
              <Tag tone="accent">ОФИЦИАЛЬНЫЕ МАТЕРИАЛЫ</Tag>
              <h1 className={styles.heroTitle}>{hero.title}</h1>
              {(hero.subtitle ?? portal.description) && (
                <p className={styles.heroSubtitle}>
                  {hero.subtitle ?? portal.description}
                </p>
              )}
            </div>
            {heroImage?.previewUrl && (
              <img
                className={styles.heroImage}
                src={heroImage.previewUrl}
                alt=""
              />
            )}
          </section>
        )}

        {texts.map((block, index) => (
          <section
            key={index}
            id={index === 0 ? 'about' : undefined}
            className={styles.text}
          >
            <Markdown>{block.markdown}</Markdown>
          </section>
        ))}

        {galleries.length > 0 && (
          <Galleries galleries={galleries} onOpen={setOpened} />
        )}

        {files.map((block, index) => (
          <FilesList
            key={index}
            slug={slug}
            block={block}
            allowDownload={portal.allowDownload}
          />
        ))}

        <footer className={styles.footer} id="terms">
          <p>
            <ShieldCheck size={20} strokeWidth={1.7} aria-hidden />
            Публикация с указанием «Пресс-служба ТИУ». Условия доступны в
            карточке каждого файла.
          </p>
          {env.pressContactUrl && (
            <a href={env.pressContactUrl} className={styles.contact}>
              Связаться с пресс-службой →
            </a>
          )}
        </footer>
      </main>

      <PortalAssetDialog
        slug={slug}
        asset={opened}
        allowDownload={portal.allowDownload}
        onClose={() => setOpened(null)}
      />
    </div>
  );
}
