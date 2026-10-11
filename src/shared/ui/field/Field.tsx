import clsx from 'clsx';
import { useId, type ComponentProps, type ReactNode } from 'react';
import styles from './Field.module.scss';

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  children: (control: {
    id: string;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
  }) => ReactNode;
}

/** Подпись, контрол и подсказка/ошибка: общая обвязка всех полей формы. */
export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={clsx(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': message ? messageId : undefined,
      })}
      {message && (
        <span id={messageId} className={error ? styles.error : styles.hint}>
          {message}
        </span>
      )}
    </div>
  );
}

type OwnProps = Pick<FieldProps, 'label' | 'hint' | 'error'>;

export function TextField({
  label,
  hint,
  error,
  className,
  required,
  ...props
}: OwnProps & ComponentProps<'input'>) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      {(control) => (
        <input
          className={styles.control}
          required={required}
          {...control}
          {...props}
        />
      )}
    </Field>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  className,
  required,
  ...props
}: OwnProps & ComponentProps<'textarea'>) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      {(control) => (
        <textarea
          className={clsx(styles.control, styles.textarea)}
          required={required}
          {...control}
          {...props}
        />
      )}
    </Field>
  );
}

export function SelectField({
  label,
  hint,
  error,
  className,
  required,
  ...props
}: OwnProps & ComponentProps<'select'>) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      {(control) => (
        <select
          className={clsx(styles.control, styles.select)}
          required={required}
          {...control}
          {...props}
        />
      )}
    </Field>
  );
}

interface ToggleProps extends Omit<ComponentProps<'input'>, 'type'> {
  label: ReactNode;
  description?: ReactNode;
}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: ToggleProps) {
  return (
    <label className={clsx(styles.toggle, className)}>
      <input type="checkbox" className={styles.checkbox} {...props} />
      <span className={styles.toggleText}>
        <span>{label}</span>
        {description && <span className={styles.hint}>{description}</span>}
      </span>
    </label>
  );
}

export function Switch({
  label,
  description,
  className,
  ...props
}: ToggleProps) {
  return (
    <label className={clsx(styles.toggle, className)}>
      <input
        type="checkbox"
        role="switch"
        className={styles.switch}
        {...props}
      />
      <span className={styles.toggleText}>
        <span>{label}</span>
        {description && <span className={styles.hint}>{description}</span>}
      </span>
    </label>
  );
}
