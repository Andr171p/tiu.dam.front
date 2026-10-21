import { create } from 'zustand';

interface PlaybackState {
  /** Текущий момент открытого видео или аудио, секунды */
  time: number;
  duration: number;
  /** Запрос перехода: плеер выполняет его и сбрасывает */
  seekRequest: number | null;
}

/**
 * Позиция воспроизведения открытого материала. Плеер сообщает время,
 * а таймлайн, расшифровка, участники и обсуждение — просят перейти к моменту.
 */
export const usePlayback = create<PlaybackState>()(() => ({
  time: 0,
  duration: 0,
  seekRequest: null,
}));

export function seekTo(time: number) {
  usePlayback.setState({
    seekRequest: Math.max(0, time),
    time: Math.max(0, time),
  });
}

export function reportPlayback(time: number, duration: number) {
  usePlayback.setState({ time, duration });
}

export function completeSeek() {
  usePlayback.setState({ seekRequest: null });
}

export function resetPlayback() {
  usePlayback.setState(usePlayback.getInitialState(), true);
}
