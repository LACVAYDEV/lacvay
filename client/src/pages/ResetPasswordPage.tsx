import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const isRecoveryUrl =
      window.location.hash.includes('type=recovery') ||
      new URLSearchParams(window.location.search).has('code');

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      setHasRecoverySession(Boolean(data.session) && !sessionError && isRecoveryUrl);
      setCheckingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasRecoverySession(true);
        setCheckingSession(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    await supabase.auth.signOut();
    navigate('/login', { replace: true, state: { passwordReset: true } });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-lacvay-cream px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-gray-100 bg-white p-6 shadow-card sm:p-8">
        <Link to="/welcome" className="text-sm font-semibold text-lacvay-green hover:underline">
          Back to LACVAY
        </Link>
        <h1 className="mt-6 text-2xl font-extrabold text-gray-900">Set a new password</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Choose a new password for your LACVAY account.
        </p>

        {checkingSession ? (
          <div className="mt-8 flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying reset link...
          </div>
        ) : !hasRecoverySession ? (
          <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900" role="alert">
            <p className="font-semibold">This reset link is invalid or has expired.</p>
            <p className="mt-1">Request a new link from the sign-in page.</p>
            <Link to="/login" className="mt-3 inline-block font-bold text-lacvay-green hover:underline">
              Return to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-gray-700">
                New password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-11 text-sm outline-none focus:border-lacvay-green focus:bg-white focus:ring-2 focus:ring-lacvay-green/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-new-password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <input
                id="confirm-new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lacvay-green focus:bg-white focus:ring-2 focus:ring-lacvay-green/20"
              />
            </div>
            {error && (
              <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-lacvay-green py-3 text-sm font-bold text-white hover:bg-lacvay-green-dark disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
