/** Ошибка API в формате бэкенда: `{ errorCode, message, details }`. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(
    status: number,
    message: string,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ErrorBody {
  errorCode?: string;
  message?: string;
  details?: unknown;
  /** Формат валидации FastAPI */
  detail?: string | { msg?: string }[];
}

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Требуется авторизация',
  403: 'Недостаточно прав для этого действия',
  404: 'Не найдено',
  410: 'Ссылка устарела, обновите страницу',
  413: 'Файл слишком большой',
  422: 'Проверьте введённые данные',
  429: 'Слишком много запросов, попробуйте позже',
  503: 'Сервис временно недоступен',
};

export async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as ErrorBody | null;
  const validation = Array.isArray(body?.detail)
    ? body.detail[0]?.msg
    : body?.detail;
  // 409 — нарушение правила: сообщение сервера объясняет, какого именно
  const message =
    (response.status === 409 ? body?.message : undefined) ??
    STATUS_MESSAGES[response.status] ??
    (response.status >= 500 ? 'Сервис временно недоступен' : undefined) ??
    validation ??
    body?.message ??
    'Не удалось выполнить запрос';

  return new ApiError(response.status, message, body?.errorCode, body?.details);
}

/** Текст ошибки, который можно показать пользователю. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) return 'Нет соединения с сервером';
  return 'Что-то пошло не так';
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}
