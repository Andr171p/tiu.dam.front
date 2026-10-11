const UNITS = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];

export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: value < 10 && unit > 0 ? 1 : 0 })} ${UNITS[unit]}`;
}

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const dateTimeFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const relativeFormat = new Intl.RelativeTimeFormat('ru-RU', {
  numeric: 'auto',
});

export const formatDate = (value: string | Date) =>
  dateFormat.format(new Date(value));
export const formatDateTime = (value: string | Date) =>
  dateTimeFormat.format(new Date(value));

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** «только что», «5 минут назад», «вчера»; старше недели — дата. */
export function formatRelative(value: string | Date, now = new Date()): string {
  const diff = new Date(value).getTime() - now.getTime();
  const abs = Math.abs(diff);

  if (abs < MINUTE) return 'только что';
  if (abs < HOUR)
    return relativeFormat.format(Math.round(diff / MINUTE), 'minute');
  if (abs < DAY) return relativeFormat.format(Math.round(diff / HOUR), 'hour');
  if (abs < 7 * DAY)
    return relativeFormat.format(Math.round(diff / DAY), 'day');
  return formatDate(value);
}

/** «12 активов», «1 актив», «3 актива». */
export function plural(
  count: number,
  [one, few, many]: [string, string, string],
): string {
  const rule = new Intl.PluralRules('ru-RU').select(count);
  const word = rule === 'one' ? one : rule === 'few' ? few : many;
  return `${count.toLocaleString('ru-RU')} ${word}`;
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

/** Ключ поля из подписи: «Дата мероприятия» → `data_meropriyatiya`. */
export function toFieldKey(label: string): string {
  const key = Array.from(label.toLowerCase(), (char) => TRANSLIT[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
  return /^[a-z]/.test(key) ? key : `field_${key}`.replace(/_+$/, '');
}

/** Текстовое значение поля формы без пробелов по краям (файловые поля дают пустую строку). */
export function formText(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
