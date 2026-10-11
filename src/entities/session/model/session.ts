import Keycloak from 'keycloak-js';
import { create } from 'zustand';
import { api, setAccessTokenProvider, unwrap, type Schemas } from '@shared/api';
import { env } from '@shared/config/env';

export type CurrentUser = Schemas['CurrentUserResponse'];

type SessionState =
  | { status: 'loading' }
  | { status: 'ready'; user: CurrentUser }
  | { status: 'error'; message: string };

export const useSession = create<SessionState>()(() => ({ status: 'loading' }));

const keycloak = new Keycloak({
  url: env.keycloak.url,
  realm: env.keycloak.realm,
  clientId: env.keycloak.clientId,
});

/** Обновляем access-токен заранее, чтобы он не истёк по дороге до сервера. */
const MIN_VALIDITY_SECONDS = 30;

async function accessToken(): Promise<string | null> {
  try {
    await keycloak.updateToken(MIN_VALIDITY_SECONDS);
  } catch {
    // Refresh-токен истёк: заново через страницу входа Keycloak
    await keycloak.login();
  }
  return keycloak.token ?? null;
}

async function loadUser() {
  // Профиль синхронизируется с данными токена при каждом входе
  const user = await unwrap(api.GET('/api/user/v1/users/me'));
  useSession.setState({ status: 'ready', user });
}

/** Вход через Keycloak (Authorization Code + PKCE S256). Без сессии — редирект на форму входа. */
export async function initSession() {
  try {
    await keycloak.init({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
      responseMode: 'fragment',
    });
    setAccessTokenProvider(accessToken);
    await loadUser();
  } catch (error) {
    console.error('Session init failed', error);
    useSession.setState({
      status: 'error',
      message: 'Не удалось войти: сервис авторизации или API недоступны',
    });
  }
}

export function logout() {
  void keycloak.logout({ redirectUri: window.location.origin });
}

export function useCurrentUser(): CurrentUser {
  const session = useSession();
  if (session.status !== 'ready') throw new Error('Session is not ready');
  return session.user;
}
