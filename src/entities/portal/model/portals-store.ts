import { create } from 'zustand';
import { api, describeError } from '@shared/api';
import { registerStoreReset } from '@shared/lib/store-reset';
import type { Portal, PortalUpdate } from './types';

interface PortalsState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  items: Portal[];
  error: string | null;
}

/** Порталы, которыми управляет пользователь. */
export const usePortals = create<PortalsState>()(() => ({
  status: 'idle',
  items: [],
  error: null,
}));

registerStoreReset(() =>
  usePortals.setState(usePortals.getInitialState(), true),
);

const newestFirst = (a: Portal, b: Portal) =>
  b.updatedAt.localeCompare(a.updatedAt);

export async function loadPortals() {
  if (usePortals.getState().status !== 'ready')
    usePortals.setState({ status: 'loading' });
  try {
    const items = await api.get<Portal[]>('/portals');
    usePortals.setState({
      status: 'ready',
      items: items.sort(newestFirst),
      error: null,
    });
  } catch (error) {
    usePortals.setState({ status: 'error', error: describeError(error) });
  }
}

export function upsertPortal(portal: Portal) {
  usePortals.setState(({ items }) => ({
    items: [portal, ...items.filter((item) => item.id !== portal.id)].sort(
      newestFirst,
    ),
  }));
}

export async function updatePortal(
  id: string,
  changes: PortalUpdate,
): Promise<Portal> {
  const portal = await api.patch<Portal>(`/portals/${id}`, { body: changes });
  upsertPortal(portal);
  return portal;
}

export async function deletePortal(id: string) {
  await api.delete(`/portals/${id}`);
  usePortals.setState(({ items }) => ({
    items: items.filter((item) => item.id !== id),
  }));
}
