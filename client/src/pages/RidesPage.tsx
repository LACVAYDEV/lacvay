import { useEffect, useState } from 'react';
import {
  Car,
  CheckCircle2,
  MapPin,
  Sparkles,
  Compass,
  Lightbulb,
  Smartphone,
  ShieldCheck,
  Accessibility,
  Moon,
  PhoneCall,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dataService } from '@/services/dataService';
import { rideGuides } from '@/data/rideGuideContent';
import type { ExternalProvider } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/States';
import { launchTransportApp, transportApps, type TransportAppKey } from '@/lib/transportApps';

export default function RidesPage() {
  const [providers, setProviders] = useState<ExternalProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataService.getExternalProviders().then((res) => {
      setProviders(res.filter((p) => p.is_active));
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-lacvay-green p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-lacvay-yellow" />
            Ride booking guide
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
            How to Book Angkas & Taxis in Batangas
          </h1>
          <p className="text-sm leading-relaxed text-white/85 sm:text-base">
            LACVAY does not book rides directly. Use this guide to book motorcycle taxis through Angkas
            or metered taxis through Grab and local fleets — step by step, before you travel.
          </p>
        </div>
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      </div>

      <Card className="flex gap-4 border-l-4 border-l-lacvay-green bg-lacvay-green/5 p-5">
        <Lightbulb className="h-5 w-5 shrink-0 text-lacvay-green" />
        <div className="space-y-1 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">For jeepneys and tricycles</p>
          <p>
            Public jeepneys and tricycles are not booked through apps. Use our{' '}
            <Link to="/commute" className="font-semibold text-lacvay-green hover:underline">Commute Guide</Link>
            {' '}or{' '}
            <Link to="/fares" className="font-semibold text-lacvay-green hover:underline">Fare Checker</Link>
            {' '}for routes and estimated fares instead.
          </p>
        </div>
      </Card>

      <section aria-labelledby="transport-safety-heading">
        <Card className="border border-amber-200 bg-amber-50/70">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />
            <div>
              <h2 id="transport-safety-heading" className="text-lg font-bold text-gray-900">
                Travel safely
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                Routes, fares, schedules, and provider availability can change. Confirm details with the
                driver, operator, terminal, or provider app before traveling.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="flex gap-3 rounded-2xl bg-white/80 p-4">
              <ShieldCheck className="h-5 w-5 shrink-0 text-lacvay-green" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">Verify before boarding</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  Use licensed or platform-listed providers. Match the rider, driver, vehicle, plate number,
                  and booking details. Motorcycle passengers should wear a properly fitted helmet.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl bg-white/80 p-4">
              <Accessibility className="h-5 w-5 shrink-0 text-lacvay-green" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">Accessibility</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  Vehicle accessibility varies. Contact the operator before departure if you need step-free
                  access, mobility-device space, seating assistance, or help with luggage.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl bg-white/80 p-4">
              <Moon className="h-5 w-5 shrink-0 text-lacvay-green" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">Late-night travel</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  Book ahead, wait in a well-lit public place, share your trip details with someone you trust,
                  keep your phone charged, and avoid unverified roadside offers.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl bg-white/80 p-4">
              <PhoneCall className="h-5 w-5 shrink-0 text-red-600" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">Emergency help</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  In an immediate emergency in the Philippines, call <a href="tel:911" className="font-bold text-red-700 hover:underline">911</a>.
                  Also use the provider app&apos;s emergency or trip-sharing tools when available.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <div className="space-y-8">
        {providers.map((provider) => {
          const guide = rideGuides[provider.id];
          if (!guide) return null;

          const appKey: TransportAppKey | null =
            provider.id === 'idol-taxi'
              ? 'idolTaxi'
              : provider.id === 'angkas' || provider.id === 'grab'
                ? provider.id
                : null;
          const app = appKey ? transportApps[appKey] : null;

          return (
            <Card key={provider.id} className="overflow-hidden p-0">
              <div className="border-b border-gray-100 bg-gray-50/80 p-6 sm:p-7">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
                    {provider.logo_url ? (
                      <img
                        src={provider.logo_url}
                        alt={`${provider.provider_name} logo`}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <Car className="h-8 w-8 text-lacvay-green" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900">{provider.provider_name}</h2>
                      {provider.tag && <Badge variant="lime">{provider.tag}</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-lacvay-green">
                      {provider.service_type}
                    </p>
                    {provider.description && (
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                        {provider.description}
                      </p>
                    )}
                    {provider.coverageArea && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        Coverage: {provider.coverageArea}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[1fr_280px]">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                    How to book
                  </h3>
                  <ol className="space-y-4">
                    {guide.steps.map((step, index) => (
                      <li key={step.title} className="flex gap-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lacvay-green text-sm font-bold text-white">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">{step.title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-gray-600">{step.description}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Traveler tips</p>
                    <ul className="mt-3 space-y-2">
                      {guide.tips.map((tip) => (
                        <li key={tip} className="flex items-start gap-2 text-xs leading-relaxed text-amber-900">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {app && appKey && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Book with {app.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => launchTransportApp(appKey)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-lacvay-green px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-lacvay-green-dark"
                        aria-label={`Open ${app.name} or install it from your app store`}
                      >
                        <Smartphone className="h-4 w-4" />
                        Open {app.name}
                      </button>
                      <p className="text-center text-[11px] leading-relaxed text-gray-500">
                        Opens the app when installed, otherwise redirects to your device&apos;s app store.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-soft sm:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="rounded-xl bg-lacvay-green/10 p-2.5 text-lacvay-green">
              <Compass className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-gray-900">Prefer public transport?</h4>
              <p className="text-sm text-gray-600">
                Jeepneys and tricycles don&apos;t need an app — follow our commute guides for step-by-step directions.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/commute">
              <Button variant="secondary">Commute Guides</Button>
            </Link>
            <Link to="/fares">
              <Button>Fare Checker</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
