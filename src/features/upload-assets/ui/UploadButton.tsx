import { Upload } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Spinner } from '@shared/ui/spinner';
import { openUploadDialog, useActiveUploads } from '../model/upload-store';

/** «Загрузить» в шапке; пока идут загрузки — показывает прогресс и открывает очередь. */
export function UploadButton({ collectionId }: { collectionId?: string }) {
  const { active, total } = useActiveUploads();
  const busy = active > 0;

  return (
    <Button
      variant="primary"
      icon={busy ? undefined : Upload}
      onClick={() => openUploadDialog(collectionId)}
    >
      {busy && <Spinner size={18} />}
      {busy ? `Готово ${total - active} из ${total}` : 'Загрузить'}
    </Button>
  );
}
