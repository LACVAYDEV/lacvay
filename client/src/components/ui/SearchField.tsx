import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  className?: string;
}

export function SearchField({ value, onChange, placeholder, label, className }: SearchFieldProps) {
  return (
    <label className={cn('relative block min-w-0', className)}>
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-gray-200 bg-lacvay-cream/60 py-3 pl-11 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-lacvay-green focus:bg-white focus:ring-2 focus:ring-lacvay-green/15"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </label>
  );
}

export function FilterChip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition',
        active
          ? 'bg-lacvay-green text-white shadow-soft'
          : 'bg-lacvay-cream text-gray-600 hover:bg-lacvay-blush hover:text-lacvay-green',
        className,
      )}
    >
      {children}
    </button>
  );
}
