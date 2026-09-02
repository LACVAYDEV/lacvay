import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'lime' | 'yellow' | 'gray';
  className?: string;
}

export function Badge({ children, variant = 'green', className }: BadgeProps) {
  const variants = {
    green: 'bg-lacvay-green/10 text-lacvay-green-dark',
    lime: 'bg-lacvay-lime/30 text-lacvay-green-dark',
    yellow: 'bg-lacvay-yellow/20 text-amber-800',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  );
}
