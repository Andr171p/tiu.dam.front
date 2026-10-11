import { TriangleAlert } from 'lucide-react';
import { useRouteError } from 'react-router';
import { describeError } from '@shared/api';
import { routes } from '@shared/config/routes';
import { ButtonLink } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';

export function RouteError() {
  const error = useRouteError();
  console.error(error);

  return (
    <EmptyState
      icon={TriangleAlert}
      title="Не удалось открыть страницу"
      description={describeError(error)}
      action={
        <ButtonLink to={routes.home()} variant="primary">
          На главную
        </ButtonLink>
      }
    />
  );
}
