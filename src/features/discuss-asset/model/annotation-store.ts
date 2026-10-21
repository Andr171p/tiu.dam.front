import { create } from 'zustand';
import type { CommentAnchor, RegionAnchor } from '@entities/comment';

interface AnnotationState {
  /** Пользователь выделяет область на изображении */
  drawing: boolean;
  /** Отметка, к которой будет привязан новый комментарий */
  draft: CommentAnchor | null;
  /** Обсуждение, чья отметка подсвечена на просмотре */
  focusedId: string | null;
}

/** Связь между просмотром материала и обсуждением: отметки областей и моментов. */
export const useAnnotation = create<AnnotationState>()(() => ({
  drawing: false,
  draft: null,
  focusedId: null,
}));

export function startDrawing() {
  useAnnotation.setState({ drawing: true, draft: null, focusedId: null });
}

export function finishDrawing(region: RegionAnchor | null) {
  useAnnotation.setState({ drawing: false, draft: region });
}

export function setDraftAnchor(anchor: CommentAnchor | null) {
  useAnnotation.setState({ draft: anchor, drawing: false });
}

export function focusComment(commentId: string | null) {
  useAnnotation.setState({ focusedId: commentId });
}

export function resetAnnotation() {
  useAnnotation.setState(useAnnotation.getInitialState(), true);
}
