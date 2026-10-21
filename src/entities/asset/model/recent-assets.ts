import { create } from 'zustand';
import { storage } from '@shared/lib/storage';

/** Сколько недавно открытых материалов помнить */
const LIMIT = 24;

const keyOf = (userId: string) => `tiu-dam.recent.${userId}`;

interface RecentState {
  byUser: Record<string, string[]>;
}

/**
 * Недавно открытые материалы — локально в браузере, отдельно для каждого пользователя.
 * Храним только id: ссылки на превью временные, карточки перечитываются при показе.
 */
export const useRecentAssets = create<RecentState>()(() => ({ byUser: {} }));

const saved: Record<string, string[]> = {};

const savedIds = (userId: string) =>
  (saved[userId] ??= storage.read<string[]>(keyOf(userId), []));

function save(userId: string, ids: string[]) {
  saved[userId] = ids;
  storage.write(keyOf(userId), ids);
  useRecentAssets.setState(({ byUser }) => ({
    byUser: { ...byUser, [userId]: ids },
  }));
}

export function rememberRecentAsset(userId: string, assetId: string) {
  const rest = savedIds(userId).filter((id) => id !== assetId);
  save(userId, [assetId, ...rest].slice(0, LIMIT));
}

export function forgetRecentAsset(userId: string, assetId: string) {
  save(
    userId,
    savedIds(userId).filter((id) => id !== assetId),
  );
}

export function useRecentAssetIds(userId: string): string[] {
  return useRecentAssets((state) => state.byUser[userId]) ?? savedIds(userId);
}
