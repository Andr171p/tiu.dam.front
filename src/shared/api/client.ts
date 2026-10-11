import createClient, { type Middleware } from 'openapi-fetch';
import { env } from '../config/env';
import { toApiError } from './errors';
import type { paths } from './schema';

type TokenProvider = () => Promise<string | null>;

let getAccessToken: TokenProvider = () => Promise.resolve(null);

/** Сессия регистрирует источник токена: shared/api не зависит от слоя сессии. */
export function setAccessTokenProvider(provider: TokenProvider) {
  getAccessToken = provider;
}

const auth: Middleware = {
  async onRequest({ request }) {
    const token = await getAccessToken();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },
};

/** Типизированный клиент: пути, параметры и ответы берутся из OpenAPI бэкенда (`npm run api:types`). */
export const api = createClient<paths>({ baseUrl: env.apiOrigin });
api.use(auth);

interface Result<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/** Данные ответа или исключение `ApiError`: удобно для react-query. */
export async function unwrap<T>(request: Promise<Result<T>>): Promise<T> {
  const { data, error, response } = await request;
  if (!response.ok) throw toApiError(response.status, error);
  return data as T;
}
