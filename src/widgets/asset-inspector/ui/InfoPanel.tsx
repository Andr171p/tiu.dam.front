import { ShieldCheck } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
  CHANNEL_LABELS,
  LICENSE_TYPE_LABELS,
  PublicationBadge,
  type Asset,
  type MetadataValue,
} from '@entities/asset';
import { can, useCollection, type MetadataField } from '@entities/collection';
import { UserName } from '@entities/user';
import { Discussion } from '@features/discuss-asset';
import {
  LicenseDialog,
  MetadataDialog,
  TagsEditor,
} from '@features/edit-asset';
import { formatDate, formatDateTime } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import styles from './AssetInspector.module.scss';

function formatValue(
  field: MetadataField,
  value: MetadataValue | undefined,
): string {
  if (value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  if (Array.isArray(value)) return value.join(', ');
  if (field.type === 'date' && typeof value === 'string')
    return formatDate(value);
  return String(value);
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function LicenseSection({
  asset,
  editable,
}: {
  asset: Asset;
  editable: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const license = asset.license;
  const period = license?.period;

  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          <ShieldCheck size={20} strokeWidth={1.7} aria-hidden />
          Права и лицензия
        </h3>
        {editable && (
          <Button variant="link" onClick={() => setEditing(true)}>
            {license ? 'Изменить' : 'Указать'}
          </Button>
        )}
      </header>

      {license ? (
        <>
          <dl className={styles.rows}>
            <Row label="Тип">{LICENSE_TYPE_LABELS[license.type]}</Row>
            <Row label="Разрешено">
              {license.channels?.length
                ? license.channels
                    .map((channel) => CHANNEL_LABELS[channel])
                    .join(', ')
                : 'Любые носители'}
            </Row>
            {(period?.start || period?.end) && (
              <Row label="Действует">
                {period.start && `с ${formatDate(period.start)} `}
                {period.end && `до ${formatDate(period.end)}`}
              </Row>
            )}
            {license.holder && <Row label="Автор">{license.holder}</Row>}
            {license.territories?.length ? (
              <Row label="Территории">{license.territories.join(', ')}</Row>
            ) : null}
          </dl>
          {license.restrictions && (
            <p className={styles.note}>{license.restrictions}</p>
          )}
        </>
      ) : (
        <p className={styles.muted}>
          Лицензия не указана — перед публикацией уточните права у автора.
        </p>
      )}

      {editing && (
        <LicenseDialog asset={asset} open onClose={() => setEditing(false)} />
      )}
    </section>
  );
}

function FieldsSection({
  asset,
  editable,
}: {
  asset: Asset;
  editable: boolean;
}) {
  const collection = useCollection(asset.collectionId);
  const [editing, setEditing] = useState(false);
  const schema = collection?.metadataSchema ?? [];
  const values = asset.metadata as Record<string, MetadataValue>;
  if (schema.length === 0) return null;

  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Сведения</h3>
        {editable && (
          <Button variant="link" onClick={() => setEditing(true)}>
            Заполнить
          </Button>
        )}
      </header>
      <dl className={styles.rows}>
        {schema.map((field) => (
          <Row key={field.key} label={field.label}>
            {formatValue(field, values[field.key])}
          </Row>
        ))}
      </dl>
      {editing && (
        <MetadataDialog
          asset={asset}
          schema={schema}
          open
          onClose={() => setEditing(false)}
        />
      )}
    </section>
  );
}

/** «Информация»: статус публикации, AI-теги, права, сведения и обсуждение. */
export function InfoPanel({ asset }: { asset: Asset }) {
  const editable = can(asset, 'write') && !asset.trashedAt;

  return (
    <div className={styles.info}>
      <div className={styles.status}>
        <PublicationBadge status={asset.licenseStatus} />
        <p className={styles.muted}>
          Добавлено {formatDateTime(asset.createdAt)} ·{' '}
          <UserName id={asset.createdBy} />
        </p>
      </div>

      {asset.description && (
        <p className={styles.description}>{asset.description}</p>
      )}

      <TagsEditor asset={asset} editable={editable} />
      <hr className={styles.divider} />
      <LicenseSection asset={asset} editable={editable} />
      <FieldsSection asset={asset} editable={editable} />
      <hr className={styles.divider} />
      <Discussion asset={asset} />
    </div>
  );
}
