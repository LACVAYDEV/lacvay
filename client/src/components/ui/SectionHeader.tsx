import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, icon, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-lacvay-blush text-lacvay-green">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11.5px] leading-snug text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SectionLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold text-lacvay-green transition hover:bg-lacvay-blush"
    >
      {label}
      <span aria-hidden="true">→</span>
    </button>
  );
}
