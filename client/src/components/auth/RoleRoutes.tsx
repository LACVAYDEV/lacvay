import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/** Sends travelers to `/` and transport partners to `/partner`. */
export function RoleHomeRedirect() {
  const { isTranspoPartner } = useAuth();
  return <Navigate to={isTranspoPartner ? '/partner' : '/'} replace />;
}

interface PartnerOnlyProps {
  children: React.ReactNode;
}

export function PartnerOnly({ children }: PartnerOnlyProps) {
  const { isTranspoPartner } = useAuth();
  if (!isTranspoPartner) return <Navigate to="/" replace />;
  return children;
}

interface TravelerOnlyProps {
  children: React.ReactNode;
}

export function TravelerOnly({ children }: TravelerOnlyProps) {
  const { isTranspoPartner } = useAuth();
  if (isTranspoPartner) return <Navigate to="/partner" replace />;
  return children;
}
