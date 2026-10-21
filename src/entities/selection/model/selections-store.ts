import { create } from 'zustand';
import { api, describeError } from '@shared/api';
import { registerStoreReset } from '@shared/lib/store-reset';
import type { Selection } from './types';

interface SelectionsState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  items: Selection[];
  error: string | null;
}

export const useSelections = create<SelectionsState>()(() => ({
  status: 'idle',
  items: [],
  error: null,
}));

registerStoreReset(() =>
  useSelections.setState(useSelections.getInitialState(), true),
);

const newestFirst = (a: Selection, b: Selection) =>
  b.updatedAt.localeCompare(a.updatedAt);

let pending: Promise<void> | null = null;

/** Свои и общие подборки. Повторные вызовы во время загрузки объединяются. */
export function loadSelections(): Promise<void> {
  pending ??= (async () => {
    if (useSelections.getState().status !== 'ready')
      useSelections.setState({ status: 'loading', error: null });
    try {
      const items = await api.get<Selection[]>('/selections');
      useSelections.setState({
        status: 'ready',
        items: items.sort(newestFirst),
        error: null,
      });
    } catch (error) {
      useSelections.setState({ status: 'error', error: describeError(error) });
    } finally {
      pending = null;
    }
  })();
  return pending;
}

export function upsertSelection(selection: Selection) {
  useSelections.setState(({ items }) => ({
    items: [
      selection,
      ...items.filter((item) => item.id !== selection.id),
    ].sort(newestFirst),
  }));
}

export function removeSelection(selectionId: string) {
  useSelections.setState(({ items }) => ({
    items: items.filter((item) => item.id !== selectionId),
  }));
}

export function useSelection(id: string | undefined): Selection | undefined {
  return useSelections((state) => state.items.find((item) => item.id === id));
}
