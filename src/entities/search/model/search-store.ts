import { create } from 'zustand';
import type { AssetKind } from '@entities/asset';
import { api, describeError, isAbortError, type Schemas } from '@shared/api';
import type { SearchMode } from '@shared/config/routes';
import { registerStoreReset } from '@shared/lib/store-reset';
import type { SearchHit } from './types';

interface Reference {
  file: File;
  /** object URL для превью референса */
  previewUrl: string;
}

interface SearchState {
  /** Референс для поиска по изображению или по лицу; живёт до замены или удаления */
  reference: Reference | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  hits: SearchHit[];
  error: string | null;
}

export const useSearch = create<SearchState>()(() => ({
  reference: null,
  status: 'idle',
  hits: [],
  error: null,
}));

registerStoreReset(() => {
  clearReference();
  useSearch.setState(useSearch.getInitialState(), true);
});

export function setReference(file: File) {
  const previous = useSearch.getState().reference;
  if (previous) URL.revokeObjectURL(previous.previewUrl);
  useSearch.setState({
    reference: { file, previewUrl: URL.createObjectURL(file) },
  });
}

export function clearReference() {
  const previous = useSearch.getState().reference;
  if (previous) URL.revokeObjectURL(previous.previewUrl);
  useSearch.setState({ reference: null });
}

export interface SearchRequest {
  mode: SearchMode;
  query: string;
  kinds: AssetKind[];
}

/** Выдача не больше этого числа результатов: ранжирование RRF сводит источники на сервере */
const LIMIT = 120;

let controller: AbortController | null = null;

/**
 * Выдача авторизована на сервере: фильтр по доступным коллекциям — до ранжирования.
 * Предыдущий запрос отменяется, чтобы старый ответ не перезаписал новый.
 */
export async function runSearch({ mode, query, kinds }: SearchRequest) {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;
  const reference = useSearch.getState().reference;

  if (mode === 'text' ? !query.trim() : !reference) {
    useSearch.setState({ status: 'idle', hits: [], error: null });
    return;
  }

  useSearch.setState({ status: 'loading', error: null });
  try {
    let response: Schemas['SearchResponse'];
    if (mode === 'text') {
      response = await api.post('/search', {
        body: { query: query.trim(), kinds, limit: LIMIT },
        signal,
      });
    } else {
      const form = new FormData();
      form.append('image', reference!.file);
      form.append('limit', String(LIMIT));
      kinds.forEach((kind) => form.append('kinds', kind));
      response = await api.post(
        mode === 'image' ? '/search/by-image' : '/search/by-face',
        {
          form,
          signal,
        },
      );
    }
    useSearch.setState({ status: 'ready', hits: response.items, error: null });
  } catch (error) {
    if (isAbortError(error)) return;
    useSearch.setState({
      status: 'error',
      hits: [],
      error: describeError(error),
    });
  }
}
