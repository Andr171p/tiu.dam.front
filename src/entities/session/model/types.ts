import type { Schemas } from '@shared/api';

/** Профиль из токена Keycloak; `isAdmin` — глобальная роль, остальные права — на коллекциях. */
export type CurrentUser = Schemas['MeResponse'];
