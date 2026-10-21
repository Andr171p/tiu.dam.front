import { fetchAsset, invalidateAssets } from '@entities/asset';
import { api, describeError } from '@shared/api';
import { confirmAction } from '@shared/ui/dialog';
import { toast } from '@shared/ui/toast';

/** Корзина хранит материалы 30 дней, затем их удаляет планировщик. */
export async function trashAsset(assetId: string) {
  try {
    await api.post(`/assets/${assetId}/trash`);
    invalidateAssets();
    await fetchAsset(assetId);
    toast.success(
      'Материал в корзине. Его можно восстановить в течение 30 дней',
    );
  } catch (error) {
    toast.error(describeError(error));
  }
}

export async function restoreAsset(assetId: string) {
  try {
    await api.post(`/assets/${assetId}/restore`);
    invalidateAssets();
    await fetchAsset(assetId);
    toast.success('Материал восстановлен');
  } catch (error) {
    toast.error(describeError(error));
  }
}

/** Безвозвратное удаление — только из корзины и только с правом управления коллекцией. */
export function purgeAsset(
  assetId: string,
  title: string,
  onDone?: () => void,
) {
  confirmAction({
    title: `Удалить «${title}» навсегда?`,
    description:
      'Оригинал, все версии и обсуждение будут удалены без возможности восстановления.',
    confirmLabel: 'Удалить навсегда',
    tone: 'danger',
    onConfirm: async () => {
      await api.delete(`/assets/${assetId}`);
      invalidateAssets();
      toast.success('Материал удалён');
      onDone?.();
    },
  });
}

export async function moveAsset(assetId: string, collectionId: string) {
  await api.post(`/assets/${assetId}/move`, { body: { collectionId } });
  invalidateAssets();
  await fetchAsset(assetId);
}
