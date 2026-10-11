import { Save } from 'lucide-react';
import { useState } from 'react';
import { useUpdateSettings, type Collection } from '@entities/collection';
import { describeError } from '@shared/api';
import { Button } from '@shared/ui/button';
import { Checkbox, Switch, TextField } from '@shared/ui/field';
import styles from './settings.module.scss';

/** Группы форматов в понятных пользователю терминах: каждая — набор масок MIME. */
const FORMAT_GROUPS = [
  {
    id: 'images',
    label: 'Изображения',
    description: 'JPEG, PNG, WebP, TIFF, GIF…',
    patterns: ['image/*'],
  },
  {
    id: 'pdf',
    label: 'PDF',
    description: 'С предпросмотром первой страницы',
    patterns: ['application/pdf'],
  },
  {
    id: 'office',
    label: 'Документы Office',
    description: 'Word, Excel, PowerPoint, OpenDocument',
    patterns: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.*',
      'application/vnd.ms-excel',
      'application/vnd.ms-powerpoint',
      'application/vnd.oasis.opendocument.*',
      'application/rtf',
    ],
  },
  {
    id: 'text',
    label: 'Текст',
    description: 'TXT, CSV',
    patterns: ['text/plain', 'text/csv'],
  },
];

const MB = 1024 * 1024;

export function PolicySettings({ collection }: { collection: Collection }) {
  const { upload, license } = collection.settings;
  const [groups, setGroups] = useState(
    () =>
      new Set(
        FORMAT_GROUPS.filter((group) =>
          group.patterns.every((p) => upload.allowedMimeTypes.includes(p)),
        ).map((g) => g.id),
      ),
  );
  const [maxSize, setMaxSize] = useState(Math.round(upload.maxFileSize / MB));
  const [licenseRequired, setLicenseRequired] = useState(license.required);
  const update = useUpdateSettings(collection);

  // Маски, которые не входят ни в одну группу (заданы через API), сохраняем как есть
  const known = new Set(FORMAT_GROUPS.flatMap((group) => group.patterns));
  const custom = upload.allowedMimeTypes.filter(
    (pattern) => !known.has(pattern),
  );

  return (
    <form
      className={styles.card}
      onSubmit={(event) => {
        event.preventDefault();
        update.mutate({
          upload: {
            allowedMimeTypes: [
              ...custom,
              ...FORMAT_GROUPS.filter((group) => groups.has(group.id)).flatMap(
                (group) => group.patterns,
              ),
            ],
            maxFileSize: maxSize * MB,
          },
          license: { required: licenseRequired },
        });
      }}
    >
      <h2 className={styles.cardTitle}>Что можно загружать</h2>
      <p className={styles.hint}>
        Тип проверяется дважды: по заявленному при загрузке и по фактическому
        содержимому файла.
      </p>
      <div className={styles.checks}>
        {FORMAT_GROUPS.map((group) => (
          <Checkbox
            key={group.id}
            label={group.label}
            description={group.description}
            checked={groups.has(group.id)}
            onChange={(event) =>
              setGroups((current) => {
                const next = new Set(current);
                if (event.target.checked) next.add(group.id);
                else next.delete(group.id);
                return next;
              })
            }
          />
        ))}
      </div>
      <TextField
        label="Максимальный размер файла, МБ"
        type="number"
        min={1}
        max={1024}
        value={maxSize}
        onChange={(event) => setMaxSize(Number(event.target.value))}
        className={styles.field}
      />

      <h2 className={styles.cardTitle}>Права</h2>
      <Switch
        label="Лицензия обязательна"
        description="Активы без лицензии отмечаются как нарушение, а не предупреждение"
        checked={licenseRequired}
        onChange={(event) => setLicenseRequired(event.target.checked)}
      />

      {update.error && (
        <p className={styles.hint}>{describeError(update.error)}</p>
      )}
      <div className={styles.actions}>
        <Button
          type="submit"
          variant="primary"
          icon={Save}
          loading={update.isPending}
          disabled={!groups.size && !custom.length}
        >
          Сохранить
        </Button>
      </div>
    </form>
  );
}
