import { RouterProvider } from 'react-router/dom';
import { useSession } from '@entities/session';
import { ConfirmHost } from '@shared/ui/dialog';
import { Toaster } from '@shared/ui/toast';
import { router } from './router';
import { SplashScreen } from './ui/SplashScreen';

export function App() {
  const status = useSession((state) => state.status);
  const error = useSession((state) => state.error);

  if (status === 'restoring') return <SplashScreen />;
  if (status === 'error') return <SplashScreen error={error} />;

  return (
    <>
      <RouterProvider router={router} />
      <ConfirmHost />
      <Toaster />
    </>
  );
}
