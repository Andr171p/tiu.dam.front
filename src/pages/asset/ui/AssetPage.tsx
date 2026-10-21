import { RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import {
  fileFormat,
  rememberRecentAsset,
  useAsset,
  type Asset,
} from '@entities/asset';
import { can, loadCollections, useCollection } from '@entities/collection';
import { useAssetFaces, type Face } from '@entities/person';
import { useCurrentUser } from '@entities/session';
import { AssignPersonDialog } from '@features/assign-face';
import { MarkButton, resetAnnotation } from '@features/discuss-asset';
import { restoreAsset } from '@features/manage-asset';
import {
  AssetInspector,
  defaultInspectorTab,
  type InspectorTab,
} from '@widgets/asset-inspector';
import { AssetViewer } from '@widgets/asset-viewer';
import { VideoTimeline } from '@widgets/video-timeline';
import { routes } from '@shared/config/routes';
import {
  formatBytes,
  formatDimensions,
  formatTimecode,
} from '@shared/lib/format';
import { Breadcrumbs } from '@shared/ui/breadcrumbs';
import { Button, ButtonLink } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { Notice } from '@shared/ui/notice';
import { Skeleton } from '@shared/ui/skeleton';
import { Tag } from '@shared/ui/tag';
import { AssetActions, DownloadButton } from './AssetActions';
import styles from './AssetPage.module.scss';

/** «JPEG · 6 000 × 4 000 · 18,4 МБ» */
function technicalLine(asset: Asset): string {
  const meta = asset.version.meta;
  return [
    fileFormat(asset),
    meta?.width && meta.height
      ? formatDimensions(meta.width, meta.height)
      : null,
    meta?.duration ? formatTimecode(meta.duration) : null,
    formatBytes(asset.version.file.size),
  ]
    .filter(Boolean)
    .join('  ·  ');
}

function TrashedNotice({ asset }: { asset: Asset }) {
  return (
    <Notice
      action={
        can(asset, 'write') && (
          <Button
            size="sm"
            icon={RotateCcw}
            onClick={() => void restoreAsset(asset.id)}
          >
            Восстановить
          </Button>
        )
      }
    >
      Материал в корзине: через 30 дней он будет удалён навсегда.
    </Notice>
  );
}

function AssetScreen({ asset, startAt }: { asset: Asset; startAt?: number }) {
  const user = useCurrentUser();
  const collection = useCollection(asset.collectionId);
  const faces = useAssetFaces(asset.id, asset.version.id);
  const [tab, setTab] = useState<InspectorTab>(() =>
    defaultInspectorTab(asset),
  );
  const [assigning, setAssigning] = useState<Face | null>(null);
  const isVideo = asset.kind === 'video';
  const back = { to: routes.library(), label: 'Медиатека' };
  // Рамки лиц на фото — только на вкладке «Люди», чтобы не мешать просмотру
  const viewerFaces = isVideo || tab === 'people' ? faces.items : [];

  useEffect(() => {
    rememberRecentAsset(user.id, asset.id);
    void loadCollections();
    return resetAnnotation;
  }, [user.id, asset.id]);

  const inspector = (
    <AssetInspector
      asset={asset}
      tab={tab}
      onTabChange={setTab}
      faces={faces}
      onAssignFace={setAssigning}
      variant={isVideo ? 'card' : 'column'}
    />
  );

  const dialogs = (
    <AssignPersonDialog
      assetId={asset.id}
      face={assigning}
      onClose={() => setAssigning(null)}
    />
  );

  if (isVideo)
    return (
      <div className={styles.video}>
        <header className={styles.videoHeader}>
          <Breadcrumbs back={back} current={asset.version.file.name} />
          <div className={styles.toolbar}>
            <AssetActions asset={asset} withEditor={false} />
            <DownloadButton asset={asset} />
          </div>
        </header>
        <div className={styles.videoBody}>
          <div className={styles.videoMain}>
            {asset.trashedAt && <TrashedNotice asset={asset} />}
            <div className={styles.proxy}>
              <Tag tone="accent">Прокси 720p</Tag>
              <span>Оригинал сохранён · предпросмотр загружается быстрее</span>
            </div>
            <AssetViewer asset={asset} faces={viewerFaces} startAt={startAt} />
            <div className={styles.caption}>
              <h1 className={styles.title}>{asset.title}</h1>
              <MarkButton kind={asset.kind} />
            </div>
            <VideoTimeline asset={asset} faces={faces.items} />
          </div>
          {inspector}
        </div>
        {dialogs}
      </div>
    );

  return (
    <div className={styles.layout}>
      <div className={styles.content}>
        <Breadcrumbs back={back} current={asset.title} />
        <div className={styles.toolbar}>
          <AssetActions asset={asset} withEditor />
          <DownloadButton asset={asset} />
        </div>
        {asset.trashedAt && <TrashedNotice asset={asset} />}

        <AssetViewer
          asset={asset}
          faces={viewerFaces}
          onFaceClick={can(asset, 'write') ? setAssigning : undefined}
          startAt={startAt}
        />

        <div className={styles.caption}>
          <div>
            <h1 className={styles.title}>{asset.version.file.name}</h1>
            <p className={styles.technical}>{technicalLine(asset)}</p>
          </div>
          <span className={styles.version}>
            Версия {asset.version.number} ·{' '}
            {asset.version.sourceVersionId ? 'Правка' : 'Оригинал'}
          </span>
        </div>

        <div className={styles.footer}>
          <MarkButton kind={asset.kind} />
          {collection && (
            <Link to={routes.collection(collection.id)} className={styles.path}>
              {collection.name}
            </Link>
          )}
        </div>
      </div>
      {inspector}
      {dialogs}
    </div>
  );
}

/** Карточка материала: просмотр, права, обсуждение, версии и люди. */
export function AssetPage() {
  const { assetId = '' } = useParams();
  const [params] = useSearchParams();
  const { asset, status, error, httpStatus } = useAsset(assetId);
  const time = params.get('t');

  if (asset?.id === assetId)
    return (
      <AssetScreen
        key={asset.id}
        asset={asset}
        startAt={time ? Number(time) : undefined}
      />
    );

  if (status === 'error')
    return (
      <div className={styles.state}>
        <EmptyState
          title={
            httpStatus === 404
              ? 'Материал не найден'
              : 'Не удалось открыть материал'
          }
          description={
            httpStatus === 404
              ? 'Возможно, его удалили или у вас нет доступа к коллекции.'
              : error
          }
          action={<ButtonLink to={routes.library()}>В медиатеку</ButtonLink>}
        />
      </div>
    );

  return (
    <div className={styles.state}>
      <Skeleton height={580} />
    </div>
  );
}
