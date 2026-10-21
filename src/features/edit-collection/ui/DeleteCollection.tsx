import { useNavigate } from 'react-router';
import type { Collection } from '@entities/collection';
import { routes } from '@shared/config/routes';
import { Button } from '@shared/ui/button';
import { confirmAction } from '@shared/ui/dialog';
import { toast } from '@shared/ui/toast';
import { deleteCollection } from '../model/save-collection';
import styles from './settings.module.scss';

/** Удаление коллекции — только владельцу и только пустой. */
export function DeleteCollection({ collection }: { collection: Collection }) {
  const navigate = useNavigate();

  const remove = () =>
    confirmAction({
      title: `Удалить «${collection.name}»?`,
      description:
        'Коллекцию можно удалить, только когда в ней нет материалов, в том числе в корзине.',
      confirmLabel: 'Удалить',
      tone: 'danger',
      onConfirm: async () => {
        await deleteCollection(collection.id);
        toast.success('Коллекция удалена');
        void navigate(routes.collections());
      },
    });

  return (
    <section className={styles.danger}>
      <h2 className={styles.title}>Удаление</h2>
      <p className={styles.description}>
        Сначала перенесите или удалите материалы коллекции и очистите корзину.
      </p>
      <div>
        <Button variant="danger" onClick={remove}>
          Удалить коллекцию
        </Button>
      </div>
    </section>
  );
}
