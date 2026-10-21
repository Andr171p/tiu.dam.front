import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@shared/ui/button';
import { CreateCollectionDialog } from './CreateCollectionDialog';

export function CreateCollectionButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button icon={Plus} onClick={() => setOpen(true)}>
        Создать коллекцию
      </Button>
      <CreateCollectionDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
