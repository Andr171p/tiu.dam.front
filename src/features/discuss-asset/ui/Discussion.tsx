import clsx from 'clsx';
import { useState } from 'react';
import { seekTo, type Asset } from '@entities/asset';
import { can } from '@entities/collection';
import {
  commentActions,
  isTime,
  useAssetComments,
  type Comment,
} from '@entities/comment';
import { useCurrentUser } from '@entities/session';
import { UserName, useUser } from '@entities/user';
import { describeError } from '@shared/api';
import { formatDateTime, initials } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { confirmAction } from '@shared/ui/dialog';
import { Notice } from '@shared/ui/notice';
import { Skeleton } from '@shared/ui/skeleton';
import { Tag } from '@shared/ui/tag';
import { toast } from '@shared/ui/toast';
import { describeAnchor } from '../lib/anchor';
import { focusComment, useAnnotation } from '../model/annotation-store';
import { CommentComposer } from './CommentComposer';
import styles from './Discussion.module.scss';

function AuthorAvatar({ id }: { id: string }) {
  const user = useUser(id);
  return (
    <span className={styles.avatar}>{initials(user?.displayName ?? '?')}</span>
  );
}

const run = (action: Promise<unknown>) =>
  action.catch((error: unknown) => toast.error(describeError(error)));

interface MessageProps {
  asset: Asset;
  comment: Comment;
  number?: number;
}

function Message({ asset, comment, number }: MessageProps) {
  const user = useCurrentUser();
  const focusedId = useAnnotation((state) => state.focusedId);
  const [replying, setReplying] = useState(false);
  const isRoot = number !== undefined;
  const anchor = describeAnchor(comment.anchor);
  const ownMessage = comment.authorId === user.id;
  const otherVersion = comment.versionId !== asset.version.id;

  const showAnchor = () => {
    focusComment(focusedId === comment.id ? null : comment.id);
    if (isTime(comment.anchor)) seekTo(comment.anchor.start);
  };

  const remove = () =>
    confirmAction({
      title: isRoot ? 'Удалить обсуждение?' : 'Удалить ответ?',
      description: isRoot ? 'Вместе с ним удалятся все ответы.' : undefined,
      confirmLabel: 'Удалить',
      tone: 'danger',
      onConfirm: () => commentActions.remove(asset.id, comment.id),
    });

  return (
    <article
      className={clsx(
        styles.message,
        !isRoot && styles.reply,
        comment.resolvedAt && styles.resolved,
        focusedId === comment.id && styles.focused,
      )}
    >
      <header className={styles.header}>
        <AuthorAvatar id={comment.authorId} />
        <div className={styles.byline}>
          <span className={styles.author}>
            <UserName id={comment.authorId} /> ·{' '}
            {formatDateTime(comment.createdAt)}
          </span>
          {isRoot && (
            <button
              type="button"
              className={styles.anchor}
              onClick={showAnchor}
              disabled={!anchor}
            >
              № {number}
              {anchor && ` · ${anchor}`}
              {otherVersion && ' · к другой версии'}
            </button>
          )}
        </div>
        {comment.resolvedAt && <Tag tone="success">Решено</Tag>}
      </header>

      <p className={styles.text}>{comment.text}</p>

      <div className={styles.actions}>
        {isRoot && !comment.resolvedAt && (
          <>
            <Button
              variant="link"
              onClick={() => setReplying((value) => !value)}
            >
              Ответить
            </Button>
            <Button
              variant="link"
              onClick={() =>
                void run(commentActions.resolve(asset.id, comment.id))
              }
            >
              Отметить решённым
            </Button>
          </>
        )}
        {isRoot && comment.resolvedAt && (
          <Button
            variant="link"
            onClick={() =>
              void run(commentActions.reopen(asset.id, comment.id))
            }
          >
            Открыть снова
          </Button>
        )}
        {(ownMessage || can(asset, 'manage')) && (
          <Button
            variant="link"
            className={styles.secondaryAction}
            onClick={remove}
          >
            Удалить
          </Button>
        )}
      </div>

      {comment.replies?.map((reply) => (
        <Message key={reply.id} asset={asset} comment={reply} />
      ))}

      {replying && (
        <CommentComposer
          placeholder="Ответ…"
          autoFocus
          onSubmit={async (text) => {
            await commentActions.reply(asset.id, comment.id, text);
            setReplying(false);
          }}
        />
      )}
    </article>
  );
}

/** Обсуждение материала: отметки областей и моментов, ответы, решённые вопросы. */
export function Discussion({ asset }: { asset: Asset }) {
  const thread = useAssetComments(asset.id);
  const draft = useAnnotation((state) => state.draft);
  const roots = [...thread.items].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  const open = roots.filter((comment) => !comment.resolvedAt).length;

  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h3>Обсуждение</h3>
        {open > 0 && <Tag tone="neutral">{open}</Tag>}
      </header>

      {thread.status === 'error' && <Notice>{thread.error}</Notice>}
      {thread.status === 'loading' && thread.items.length === 0 && (
        <Skeleton height={64} />
      )}

      {roots.map((comment, index) => (
        <Message
          key={comment.id}
          asset={asset}
          comment={comment}
          number={index + 1}
        />
      ))}

      <CommentComposer
        anchor={draft}
        placeholder={draft ? 'Комментарий к отметке…' : 'Комментарий…'}
        onSubmit={(text) =>
          commentActions.add(asset.id, {
            text,
            versionId: asset.version.id,
            anchor: draft,
          })
        }
      />
    </section>
  );
}
