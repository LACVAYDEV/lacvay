import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function AdminPageHeader({ eyebrow, title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-lacvay-green/70">{eyebrow}</p>
        )}
        <h1 className={cn('text-[26px] font-extrabold leading-tight tracking-tight text-lacvay-green-dark', eyebrow && 'mt-1')}>
          {title}
        </h1>
        {description && <p className="mt-1.5 max-w-xl text-[13px] text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
