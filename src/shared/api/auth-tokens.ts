/**
 * Источник access-токена. Сессия (Keycloak) регистрирует его при старте,
 * поэтому shared/api не зависит от слоя сессии.
 */
export interface TokenSource {
  /** Действующий токен, при необходимости обновлённый; null — гость */
  get(): Promise<string | null>;
  /** Сервер отклонил токен: обновить принудительно */
  renew(): Promise<string | null>;
}

const anonymous: TokenSource = {
  get: () => Promise.resolve(null),
  renew: () => Promise.resolve(null),
};

let source = anonymous;

export const authTokens = {
  register(next: TokenSource) {
    source = next;
  },
  get: () => source.get(),
  renew: () => source.renew(),
};
