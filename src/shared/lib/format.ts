const UNITS = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];

/** «18,4 МБ» */
export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = value < 10 && unit > 0 ? 1 : 0;
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: digits })} ${UNITS[unit]}`;
}

/** «6 000 × 4 000» */
export const formatDimensions = (width: number, height: number) =>
  `${width.toLocaleString('ru-RU')} × ${height.toLocaleString('ru-RU')}`;

/** Таймкод видео: «04:32», «1:02:05». */
export function formatTimecode(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const shortDateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
});
const timeFormat = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
});

/** «31 декабря 2027» */
export const formatDate = (value: string | Date) =>
  dateFormat.format(new Date(value));

/** «20 октября» */
export const formatShortDate = (value: string | Date) =>
  shortDateFormat.format(new Date(value));

export const formatTime = (value: string | Date) =>
  timeFormat.format(new Date(value));

const DAY = 24 * 60 * 60 * 1000;

/** «сегодня, 10:24», «вчера, 18:03», «20 октября, 12:42». */
export function formatDateTime(value: string | Date, now = new Date()): string {
  const date = new Date(value);
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const time = formatTime(date);

  if (date.getTime() >= startOfToday) return `сегодня, ${time}`;
  if (date.getTime() >= startOfToday - DAY) return `вчера, ${time}`;
  return date.getFullYear() === now.getFullYear()
    ? `${formatShortDate(date)}, ${time}`
    : formatDate(date);
}

/** «12 материалов», «1 материал», «3 материала». */
export function plural(
  count: number,
  [one, few, many]: [string, string, string],
): string {
  const rule = new Intl.PluralRules('ru-RU').select(count);
  const word = rule === 'one' ? one : rule === 'few' ? few : many;
  return `${count.toLocaleString('ru-RU')} ${word}`;
}

/** Инициалы: «Анна Смирнова» → «АС». */
export function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
  return letters || '?';
}

const TRANSLIT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

/** Латинский идентификатор из подписи: «Дата съёмки» → `data_semki`. */
export function slugify(label: string, separator = '_'): string {
  return Array.from(label.toLowerCase(), (char) => TRANSLIT[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^\\${separator}+|\\${separator}+$`, 'g'), '')
    .slice(0, 64);
}

/** Текстовое значение поля формы без пробелов по краям. */
export function formText(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
