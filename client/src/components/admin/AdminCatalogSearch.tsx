import type { ReactNode } from 'react';
import { Search } from 'lucide-react';

interface AdminCatalogSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  'aria-label': string;
  trailing?: ReactNode;
}

export function AdminCatalogSearch({
  value,
  onChange,
  placeholder,
  'aria-label': ariaLabel,
  trailing,
}: AdminCatalogSearchProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-[12.5px] outline-none transition placeholder:text-gray-400 focus:border-lacvay-green focus:ring-2 focus:ring-lacvay-green/15"
        />
      </div>
      {trailing ? <div className="flex shrink-0 items-center">{trailing}</div> : null}
    </div>
  );
}
