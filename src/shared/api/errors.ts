/** Ошибка API в формате бэкенда: `{ errorCode, message, details }`. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly details: unknown;

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

  /** Ошибки по полям (валидация кастомных метаданных): `{ поле: сообщение }`. */
  get fieldErrors(): Record<string, string> {
    return this.details &&
      typeof this.details === 'object' &&
      !Array.isArray(this.details)
      ? (this.details as Record<string, string>)
      : {};
  }
}

interface ErrorBody {
  errorCode?: string;
  message?: string;
  details?: unknown;
  /** Валидация FastAPI */
  detail?: string | { msg?: string; loc?: (string | number)[] }[];
}

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Сессия истекла, войдите снова',
  403: 'Недостаточно прав для этого действия',
  404: 'Не найдено',
  409: 'Конфликт: данные уже изменились',
  413: 'Файл слишком большой',
  422: 'Проверьте введённые данные',
  503: 'Сервис временно недоступен',
};

export function toApiError(status: number, body: unknown): ApiError {
  const error = (body ?? {}) as ErrorBody;
  const validation = Array.isArray(error.detail) ? error.detail[0] : undefined;
  const message =
    validation?.msg ??
    (typeof error.detail === 'string' ? error.detail : undefined) ??
    STATUS_MESSAGES[status] ??
    error.message ??
    'Не удалось выполнить запрос';

  return new ApiError(status, message, error.errorCode, error.details);
}

/** Текст ошибки для пользователя. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) return 'Нет соединения с сервером';
  if (error instanceof Error && error.message) return error.message;
  return 'Что-то пошло не так';
}
