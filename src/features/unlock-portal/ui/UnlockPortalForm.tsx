import { LockKeyhole } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { unlockPortal } from '@entities/portal';
import { ApiError, describeError } from '@shared/api';
import { formText } from '@shared/lib/format';
import { Button } from '@shared/ui/button';
import { TextField } from '@shared/ui/field';
import styles from './UnlockPortalForm.module.scss';

interface UnlockPortalFormProps {
  slug: string;
  onUnlocked: () => void;
}

/** Портал по паролю: токен действует до закрытия вкладки. */
export function UnlockPortalForm({ slug, onUnlocked }: UnlockPortalFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await unlockPortal(
        slug,
        formText(new FormData(event.currentTarget), 'password'),
      );
      onUnlocked();
    } catch (failure) {
      setError(
        failure instanceof ApiError && failure.status === 401
          ? 'Неверный пароль'
          : describeError(failure),
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={(event) => void submit(event)}>
      <span className={styles.icon}>
        <LockKeyhole size={24} strokeWidth={1.6} aria-hidden />
      </span>
      <h1 className={styles.title}>Материалы по паролю</h1>
      <p className={styles.description}>
        Пароль можно получить у пресс-службы ТИУ.
      </p>
      <TextField
        label="Пароль"
        name="password"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        error={error ?? undefined}
      />
      <Button type="submit" variant="primary" block loading={pending}>
        Открыть
      </Button>
    </form>
  );
}
