import { launchTransportApp, transportApps, type TransportAppKey } from '@/lib/transportApps';
import { cn } from '@/lib/utils';

interface TransportBarProps {
  className?: string;
  variant?: 'horizontal' | 'vertical';
}

const transportButtonKeys: TransportAppKey[] = ['grab', 'angkas', 'idolTaxi'];

export function TransportBar({ className, variant = 'horizontal' }: TransportBarProps) {
  return (
    <div
      className={cn(
        variant === 'vertical' ? 'flex flex-col gap-3' : 'grid min-w-0 grid-cols-3 gap-2 sm:gap-3',
        className,
      )}
    >
      {transportButtonKeys.map((key) => {
        const app = transportApps[key];
        return (
        <button
          key={key}
          type="button"
          onClick={() => launchTransportApp(key)}
          className={cn(
            'min-w-0 rounded-xl font-medium transition',
            'bg-white shadow-card hover:shadow-lg hover:-translate-y-0.5',
            'text-gray-900',
            variant === 'horizontal'
              ? 'flex flex-col items-center justify-center gap-1 px-1.5 py-2.5 sm:flex-row sm:gap-2 sm:px-3 sm:py-3'
              : 'flex w-full items-center justify-center gap-2 px-3 py-2.5 text-[14px]',
          )}
          aria-label={`Launch ${app.name}`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-white p-1 sm:h-10 sm:w-10">
            <img
              src={app.logoUrl}
              alt=""
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </span>
          <span
            className={cn(
              'max-w-full text-center text-[10px] font-semibold leading-tight sm:text-sm',
              variant === 'horizontal' && 'line-clamp-2',
            )}
          >
            {app.name}
          </span>
        </button>
        );
      })}
    </div>
  );
}
