/**
 * localStorage без исключений: в приватном режиме и при запрете хранилища
 * значения просто не переживают перезагрузку.
 */
export const storage = {
  read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },

  write(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Хранилище недоступно или переполнено — данные останутся только в памяти
    }
  },
};
