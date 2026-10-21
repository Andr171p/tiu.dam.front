import {
  FlipHorizontal2,
  FlipVertical2,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { formatDimensions } from '@shared/lib/format';
import { Button, IconButton } from '@shared/ui/button';
import { Chip, ChipGroup } from '@shared/ui/chip';
import { Checkbox, SelectField, TextField } from '@shared/ui/field';
import { Slider } from '@shared/ui/slider';
import type { ImageEditorModel } from '../model/use-image-editor';
import { ASPECTS, FILTERS, resultSize, type TextLayer } from '../model/recipe';
import styles from './ImageEditor.module.scss';

const percent = (value: number) =>
  `${value > 0 ? '+' : ''}${Math.round(value * 100)}`;

export function CropPanel({ editor }: { editor: ImageEditorModel }) {
  const { state, original } = editor;
  const size = resultSize(original, {
    ...state,
    resize: { width: null, height: null },
  });

  return (
    <>
      <div className={styles.group}>
        <h3 className={styles.label}>Соотношение сторон</h3>
        <div className={styles.aspects}>
          {ASPECTS.map((aspect) => (
            <Button
              key={aspect.label}
              selected={state.aspect === aspect.value}
              onClick={() => editor.setAspect(aspect.value)}
            >
              {aspect.label}
            </Button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.label}>Размер кадра</h3>
        <p className={styles.readout}>
          {formatDimensions(size.width, size.height)} px
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.group}>
        <h3 className={styles.label}>
          Поворот <span className={styles.value}>{state.rotate}°</span>
        </h3>
        <div className={styles.tools}>
          <Button icon={RotateCcw} onClick={() => editor.rotate(-1)}>
            90°
          </Button>
          <Button icon={RotateCw} onClick={() => editor.rotate(1)}>
            90°
          </Button>
          <IconButton
            icon={FlipHorizontal2}
            label="Отразить по горизонтали"
            variant="secondary"
            size="md"
            selected={state.flipHorizontal}
            onClick={() =>
              editor.update({ flipHorizontal: !state.flipHorizontal })
            }
          />
          <IconButton
            icon={FlipVertical2}
            label="Отразить по вертикали"
            variant="secondary"
            size="md"
            selected={state.flipVertical}
            onClick={() => editor.update({ flipVertical: !state.flipVertical })}
          />
        </div>
      </div>
    </>
  );
}

export function AdjustPanel({ editor }: { editor: ImageEditorModel }) {
  const { adjustments, filter } = editor.state;
  const set = (key: keyof typeof adjustments) => (value: number) =>
    editor.update({ adjustments: { ...adjustments, [key]: value / 100 } });

  return (
    <>
      <Slider
        label="Яркость"
        min={-100}
        max={100}
        value={Math.round(adjustments.brightness * 100)}
        format={(value) => percent(value / 100)}
        onChange={set('brightness')}
      />
      <Slider
        label="Контраст"
        min={-100}
        max={100}
        value={Math.round(adjustments.contrast * 100)}
        format={(value) => percent(value / 100)}
        onChange={set('contrast')}
      />
      <Slider
        label="Насыщенность"
        min={-100}
        max={100}
        value={Math.round(adjustments.saturation * 100)}
        format={(value) => percent(value / 100)}
        onChange={set('saturation')}
      />
      <hr className={styles.divider} />
      <div className={styles.group}>
        <h3 className={styles.label}>Фильтр</h3>
        <ChipGroup>
          {FILTERS.map((option) => (
            <Chip
              key={option.value}
              selected={filter === option.value}
              onClick={() => editor.update({ filter: option.value })}
            >
              {option.label}
            </Chip>
          ))}
        </ChipGroup>
      </div>
    </>
  );
}

export function ResizePanel({ editor }: { editor: ImageEditorModel }) {
  const { state, original } = editor;
  const size = resultSize(original, state);
  const read = (value: string) =>
    value ? Math.max(1, Math.round(Number(value))) : null;

  return (
    <>
      <div className={styles.group}>
        <h3 className={styles.label}>Вписать в рамку</h3>
        <div className={styles.dimensions}>
          <TextField
            label="Ширина, px"
            type="number"
            min={1}
            max={16000}
            placeholder="Авто"
            value={state.resize.width ?? ''}
            onChange={(event) =>
              editor.update({
                resize: { ...state.resize, width: read(event.target.value) },
              })
            }
          />
          <span className={styles.times}>×</span>
          <TextField
            label="Высота, px"
            type="number"
            min={1}
            max={16000}
            placeholder="Авто"
            value={state.resize.height ?? ''}
            onChange={(event) =>
              editor.update({
                resize: { ...state.resize, height: read(event.target.value) },
              })
            }
          />
        </div>
        <p className={styles.hint}>
          Пропорции сохраняются, увеличения нет. Результат:{' '}
          {formatDimensions(size.width, size.height)} px
        </p>
      </div>
      <hr className={styles.divider} />
      <SelectField
        label="Формат"
        value={state.format}
        onChange={(event) =>
          editor.update({ format: event.target.value as typeof state.format })
        }
      >
        <option value="jpeg">JPEG</option>
        <option value="png">PNG</option>
        <option value="webp">WebP</option>
      </SelectField>
      {state.format !== 'png' && (
        <Slider
          label="Качество"
          min={50}
          max={100}
          value={state.quality}
          onChange={(quality) => editor.update({ quality })}
        />
      )}
    </>
  );
}

interface MarkupPanelProps {
  editor: ImageEditorModel;
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function MarkupPanel({ editor, selected, onSelect }: MarkupPanelProps) {
  const { texts } = editor.state;
  const layer = texts.find((item) => item.id === selected);

  const change = (patch: Partial<TextLayer>) =>
    editor.update({
      texts: texts.map((item) =>
        item.id === selected ? { ...item, ...patch } : item,
      ),
    });

  const add = () => {
    const created: TextLayer = {
      id: crypto.randomUUID(),
      text: 'Надпись',
      x: 0.5,
      y: 0.5,
      size: 0.06,
      color: '#FFFFFF',
      bold: true,
      shadow: true,
    };
    editor.update({ texts: [...texts, created] });
    onSelect(created.id);
  };

  return (
    <>
      <p className={styles.hint}>
        Надписи ставятся на итоговый кадр. Перетащите надпись на холсте.
      </p>
      <Button icon={Plus} onClick={add} disabled={texts.length >= 20}>
        Добавить надпись
      </Button>
      {layer && (
        <div className={styles.group}>
          <TextField
            label="Текст"
            value={layer.text}
            maxLength={500}
            onChange={(event) => change({ text: event.target.value })}
          />
          <Slider
            label="Размер"
            min={2}
            max={30}
            value={Math.round(layer.size * 100)}
            format={(value) => `${value}%`}
            onChange={(value) => change({ size: value / 100 })}
          />
          <div className={styles.textOptions}>
            <label className={styles.color}>
              <input
                type="color"
                value={layer.color}
                onChange={(event) =>
                  change({ color: event.target.value.toUpperCase() })
                }
              />
              Цвет
            </label>
            <Checkbox
              label="Жирный"
              checked={layer.bold}
              onChange={(event) => change({ bold: event.target.checked })}
            />
            <Checkbox
              label="Тень"
              checked={layer.shadow}
              onChange={(event) => change({ shadow: event.target.checked })}
            />
            <IconButton
              icon={Trash2}
              label="Удалить надпись"
              onClick={() => {
                editor.update({
                  texts: texts.filter((item) => item.id !== layer.id),
                });
                onSelect(null);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
