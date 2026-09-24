import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Sidebar, mobileNavItems } from './Sidebar';
import { Header } from './Header';
import { LocationPermissionBar } from './LocationPermissionBar';
import { LogoMark } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function AppLayout({ children, sidebarOpen, setSidebarOpen }: AppLayoutProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const isAssistant = location.pathname.startsWith('/ai-assistant');
  const isHome = location.pathname === '/';

  useEffect(() => {
    if (!sidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    focusable()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSidebarOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      menuButtonRef.current?.focus();
    };
  }, [setSidebarOpen, sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-lacvay-cream">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
            className="absolute inset-y-0 left-0 shadow-xl"
          >
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-2 top-3 z-10 rounded-full p-2 text-white hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col lg:pl-[248px]',
          isAssistant && 'h-screen overflow-hidden',
        )}
        inert={sidebarOpen ? true : undefined}
      >
        {isHome && (
          <div className="flex shrink-0 items-center gap-3 border-b border-lacvay-green/10 bg-white px-4 py-2.5 lg:hidden">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lacvay-green hover:bg-lacvay-blush"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <LogoMark className="size-9" />
            <span className="text-[17px] font-extrabold text-lacvay-green">LACVAY</span>
          </div>
        )}

        <Header menuButtonRef={menuButtonRef} onMenuClick={() => setSidebarOpen(true)} />
        <LocationPermissionBar />
        <main
          className={cn(
            'flex-1 min-h-0',
            isAssistant
              ? 'flex flex-col overflow-hidden p-0 pt-1.5'
              : cn('px-4 pb-6 md:px-6 lg:px-7', !isHome && 'pt-1.5 md:pt-2'),
          )}
        >
          {children}
        </main>

        <nav
          aria-label="Primary"
          className="pb-safe fixed bottom-0 left-0 right-0 z-40 border-t border-lacvay-green/10 bg-white/95 px-2 pt-1.5 backdrop-blur lg:hidden"
        >
          <div className="flex justify-around">
            {mobileNavItems.map(({ to, label, shortLabel, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                aria-label={label}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1 text-[10.5px] font-semibold transition',
                    isActive ? 'bg-lacvay-blush text-lacvay-green' : 'text-gray-500 hover:text-lacvay-green',
                  )
                }
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
                <span>{shortLabel}</span>
              </NavLink>
            ))}
          </div>
        </nav>
        {!isAssistant && <div className="h-20 lg:hidden" />}
      </div>
    </div>
  );
}
