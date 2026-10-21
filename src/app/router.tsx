import { createBrowserRouter } from 'react-router';
import { AppLayout, type RouteHandle } from './ui/AppLayout';
import { RouteError } from './ui/RouteError';
import { SplashScreen } from './ui/SplashScreen';

/** Медиа и редактор занимают всю ширину: панель материала прижата к краю окна */
const bleed: RouteHandle = { bleed: true };

/** Страницы грузятся по требованию: редактор и плеер не нужны на главной. */
export const router = createBrowserRouter([
  {
    path: '/p/:slug',
    ErrorBoundary: RouteError,
    HydrateFallback: SplashScreen,
    lazy: () =>
      import('@pages/public-portal').then(({ PublicPortalPage }) => ({
        Component: PublicPortalPage,
      })),
  },
  {
    path: '/',
    Component: AppLayout,
    ErrorBoundary: RouteError,
    HydrateFallback: SplashScreen,
    children: [
      {
        index: true,
        lazy: () =>
          import('@pages/library').then(({ LibraryPage }) => ({
            Component: LibraryPage,
          })),
      },
      {
        path: 'collections',
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
        handle: bleed,
        lazy: () =>
          import('@pages/asset').then(({ AssetPage }) => ({
            Component: AssetPage,
          })),
      },
      {
        path: 'assets/:assetId/edit',
        handle: bleed,
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
        path: 'selections',
        lazy: () =>
          import('@pages/selections').then(({ SelectionsPage }) => ({
            Component: SelectionsPage,
          })),
      },
      {
        path: 'selections/:selectionId',
        lazy: () =>
          import('@pages/selection').then(({ SelectionPage }) => ({
            Component: SelectionPage,
          })),
      },
      {
        path: 'portals',
        lazy: () =>
          import('@pages/portals').then(({ PortalsPage }) => ({
            Component: PortalsPage,
          })),
      },
      {
        path: 'portals/:portalId',
        lazy: () =>
          import('@pages/portal').then(({ PortalPage }) => ({
            Component: PortalPage,
          })),
      },
      {
        path: 'people',
        lazy: () =>
          import('@pages/people').then(({ PeoplePage }) => ({
            Component: PeoplePage,
          })),
      },
      {
        path: 'people/:personId',
        lazy: () =>
          import('@pages/person').then(({ PersonPage }) => ({
            Component: PersonPage,
          })),
      },
      {
        path: 'recent',
        lazy: () =>
          import('@pages/recent').then(({ RecentPage }) => ({
            Component: RecentPage,
          })),
      },
      {
        path: 'trash',
        lazy: () =>
          import('@pages/trash').then(({ TrashPage }) => ({
            Component: TrashPage,
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
