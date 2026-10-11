/** Адреса экранов. Ссылки строятся только через эти функции. */
export const routes = {
  home: () => '/',
  collection: (id: string) => `/collections/${id}`,
  collectionSettings: (id: string, tab?: string) =>
    `/collections/${id}/settings${tab ? `?tab=${tab}` : ''}`,
  asset: (id: string) => `/assets/${id}`,
  assetEditor: (id: string) => `/assets/${id}/edit`,
  search: (query?: string) =>
    query
      ? `/search?${new URLSearchParams({ q: query }).toString()}`
      : '/search',
  adminTags: () => '/admin/tags',
};
