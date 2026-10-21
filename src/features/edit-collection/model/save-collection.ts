import {
  removeCollection,
  upsertCollection,
  type Collection,
} from '@entities/collection';
import { api, type Schemas } from '@shared/api';

export async function saveCollection(
  id: string,
  changes: Schemas['UpdateCollectionDTO'],
): Promise<Collection> {
  const collection = await api.patch<Collection>(`/collections/${id}`, {
    body: changes,
  });
  upsertCollection(collection);
  return collection;
}

/** Удалить можно только пустую коллекцию: иначе сервер ответит 409 с объяснением. */
export async function deleteCollection(id: string) {
  await api.delete(`/collections/${id}`);
  removeCollection(id);
}
