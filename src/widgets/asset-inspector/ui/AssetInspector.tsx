import { useState } from 'react';
import {
  displayVersion,
  IssueList,
  worstSeverity,
  type Asset,
} from '@entities/asset';
import { can, type Collection } from '@entities/collection';
import { VersionHistory } from '@features/asset-versions';
import {
  AssetActions,
  AssetDetailsForm,
  CustomMetaForm,
  LicenseForm,
  TagEditor,
} from '@features/edit-asset';
import { Tabs } from '@shared/ui/tabs';
import { FileDetails } from './FileDetails';
import styles from './AssetInspector.module.scss';

type Tab = 'details' | 'license' | 'metadata' | 'versions' | 'file';

export function AssetInspector({
  asset,
  collection,
}: {
  asset: Asset;
  collection: Collection;
}) {
  const [tab, setTab] = useState<Tab>('details');
  const version = displayVersion(asset);
  const severity = worstSeverity(asset.issues);

  const tabs = [
    { value: 'details' as const, label: 'Описание' },
    {
      value: 'license' as const,
      label: 'Права',
      badge: severity === 'error' || severity === 'warning' ? '!' : undefined,
    },
    { value: 'metadata' as const, label: 'Метаданные' },
    { value: 'versions' as const, label: 'Версии', badge: version?.number },
    { value: 'file' as const, label: 'Файл' },
  ];

  return (
    <aside className={styles.inspector}>
      <Tabs
        items={tabs}
        value={tab}
        onChange={setTab}
        className={styles.tabs}
      />

      <div className={styles.body}>
        {tab === 'details' && (
          <div className={styles.stack}>
            <AssetDetailsForm asset={asset} />
            <section className={styles.stack}>
              <h3 className={styles.sectionTitle}>Теги</h3>
              <TagEditor asset={asset} />
            </section>
            <AssetActions asset={asset} />
          </div>
        )}

        {tab === 'license' && (
          <div className={styles.stack}>
            {asset.issues.length > 0 && <IssueList issues={asset.issues} />}
            <LicenseForm asset={asset} />
          </div>
        )}

        {tab === 'metadata' && (
          <CustomMetaForm
            key={asset.updatedAt}
            asset={asset}
            fields={collection.settings.metadataFields}
            canConfigure={can(collection, 'moderate')}
          />
        )}

        {tab === 'versions' && <VersionHistory asset={asset} />}

        {tab === 'file' && version && (
          <FileDetails asset={asset} version={version} />
        )}
      </div>
    </aside>
  );
}
