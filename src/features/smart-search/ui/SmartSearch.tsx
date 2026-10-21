import { ImageIcon, Images, ScanFace } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { setReference } from '@entities/search';
import { routes } from '@shared/config/routes';
import { Menu, MenuItem } from '@shared/ui/menu';
import { usePopover } from '@shared/ui/popover';
import { SearchField } from '@shared/ui/search-field';
import styles from './SmartSearch.module.scss';

type ReferenceMode = 'image' | 'face';

/** Поиск по смыслу в шапке: описание словами или изображение-референс. */
export function SmartSearch() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const urlQuery = pathname === routes.search() ? (params.get('q') ?? '') : '';
  const [query, setQuery] = useState(urlQuery);
  const [shownUrlQuery, setShownUrlQuery] = useState(urlQuery);
  const fileRef = useRef<HTMLInputElement>(null);
  const modeRef = useRef<ReferenceMode>('image');
  const { triggerProps, popoverProps } = usePopover();

  // Поле повторяет запрос из адреса: назад/вперёд в истории, переход по ссылке
  if (shownUrlQuery !== urlQuery) {
    setShownUrlQuery(urlQuery);
    setQuery(urlQuery);
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (query.trim()) void navigate(routes.search({ q: query.trim() }));
  };

  const pickReference = (mode: ReferenceMode) => {
    modeRef.current = mode;
    fileRef.current?.click();
  };

  return (
    <form role="search" className={styles.search} onSubmit={submit}>
      <SearchField
        appearance="muted"
        value={query}
        placeholder="Опишите, что ищете, или добавьте изображение"
        aria-label="Умный поиск"
        onChange={(event) => setQuery(event.target.value)}
        trailing={
          <button
            type="button"
            className={styles.imageButton}
            aria-label="Искать по изображению"
            {...triggerProps}
          >
            <ImageIcon size={20} strokeWidth={1.7} aria-hidden />
          </button>
        }
      />
      <Menu {...popoverProps} placement="bottom-end">
        <MenuItem
          icon={Images}
          description="Объекты, композиция и цвет"
          onSelect={() => pickReference('image')}
        >
          Найти похожие кадры
        </MenuItem>
        <MenuItem
          icon={ScanFace}
          description="Фото и видео, где есть этот человек"
          onSelect={() => pickReference('face')}
        >
          Найти человека по фото
        </MenuItem>
      </Menu>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          setReference(file);
          void navigate(
            routes.search({
              by: modeRef.current,
              q: query.trim() || undefined,
            }),
          );
        }}
      />
    </form>
  );
}
