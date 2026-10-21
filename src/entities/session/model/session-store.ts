import Keycloak from 'keycloak-js';
import { create } from 'zustand';
import { api, authTokens, describeError } from '@shared/api';
import { env } from '@shared/config/env';
import { resetStores } from '@shared/lib/store-reset';
import type { CurrentUser } from './types';

type SessionStatus = 'restoring' | 'authenticated' | 'anonymous' | 'error';

interface SessionState {
  status: SessionStatus;
  user: CurrentUser | null;
  error: string | null;
}

export const useSession = create<SessionState>()(() => ({
  status: 'restoring',
  user: null,
  error: null,
}));

const keycloak = new Keycloak({
  url: env.keycloak.url,
  realm: env.keycloak.realm,
  clientId: env.keycloak.clientId,
});

/** Обновляем access-токен заранее, чтобы он не истёк по дороге до сервера */
const MIN_VALIDITY_SECONDS = 30;

async function refreshToken(minValidity: number): Promise<string | null> {
  if (!keycloak.authenticated) return null;
  try {
    await keycloak.updateToken(minValidity);
  } catch {
    // Refresh-токен истёк: заново через страницу входа Keycloak
    await keycloak.login();
  }
  return keycloak.token ?? null;
}

authTokens.register({
  get: () => refreshToken(MIN_VALIDITY_SECONDS),
  renew: () => refreshToken(-1),
});

/**
 * Вход через Keycloak (Authorization Code + PKCE S256).
 * `required` — без сессии сразу редирект на форму входа; иначе страница открывается гостю
 * (публичный портал), а возврат после «Войти» обрабатывается здесь же.
 */
export async function initSession({ required }: { required: boolean }) {
  try {
    const authenticated = await keycloak.init({
      // Гостю портала тихо проверяем SSO: сотрудник с активной сессией войдёт без клика
      onLoad: required ? 'login-required' : 'check-sso',
      silentCheckSsoRedirectUri: required
        ? undefined
        : `${window.location.origin}/silent-check-sso.html`,
      pkceMethod: 'S256',
      checkLoginIframe: false,
      responseMode: 'fragment',
    });

    if (!authenticated) {
      useSession.setState({ status: 'anonymous', user: null, error: null });
      return;
    }

    // Профиль синхронизируется с данными токена при каждом входе
    const user = await api.get<CurrentUser>('/me');
    useSession.setState({ status: 'authenticated', user, error: null });
  } catch (error) {
    useSession.setState({
      status: 'error',
      error: `Не удалось войти: ${describeError(error).toLowerCase()}`,
    });
  }
}

export function login() {
  void keycloak.login();
}

export function logout() {
  // Содержимое закрытых коллекций не должно остаться в памяти вкладки
  resetStores();
  void keycloak.logout({ redirectUri: window.location.origin });
}

/** Текущий пользователь в закрытой части приложения (вход там обязателен). */
export function useCurrentUser(): CurrentUser {
  const user = useSession((state) => state.user);
  if (!user) throw new Error('Сессия ещё не готова');
  return user;
}
