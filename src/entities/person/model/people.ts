import { api } from '@shared/api';
import type { Person } from './types';

export function searchPeople(
  query: string,
  signal?: AbortSignal,
): Promise<Person[]> {
  return api.get<Person[]>('/people', {
    query: { query: query || undefined },
    signal,
  });
}

export function createPerson(
  name: string,
  description?: string,
): Promise<Person> {
  return api.post<Person>('/people', { body: { name, description } });
}
