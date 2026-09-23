import { Navigate, useNavigate } from 'react-router-dom';
import { Shield, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { LogoMark } from '@/components/ui/Logo';
import { LoadingState } from '@/components/ui/States';

export default function ChooseModePage() {
  const { isAdmin, isLoading, chooseSessionMode } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <LoadingState />;

  if (!isAdmin) return <Navigate to="/" replace />;

  const enterAsUser = () => {
    chooseSessionMode('user');
    navigate('/', { replace: true });
  };

  const enterAsAdmin = () => {
    chooseSessionMode('admin');
    navigate('/admin', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-lacvay-cream px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="size-24" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">How would you like to continue?</h1>
          <p className="mt-2 text-sm text-gray-500">
            Your account has admin access. Choose traveler mode for the regular app, or admin mode to manage content.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button type="button" onClick={enterAsUser} className="text-left">
            <Card className="h-full transition hover:border-lacvay-green/40 hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <User className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-bold text-gray-900">Continue as user</h2>
              <p className="mt-2 text-sm text-gray-500">
                Explore Batangas, check fares, and use LACVAY like any traveler.
              </p>
            </Card>
          </button>

          <button type="button" onClick={enterAsAdmin} className="text-left">
            <Card className="h-full transition hover:border-lacvay-green/40 hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-bold text-gray-900">Open admin panel</h2>
              <p className="mt-2 text-sm text-gray-500">
                Manage tourist spots, restaurants, promotions, and users.
              </p>
            </Card>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400">
          You can switch modes anytime from your profile menu.
        </p>
      </div>
    </div>
  );
}
