import { useState } from 'react';
import { invalidateAssets, type Asset } from '@entities/asset';
import { api, type Schemas } from '@shared/api';
import {
  cropForAspect,
  INITIAL_STATE,
  orientedSize,
  toRecipe,
  type EditorState,
  type Rotation,
  type Size,
} from './recipe';

type SaveAs = 'version' | 'asset';

/** Рендер идёт в фоне; ждём результат ограниченное время (см. известные ограничения бэкенда) */
const RENDER_TIMEOUT_MS = 90_000;
const RENDER_POLL_MS = 2000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForVersion(
  assetId: string,
  versionId: string,
): Promise<boolean> {
  const deadline = Date.now() + RENDER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await delay(RENDER_POLL_MS);
    const versions = await api
      .get<Schemas['VersionResponse'][]>(`/assets/${assetId}/versions`)
      .catch(() => []);
    if (versions.some((version) => version.id === versionId)) return true;
  }
  return false;
}

export function useImageEditor(asset: Asset) {
  const [state, setState] = useState<EditorState>(INITIAL_STATE);
  const original: Size = {
    width: asset.version.meta?.width ?? 1,
    height: asset.version.meta?.height ?? 1,
  };
  const oriented = orientedSize(original, state.rotate);

  const update = (patch: Partial<EditorState>) =>
    setState((current) => ({ ...current, ...patch }));

  /** Поворот на 90°: кадр сбрасывается, потому что меняются стороны изображения */
  const rotate = (direction: 1 | -1) =>
    setState((current) => {
      const next = (((current.rotate + direction * 90) % 360) + 360) % 360;
      const rotated = orientedSize(original, next as Rotation);
      return {
        ...current,
        rotate: next as Rotation,
        crop: cropForAspect(current.aspect, rotated),
      };
    });

  const setAspect = (aspect: number | null) =>
    update({ aspect, crop: cropForAspect(aspect, oriented) });

  /** Отправляет рецепт и ждёт, пока сервер создаст результат. */
  const save = async (
    saveAs: SaveAs,
  ): Promise<{ assetId: string; ready: boolean }> => {
    const accepted = await api.post<Schemas['EditAccepted']>(
      `/assets/${asset.id}/edits`,
      {
        body: {
          recipe: toRecipe(state),
          sourceVersionId: asset.version.id,
          saveAs,
          title: saveAs === 'asset' ? `${asset.title} (правка)` : undefined,
        },
      },
    );
    const ready = await waitForVersion(accepted.assetId, accepted.versionId);
    invalidateAssets();
    return { assetId: accepted.assetId, ready };
  };

  return {
    state,
    original,
    oriented,
    update,
    rotate,
    setAspect,
    reset: () => setState(INITIAL_STATE),
    save,
  };
}

export type ImageEditorModel = ReturnType<typeof useImageEditor>;
