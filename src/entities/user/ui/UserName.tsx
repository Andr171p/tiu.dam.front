import { useUser } from '../model/users-store';

/** Имя коллеги по id; пока профиль грузится — нейтральная подпись. */
export function UserName({
  id,
  fallback = 'Сотрудник',
}: {
  id: string;
  fallback?: string;
}) {
  const user = useUser(id);
  return <>{user?.displayName ?? fallback}</>;
}
