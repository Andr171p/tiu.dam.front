import { invalidateAssets } from '@entities/asset';
import {
  removeSelection,
  upsertSelection,
  type Selection,
} from '@entities/selection';
import { api, type Schemas } from '@shared/api';

export async function createSelection(
  input: Schemas['CreateSelectionDTO'],
): Promise<Selection> {
  const selection = await api.post<Selection>('/selections', { body: input });
  upsertSelection(selection);
  return selection;
}

export async function updateSelection(
  id: string,
  changes: Schemas['UpdateSelectionDTO'],
): Promise<Selection> {
  const selection = await api.patch<Selection>(`/selections/${id}`, {
    body: changes,
  });
  upsertSelection(selection);
  return selection;
}

export async function deleteSelection(id: string) {
  await api.delete(`/selections/${id}`);
  removeSelection(id);
}

export async function addToSelection(selectionId: string, assetIds: string[]) {
  const selection = await api.post<Selection>(
    `/selections/${selectionId}/assets`,
    {
      body: { assetIds },
    },
  );
  upsertSelection(selection);
}

export async function removeFromSelection(
  selectionId: string,
  assetIds: string[],
) {
  const selection = await api.post<Selection>(
    `/selections/${selectionId}/assets/remove`,
    {
      body: { assetIds },
    },
  );
  upsertSelection(selection);
  invalidateAssets();
}
