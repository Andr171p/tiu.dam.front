import { Clock, MessageSquare, X } from 'lucide-react';
import { usePlayback, type AssetKind } from '@entities/asset';
import { Button } from '@shared/ui/button';
import {
  finishDrawing,
  setDraftAnchor,
  startDrawing,
  useAnnotation,
} from '../model/annotation-store';

/**
 * «Отметить область» на изображении или «Отметить момент» в видео:
 * отметка прикрепится к следующему комментарию.
 */
export function MarkButton({ kind }: { kind: AssetKind }) {
  const drawing = useAnnotation((state) => state.drawing);

  if (kind === 'video' || kind === 'audio') {
    const markMoment = () =>
      setDraftAnchor({
        type: 'time',
        start: usePlayback.getState().time,
        end: null,
      });
    return (
      <Button icon={Clock} onClick={markMoment}>
        Отметить момент
      </Button>
    );
  }

  if (kind !== 'image') return null;

  return drawing ? (
    <Button icon={X} onClick={() => finishDrawing(null)}>
      Отменить выделение
    </Button>
  ) : (
    <Button icon={MessageSquare} onClick={startDrawing}>
      Отметить область
    </Button>
  );
}
