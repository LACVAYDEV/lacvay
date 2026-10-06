import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, User, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { LogoMark } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import { getAdminPageSubtitle, getAdminPageTitle } from '@/lib/adminPageTitle';
import { AdminNavTitleOverrideProvider, type AdminNavHeaderOverride } from '@/context/AdminNavTitleContext';

function AdminProfileMenu({
  fullName,
  firstName,
  email,
  avatarUrl,
  profileOpen,
  setProfileOpen,
  onSwitchTraveler,
  onSignOut,
  compact,
}: {
  fullName: string;
  firstName: string;
  email?: string;
  avatarUrl: string;
  profileOpen: boolean;
  setProfileOpen: (open: boolean) => void;
  onSwitchTraveler: () => void;
  onSignOut: () => void;
  compact?: boolean;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  const updateMenuPos = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  };

  useLayoutEffect(() => {
    if (!profileOpen) {
      setMenuPos(null);
      return;
    }
    updateMenuPos();
    window.addEventListener('resize', updateMenuPos);
    window.addEventListener('scroll', updateMenuPos, true);
    return () => {
      window.removeEventListener('resize', updateMenuPos);
      window.removeEventListener('scroll', updateMenuPos, true);
    };
  }, [profileOpen]);

  const menuOverlay =
    profileOpen && menuPos
      ? createPortal(
          <div
            className="fixed inset-0 z-[200]"
            role="presentation"
            onClick={() => setProfileOpen(false)}
          >
            <div
              role="menu"
              className="absolute w-52 overflow-hidden rounded-lg border border-gray-100 bg-white py-1.5 shadow-lg"
              style={{ top: menuPos.top, right: menuPos.right }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-gray-100 px-4 pb-2 pt-1">
                <p className="truncate text-[12.5px] font-semibold text-gray-900">{fullName}</p>
                <p className="truncate text-[11px] text-gray-500">{email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => onSwitchTraveler()}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[12.5px] font-medium text-lacvay-green hover:bg-lacvay-green/5 active:bg-lacvay-green/10"
              >
                <User className="h-3.5 w-3.5 shrink-0" />
                Switch to traveler
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => onSignOut()}
                className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-2.5 text-left text-[12.5px] font-medium text-red-600 hover:bg-red-50 active:bg-red-100"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                Sign out
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setProfileOpen((open) => !open)}
        aria-expanded={profileOpen}
        aria-haspopup="menu"
        aria-label="Admin account menu"
        className={cn(
          'flex items-center gap-2 rounded-lg border border-gray-100 bg-white shadow-sm hover:bg-gray-50',
          compact ? 'p-0.5' : 'py-1 pl-1 pr-2.5',
        )}
      >
        <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full bg-gray-100 object-cover" />
        {!compact && (
          <>
            <span className="hidden text-[12.5px] font-medium text-gray-800 md:inline">{firstName}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 text-gray-500 transition', profileOpen && 'rotate-180')} />
          </>
        )}
      </button>
      {menuOverlay}
    </>
  );
}

function AdminPageHeading({
  title,
  subtitle,
  isDashboard,
  compact,
}: {
  title: string;
  subtitle: string | null;
  isDashboard: boolean;
  compact?: boolean;
}) {
  const titleClass = cn(
    'font-extrabold leading-none tracking-tight text-lacvay-green-dark',
    compact ? 'truncate text-[20px] sm:text-[22px]' : 'text-[26px] leading-tight lg:text-[28px]',
  );

  return (
    <div className="min-w-0">
      {isDashboard ? (
        <span className={titleClass}>{title}</span>
      ) : (
        <h1 className={titleClass}>{title}</h1>
      )}
      {subtitle && !compact ? (
        <p className="mt-0.5 max-w-2xl text-[12.5px] leading-snug text-gray-500 sm:text-[13px]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut, chooseSessionMode } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [headerOverride, setHeaderOverride] = useState<AdminNavHeaderOverride | null>(null);

  const path = location.pathname.replace(/\/$/, '') || '/admin';
  const pageTitle = headerOverride?.title ?? getAdminPageTitle(location.pathname);
  const pageSubtitle =
    headerOverride !== null
      ? (headerOverride.subtitle ?? null)
      : getAdminPageSubtitle(location.pathname);
  const isDashboard = path === '/admin';

  useEffect(() => {
    setHeaderOverride(null);
  }, [location.pathname]);

  const switchToTraveler = useCallback(() => {
    setProfileOpen(false);
    chooseSessionMode('user');
    navigate('/', { replace: true });
  }, [chooseSessionMode, navigate]);

  const handleSignOut = useCallback(async () => {
    setProfileOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  }, [navigate, signOut]);

  const fullName = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Admin';
  const firstName = fullName.split(' ')[0];
  const avatarUrl =
    user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`;

  const profileMenuProps = {
    fullName,
    firstName,
    email: user?.email,
    avatarUrl,
    profileOpen,
    setProfileOpen,
    onSwitchTraveler: switchToTraveler,
    onSignOut: () => {
      void handleSignOut();
    },
  };

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-lacvay-cream">
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

      <div className="flex w-full min-w-0 max-w-full flex-1 flex-col lg:pl-[248px]">
        <div className="relative z-40 border-b border-gray-100 bg-white lg:hidden">
          <div className="flex min-h-[52px] items-center justify-between gap-2 px-4 py-2">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="shrink-0 rounded-xl p-1.5 hover:bg-gray-100"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <LogoMark className="size-9 shrink-0 sm:size-10" />
              <AdminPageHeading
                title={pageTitle}
                subtitle={pageSubtitle}
                isDashboard={isDashboard}
                compact
              />
            </div>
            <AdminProfileMenu {...profileMenuProps} compact />
          </div>
        </div>

        <header className="sticky top-0 z-30 hidden border-b border-gray-100/80 bg-lacvay-cream/95 px-4 py-2.5 backdrop-blur md:px-6 lg:flex lg:items-center lg:justify-between lg:gap-3 lg:px-7">
          <AdminPageHeading title={pageTitle} subtitle={pageSubtitle} isDashboard={isDashboard} />
          <AdminProfileMenu {...profileMenuProps} />
        </header>

        <main className="box-border w-full min-w-0 max-w-full flex-1 overflow-x-clip px-4 pb-8 pt-2 md:px-6 lg:px-7 lg:pt-3">
          <AdminNavTitleOverrideProvider setOverride={setHeaderOverride}>
            <Outlet />
          </AdminNavTitleOverrideProvider>
        </main>
      </div>
    </div>
  );
}

