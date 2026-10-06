import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Hide description below `sm` to save vertical space on phones */
  hideDescriptionOnMobile?: boolean;
  /** Hide description at all breakpoints (title lives in the admin top bar) */
  hideDescription?: boolean;
  /** Put action buttons on their own row on phones (avoids horizontal overflow) */
  stackActionsOnMobile?: boolean;
  actions?: ReactNode;
  className?: string;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  hideDescriptionOnMobile,
  hideDescription,
  stackActionsOnMobile,
  actions,
  className,
}: AdminPageHeaderProps) {
  const descriptionEl =
    description && !hideDescription ? (
      <p
        className={cn(
          'min-w-0 text-[12.5px] leading-snug text-gray-500 sm:max-w-xl sm:text-[13px]',
          hideDescriptionOnMobile && 'hidden sm:block',
        )}
      >
        {description}
      </p>
    ) : null;

  const actionsEl = actions ? (
    <div
      className={cn(
        'flex shrink-0 items-center gap-2',
        stackActionsOnMobile && 'w-full sm:w-auto',
      )}
    >
      {actions}
    </div>
  ) : null;

  const toolbarOnlyActions = actionsEl && !descriptionEl;
  const toolbarBoth = actionsEl && descriptionEl;
  const hasVisibleChrome = eyebrow || toolbarOnlyActions || toolbarBoth || (!actionsEl && descriptionEl);

  if (!hasVisibleChrome) {
    return <span className="sr-only">{title}</span>;
  }

  return (
    <header className={cn(className)}>
      <span className="sr-only">{title}</span>
      {eyebrow && (
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-lacvay-green/70">{eyebrow}</p>
      )}
      {toolbarOnlyActions && <div className="flex justify-end">{actionsEl}</div>}
      {toolbarBoth && (
        <div
          className={cn(
            'gap-2 sm:gap-4',
            stackActionsOnMobile
              ? 'flex flex-col sm:flex-row sm:items-center sm:justify-between'
              : 'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
          )}
        >
          {descriptionEl}
          {actionsEl}
        </div>
      )}
      {!actionsEl && descriptionEl}
    </header>
  );
}
