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

/** Renders app routes only for signed-in users, otherwise sends them to the landing page. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <AppSplash />;
  if (!session) {
    return <Navigate to="/welcome" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

/** Keeps signed-in users out of the landing and auth pages. */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth();

  if (isLoading) return <AppSplash />;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

