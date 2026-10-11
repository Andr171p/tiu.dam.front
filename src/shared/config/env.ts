export const env = {
  /** Origin API. Пусто — тот же origin (в dev запросы /api проксирует Vite) */
  apiOrigin: import.meta.env.VITE_API_ORIGIN ?? '',
  keycloak: {
    url: import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8081',
    realm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'tiu-media-hub',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'tiu-media-hub-web',
  },
} as const;
