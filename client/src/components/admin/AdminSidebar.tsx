import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MapPin, Route, Tag, Users, UtensilsCrossed } from 'lucide-react';
import { LogoMark, SidebarWaveArt } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

export const adminNavItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true as const },
  { to: '/admin/users', label: 'Users', icon: Users, end: false as const },
  { to: '/admin/places', label: 'Tourist Spots', icon: MapPin, end: false as const },
  { to: '/admin/restaurants', label: 'Eateries', icon: UtensilsCrossed, end: false as const },
  { to: '/admin/transit', label: 'Transit Routes', icon: Route, end: false as const },
  { to: '/admin/promotions', label: 'Promotions', icon: Tag, end: false as const },
];

interface AdminSidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function AdminSidebar({ onNavigate, className }: AdminSidebarProps) {
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
          <p className="mt-1 truncate text-[10px] text-white/60">Admin Console</p>
        </div>
      </div>

      <p className="relative mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
        Manage
      </p>

      <nav className="relative min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {adminNavItems.map(({ to, label, icon: Icon, end }) => (
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
        <p className="font-script text-[22px] leading-[1.05] text-white/90">Curate the city,</p>
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
        <p className="font-script text-[22px] leading-[1.05] text-white/90">share the stories.</p>
      </div>
      <SidebarWaveArt className="pointer-events-none -mb-5 -mt-2 w-full shrink-0" />
    </aside>
  );
}
