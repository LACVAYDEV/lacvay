import { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, User, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { LogoMark } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, profile, signOut, chooseSessionMode } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchToTraveler = () => {
    chooseSessionMode('user');
    navigate('/');
  };

  const fullName = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Admin';
  const firstName = fullName.split(' ')[0];

  return (
    <div className="flex min-h-screen bg-lacvay-cream">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex">
        <AdminSidebar />
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
              className="absolute right-2 top-3 z-10 rounded-full p-2 text-white hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
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
          <LogoMark className="size-10" />
          <span className="text-[17px] font-extrabold text-lacvay-green">LACVAY Admin</span>
        </div>

        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-lacvay-cream/95 px-4 py-4 backdrop-blur md:px-6 lg:px-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-lacvay-green/70">Administration</p>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
                className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white py-1 pl-1 pr-2.5 shadow-sm hover:bg-gray-50"
              >
                <img
                  src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                  alt=""
                  className="h-8 w-8 rounded-full bg-gray-100"
                />
                <span className="hidden text-[12.5px] font-medium text-gray-800 md:inline">{firstName}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 text-gray-500 transition', profileOpen && 'rotate-180')} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-lg border border-gray-100 bg-white py-1.5 shadow-sm">
                  <div className="border-b border-gray-100 px-4 pb-2 pt-1">
                    <p className="truncate text-[12.5px] font-semibold text-gray-900">{fullName}</p>
                    <p className="truncate text-[11px] text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); switchToTraveler(); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-[12.5px] font-medium text-lacvay-green hover:bg-lacvay-green/5"
                  >
                    <User className="h-3.5 w-3.5" />
                    Switch to traveler
                  </button>
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); void signOut(); }}
                    className="mt-1 flex w-full items-center gap-2 border-t border-gray-100 px-4 py-2 text-left text-[12.5px] font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-8 md:px-6 lg:px-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
