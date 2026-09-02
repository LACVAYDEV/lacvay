import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { validateEmail, validateName, validatePassword } from '@/services/authService';
import { cn } from '@/lib/utils';

type AuthMode = 'signin' | 'signup';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface AuthFormProps {
  mode: AuthMode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const isSignUp = mode === 'signup';
  const { signIn, signUp, signInAsGuest } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (isSignUp) next.name = validateName(name) ?? undefined;
    next.email = validateEmail(email) ?? undefined;
    next.password = validatePassword(password) ?? undefined;
    if (isSignUp && password !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match';
    }

    const cleaned = Object.fromEntries(Object.entries(next).filter(([, v]) => v)) as FieldErrors;
    setErrors(cleaned);
    return Object.keys(cleaned).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setNotice(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isSignUp) await signUp({ name, email, password });
      else await signIn({ email, password });
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuest = async () => {
    setGuestLoading(true);
    try {
      await signInAsGuest();
      navigate('/', { replace: true });
    } finally {
      setGuestLoading(false);
    }
  };

  const inputClass = (hasError?: string) =>
    cn(
      'w-full rounded-2xl border bg-gray-50 px-4 py-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:bg-white',
      hasError
        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
        : 'border-gray-200 focus:border-lacvay-green focus:ring-2 focus:ring-lacvay-green/15',
    );

  return (
    <div>
      <div className="flex rounded-full bg-gray-100 p-1">
        <Link
          to="/login"
          className={cn(
            'flex-1 rounded-full py-2 text-center text-[13px] font-semibold transition',
            !isSignUp ? 'bg-white text-lacvay-green-dark shadow-sm' : 'text-gray-500 hover:text-gray-700',
          )}
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          className={cn(
            'flex-1 rounded-full py-2 text-center text-[13px] font-semibold transition',
            isSignUp ? 'bg-white text-lacvay-green-dark shadow-sm' : 'text-gray-500 hover:text-gray-700',
          )}
        >
          Create Account
        </Link>
      </div>

      <h1 className="mt-7 text-[24px] font-extrabold tracking-tight text-gray-900">
        {isSignUp ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className="mt-1.5 text-[13px] text-gray-500">
        {isSignUp
          ? 'Save places, keep your history, and get personalised recommendations.'
          : 'Sign in to continue exploring Batangas City.'}
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-[12px] font-medium text-gray-700">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan dela Cruz"
              aria-invalid={Boolean(errors.name)}
              className={inputClass(errors.name)}
            />
            {errors.name && (
              <p role="alert" className="mt-1.5 text-[11.5px] text-red-600">{errors.name}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-[12px] font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            className={inputClass(errors.email)}
          />
          {errors.email && (
            <p role="alert" className="mt-1.5 text-[11.5px] text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-[12px] font-medium text-gray-700">
              Password
            </label>
            {!isSignUp && (
              <button
                type="button"
                onClick={() => setNotice('Password reset will be available once Firebase Auth is connected.')}
                className="text-[11.5px] font-semibold text-lacvay-green hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              aria-invalid={Boolean(errors.password)}
              className={cn(inputClass(errors.password), 'pr-11')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p role="alert" className="mt-1.5 text-[11.5px] text-red-600">{errors.password}</p>
          )}
        </div>

        {isSignUp && (
          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-[12px] font-medium text-gray-700">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              aria-invalid={Boolean(errors.confirmPassword)}
              className={inputClass(errors.confirmPassword)}
            />
            {errors.confirmPassword && (
              <p role="alert" className="mt-1.5 text-[11.5px] text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        )}

        {formError && (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700">
            {formError}
          </p>
        )}

        {notice && (
          <p className="rounded-2xl bg-lacvay-lime/20 px-4 py-3 text-[12px] font-medium text-lacvay-green-dark">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lacvay-green to-lacvay-lime py-3 text-[14px] font-bold text-white shadow-soft transition hover:opacity-95 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">or</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <button
        type="button"
        onClick={handleGuest}
        disabled={guestLoading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3 text-[13.5px] font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60"
      >
        {guestLoading && <Loader2 className="h-4 w-4 animate-spin text-lacvay-green" />}
        Continue as guest
      </button>

      <p className="mt-6 text-center text-[12px] text-gray-500">
        {isSignUp ? 'Already have an account? ' : "Don't have an account yet? "}
        <Link
          to={isSignUp ? '/login' : '/signup'}
          className="font-semibold text-lacvay-green hover:underline"
        >
          {isSignUp ? 'Sign in' : 'Create one for free'}
        </Link>
      </p>
    </div>
  );
}
