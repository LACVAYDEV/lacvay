import type { ElementType, ReactNode } from 'react';
import { useReveal } from '@/hooks/useReveal';
import { cn } from '@/lib/utils';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  as?: ElementType;
}

/**
 * Fades and slides its children up into place the first time they enter the
 * viewport. Falls back to fully visible immediately if IntersectionObserver
 * is unavailable, and respects prefers-reduced-motion via index.css.
 */
export function Reveal({ children, className, delayMs = 0, as: Tag = 'div' }: RevealProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <Tag
      ref={ref as never}
      className={cn('reveal-fade-up', visible && 'reveal-fade-up-visible', className)}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
