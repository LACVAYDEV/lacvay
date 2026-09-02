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
import { LogoMark, PalmDecor } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/map', label: 'Map & Routes', icon: Map },
  { to: '/commute', label: 'Commute Guide', icon: BookOpen },
  { to: '/fares', label: 'Fare Checker', icon: Coins },
  { to: '/rides', label: 'Book a Ride', icon: Car },
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
        'relative flex h-full w-[248px] shrink-0 flex-col overflow-hidden bg-white px-3.5 py-5',
        className,
      )}
    >
      <PalmDecor className="pointer-events-none absolute -bottom-4 left-0 w-full" />

      <div className="relative mb-7 flex items-center gap-2.5 px-1.5">
        <LogoMark className="h-9 w-7 shrink-0" />
        <div className="min-w-0">
          <h1 className="text-[19px] font-extrabold leading-none tracking-tight text-lacvay-green">
            LACVAY
          </h1>
          <p className="mt-1 truncate text-[10px] text-gray-500">Batangas City Assistant</p>
        </div>
      </div>

      <nav className="relative flex-1 space-y-0.5 overflow-y-auto">
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
                  ? 'bg-gradient-to-r from-lacvay-green to-lacvay-lime text-white shadow-soft'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-lacvay-green-dark',
              )
            }
          >
            <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.9} />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export const mobileNavItems = navItems.slice(0, 5);
