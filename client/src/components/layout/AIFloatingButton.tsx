import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AIFloatingButton() {
  const location = useLocation();
  
  if (
    location.pathname.startsWith('/ai-assistant')
    || location.pathname.startsWith('/assistant')
    || location.pathname.startsWith('/rides')
  ) {
    return null;
  }

  return (
    <Link
      to="/ai-assistant"
      aria-label="Open AI Assistant"
      className={cn(
        'fixed bottom-24 right-4 z-30 sm:bottom-28 md:bottom-32 lg:bottom-6 lg:right-6',
        'flex h-14 w-14 lg:h-16 lg:w-16 items-center justify-center',
        'rounded-full bg-lacvay-green shadow-lg hover:shadow-xl',
        'transition-all duration-200 ease-out hover:scale-110 active:scale-95',
        'text-white hover:text-white',
        'flex-shrink-0'
      )}
    >
      <Sparkles className="h-6 w-6 lg:h-7 lg:w-7" strokeWidth={1.5} />
    </Link>
  );
}
