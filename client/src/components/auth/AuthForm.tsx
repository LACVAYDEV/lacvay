import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
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

const strengthLevels = [
  { label: 'Too short', bar: 'bg-red-400', text: 'text-red-600' },
  { label: 'Weak', bar: 'bg-red-400', text: 'text-red-600' },
  { label: 'Fair', bar: 'bg-amber-400', text: 'text-amber-600' },
  { label: 'Strong', bar: 'bg-lacvay-green', text: 'text-lacvay-green' },
];

function passwordScore(value: string): number {
  if (value.length === 0) return 0;
  if (value.length < 6) return 1;
  let score = 2;
  if (value.length >= 10) score += 1;
  if (/[A-Z]/.test(value) && /[^A-Za-z]/.test(value)) score += 1;
  return Math.min(score, 3);
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

function validateName(name: string): string | null {
  if (!name.trim()) return 'Name is required';
  if (name.trim().length < 2) return 'Enter your full name';
  return null;
}

export function AuthForm({ mode }: AuthFormProps) {
  const isSignUp = mode === 'signup';
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('lacvay-saved-email') || '';
    } catch {
      return '';
    }
  });
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem('lacvay-remember-me') !== 'false';
    } catch {
      return true;
    }
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

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
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
        setNotice('Check your email to confirm your account (if email confirmation is enabled), or simply log in.');
      } else {
        try {
          if (rememberMe) {
            localStorage.setItem('lacvay-saved-email', email.trim());
            localStorage.setItem('lacvay-remember-me', 'true');
          } else {
            localStorage.removeItem('lacvay-saved-email');
            localStorage.setItem('lacvay-remember-me', 'false');
          }
        } catch {
          // ignore localStorage failure
        }
        await signInWithEmail(email, password);
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setFormError(err.message || 'Google sign in failed');
    }
  };

  const handleForgotPassword = async () => {
    setFormError(null);
    setNotice(null);
    const emailErr = validateEmail(email);
    if (emailErr) {
      setErrors({ email: emailErr });
      return;
    }
    
    setResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setNotice('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setFormError(err.message || 'Failed to send reset email');
    } finally {
      setResettingPassword(false);
    }
  };

  const inputClass = (hasError?: string, hasTrailing?: boolean) =>
    cn(
      'w-full rounded-2xl border bg-gray-50/80 py-3 pl-11 text-[13px] outline-none transition placeholder:text-gray-400 focus:bg-white',
      hasTrailing ? 'pr-11' : 'pr-4',
      hasError
        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
        : 'border-gray-200 focus:border-lacvay-green focus:ring-2 focus:ring-lacvay-green/15',
    );

  const iconClass = 'pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400';
  const score = passwordScore(password);
  const strength = strengthLevels[score];

  return (
    <div className="auth-form">
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

      <h1 className="mt-7 text-[20px] font-extrabold tracking-tight text-gray-900 sm:text-[24px]">
        {isSignUp ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
        {isSignUp
          ? 'Save places, keep your history, and get recommendations that fit how you travel.'
          : 'Sign in to continue exploring Batangas City.'}
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-[12px] font-medium text-gray-700">
              Full name
            </label>
            <div className="relative">
              <User className={iconClass} />
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
            </div>
            {errors.name && (
              <p role="alert" className="mt-1.5 text-[11.5px] text-red-600">{errors.name}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-[12px] font-medium text-gray-700">
            Email address
          </label>
          <div className="relative">
            <Mail className={iconClass} />
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
          </div>
          {errors.email && (
            <p role="alert" className="mt-1.5 text-[11.5px] text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-[12px] font-medium text-gray-700">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className={iconClass} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              aria-invalid={Boolean(errors.password)}
              className={inputClass(errors.password, true)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {!isSignUp && (
            <div className="mt-2.5 flex items-center justify-between">
              <label className="flex items-center gap-2 text-[12px] text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-lacvay-green accent-lacvay-green focus:ring-lacvay-green"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resettingPassword}
                className="text-[11.5px] font-semibold text-lacvay-green hover:underline disabled:opacity-50"
              >
                {resettingPassword ? 'Sending...' : 'Forgot password?'}
              </button>
            </div>
          )}

          {isSignUp && password.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1" aria-hidden="true">
                {[1, 2, 3].map((level) => (
                  <span
                    key={level}
                    className={cn(
                      'h-1 flex-1 rounded-full transition',
                      score >= level ? strength.bar : 'bg-gray-200',
                    )}
                  />
                ))}
              </div>
              <span className={cn('text-[11px] font-semibold', strength.text)}>{strength.label}</span>
            </div>
          )}

          {errors.password && (
            <p role="alert" className="mt-1.5 text-[11.5px] text-red-600">{errors.password}</p>
          )}
        </div>

        {isSignUp && (
          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-[12px] font-medium text-gray-700">
              Confirm password
            </label>
            <div className="relative">
              <Lock className={iconClass} />
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
            </div>
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
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-lacvay-green py-3 text-[14px] font-bold text-white shadow-soft transition hover:bg-lacvay-green-dark disabled:opacity-60"
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

      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3 text-[12.5px] font-semibold text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-lacvay-lime/50"
        >
          <img src="/images/google-logo.svg" alt="" aria-hidden="true" className="h-[19px] w-[19px]" />
          Continue with Google
        </button>
      </div>

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
