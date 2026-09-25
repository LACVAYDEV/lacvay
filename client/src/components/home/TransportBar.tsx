import { launchTransportApp, type TransportAppKey } from '@/lib/transportApps';
import { cn } from '@/lib/utils';

interface TransportBarProps {
  className?: string;
  variant?: 'horizontal' | 'vertical';
}

const transportButtons: { key: TransportAppKey; label: string; icon: string }[] = [
  { key: 'grab', label: 'Grab', icon: '🚗' },
  { key: 'angkas', label: 'Angkas', icon: '🏍️' },
  { key: 'idolTaxi', label: 'iDOL Taxi', icon: '🚕' },
];

export function TransportBar({ className, variant = 'horizontal' }: TransportBarProps) {
  return (
    <div
      className={cn(
        'flex gap-3',
        variant === 'vertical' && 'flex-col',
        className,
      )}
    >
      {transportButtons.map(({ key, label, icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => launchTransportApp(key)}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl font-medium transition',
            'bg-white shadow-card hover:shadow-lg hover:-translate-y-0.5',
            'text-[14px] text-gray-900',
            variant === 'horizontal'
              ? 'flex-1 px-4 py-3'
              : 'w-full px-3 py-2.5'
          )}
          aria-label={`Launch ${label}`}
        >
          <span className="text-lg">{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
