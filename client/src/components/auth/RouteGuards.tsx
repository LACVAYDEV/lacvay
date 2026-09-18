import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LogoMark } from '@/components/ui/Logo';

export function AppSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-lacvay-cream">
      <div className="flex flex-col items-center gap-3">
        <LogoMark className="h-12 w-9 animate-pulse" />
        <p className="text-sm font-semibold text-lacvay-green">LACVAY</p>
      </div>
    </div>
  );
}

/** Renders app routes only for signed-in users, otherwise sends them to the login page. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <AppSplash />;

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

/** Keeps signed-in users out of public-only pages like landing, login, and signup. */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { session, isLoading, needsModeChoice } = useAuth();
  const location = useLocation();

  if (isLoading) return <AppSplash />;

  if (session) {
    if (needsModeChoice) return <Navigate to="/choose-mode" replace />;
    const target = (location.state as { from?: string })?.from || '/';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}

/** Admins must pick user vs admin mode before using the main app. */
export function SessionModeRoute({ children }: { children: ReactNode }) {
  const { session, isLoading, needsModeChoice } = useAuth();
  const location = useLocation();

  if (isLoading) return <AppSplash />;

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (needsModeChoice && location.pathname !== '/choose-mode') {
    return <Navigate to="/choose-mode" replace />;
  }

  return <>{children}</>;
}

/** Admin panel — requires signed-in admin account AND admin session mode. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { session, isLoading, isAdmin, isAdminMode } = useAuth();
  const location = useLocation();

  if (isLoading) return <AppSplash />;

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (!isAdminMode) {
    return <Navigate to="/choose-mode" replace />;
  }

  return <>{children}</>;
}
