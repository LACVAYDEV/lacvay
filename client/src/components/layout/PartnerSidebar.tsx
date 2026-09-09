import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  Wallet,
  Settings,
  History,
} from 'lucide-react';
import { LogoMark, PalmDecor } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/partner', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/partner/requests', label: 'Ride Requests', icon: Inbox },
  { to: '/partner/earnings', label: 'Earnings', icon: Wallet },
  { to: '/partner/history', label: 'Trip History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface PartnerSidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function PartnerSidebar({ onNavigate, className }: PartnerSidebarProps) {
  return (
    <aside
      className={cn(
        'relative flex h-full w-[248px] shrink-0 flex-col overflow-hidden bg-white px-3.5 py-5',
        className,
      )}
    >
      <PalmDecor className="pointer-events-none absolute -bottom-4 left-0 w-full" />

      <div className="relative mb-7 px-1.5">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-9 w-7 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-[19px] font-extrabold leading-none tracking-tight text-lacvay-green">
              LACVAY
            </h1>
            <p className="mt-1 truncate text-[10px] text-gray-500">Transport Partner</p>
          </div>
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

export const partnerMobileNavItems = navItems.slice(0, 4);
