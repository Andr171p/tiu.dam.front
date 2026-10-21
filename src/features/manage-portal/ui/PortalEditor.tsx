import { ExternalLink, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { loadCollections } from '@entities/collection';
import {
  ACCESS_LABELS,
  BLOCK_LABELS,
  updatePortal,
  type Portal,
  type PortalAccess,
} from '@entities/portal';
import { loadSelections } from '@entities/selection';
import { describeError } from '@shared/api';
import { routes } from '@shared/config/routes';
import { Button } from '@shared/ui/button';
import {
  Checkbox,
  SelectField,
  TextAreaField,
  TextField,
} from '@shared/ui/field';
import { Menu, MenuItem } from '@shared/ui/menu';
import { usePopover } from '@shared/ui/popover';
import { toast } from '@shared/ui/toast';
import {
  emptyBlock,
  toDraft,
  toUpdate,
  type BlockType,
  type PortalDraft,
} from '../model/portal-draft';
import { AssetPicker } from './AssetPicker';
import { BlockEditor } from './BlockEditor';
import styles from './PortalEditor.module.scss';

type ThemeImage = 'logoAssetId' | 'coverAssetId';

/** Настройки портала и его блоки. Публикация — флажок «Опубликован». */
export function PortalEditor({
  portal,
  onSaved,
}: {
  portal: Portal;
  onSaved?: (portal: Portal) => void;
}) {
  const [draft, setDraft] = useState<PortalDraft>(() => toDraft(portal));
  const [pending, setPending] = useState(false);
  const [picking, setPicking] = useState<ThemeImage | null>(null);
  const addMenu = usePopover();

  useEffect(() => {
    void loadCollections();
    void loadSelections();
  }, []);

  const change = (patch: Partial<PortalDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const moveBlock = (index: number, direction: -1 | 1) =>
    setDraft((current) => {
      const blocks = [...current.blocks];
      [blocks[index], blocks[index + direction]] = [
        blocks[index + direction],
        blocks[index],
      ];
      return { ...current, blocks };
    });

  const save = async () => {
    setPending(true);
    try {
      const saved = await updatePortal(portal.id, toUpdate(draft));
      setDraft(toDraft(saved));
      onSaved?.(saved);
      toast.success(
        saved.publishedAt
          ? 'Портал сохранён и опубликован'
          : 'Черновик сохранён',
      );
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={styles.editor}>
      <div className={styles.main}>
        <section className={styles.card}>
          <h2 className={styles.title}>Основное</h2>
          <TextField
            label="Название"
            required
            value={draft.title}
            onChange={(event) => change({ title: event.target.value })}
          />
          <TextField
            label="Адрес"
            required
            value={draft.slug}
            hint={`${window.location.origin}${routes.publicPortal(draft.slug)}`}
            onChange={(event) => change({ slug: event.target.value })}
          />
          <TextAreaField
            label="Описание"
            rows={2}
            value={draft.description}
            onChange={(event) => change({ description: event.target.value })}
          />
        </section>

        {draft.blocks.map((block, index) => (
          <BlockEditor
            key={block.key}
            block={block}
            first={index === 0}
            last={index === draft.blocks.length - 1}
            onChange={(updated) =>
              change({
                blocks: draft.blocks.map((item) =>
                  item.key === block.key ? updated : item,
                ),
              })
            }
            onMove={(direction) => moveBlock(index, direction)}
            onRemove={() =>
              change({
                blocks: draft.blocks.filter((item) => item.key !== block.key),
              })
            }
          />
        ))}

        <div>
          <Button icon={Plus} {...addMenu.triggerProps}>
            Добавить блок
          </Button>
          <Menu {...addMenu.popoverProps}>
            {(Object.keys(BLOCK_LABELS) as BlockType[]).map((type) => (
              <MenuItem
                key={type}
                onSelect={() =>
                  change({ blocks: [...draft.blocks, emptyBlock(type)] })
                }
              >
                {BLOCK_LABELS[type]}
              </MenuItem>
            ))}
          </Menu>
        </div>
      </div>

      <aside className={styles.side}>
        <section className={styles.card}>
          <h2 className={styles.title}>Публикация</h2>
          <Checkbox
            label="Опубликован"
            description="Страница доступна по адресу портала"
            checked={draft.published}
            onChange={(event) => change({ published: event.target.checked })}
          />
          <SelectField
            label="Кто видит"
            value={draft.access}
            onChange={(event) =>
              change({ access: event.target.value as PortalAccess })
            }
          >
            {(Object.keys(ACCESS_LABELS) as PortalAccess[]).map((access) => (
              <option key={access} value={access}>
                {ACCESS_LABELS[access]}
              </option>
            ))}
          </SelectField>
          {draft.access === 'password' && (
            <TextField
              label="Пароль"
              type="password"
              autoComplete="new-password"
              value={draft.password}
              placeholder={
                portal.access === 'password'
                  ? 'Оставьте пустым, чтобы не менять'
                  : ''
              }
              required={portal.access !== 'password'}
              onChange={(event) => change({ password: event.target.value })}
            />
          )}
          <Checkbox
            label="Разрешить скачивание"
            description="Посетители смогут скачать оригиналы"
            checked={draft.allowDownload}
            onChange={(event) =>
              change({ allowDownload: event.target.checked })
            }
          />
          <Button
            variant="primary"
            block
            loading={pending}
            onClick={() => void save()}
          >
            Сохранить
          </Button>
          {portal.publishedAt && (
            <a
              className={styles.open}
              href={routes.publicPortal(portal.slug)}
              target="_blank"
              rel="noreferrer"
            >
              Открыть портал <ExternalLink size={14} aria-hidden />
            </a>
          )}
        </section>

        <section className={styles.card}>
          <h2 className={styles.title}>Оформление</h2>
          <label className={styles.colorField}>
            <input
              type="color"
              value={draft.accentColor}
              onChange={(event) =>
                change({ accentColor: event.target.value.toUpperCase() })
              }
            />
            Акцентный цвет
          </label>
          {(['logoAssetId', 'coverAssetId'] as const).map((key) => (
            <div key={key} className={styles.inline}>
              <span className={styles.secondary}>
                {key === 'logoAssetId' ? 'Логотип' : 'Обложка'}:{' '}
                {draft[key] ? 'выбрано' : 'нет'}
              </span>
              <Button size="sm" onClick={() => setPicking(key)}>
                Выбрать
              </Button>
              {draft[key] && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => change({ [key]: null })}
                >
                  Убрать
                </Button>
              )}
            </div>
          ))}
        </section>
      </aside>

      {picking && (
        <AssetPicker
          open
          title={
            picking === 'logoAssetId' ? 'Логотип портала' : 'Обложка портала'
          }
          kinds={['image']}
          onClose={() => setPicking(null)}
          onPick={([asset]) => change({ [picking]: asset.id })}
        />
      )}
    </div>
  );
}
