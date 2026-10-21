import { useEffect } from 'react';
import { create } from 'zustand';
import { api, describeError, isNotFound, type Schemas } from '@shared/api';
import { registerStoreReset } from '@shared/lib/store-reset';

export type Transcript = Schemas['TranscriptResponse'];
export type TranscriptSegment = Schemas['TranscriptSegmentDTO'];

interface TranscriptState {
  status: 'loading' | 'ready' | 'error';
  /** null — речи нет или расшифровка ещё не готова */
  transcript: Transcript | null;
  error: string | null;
}

/** Расшифровка речи: её читают таймлайн и вкладка «Текст». */
export const useTranscripts = create<{
  byVersion: Record<string, TranscriptState>;
}>()(() => ({
  byVersion: {},
}));

registerStoreReset(() =>
  useTranscripts.setState(useTranscripts.getInitialState(), true),
);

const LOADING: TranscriptState = {
  status: 'loading',
  transcript: null,
  error: null,
};

function save(versionId: string, state: TranscriptState) {
  useTranscripts.setState(({ byVersion }) => ({
    byVersion: { ...byVersion, [versionId]: state },
  }));
}

async function loadTranscript(assetId: string, versionId: string) {
  try {
    const transcript = await api.get<Transcript>(
      `/assets/${assetId}/transcript`,
    );
    save(versionId, { status: 'ready', transcript, error: null });
  } catch (error) {
    if (isNotFound(error))
      save(versionId, { status: 'ready', transcript: null, error: null });
    else
      save(versionId, {
        status: 'error',
        transcript: null,
        error: describeError(error),
      });
  }
}

/** Расшифровка текущей версии видео или аудио. */
export function useTranscript(
  assetId: string,
  versionId: string,
): TranscriptState {
  const state = useTranscripts((store) => store.byVersion[versionId]);

  useEffect(() => {
    void loadTranscript(assetId, versionId);
  }, [assetId, versionId]);

  return state ?? LOADING;
}
