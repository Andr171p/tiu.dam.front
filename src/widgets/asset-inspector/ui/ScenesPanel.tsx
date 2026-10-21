import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@shared/ui/button';
import styles from './AssetInspector.module.scss';

/** AI-разметка сцен появится вместе с поддержкой в API: раздел показан, но неактивен. */
export function ScenesPanel() {
  return (
    <div className={styles.scenes}>
      <div className={styles.scenesActions}>
        <Button variant="primary" icon={Sparkles} soon>
          AI-разметка
        </Button>
        <Button icon={Plus} soon>
          Сцена
        </Button>
      </div>
      <p className={styles.aiNote}>
        Скоро: AI разобьёт видео на сцены с таймкодами. Пока смотрите участников
        и расшифровку речи.
      </p>
    </div>
  );
}
