import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar, mobileNavItems } from './Sidebar';
import { PartnerSidebar, partnerMobileNavItems } from './PartnerSidebar';
import { Header } from './Header';
import { LogoMark } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function AppLayout({ children, sidebarOpen, setSidebarOpen }: AppLayoutProps) {
  const { isTranspoPartner } = useAuth();
  const bottomNav = isTranspoPartner ? partnerMobileNavItems : mobileNavItems;

  return (
    <div className="flex min-h-screen bg-lacvay-cream">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:border-r lg:border-gray-100">
        {isTranspoPartner ? <PartnerSidebar /> : <Sidebar />}
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
            role="presentation"
          />
          <div className="absolute inset-y-0 left-0 shadow-xl">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-2 top-3 z-10 rounded-full p-2 hover:bg-gray-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {isTranspoPartner ? (
              <PartnerSidebar onNavigate={() => setSidebarOpen(false)} />
            ) : (
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            )}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[248px]">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-1.5 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <LogoMark className="h-7 w-5" />
          <span className="text-[17px] font-extrabold text-lacvay-green">LACVAY</span>
        </div>

        <Header />
        <main className="flex-1 px-4 pb-6 md:px-6 lg:px-7">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white px-2 py-1.5 lg:hidden">
          <div className="flex justify-around">
            {bottomNav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium',
                    isActive ? 'text-lacvay-green' : 'text-gray-500',
                  )
                }
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
                <span className="max-w-[56px] truncate">{label.split(' ')[0]}</span>
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="h-16 lg:hidden" />
      </div>
    </div>
  );
}
