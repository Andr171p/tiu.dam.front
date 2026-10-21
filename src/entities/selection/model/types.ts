import type { Schemas } from '@shared/api';

/**
 * Подборка — упорядоченный список материалов из разных коллекций (до 1000).
 * `shared` — видна всем сотрудникам; каждый видит только материалы доступных ему коллекций.
 */
export type Selection = Schemas['SelectionResponse'];
