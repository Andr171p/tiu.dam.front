type SearchParams = Record<string, string | undefined>;

function withQuery(path: string, params: SearchParams = {}): string {
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  ).toString();
  return query ? `${path}?${query}` : path;
}

/** Режим поиска: по смыслу текста, по изображению-референсу, по лицу на селфи. */
export type SearchMode = 'text' | 'image' | 'face';

/** Адреса экранов. Ссылки строятся только через эти функции. */
export const routes = {
  library: () => '/',
  collections: () => '/collections',
  collection: (id: string) => `/collections/${id}`,
  collectionSettings: (id: string) => `/collections/${id}/settings`,
  asset: (id: string, at?: number) =>
    withQuery(`/assets/${id}`, {
      t: at === undefined ? undefined : String(Math.floor(at)),
    }),
  assetEditor: (id: string) => `/assets/${id}/edit`,
  search: (params: { q?: string; by?: Exclude<SearchMode, 'text'> } = {}) =>
    withQuery('/search', params),
  selections: () => '/selections',
  selection: (id: string) => `/selections/${id}`,
  portals: () => '/portals',
  portal: (id: string) => `/portals/${id}`,
  publicPortal: (slug: string) => `/p/${slug}`,
  people: () => '/people',
  person: (id: string) => `/people/${id}`,
  recent: () => '/recent',
  trash: () => '/trash',
};

/** Публичные страницы порталов открываются без входа. */
export const isPublicPath = (pathname: string) => pathname.startsWith('/p/');
