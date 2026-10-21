import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useCollections } from '@entities/collection';
import { BLOCK_LABELS } from '@entities/portal';
import { useSelections } from '@entities/selection';
import { plural } from '@shared/lib/format';
import { Button, IconButton } from '@shared/ui/button';
import { SelectField, TextAreaField, TextField } from '@shared/ui/field';
import type { DraftBlock } from '../model/portal-draft';
import { AssetPicker } from './AssetPicker';
import styles from './PortalEditor.module.scss';

interface BlockEditorProps {
  block: DraftBlock;
  first: boolean;
  last: boolean;
  onChange: (block: DraftBlock) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

const splitTags = (value: string) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

function SourceSelect({
  block,
  onChange,
}: Pick<BlockEditorProps, 'onChange'> & {
  block: Extract<DraftBlock, { type: 'gallery' }>;
}) {
  const collections = useCollections((state) => state.items);
  const selections = useSelections((state) => state.items);
  const value = block.collectionId
    ? `collection:${block.collectionId}`
    : block.selectionId
      ? `selection:${block.selectionId}`
      : '';

  return (
    <SelectField
      label="Источник — всегда актуален"
      value={value}
      required
      onChange={(event) => {
        const [kind, id] = event.target.value.split(':');
        onChange({
          ...block,
          collectionId: kind === 'collection' ? id : null,
          selectionId: kind === 'selection' ? id : null,
        });
      }}
    >
      <option value="" disabled>
        Выберите коллекцию или подборку
      </option>
      <optgroup label="Коллекции">
        {collections.map((collection) => (
          <option key={collection.id} value={`collection:${collection.id}`}>
            {collection.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Подборки">
        {selections.map((selection) => (
          <option key={selection.id} value={`selection:${selection.id}`}>
            {selection.name}
          </option>
        ))}
      </optgroup>
    </SelectField>
  );
}

/** Редактор одного блока портала: обложка, текст, галерея или файлы. */
export function BlockEditor({
  block,
  first,
  last,
  onChange,
  onMove,
  onRemove,
}: BlockEditorProps) {
  const [picking, setPicking] = useState(false);

  return (
    <section className={styles.block}>
      <header className={styles.blockHeader}>
        <h3>{BLOCK_LABELS[block.type]}</h3>
        <div className={styles.blockActions}>
          <IconButton
            icon={ArrowUp}
            label="Выше"
            disabled={first}
            onClick={() => onMove(-1)}
          />
          <IconButton
            icon={ArrowDown}
            label="Ниже"
            disabled={last}
            onClick={() => onMove(1)}
          />
          <IconButton icon={Trash2} label="Удалить блок" onClick={onRemove} />
        </div>
      </header>

      {block.type === 'hero' ? (
        <>
          <TextField
            label="Заголовок"
            required
            value={block.title}
            onChange={(event) =>
              onChange({ ...block, title: event.target.value })
            }
          />
          <TextAreaField
            label="Подзаголовок"
            rows={2}
            value={block.subtitle ?? ''}
            onChange={(event) =>
              onChange({ ...block, subtitle: event.target.value || null })
            }
          />
          <div className={styles.inline}>
            <span className={styles.secondary}>
              {block.imageAssetId ? 'Изображение выбрано' : 'Без изображения'}
            </span>
            <Button size="sm" onClick={() => setPicking(true)}>
              Выбрать изображение
            </Button>
            {block.imageAssetId && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onChange({ ...block, imageAssetId: null })}
              >
                Убрать
              </Button>
            )}
          </div>
          {picking && (
            <AssetPicker
              open
              title="Изображение обложки"
              kinds={['image']}
              onClose={() => setPicking(false)}
              onPick={([asset]) =>
                onChange({ ...block, imageAssetId: asset.id })
              }
            />
          )}
        </>
      ) : block.type === 'text' ? (
        <TextAreaField
          label="Текст (Markdown)"
          rows={6}
          value={block.markdown}
          onChange={(event) =>
            onChange({ ...block, markdown: event.target.value })
          }
        />
      ) : block.type === 'gallery' ? (
        <>
          <TextField
            label="Заголовок"
            value={block.title ?? ''}
            onChange={(event) =>
              onChange({ ...block, title: event.target.value || null })
            }
          />
          <SourceSelect block={block} onChange={onChange} />
          <div className={styles.inlineFields}>
            <TextField
              label="Только с тегами"
              placeholder="наука, лаборатории"
              defaultValue={(block.tags ?? []).join(', ')}
              onBlur={(event) =>
                onChange({ ...block, tags: splitTags(event.target.value) })
              }
            />
            <TextField
              label="Не больше"
              type="number"
              min={1}
              max={200}
              value={block.limit ?? 60}
              onChange={(event) =>
                onChange({ ...block, limit: Number(event.target.value) || 60 })
              }
            />
          </div>
        </>
      ) : (
        <>
          <TextField
            label="Заголовок"
            value={block.title ?? ''}
            onChange={(event) =>
              onChange({ ...block, title: event.target.value || null })
            }
          />
          <div className={styles.inline}>
            <span className={styles.secondary}>
              {plural(block.assetIds.length, ['файл', 'файла', 'файлов'])}
            </span>
            <Button size="sm" onClick={() => setPicking(true)}>
              Выбрать файлы
            </Button>
          </div>
          {picking && (
            <AssetPicker
              open
              multiple
              title="Файлы для скачивания"
              initial={block.assetIds}
              onClose={() => setPicking(false)}
              onPick={(assets) =>
                onChange({
                  ...block,
                  assetIds: assets.map((asset) => asset.id),
                })
              }
            />
          )}
        </>
      )}
    </section>
  );
}
