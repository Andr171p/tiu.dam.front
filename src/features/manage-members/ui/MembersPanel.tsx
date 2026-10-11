import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import {
  can,
  collectionKeys,
  useMembers,
  type Collection,
  type MemberRole,
} from '@entities/collection';
import { useCurrentUser } from '@entities/session';
import { UserChip, type User } from '@entities/user';
import { api, describeError, unwrap } from '@shared/api';
import { useDebouncedValue } from '@shared/lib/hooks';
import { Button, IconButton } from '@shared/ui/button';
import { Dialog, DialogActions } from '@shared/ui/dialog';
import { SelectField } from '@shared/ui/field';
import { SearchInput } from '@shared/ui/search-input';
import { Skeleton } from '@shared/ui/skeleton';
import { toast } from '@shared/ui/toast';
import styles from './MembersPanel.module.scss';

const ROLE_OPTIONS: {
  value: MemberRole;
  label: string;
  description: string;
}[] = [
  {
    value: 'member',
    label: 'Участник',
    description: 'Загружает и редактирует свои активы',
  },
  {
    value: 'moderator',
    label: 'Модератор',
    description: 'Редактирует любые активы, участников и настройки',
  },
];

function useMemberMutations(collectionId: string) {
  const queryClient = useQueryClient();
  const onSuccess = () =>
    queryClient.invalidateQueries({
      queryKey: collectionKeys.members(collectionId),
    });
  const onError = (error: Error) => toast.error(describeError(error));
  const path = { collection_id: collectionId };

  return {
    add: useMutation({
      mutationFn: (body: { userId: string; role: MemberRole }) =>
        unwrap(
          api.POST('/api/user/v1/collections/{collection_id}/members', {
            params: { path },
            body,
          }),
        ),
      onSuccess,
      onError,
    }),
    update: useMutation({
      mutationFn: ({ userId, role }: { userId: string; role: MemberRole }) =>
        unwrap(
          api.PATCH(
            '/api/user/v1/collections/{collection_id}/members/{user_id}',
            {
              params: { path: { ...path, user_id: userId } },
              body: { role },
            },
          ),
        ),
      onSuccess,
      onError,
    }),
    remove: useMutation({
      mutationFn: (userId: string) =>
        unwrap(
          api.DELETE(
            '/api/user/v1/collections/{collection_id}/members/{user_id}',
            {
              params: { path: { ...path, user_id: userId } },
            },
          ),
        ),
      onSuccess,
      onError,
    }),
  };
}

function AddMemberDialog({
  collection,
  open,
  onClose,
  existing,
}: {
  collection: Collection;
  open: boolean;
  onClose: () => void;
  existing: Set<string>;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<User | null>(null);
  const [role, setRole] = useState<MemberRole>('member');
  const { add } = useMemberMutations(collection.id);
  const debounced = useDebouncedValue(query.trim(), 250);

  const users = useQuery({
    queryKey: ['users', 'search', debounced],
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/api/user/v1/users', {
          params: { query: { query: debounced } },
          signal,
        }),
      ),
    enabled: debounced.length >= 2,
  });

  const candidates =
    users.data?.filter(
      (user) => !existing.has(user.id) && user.id !== collection.owner.id,
    ) ?? [];
  const close = () => {
    setQuery('');
    setSelected(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Добавить участника"
      description="Найти можно тех, кто хотя бы раз входил в Медиатеку."
      size="md"
    >
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="ФИО, логин или почта"
        autoFocus
      />
      <ul className={styles.candidates}>
        {candidates.map((user) => (
          <li key={user.id}>
            <button
              type="button"
              className={selected?.id === user.id ? styles.selected : undefined}
              onClick={() => setSelected(user)}
            >
              <UserChip user={user} />
            </button>
          </li>
        ))}
        {debounced.length >= 2 && users.isSuccess && !candidates.length && (
          <li className={styles.empty}>Никого не нашлось</li>
        )}
      </ul>
      <SelectField
        label="Роль"
        value={role}
        onChange={(event) => setRole(event.target.value as MemberRole)}
      >
        {ROLE_OPTIONS.filter(
          (option) => option.value === 'member' || can(collection, 'manage'),
        ).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} — {option.description}
          </option>
        ))}
      </SelectField>
      <DialogActions>
        <Button onClick={close}>Отмена</Button>
        <Button
          variant="primary"
          icon={UserPlus}
          disabled={!selected}
          loading={add.isPending}
          onClick={() =>
            selected &&
            add.mutate({ userId: selected.id, role }, { onSuccess: close })
          }
        >
          Добавить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function MembersPanel({ collection }: { collection: Collection }) {
  const me = useCurrentUser();
  const members = useMembers(collection.id);
  const { update, remove } = useMemberMutations(collection.id);
  const [adding, setAdding] = useState(false);
  const isOwner = can(collection, 'manage');
  const canModerate = can(collection, 'moderate');

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Участники</h2>
          <p className={styles.hint}>
            Участники загружают и редактируют свои активы, модераторы — любые, а
            также управляют участниками и настройками.
          </p>
        </div>
        {canModerate && (
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={() => setAdding(true)}
          >
            Добавить
          </Button>
        )}
      </header>

      <ul className={styles.list}>
        <li className={styles.row}>
          <UserChip user={collection.owner} />
          <span className={styles.ownerRole}>Владелец</span>
        </li>
        {members.isPending && <Skeleton height={48} />}
        {members.data?.map((member) => {
          const isSelf = member.user.id === me.id;
          const canRemove =
            isSelf || (member.role === 'moderator' ? isOwner : canModerate);

          return (
            <li key={member.user.id} className={styles.row}>
              <UserChip user={member.user} />
              <select
                className={styles.role}
                value={member.role}
                disabled={!isOwner}
                aria-label={`Роль ${member.user.displayName}`}
                onChange={(event) =>
                  update.mutate({
                    userId: member.user.id,
                    role: event.target.value as MemberRole,
                  })
                }
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {canRemove && (
                <IconButton
                  icon={isSelf ? LogOut : Trash2}
                  label={isSelf ? 'Покинуть коллекцию' : 'Исключить'}
                  onClick={() => remove.mutate(member.user.id)}
                />
              )}
            </li>
          );
        })}
      </ul>

      <AddMemberDialog
        collection={collection}
        open={adding}
        onClose={() => setAdding(false)}
        existing={new Set(members.data?.map((member) => member.user.id))}
      />
    </section>
  );
}
