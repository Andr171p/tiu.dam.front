import { toApiError } from './api-error';
import { authTokens } from './auth-tokens';

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  /** Массивы передаются повторением параметра: `kinds=image&kinds=video` */
  query?: Record<string, QueryValue | readonly QueryValue[]>;
  /** JSON-тело запроса */
  body?: unknown;
  /** multipart/form-data: поиск по изображению */
  form?: FormData;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Тонкая обёртка над fetch: базовый URL, Bearer-токен (если есть сессия),
 * повтор после 401 и единый формат ошибок.
 */
export class BackendCaller {
  readonly #baseUrl: string;

  constructor(baseUrl: string) {
    this.#baseUrl = baseUrl;
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.#json<T>('GET', path, options);
  }

  post<T = void>(path: string, options?: RequestOptions): Promise<T> {
    return this.#json<T>('POST', path, options);
  }

  put<T = void>(path: string, options?: RequestOptions): Promise<T> {
    return this.#json<T>('PUT', path, options);
  }

  patch<T = void>(path: string, options?: RequestOptions): Promise<T> {
    return this.#json<T>('PATCH', path, options);
  }

  delete(path: string, options?: RequestOptions): Promise<void> {
    return this.#json<void>('DELETE', path, options);
  }

  async #json<T>(
    method: string,
    path: string,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await this.#send(method, path, options);
    if (response.status === 202 || response.status === 204) {
      const text = await response.text();
      return (text ? JSON.parse(text) : undefined) as T;
    }
    return (await response.json()) as T;
  }

  async #send(
    method: string,
    path: string,
    { query, body, form, headers, signal }: RequestOptions = {},
  ): Promise<Response> {
    const request = (token: string | null) =>
      fetch(this.#url(path, query), {
        method,
        signal,
        headers: {
          ...(body !== undefined && { 'Content-Type': 'application/json' }),
          ...(token && { Authorization: `Bearer ${token}` }),
          ...headers,
        },
        body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      });

    let token = await authTokens.get();
    let response = await request(token);

    if (token && response.status === 401) {
      token = await authTokens.renew();
      if (token) response = await request(token);
    }

    if (!response.ok) throw await toApiError(response);
    return response;
  }

  #url(path: string, query: RequestOptions['query'] = {}): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      const values: readonly QueryValue[] = Array.isArray(value)
        ? value
        : [value];
      for (const item of values) {
        if (item !== null && item !== undefined)
          params.append(key, String(item));
      }
    }

    const search = params.size > 0 ? `?${params.toString()}` : '';
    return `${this.#baseUrl}${path}${search}`;
  }
}
