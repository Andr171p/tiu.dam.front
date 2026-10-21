import type { UploadPolicy } from '@entities/collection';
import { formatBytes } from '@shared/lib/format';

const TYPE_LABELS: Record<string, string> = {
  'image/*': 'фото',
  'video/*': 'видео',
  'audio/*': 'аудио',
  'application/pdf': 'PDF',
};

/** «Фото, видео и документы · до 20 ГБ на файл» по правилам коллекции. */
export function describePolicy(policy: UploadPolicy | undefined): string {
  const limit = policy?.maxFileSize
    ? ` · до ${formatBytes(policy.maxFileSize)} на файл`
    : '';
  const types = policy?.allowedTypes ?? [];
  if (types.length === 0 || types.includes('*/*')) return `Любые файлы${limit}`;

  const labels = types.map((type) => TYPE_LABELS[type] ?? type);
  const list =
    labels.length > 1
      ? `${labels.slice(0, -1).join(', ')} и ${labels.at(-1)}`
      : labels[0];
  return `${list.charAt(0).toUpperCase()}${list.slice(1)}${limit}`;
}

/** Атрибут `accept` для выбора файла: браузер сразу отфильтрует неподходящие. */
export const acceptOf = (policy: UploadPolicy | undefined) =>
  policy?.allowedTypes?.filter((type) => type !== '*/*').join(',') || undefined;

/** Проверка до отправки: сервер всё равно проверит, но так ошибка видна сразу. */
export function rejectReason(
  file: File,
  policy: UploadPolicy | undefined,
): string | null {
  if (policy?.maxFileSize && file.size > policy.maxFileSize)
    return `больше ${formatBytes(policy.maxFileSize)}`;

  const types = policy?.allowedTypes ?? [];
  const allowed =
    types.length === 0 ||
    types.some((pattern) =>
      pattern.endsWith('/*')
        ? file.type.startsWith(pattern.slice(0, -1))
        : pattern === '*/*' || pattern === file.type,
    );
  return allowed ? null : 'этот тип файлов коллекция не принимает';
}
