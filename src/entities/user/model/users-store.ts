import { useEffect } from 'react';
import { create } from 'zustand';
import { api } from '@shared/api';
import { registerStoreReset } from '@shared/lib/store-reset';
import type { User } from './types';

interface UsersState {
  byId: Record<string, User>;
}

/** Профили коллег по id: авторы материалов, комментариев, участники коллекций. */
export const useUsers = create<UsersState>()(() => ({ byId: {} }));

registerStoreReset(() => useUsers.setState(useUsers.getInitialState(), true));

/** Сервер отдаёт до 200 профилей за запрос */
const BATCH_SIZE = 200;

const requested = new Set<string>();
let queue: string[] = [];

async function flush() {
  const ids = queue;
  queue = [];
  for (let start = 0; start < ids.length; start += BATCH_SIZE) {
    const batch = ids.slice(start, start + BATCH_SIZE);
    try {
      const users = await api.get<User[]>('/users', { query: { ids: batch } });
      useUsers.setState(({ byId }) => ({
        byId: {
          ...byId,
          ...Object.fromEntries(users.map((user) => [user.id, user])),
        },
      }));
    } catch {
      // Имя не критично: покажем заглушку, при следующем обращении запросим снова
      batch.forEach((id) => requested.delete(id));
    }
  }
}

/** Запросы из одного рендера объединяются в один вызов `GET /users?ids=…`. */
export function requestUsers(ids: Iterable<string>) {
  const fresh = [...ids].filter((id) => id && !requested.has(id));
  if (fresh.length === 0) return;

  fresh.forEach((id) => requested.add(id));
  if (queue.length === 0) queueMicrotask(() => void flush());
  queue.push(...fresh);
}

export function rememberUsers(users: User[]) {
  users.forEach((user) => requested.add(user.id));
  useUsers.setState(({ byId }) => ({
    byId: {
      ...byId,
      ...Object.fromEntries(users.map((user) => [user.id, user])),
    },
  }));
}

export function useUser(id: string | null | undefined): User | undefined {
  const user = useUsers((state) => (id ? state.byId[id] : undefined));

  useEffect(() => {
    if (id) requestUsers([id]);
  }, [id]);

  return user;
}

/** Поиск коллег по имени или почте: выдача доступа к коллекции. */
export function searchUsers(
  query: string,
  signal?: AbortSignal,
): Promise<User[]> {
  return api.get<User[]>('/users', { query: { query }, signal });
}
