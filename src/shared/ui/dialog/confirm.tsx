import { useState } from 'react';
import { describeError } from '../../api';
import { Button } from '../button';
import { Notice } from '../notice';
import { Dialog, DialogActions } from './Dialog';
import { useConfirm } from './confirm-store';

/** Монтируется один раз в корне приложения. */
export function ConfirmHost() {
  const options = useConfirm((state) => state.options);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const close = () => {
    setError(null);
    useConfirm.setState({ options: null });
  };

  const confirm = async () => {
    if (!options) return;
    setPending(true);
    setError(null);
    try {
      await options.onConfirm();
      close();
    } catch (failure) {
      // Диалог остаётся открытым: можно повторить или отменить
      setError(describeError(failure));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={options !== null}
      onClose={close}
      title={options?.title ?? ''}
      description={options?.description}
    >
      {error && <Notice>{error}</Notice>}
      <DialogActions>
        <Button onClick={close} disabled={pending}>
          Отмена
        </Button>
        <Button
          variant={options?.tone === 'danger' ? 'danger' : 'primary'}
          loading={pending}
          onClick={() => void confirm()}
          autoFocus
        >
          {options?.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
