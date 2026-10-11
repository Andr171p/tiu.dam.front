import { ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Asset, AssetVersion } from '@entities/asset';
import { formatBytes, formatDateTime } from '@shared/lib/format';
import styles from './AssetInspector.module.scss';

function Row({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === '')
    return null;
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

/** Технические сведения версии: формат, размеры, встроенные метаданные и контрольная сумма. */
export function FileDetails({
  asset,
  version,
}: {
  asset: Asset;
  version: AssetVersion;
}) {
  const meta = version.meta;
  const embedded = meta && 'embedded' in meta ? meta.embedded : undefined;

  return (
    <div className={styles.stack}>
      <div className={styles.integrity}>
        <ShieldCheck size={18} aria-hidden />
        <div>
          <strong>Целостность подтверждена</strong>
          <span>SHA-256 проверен при загрузке и при обработке</span>
          <code>{version.sha256}</code>
        </div>
      </div>

      <dl className={styles.details}>
        <Row label="Файл">{version.originalFilename}</Row>
        <Row label="Тип">{version.contentType}</Row>
        <Row label="Размер">{formatBytes(version.sizeBytes)}</Row>
        {meta?.kind === 'image' && (
          <>
            <Row label="Разрешение">{`${meta.width} × ${meta.height} px`}</Row>
            <Row label="Цвет">
              {[meta.mode, meta.iccProfile].filter(Boolean).join(' · ')}
            </Row>
            <Row label="DPI">{meta.dpi}</Row>
            <Row label="Кадров">{meta.frames > 1 ? meta.frames : null}</Row>
          </>
        )}
        {meta?.kind === 'document' && (
          <>
            <Row label="Страниц">{meta.pageCount}</Row>
            <Row label="Текстовый слой">
              {meta.hasTextLayer == null
                ? null
                : meta.hasTextLayer
                  ? 'есть'
                  : 'нет'}
            </Row>
            <Row label="Защищён паролем">{meta.isEncrypted ? 'да' : null}</Row>
          </>
        )}
        <Row label="Загружен">{formatDateTime(version.createdAt)}</Row>
        <Row label="Автор актива">{asset.author.displayName}</Row>
      </dl>

      {embedded && (
        <>
          <h3 className={styles.sectionTitle}>Сведения из файла</h3>
          <dl className={styles.details}>
            <Row label="Автор">{embedded.creator}</Row>
            <Row label="Правообладатель">{embedded.copyright}</Row>
            <Row label="Условия">{embedded.usageTerms}</Row>
            <Row label="Название">{embedded.title}</Row>
            <Row label="Описание">{embedded.description}</Row>
            <Row label="Ключевые слова">{embedded.keywords?.join(', ')}</Row>
            <Row label="Дата съёмки">
              {embedded.capturedAt ? formatDateTime(embedded.capturedAt) : null}
            </Row>
            <Row label="Камера">{embedded.camera}</Row>
            <Row label="Программа">{embedded.software}</Row>
            <Row label="Геолокация">
              {embedded.hasLocation ? 'есть (удалена из превью)' : null}
            </Row>
          </dl>
        </>
      )}
    </div>
  );
}
