import {
  Droplet,
  ListChecks,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Navigate, useParams, useSearchParams } from 'react-router';
import { can, useCollection } from '@entities/collection';
import { WatermarkEditor } from '@features/configure-watermark';
import { GeneralSettings, PolicySettings } from '@features/edit-collection';
import { MetadataSchemaEditor } from '@features/edit-metadata-schema';
import { MembersPanel } from '@features/manage-members';
import { routes } from '@shared/config/routes';
import { PageHeader } from '@shared/ui/page-header';
import { Skeleton } from '@shared/ui/skeleton';
import { Tabs } from '@shared/ui/tabs';
import styles from './CollectionSettingsPage.module.scss';

const TABS = [
  { value: 'general' as const, label: 'Основное', icon: Settings2 },
  { value: 'members' as const, label: 'Участники', icon: Users },
  { value: 'metadata' as const, label: 'Метаданные', icon: ListChecks },
  { value: 'watermark' as const, label: 'Водяной знак', icon: Droplet },
  { value: 'policy' as const, label: 'Загрузка и права', icon: ShieldCheck },
];

type Tab = (typeof TABS)[number]['value'];

export function CollectionSettingsPage() {
  const { collectionId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const collection = useCollection(collectionId);
  const tab = (TABS.find((item) => item.value === searchParams.get('tab'))
    ?.value ?? 'general') satisfies Tab;

  if (collection.isError) throw collection.error;
  if (!collection.data) return <Skeleton height={320} radius={20} />;

  const current = collection.data;
  if (!can(current, 'moderate'))
    return <Navigate to={routes.collection(current.id)} replace />;

  return (
    <div className={styles.page}>
      <PageHeader
        back={{ to: routes.collection(current.id), label: current.name }}
        title="Настройки коллекции"
      >
        <Tabs
          items={TABS}
          value={tab}
          onChange={(value) =>
            setSearchParams({ tab: value }, { replace: true })
          }
        />
      </PageHeader>

      <div className={tab === 'watermark' ? styles.wide : styles.content}>
        {tab === 'general' && (
          <GeneralSettings key={current.updatedAt} collection={current} />
        )}
        {tab === 'members' && <MembersPanel collection={current} />}
        {tab === 'metadata' && (
          <MetadataSchemaEditor key={current.updatedAt} collection={current} />
        )}
        {tab === 'watermark' && (
          <WatermarkEditor key={current.updatedAt} collection={current} />
        )}
        {tab === 'policy' && (
          <PolicySettings key={current.updatedAt} collection={current} />
        )}
      </div>
    </div>
  );
}
