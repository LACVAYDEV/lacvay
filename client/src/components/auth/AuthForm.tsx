import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Eye, EyeOff, Loader2, Lock, Mail, User, Car } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { validateEmail, validateName, validatePassword } from '@/services/authService';
import { getHomePath } from '@/lib/auth';
import type { OnDemandVehicle, UserRole } from '@/types';
import {
  defaultPartnerRates,
  validatePartnerBaseFare,
  validatePartnerPerKmFee,
} from '@/lib/partnerRates';
import { onDemandRideOptions } from '@/lib/transport';
import { cn } from '@/lib/utils';

type AuthMode = 'signin' | 'signup';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  baseFare?: string;
  perKmFee?: string;
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

export function AuthForm({ mode }: AuthFormProps) {
  const isSignUp = mode === 'signup';
  const { signIn, signUp, signInAsGuest, signInAsPartner } = useAuth();
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
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [accountRole, setAccountRole] = useState<UserRole>('traveler');
  const [partnerVehicle, setPartnerVehicle] = useState<OnDemandVehicle>('motorcycle');
  const [baseFare, setBaseFare] = useState(String(defaultPartnerRates.motorcycle.baseFare));
  const [perKmFee, setPerKmFee] = useState(String(defaultPartnerRates.motorcycle.perKmFee));
  const [vehicleLabel, setVehicleLabel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');

  const selectPartnerVehicle = (type: OnDemandVehicle) => {
    setPartnerVehicle(type);
    setBaseFare(String(defaultPartnerRates[type].baseFare));
    setPerKmFee(String(defaultPartnerRates[type].perKmFee));
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (isSignUp) next.name = validateName(name) ?? undefined;
    next.email = validateEmail(email) ?? undefined;
    next.password = validatePassword(password) ?? undefined;
    if (isSignUp && password !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match';
    }
    if (isSignUp && accountRole === 'transpo_partner') {
      const base = parseFloat(baseFare);
      const km = parseFloat(perKmFee);
      next.baseFare = validatePartnerBaseFare(base) ?? undefined;
      next.perKmFee = validatePartnerPerKmFee(km) ?? undefined;
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
      const user = isSignUp
        ? await signUp({
            name,
            email,
            password,
            role: accountRole,
            ...(accountRole === 'transpo_partner'
              ? {
                  partnerSetup: {
                    vehicleType: partnerVehicle,
                    baseFare: parseFloat(baseFare),
                    perKmFee: parseFloat(perKmFee),
                    vehicleLabel: vehicleLabel.trim() || undefined,
                    plateNumber: plateNumber.trim() || undefined,
                  },
                }
              : {}),
          })
        : await signIn({ email, password });
      navigate(getHomePath(user), { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuest = async () => {
    setGuestLoading(true);
    try {
      const user = await signInAsGuest();
      navigate(getHomePath(user), { replace: true });
    } finally {
      setGuestLoading(false);
    }
  };

  const handlePartnerDemo = async () => {
    setPartnerLoading(true);
    try {
      const user = await signInAsPartner();
      navigate(getHomePath(user), { replace: true });
    } finally {
      setPartnerLoading(false);
    }
  };

  const inputClass = (hasError?: string, hasTrailing?: boolean, compact?: boolean) =>
    cn(
      'w-full rounded-2xl border bg-gray-50/80 py-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:bg-white',
      compact ? 'px-4' : 'pl-11',
      hasTrailing ? 'pr-11' : compact ? 'pr-4' : 'pr-4',
      hasError
        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
        : 'border-gray-200 focus:border-lacvay-green focus:ring-2 focus:ring-lacvay-green/15',
    );

  const iconClass = 'pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400';
  const score = passwordScore(password);
  const strength = strengthLevels[score];

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

            <div className="mt-4">
              <p className="mb-2 block text-[12px] font-medium text-gray-700">I am signing up as</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'traveler' as const, label: 'Traveler', hint: 'Book rides & explore' },
                  { value: 'transpo_partner' as const, label: 'Transport Partner', hint: 'Taxi or habal-habal rider' },
                ]).map(({ value, label, hint }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAccountRole(value)}
                    aria-pressed={accountRole === value}
                    className={cn(
                      'rounded-2xl border px-3 py-3 text-left transition',
                      accountRole === value
                        ? 'border-lacvay-green bg-lacvay-green/[0.06]'
                        : 'border-gray-200 bg-gray-50 hover:border-lacvay-green/30',
                    )}
                  >
                    <p className="text-[12.5px] font-bold text-gray-900">{label}</p>
                    <p className="mt-0.5 text-[10.5px] text-gray-500">{hint}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {isSignUp && accountRole === 'transpo_partner' && (
          <div className="rounded-2xl border border-lacvay-green/20 bg-lacvay-green/[0.04] p-4 space-y-4">
            <div>
              <p className="text-[12px] font-semibold text-gray-900">Your rates</p>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Passengers see these on the map when you are online. You can update them later in Settings.
              </p>
            </div>

            <div>
              <p className="mb-2 text-[12px] font-medium text-gray-700">Vehicle type</p>
              <div className="grid grid-cols-2 gap-2">
                {onDemandRideOptions.map(({ type, label }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => selectPartnerVehicle(type)}
                    aria-pressed={partnerVehicle === type}
                    className={cn(
                      'rounded-xl border px-3 py-2.5 text-[12px] font-semibold transition',
                      partnerVehicle === type
                        ? 'border-lacvay-green bg-white text-lacvay-green-dark'
                        : 'border-gray-200 bg-white/80 text-gray-600 hover:border-lacvay-green/30',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="base-fare" className="mb-1.5 block text-[12px] font-medium text-gray-700">
                  Base fare (₱)
                </label>
                <input
                  id="base-fare"
                  type="number"
                  min={1}
                  step={1}
                  value={baseFare}
                  onChange={(e) => setBaseFare(e.target.value)}
                  className={inputClass(errors.baseFare, false, true)}
                />
                {errors.baseFare && (
                  <p role="alert" className="mt-1.5 text-[11.5px] text-red-600">{errors.baseFare}</p>
                )}
              </div>
              <div>
                <label htmlFor="per-km" className="mb-1.5 block text-[12px] font-medium text-gray-700">
                  Per km (₱)
                </label>
                <input
                  id="per-km"
                  type="number"
                  min={1}
                  step={1}
                  value={perKmFee}
                  onChange={(e) => setPerKmFee(e.target.value)}
                  className={inputClass(errors.perKmFee, false, true)}
                />
                {errors.perKmFee && (
                  <p role="alert" className="mt-1.5 text-[11.5px] text-red-600">{errors.perKmFee}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="vehicle-label" className="mb-1.5 block text-[12px] font-medium text-gray-700">
                  Vehicle details <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="vehicle-label"
                  type="text"
                  value={vehicleLabel}
                  onChange={(e) => setVehicleLabel(e.target.value)}
                  placeholder="e.g. 125cc · helmet provided"
                  className={inputClass(undefined, false, true)}
                />
              </div>
              <div>
                <label htmlFor="plate" className="mb-1.5 block text-[12px] font-medium text-gray-700">
                  Plate no. <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="plate"
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="MC 1234"
                  className={inputClass(undefined, false, true)}
                />
              </div>
            </div>
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
        disabled={guestLoading || partnerLoading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3 text-[13.5px] font-semibold text-gray-800 transition hover:border-lacvay-green/30 hover:bg-lacvay-green/[0.04] disabled:opacity-60"
      >
        {guestLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-lacvay-green" />
        ) : (
          <Compass className="h-4 w-4 text-lacvay-green" />
        )}
        Continue as guest
      </button>

      <button
        type="button"
        onClick={handlePartnerDemo}
        disabled={partnerLoading || guestLoading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-lacvay-green/25 bg-lacvay-green/[0.05] py-3 text-[13.5px] font-semibold text-lacvay-green-dark transition hover:bg-lacvay-green/10 disabled:opacity-60"
      >
        {partnerLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-lacvay-green" />
        ) : (
          <Car className="h-4 w-4 text-lacvay-green" />
        )}
        Try Transport Partner demo
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
