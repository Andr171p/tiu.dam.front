import clsx from 'clsx';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { dismissToast, useToasts } from './toast-store';
import styles from './Toaster.module.scss';

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };

export function Toaster() {
  const items = useToasts((state) => state.items);

  return (
    <div className={styles.toaster} role="status" aria-live="polite">
      {items.map((item) => {
        const Icon = ICONS[item.tone];
        return (
          <div key={item.id} className={clsx(styles.toast, styles[item.tone])}>
            <Icon size={18} className={styles.icon} aria-hidden />
            <span className={styles.message}>{item.message}</span>
            <button
              type="button"
              className={styles.close}
              aria-label="Закрыть"
              onClick={() => dismissToast(item.id)}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
