import { Link } from 'react-router';
import { seekTo, type Asset } from '@entities/asset';
import { can } from '@entities/collection';
import { FaceAvatar, type Face } from '@entities/person';
import { routes } from '@shared/config/routes';
import { formatTimecode } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { Notice } from '@shared/ui/notice';
import { Skeleton } from '@shared/ui/skeleton';
import { Tag } from '@shared/ui/tag';
import styles from './AssetInspector.module.scss';

interface PeoplePanelProps {
  asset: Asset;
  faces: {
    status: 'loading' | 'ready' | 'error';
    items: Face[];
    error: string | null;
  };
  onAssign: (face: Face) => void;
}

/** Люди на материале: распознанные автоматически и подписанные вручную. */
export function PeoplePanel({ asset, faces, onAssign }: PeoplePanelProps) {
  const editable = can(asset, 'write');
  const isVideo = asset.kind === 'video';
  const unnamed = faces.items.filter((face) => !face.personId).length;

  if (faces.status === 'error') return <Notice>{faces.error}</Notice>;
  if (faces.status === 'loading' && faces.items.length === 0)
    return <Skeleton height={120} />;
  if (faces.items.length === 0)
    return (
      <EmptyState
        title={
          asset.version.status === 'processing'
            ? 'Ищем людей…'
            : 'Людей не найдено'
        }
        description="Лица распознаются после обработки файла автоматически."
      />
    );

  return (
    <div className={styles.people}>
      <p className={styles.aiNote}>
        {isVideo ? 'Найдено участников' : 'Найдено лиц'}: {faces.items.length}
        {unnamed > 0 && `, без подписи — ${unnamed}`}. Подпись одного лица ищет
        человека на остальных материалах.
      </p>

      <ul className={styles.faces}>
        {faces.items.map((face, index) => (
          <li key={face.id} className={styles.faceRow}>
            <FaceAvatar src={face.thumbnailUrl} name={face.personName} />
            <div className={styles.faceText}>
              {face.personId ? (
                <Link
                  to={routes.person(face.personId)}
                  className={styles.faceName}
                >
                  {face.personName}
                </Link>
              ) : (
                <span className={styles.faceName}>
                  {isVideo
                    ? `Участник ${String(index + 1).padStart(2, '0')}`
                    : 'Не подписан'}
                </span>
              )}
              {face.personId && !face.confirmed && (
                <Tag tone="ai">Распознан AI</Tag>
              )}
              {isVideo && face.timecodes.length > 0 && (
                <div className={styles.timecodes}>
                  {face.timecodes.slice(0, 6).map((timecode) => (
                    <button
                      key={timecode}
                      type="button"
                      className={styles.timecode}
                      onClick={() => seekTo(timecode)}
                    >
                      {formatTimecode(timecode)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {editable && (
              <Button size="sm" onClick={() => onAssign(face)}>
                {face.personId ? 'Изменить' : 'Подписать'}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
