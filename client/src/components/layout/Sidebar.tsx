import { NavLink } from 'react-router-dom';
import {
  Home,
  Map,
  BookOpen,
  Coins,
  Car,
  Camera,
  Sparkles,
  UtensilsCrossed,
  Tag,
  Bookmark,
  History,
  Settings,
} from 'lucide-react';
import { LogoMark, SidebarWaveArt } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/map', label: 'Map & Routes', icon: Map },
  { to: '/commute', label: 'Commute Guide', icon: BookOpen },
  { to: '/fares', label: 'Fare Checker', icon: Coins },
  { to: '/rides', label: 'Ride Guide', icon: Car },
  { to: '/tourist-spots', label: 'Tourist Spots', icon: Camera },
  { to: '/ai-assistant', label: 'AI Travel Assistant', icon: Sparkles },
  { to: '/restaurants', label: 'Nearby Restaurants', icon: UtensilsCrossed },
  { to: '/promotions', label: 'Promotions', icon: Tag },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
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
      <div className="relative mb-7 flex items-center gap-2.5 px-1.5">
        <LogoMark className="h-9 w-7 shrink-0 rounded-full ring-1 ring-white/30" />
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

      <div className="relative mt-3 shrink-0 px-2">
        <p className="font-script text-[22px] leading-[1.05] text-white/90">More places,</p>
        <svg
          viewBox="0 0 90 10"
          className="-mt-1 ml-1 h-2 w-[70px] text-white/70"
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
        <p className="font-script text-[22px] leading-[1.05] text-white/90">More stories.</p>
      </div>
      <SidebarWaveArt className="pointer-events-none -mb-5 -mt-2 w-full shrink-0" />
    </aside>
  );
}

export const mobileNavItems = navItems.slice(0, 5);
