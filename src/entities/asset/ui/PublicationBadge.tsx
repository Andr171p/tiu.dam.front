import { Check } from 'lucide-react';
import { Tag } from '@shared/ui/tag';
import { publicationStatus } from '../model/labels';
import type { LicenseStatus } from '../model/types';

/** «✓ Можно публиковать», «Нужна проверка» — по статусу лицензии на сегодня. */
export function PublicationBadge({ status }: { status: LicenseStatus | null }) {
  const { label, tone } = publicationStatus(status);

  return (
    <Tag
      tone={tone}
      icon={
        status === 'active' ? (
          <Check size={12} strokeWidth={2} aria-hidden />
        ) : undefined
      }
    >
      {label}
    </Tag>
  );
}
