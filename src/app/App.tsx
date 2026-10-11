import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router/dom';
import { useSession } from '@entities/session';
import { ApiError } from '@shared/api';
import { router } from './router';
import { SplashScreen } from './ui/SplashScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      // Ошибки доступа и отсутствия повторять бессмысленно
      retry: (count, error) =>
        !(error instanceof ApiError && error.status < 500) && count < 2,
    },
  },
});

export function App() {
  const session = useSession();

  if (session.status === 'loading') return <SplashScreen />;
  if (session.status === 'error')
    return <SplashScreen error={session.message} />;

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
