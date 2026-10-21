import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { upsertPortal, type Portal } from '@entities/portal';
import { api, describeError } from '@shared/api';
import { routes } from '@shared/config/routes';
import { formText, slugify } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { Dialog, DialogActions } from '@shared/ui/dialog';
import { TextField } from '@shared/ui/field';
import { Notice } from '@shared/ui/notice';

interface CreatePortalDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Новый портал создаётся черновиком: блоки и публикация — в редакторе. */
export function CreatePortalDialog({ open, onClose }: CreatePortalDialogProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const effectiveSlug = slug ?? slugify(title, '-');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const portal = await api.post<Portal>('/portals', {
        body: {
          title: formText(form, 'title'),
          slug: formText(form, 'slug'),
          blocks: [{ type: 'hero', title: formText(form, 'title') }],
        },
      });
      upsertPortal(portal);
      onClose();
      void navigate(routes.portal(portal.id));
    } catch (failure) {
      setError(describeError(failure));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Новый контент-портал"
      description="Пресс-кит или витрина материалов для СМИ, партнёров и команд университета."
    >
      <form className="stack" onSubmit={(event) => void submit(event)}>
        <TextField
          label="Название"
          name="title"
          required
          autoFocus
          placeholder="Медиацентр ТИУ"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <TextField
          label="Адрес"
          name="slug"
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          hint={`${window.location.origin}${routes.publicPortal(effectiveSlug || '…')}`}
          value={effectiveSlug}
          onChange={(event) => setSlug(event.target.value)}
        />
        {error && <Notice>{error}</Notice>}
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="primary" loading={pending}>
            Создать
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
