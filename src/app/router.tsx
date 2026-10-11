import { createBrowserRouter } from 'react-router';
import { AppLayout } from './ui/AppLayout';
import { RouteError } from './ui/RouteError';

/** Страницы грузятся по требованию: редактор изображений не нужен на главной. */
export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    ErrorBoundary: RouteError,
    children: [
      {
        index: true,
        lazy: () =>
          import('@pages/collections').then(({ CollectionsPage }) => ({
            Component: CollectionsPage,
          })),
      },
      {
        path: 'collections/:collectionId',
        lazy: () =>
          import('@pages/collection').then(({ CollectionPage }) => ({
            Component: CollectionPage,
          })),
      },
      {
        path: 'collections/:collectionId/settings',
        lazy: () =>
          import('@pages/collection-settings').then(
            ({ CollectionSettingsPage }) => ({
              Component: CollectionSettingsPage,
            }),
          ),
      },
      {
        path: 'assets/:assetId',
        lazy: () =>
          import('@pages/asset').then(({ AssetPage }) => ({
            Component: AssetPage,
          })),
      },
      {
        path: 'assets/:assetId/edit',
        lazy: () =>
          import('@pages/asset-editor').then(({ AssetEditorPage }) => ({
            Component: AssetEditorPage,
          })),
      },
      {
        path: 'search',
        lazy: () =>
          import('@pages/search').then(({ SearchPage }) => ({
            Component: SearchPage,
          })),
      },
      {
        path: 'admin/tags',
        lazy: () =>
          import('@pages/admin-tags').then(({ AdminTagsPage }) => ({
            Component: AdminTagsPage,
          })),
      },
      {
        path: '*',
        lazy: () =>
          import('@pages/not-found').then(({ NotFoundPage }) => ({
            Component: NotFoundPage,
          })),
      },
    ],
  },
]);
