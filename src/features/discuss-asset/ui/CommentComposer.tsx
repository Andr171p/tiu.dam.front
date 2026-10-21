import { SendHorizontal } from 'lucide-react';
import { useState, type FormEvent, type KeyboardEvent } from 'react';
import type { CommentAnchor } from '@entities/comment';
import { describeError } from '@shared/api';
import { IconButton } from '@shared/ui/button';
import { Tag } from '@shared/ui/tag';
import { toast } from '@shared/ui/toast';
import { describeAnchor } from '../lib/anchor';
import { setDraftAnchor } from '../model/annotation-store';
import styles from './Discussion.module.scss';

interface CommentComposerProps {
  placeholder: string;
  anchor?: CommentAnchor | null;
  autoFocus?: boolean;
  onSubmit: (text: string) => Promise<unknown>;
}

/** Поле комментария: Enter — отправить, Shift+Enter — новая строка. */
export function CommentComposer({
  placeholder,
  anchor,
  autoFocus,
  onSubmit,
}: CommentComposerProps) {
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const anchorLabel = describeAnchor(anchor);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const value = text.trim();
    if (!value || pending) return;

    setPending(true);
    try {
      await onSubmit(value);
      setText('');
      if (anchor) setDraftAnchor(null);
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setPending(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <form className={styles.composer} onSubmit={(event) => void submit(event)}>
      {anchorLabel && (
        <Tag
          tone="accent"
          removeLabel="Убрать отметку"
          onRemove={() => setDraftAnchor(null)}
        >
          {anchorLabel}
        </Tag>
      )}
      <div className={styles.field}>
        <textarea
          className={styles.input}
          rows={1}
          value={text}
          placeholder={placeholder}
          aria-label={placeholder}
          autoFocus={autoFocus}
          disabled={pending}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
        />
        {text.trim() && (
          <IconButton
            type="submit"
            icon={SendHorizontal}
            label="Отправить"
            disabled={pending}
          />
        )}
      </div>
    </form>
  );
}
