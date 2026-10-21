import type { Asset } from '@entities/asset';
import type { TabItem } from '@shared/ui/tabs';

export type InspectorTab =
  'scenes' | 'people' | 'transcript' | 'info' | 'versions';

/** Вкладки по типу материала: у видео — сцены, участники и текст (как в макете). */
export function inspectorTabs(asset: Asset): TabItem<InspectorTab>[] {
  const versions: TabItem<InspectorTab> = {
    value: 'versions',
    label: 'Версии',
  };
  const info: TabItem<InspectorTab> = { value: 'info', label: 'Информация' };

  switch (asset.kind) {
    case 'video':
      return [
        { value: 'scenes', label: 'Сцены', soon: true },
        { value: 'people', label: 'Участники' },
        { value: 'transcript', label: 'Текст' },
        info,
        versions,
      ];
    case 'audio':
      return [info, { value: 'transcript', label: 'Текст' }, versions];
    case 'image':
      return [info, versions, { value: 'people', label: 'Люди' }];
    default:
      return [info, versions];
  }
}

export const defaultInspectorTab = (asset: Asset): InspectorTab =>
  asset.kind === 'video' ? 'people' : 'info';
