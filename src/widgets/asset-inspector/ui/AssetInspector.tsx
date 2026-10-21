import type { Asset } from '@entities/asset';
import { can } from '@entities/collection';
import type { Face } from '@entities/person';
import { VersionsPanel } from '@features/asset-versions';
import { TabPanel, Tabs } from '@shared/ui/tabs';
import { inspectorTabs, type InspectorTab } from '../model/tabs';
import { InfoPanel } from './InfoPanel';
import { PeoplePanel } from './PeoplePanel';
import { ScenesPanel } from './ScenesPanel';
import { TranscriptPanel } from './TranscriptPanel';
import styles from './AssetInspector.module.scss';

interface AssetInspectorProps {
  asset: Asset;
  tab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  faces: {
    status: 'loading' | 'ready' | 'error';
    items: Face[];
    error: string | null;
  };
  onAssignFace: (face: Face) => void;
  /** Видео: панель — карточка справа; остальное — колонка во всю высоту */
  variant?: 'column' | 'card';
}

/** Панель материала: сведения, версии, люди и расшифровка. */
export function AssetInspector({
  asset,
  tab,
  onTabChange,
  faces,
  onAssignFace,
  variant = 'column',
}: AssetInspectorProps) {
  return (
    <aside className={variant === 'card' ? styles.card : styles.column}>
      <Tabs
        label="Разделы материала"
        items={inspectorTabs(asset)}
        value={tab}
        onChange={onTabChange}
        className={styles.tabs}
      />
      <div className={styles.body}>
        <TabPanel>
          {tab === 'info' && <InfoPanel asset={asset} />}
          {tab === 'versions' && (
            <VersionsPanel
              asset={asset}
              editable={can(asset, 'write') && !asset.trashedAt}
            />
          )}
          {tab === 'people' && (
            <PeoplePanel asset={asset} faces={faces} onAssign={onAssignFace} />
          )}
          {tab === 'transcript' && <TranscriptPanel asset={asset} />}
          {tab === 'scenes' && <ScenesPanel />}
        </TabPanel>
      </div>
    </aside>
  );
}
