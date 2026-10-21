import clsx from 'clsx';
import {
  Check,
  Clock,
  Crop,
  Image as ImageIcon,
  MessageSquare,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Asset } from '@entities/asset';
import { describeError } from '@shared/api';
import { routes } from '@shared/config/routes';
import { Breadcrumbs } from '@shared/ui/breadcrumbs';
import { Button, ButtonLink } from '@shared/ui/button';
import { Checkbox } from '@shared/ui/field';
import { Tag } from '@shared/ui/tag';
import { toast } from '@shared/ui/toast';
import { isPristine } from '../model/recipe';
import { useImageEditor } from '../model/use-image-editor';
import { EditorStage } from './EditorStage';
import {
  AdjustPanel,
  CropPanel,
  MarkupPanel,
  ResizePanel,
} from './EditorPanels';
import styles from './ImageEditor.module.scss';

type Tool = 'crop' | 'adjust' | 'resize' | 'markup';

const TOOLS: { value: Tool; label: string; icon: LucideIcon }[] = [
  { value: 'crop', label: 'Обрезка', icon: Crop },
  { value: 'adjust', label: 'Коррекция', icon: SlidersHorizontal },
  { value: 'resize', label: 'Размер', icon: ImageIcon },
  { value: 'markup', label: 'Разметка', icon: MessageSquare },
];

const ZOOMS = [0.5, 0.75, 1, 1.5, 2];

/**
 * Редактор изображения: собирает рецепт и показывает предпросмотр,
 * сервер применяет рецепт к оригиналу. Оригинал не меняется — появляется новая версия.
 */
export function ImageEditor({ asset }: { asset: Asset }) {
  const navigate = useNavigate();
  const editor = useImageEditor(asset);
  const [tool, setTool] = useState<Tool>('crop');
  const [zoom, setZoom] = useState(1);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [asNewAsset, setAsNewAsset] = useState(false);
  const [saving, setSaving] = useState(false);
  const preview = asset.version.urls.preview ?? asset.version.urls.thumbnail;
  const toolLabel = TOOLS.find((item) => item.value === tool)?.label;

  const save = async () => {
    setSaving(true);
    try {
      const { assetId, ready } = await editor.save(
        asNewAsset ? 'asset' : 'version',
      );
      if (ready)
        toast.success(
          asNewAsset ? 'Создан новый материал' : 'Новая версия готова',
        );
      else
        toast.info(
          'Правка ещё обрабатывается — версия появится в карточке материала',
        );
      void navigate(routes.asset(assetId));
    } catch (error) {
      toast.error(describeError(error));
      setSaving(false);
    }
  };

  return (
    <div className={styles.editor}>
      <header className={styles.header}>
        <Breadcrumbs
          back={{ to: routes.asset(asset.id), label: 'К материалу' }}
        />
        <h1 className={styles.title}>Редактирование изображения</h1>
        <div className={styles.headerActions}>
          <ButtonLink to={routes.asset(asset.id)}>Отмена</ButtonLink>
          <Button
            variant="primary"
            icon={Check}
            loading={saving}
            disabled={isPristine(editor.state)}
            onClick={() => void save()}
          >
            {saving
              ? 'Применяем правки…'
              : asNewAsset
                ? 'Сохранить материал'
                : 'Сохранить версию'}
          </Button>
        </div>
      </header>

      <div className={styles.workspace}>
        <nav className={styles.rail} aria-label="Инструменты">
          {TOOLS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              className={clsx(
                styles.toolButton,
                tool === value && styles.toolActive,
              )}
              aria-pressed={tool === value}
              onClick={() => setTool(value)}
            >
              <Icon size={24} strokeWidth={1.6} aria-hidden />
              {label}
            </button>
          ))}
        </nav>

        <div className={styles.canvas}>
          {preview ? (
            <EditorStage
              src={preview}
              state={editor.state}
              oriented={editor.oriented}
              zoom={zoom}
              cropping={tool === 'crop'}
              marking={tool === 'markup'}
              selectedText={selectedText}
              onCrop={(crop) => editor.update({ crop })}
              onMoveText={(id, position) =>
                editor.update({
                  texts: editor.state.texts.map((layer) =>
                    layer.id === id ? { ...layer, ...position } : layer,
                  ),
                })
              }
              onSelectText={(id) => {
                setSelectedText(id);
                setTool('markup');
              }}
            />
          ) : (
            <p className={styles.noPreview}>
              Превью ещё не готово — дождитесь обработки файла.
            </p>
          )}
          <div className={styles.canvasFooter}>
            <div className={styles.zoom}>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                aria-label="Уменьшить"
                disabled={zoom === ZOOMS[0]}
                onClick={() =>
                  setZoom(ZOOMS[Math.max(0, ZOOMS.indexOf(zoom) - 1)])
                }
              >
                −
              </button>
              <button
                type="button"
                aria-label="Увеличить"
                disabled={zoom === ZOOMS.at(-1)}
                onClick={() =>
                  setZoom(
                    ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(zoom) + 1)],
                  )
                }
              >
                +
              </button>
            </div>
            <Tag tone="surface">Оригинал остаётся без изменений</Tag>
          </div>
        </div>

        <aside className={styles.panel}>
          <h2 className={styles.panelTitle}>{toolLabel}</h2>
          {tool === 'crop' && <CropPanel editor={editor} />}
          {tool === 'adjust' && <AdjustPanel editor={editor} />}
          {tool === 'resize' && <ResizePanel editor={editor} />}
          {tool === 'markup' && (
            <MarkupPanel
              editor={editor}
              selected={selectedText}
              onSelect={setSelectedText}
            />
          )}

          <Button
            block
            onClick={editor.reset}
            disabled={isPristine(editor.state)}
          >
            Сбросить
          </Button>

          <div className={styles.versionInfo}>
            <p className={styles.versionTitle}>
              <Clock size={20} strokeWidth={1.7} aria-hidden />
              {asNewAsset
                ? 'Будет создан новый материал'
                : `Будет создана версия ${asset.versionCount + 1}`}
            </p>
            <p className={styles.hint}>
              История правок и исходный файл сохранятся в карточке материала.
            </p>
            <Checkbox
              label="Сохранить отдельным материалом"
              checked={asNewAsset}
              onChange={(event) => setAsNewAsset(event.target.checked)}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
