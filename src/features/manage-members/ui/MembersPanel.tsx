import { Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type Collection,
  type CollectionRole,
  type Member,
} from '@entities/collection';
import { searchUsers, UserName, type User } from '@entities/user';
import { api, describeError } from '@shared/api';
import { useDebouncedValue, useRequest } from '@shared/lib/hooks';
import { Avatar } from '@shared/ui/avatar';
import { Button, IconButton } from '@shared/ui/button';
import { confirmAction } from '@shared/ui/dialog';
import { SelectField } from '@shared/ui/field';
import { Notice } from '@shared/ui/notice';
import { SearchField } from '@shared/ui/search-field';
import { Skeleton } from '@shared/ui/skeleton';
import { toast } from '@shared/ui/toast';
import styles from './MembersPanel.module.scss';

const ROLES = Object.keys(ROLE_LABELS) as CollectionRole[];

function RoleSelect({
  value,
  onChange,
  label,
}: {
  value: CollectionRole;
  onChange: (role: CollectionRole) => void;
  label: string;
}) {
  return (
    <SelectField
      label={label}
      value={value}
      className={styles.role}
      onChange={(event) => onChange(event.target.value as CollectionRole)}
    >
      {ROLES.map((role) => (
        <option key={role} value={role}>
          {ROLE_LABELS[role]}
        </option>
      ))}
    </SelectField>
  );
}

function AddMember({
  collectionId,
  onAdded,
}: {
  collectionId: string;
  onAdded: () => void;
}) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<CollectionRole>('viewer');
  const debounced = useDebouncedValue(query.trim(), 300);
  const found = useRequest<User[]>(
    (signal) =>
      debounced ? searchUsers(debounced, signal) : Promise.resolve([]),
    [debounced],
  );

  const add = async (user: User) => {
    try {
      await api.put(`/collections/${collectionId}/members`, {
        body: { userId: user.id, role },
      });
      toast.success(`${user.displayName}: ${ROLE_LABELS[role].toLowerCase()}`);
      setQuery('');
      onAdded();
    } catch (error) {
      toast.error(describeError(error));
    }
  };

  return (
    <div className={styles.add}>
      <div className={styles.addRow}>
        <SearchField
          placeholder="Имя или почта коллеги"
          aria-label="Найти коллегу"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <RoleSelect
          label="Роль новых участников"
          value={role}
          onChange={setRole}
        />
      </div>
      {debounced && found.status === 'ready' && (
        <ul className={styles.results}>
          {found.data.length === 0 && (
            <li className={styles.empty}>
              Никого не нашли. Коллега появится в поиске после первого входа в
              медиатеку.
            </li>
          )}
          {found.data.map((user) => (
            <li key={user.id} className={styles.person}>
              <Avatar name={user.displayName} size={32} />
              <span className={styles.personText}>
                <span>{user.displayName}</span>
                {user.email && (
                  <span className={styles.secondary}>{user.email}</span>
                )}
              </span>
              <Button size="sm" icon={UserPlus} onClick={() => void add(user)}>
                Добавить
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Участники коллекции и их роли. Владелец участником не хранится и не показывается. */
export function MembersPanel({ collection }: { collection: Collection }) {
  const members = useRequest(
    (signal) =>
      api.get<Member[]>(`/collections/${collection.id}/members`, { signal }),
    [collection.id],
  );

  const changeRole = async (member: Member, role: CollectionRole) => {
    try {
      await api.put(`/collections/${collection.id}/members`, {
        body: { userId: member.userId, role },
      });
      members.reload();
    } catch (error) {
      toast.error(describeError(error));
    }
  };

  const remove = (member: Member) =>
    confirmAction({
      title: `Убрать ${member.displayName ?? 'участника'} из коллекции?`,
      description:
        'Доступ пропадёт сразу; материалы, которые он загрузил, останутся.',
      confirmLabel: 'Убрать',
      tone: 'danger',
      onConfirm: async () => {
        await api.delete(
          `/collections/${collection.id}/members/${member.userId}`,
        );
        members.reload();
      },
    });

  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>Участники</h2>
      <p className={styles.secondary}>
        {ROLES.map(
          (role) =>
            `${ROLE_LABELS[role]} — ${ROLE_DESCRIPTIONS[role].toLowerCase()}`,
        ).join('. ')}
        .
      </p>

      <AddMember collectionId={collection.id} onAdded={members.reload} />

      {members.status === 'error' && <Notice>{members.error}</Notice>}
      {members.status === 'loading' && !members.data && (
        <Skeleton height={48} />
      )}
      {members.data && (
        <ul className={styles.list}>
          {members.data.length === 0 && (
            <li className={styles.empty}>Пока только владелец коллекции.</li>
          )}
          {members.data.map((member) => (
            <li key={member.userId} className={styles.person}>
              <Avatar
                name={member.displayName ?? member.email ?? '?'}
                size={32}
              />
              <span className={styles.personText}>
                <span>
                  {member.displayName ?? <UserName id={member.userId} />}
                </span>
                {member.email && (
                  <span className={styles.secondary}>{member.email}</span>
                )}
              </span>
              <RoleSelect
                label={`Роль: ${member.displayName ?? 'участник'}`}
                value={member.role}
                onChange={(role) => void changeRole(member, role)}
              />
              <IconButton
                icon={Trash2}
                label="Убрать из коллекции"
                onClick={() => remove(member)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
