import { Compass } from 'lucide-react';
import { routes } from '@shared/config/routes';
import { ButtonLink } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Страница не найдена"
      description="Возможно, ссылка устарела или у вас нет доступа к этому разделу."
      action={
        <ButtonLink to={routes.home()} variant="primary">
          К коллекциям
        </ButtonLink>
      }
    />
  );
}
