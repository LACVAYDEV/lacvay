import { NavLink } from 'react-router-dom';
import {
  Home,
  Map,
  BookOpen,
  Camera,
  Sparkles,
  UtensilsCrossed,
  Bookmark,
  Settings,
  Car,
} from 'lucide-react';
import { LogoMark, SidebarWaveArt } from '@/components/ui/Logo';
import { TransportBar } from '@/components/home/TransportBar';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Home', shortLabel: 'Home', icon: Home, end: true },
  { to: '/map', label: 'Map & Routes', shortLabel: 'Map', icon: Map },
  { to: '/commute', label: 'Commute Guide', shortLabel: 'Commute', icon: BookOpen },
  { to: '/rides', label: 'Book a Ride', shortLabel: 'Rides', icon: Car },
  { to: '/tourist-spots', label: 'Nearby Tourist Spots', shortLabel: 'Spots', icon: Camera },
  { to: '/restaurants', label: 'Nearby Restaurants', shortLabel: 'Food', icon: UtensilsCrossed },
  { to: '/ai-assistant', label: 'LACVAY AI', shortLabel: 'AI', icon: Sparkles },
  { to: '/saved', label: 'Saved', shortLabel: 'Saved', icon: Bookmark },
  { to: '/settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
];

interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ onNavigate, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'relative flex h-full w-[248px] shrink-0 flex-col overflow-hidden bg-lacvay-green px-3.5 py-5',
        className,
      )}
    >
      <div className="relative mb-6 flex items-center gap-3 px-0.5">
        <LogoMark className="size-20" />
        <div className="min-w-0">
          <h1 className="text-[19px] font-extrabold leading-none tracking-tight text-white">
            LACVAY
          </h1>
          <p className="mt-1 truncate text-[10px] text-white/60">Batangas City Assistant</p>
        </div>
      </div>

      <nav className="relative min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-medium transition',
                isActive
                  ? 'bg-lacvay-blush text-lacvay-green shadow-soft'
                  : 'text-white/80 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.9} />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="relative mt-4 mb-3 px-0.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60 mb-2">Quick Access</p>
        <TransportBar variant="vertical" className="gap-2" />
      </div>

      <div className="relative -mx-3.5 -mb-5 h-[92px] shrink-0">
        <SidebarWaveArt className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className="absolute left-5 top-2.5">
          <p className="font-script text-[18px] leading-none text-white/90">More places,</p>
          <svg
            viewBox="0 0 90 10"
            className="-mt-0.5 ml-1 h-1.5 w-[56px] text-white/70"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 5c10-6 18 6 28 0s18-6 28 0 18 6 28 0"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <p className="-mt-0.5 font-script text-[18px] leading-none text-white/90">More stories.</p>
        </div>
      </div>
    </aside>
  );
}

export const mobileNavItems = navItems.slice(0, 5);
