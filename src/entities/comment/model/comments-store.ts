import { useEffect } from 'react';
import { create } from 'zustand';
import { api, describeError } from '@shared/api';
import { registerStoreReset } from '@shared/lib/store-reset';
import type { Comment, NewComment } from './types';

interface Thread {
  status: 'loading' | 'ready' | 'error';
  items: Comment[];
  error: string | null;
}

interface CommentsState {
  byAsset: Record<string, Thread>;
}

/** Обсуждения материалов: их читают и панель, и просмотр (отметки областей и моментов). */
export const useComments = create<CommentsState>()(() => ({ byAsset: {} }));

registerStoreReset(() =>
  useComments.setState(useComments.getInitialState(), true),
);

const EMPTY: Thread = { status: 'loading', items: [], error: null };

function patch(assetId: string, thread: Partial<Thread>) {
  useComments.setState(({ byAsset }) => ({
    byAsset: {
      ...byAsset,
      [assetId]: { ...(byAsset[assetId] ?? EMPTY), ...thread },
    },
  }));
}

export async function loadComments(assetId: string) {
  try {
    const items = await api.get<Comment[]>(`/assets/${assetId}/comments`);
    patch(assetId, { status: 'ready', items, error: null });
  } catch (error) {
    patch(assetId, { status: 'error', error: describeError(error) });
  }
}

/**
 * Изменения обсуждения перечитывают его целиком: ответы, решённые
 * и удалённые сообщения сервер собирает в дерево сам.
 */
async function mutate(assetId: string, request: Promise<unknown>) {
  await request;
  await loadComments(assetId);
}

export const commentActions = {
  add: (assetId: string, comment: NewComment) =>
    mutate(assetId, api.post(`/assets/${assetId}/comments`, { body: comment })),
  reply: (assetId: string, commentId: string, text: string) =>
    mutate(
      assetId,
      api.post(`/comments/${commentId}/replies`, { body: { text } }),
    ),
  edit: (assetId: string, commentId: string, text: string) =>
    mutate(assetId, api.patch(`/comments/${commentId}`, { body: { text } })),
  remove: (assetId: string, commentId: string) =>
    mutate(assetId, api.delete(`/comments/${commentId}`)),
  resolve: (assetId: string, commentId: string) =>
    mutate(assetId, api.post(`/comments/${commentId}/resolve`)),
  reopen: (assetId: string, commentId: string) =>
    mutate(assetId, api.post(`/comments/${commentId}/reopen`)),
};

export function useAssetComments(assetId: string): Thread {
  const thread = useComments((state) => state.byAsset[assetId]);

  useEffect(() => {
    void loadComments(assetId);
  }, [assetId]);

  return thread ?? EMPTY;
}
