import { Check, Link2 } from 'lucide-react';
import { routes } from '@shared/config/routes';
import { useCopyToClipboard } from '@shared/lib/hooks';
import { Button } from '@shared/ui/button';
import { toast } from '@shared/ui/toast';

/** «Поделиться» — ссылка на карточку: откроется у коллег, у которых есть доступ к коллекции. */
export function ShareButton({ assetId }: { assetId: string }) {
  const { copied, copy } = useCopyToClipboard();

  const share = () =>
    copy(
      new URL(routes.asset(assetId), window.location.origin).toString(),
    ).then(
      () => toast.success('Ссылка скопирована'),
      () => toast.error('Не удалось скопировать ссылку'),
    );

  return (
    <Button icon={copied ? Check : Link2} onClick={() => void share()}>
      Поделиться
    </Button>
  );
}
