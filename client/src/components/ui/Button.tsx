import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variants = {
      primary: 'bg-lacvay-green text-white hover:bg-lacvay-green-dark shadow-soft',
      secondary: 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50',
      ghost: 'bg-transparent text-lacvay-green hover:bg-lacvay-green/5',
      outline: 'border-2 border-lacvay-green text-lacvay-green bg-white hover:bg-lacvay-green/5',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-xl',
      md: 'px-5 py-2.5 text-sm rounded-2xl',
      lg: 'px-6 py-3 text-base rounded-2xl',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
