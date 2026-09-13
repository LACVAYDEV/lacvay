import { useEffect, useState } from 'react';
import {
  Car,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Sparkles,
  X,
  Info,
  Clock,
  Navigation,
  Compass,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dataService } from '@/services/dataService';
import type { ExternalProvider } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';

type ProviderFilter = 'all' | 'car' | 'motorcycle' | 'taxi';

const filterTabs: { value: ProviderFilter; label: string }[] = [
  { value: 'all', label: 'All Services' },
  { value: 'car', label: 'Car & 4-Wheel' },
  { value: 'motorcycle', label: 'Motorcycle Taxi' },
  { value: 'taxi', label: 'Local City Taxi' },
];

export default function RidesPage() {
  const [providers, setProviders] = useState<ExternalProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProviderFilter>('all');
  const [selectedProvider, setSelectedProvider] = useState<ExternalProvider | null>(null);

  useEffect(() => {
    dataService.getExternalProviders().then((res) => {
      setProviders(res);
      setLoading(false);
    });
  }, []);

  const filteredProviders = providers.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'car') return p.service_type.toLowerCase().includes('car');
    if (filter === 'motorcycle') return p.service_type.toLowerCase().includes('motorcycle');
    if (filter === 'taxi') return p.service_type.toLowerCase().includes('taxi');
    return true;
  });

  const getTagBadgeColor = (tag?: string) => {
    switch (tag) {
      case 'Most Popular':
        return 'bg-lacvay-green/10 text-lacvay-green border-lacvay-green/20';
      case 'Fastest Solo Commute':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Batangas Local Fleet':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-lacvay-green p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-lacvay-yellow" />
            Ride-Hailing & Transit Partners
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
            Book Rides Across Batangas City
          </h1>
          <p className="text-sm leading-relaxed text-white/85 sm:text-base">
            Choose from certified ride-hailing and dedicated city taxi services. Enjoy upfront fares,
            safe point-to-point transit, and reliable pickups throughout Batangas City, terminals, and ports.
          </p>
        </div>

        {/* Decorative Background Accent */}
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
              filter === tab.value
                ? 'bg-lacvay-green text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-100 shadow-soft hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Partner Promotional Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProviders.map((provider) => (
          <Card
            key={provider.id}
            className="group flex flex-col justify-between overflow-hidden border border-gray-100 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-xl rounded-2xl"
          >
            <div className="space-y-4">
              {/* Top Row: Logo & Badges */}
              <div className="flex items-start gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-sm transition group-hover:shadow-md">
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
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                      {provider.provider_name}
                    </h3>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-lacvay-green">
                    {provider.service_type}
                  </p>
                  {provider.tag && (
                    <span
                      className={`mt-1.5 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getTagBadgeColor(
                        provider.tag
                      )}`}
                    >
                      {provider.tag}
                    </span>
                  )}
                </div>
              </div>

              {/* Highlight callout */}
              {provider.highlight && (
                <div className="rounded-xl bg-lacvay-lime/10 border border-lacvay-lime/20 px-3.5 py-2 text-xs font-medium text-lacvay-lime flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-lacvay-lime" />
                  <span>{provider.highlight}</span>
                </div>
              )}

              {/* Description */}
              <p className="text-sm leading-relaxed text-gray-600 line-clamp-3">
                {provider.description}
              </p>

              {/* Key Features List */}
              {provider.features && provider.features.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Service Highlights
                  </p>
                  <ul className="space-y-1.5">
                    {provider.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-lacvay-green mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Coverage Area */}
              {provider.coverageArea && (
                <div className="flex items-center gap-1.5 pt-1 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span>Coverage: {provider.coverageArea}</span>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <Button
                type="button"
                className="w-full justify-center gap-2 font-semibold shadow-sm group-hover:shadow"
                onClick={() => setSelectedProvider(provider)}
              >
                <span>{provider.ctaText || `Book via ${provider.provider_name}`}</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Informational Guidance Box */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-soft sm:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="rounded-xl bg-lacvay-green/10 p-2.5 text-lacvay-green">
              <Navigation className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-gray-900">Looking for Traditional Commuting?</h4>
              <p className="text-sm text-gray-600">
                Prefer to ride local jeepneys or tricycles? Check our step-by-step commute guides or official city fare calculator.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/commute"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-soft hover:bg-gray-50 transition"
            >
              <Compass className="h-4 w-4 text-lacvay-green" />
              Commute Guides
            </Link>
            <Link
              to="/fares"
              className="inline-flex items-center gap-1.5 rounded-xl bg-lacvay-green px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-lacvay-green-dark transition"
            >
              Fare Matrix
            </Link>
          </div>
        </div>
      </div>

      {/* Coming Soon Modal Dialog */}
      {selectedProvider && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedProvider(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-xl border border-gray-100 p-1 flex items-center justify-center bg-white">
                  {selectedProvider.logo_url ? (
                    <img
                      src={selectedProvider.logo_url}
                      alt={selectedProvider.provider_name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Car className="h-5 w-5 text-lacvay-green" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedProvider.provider_name}</h3>
                  <p className="text-xs text-gray-500">{selectedProvider.service_type}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-5 space-y-4">
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-amber-800 text-xs font-medium">
                <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Direct In-App Booking Integration Coming Soon</span>
              </div>

              <p className="text-sm leading-relaxed text-gray-600">
                Direct booking integration for <strong className="text-gray-900">{selectedProvider.provider_name}</strong> is currently being finalized on the LACVAY platform.
              </p>

              <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700">
                  <Info className="h-4 w-4 text-lacvay-green" />
                  <span>Commuter Tip for Batangas City</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {selectedProvider.id === 'angkas'
                    ? 'Angkas is ideal for skipping the Diversion Road and Kumintang traffic during morning and evening rush hours. Riders supply sanitized hairnets with every ride.'
                    : selectedProvider.id === 'grab'
                    ? 'Grab is ideal for family trips, airport or terminal drop-offs with heavy luggage. Enjoy upfront digital fares through GCash or GrabPay.'
                    : 'Idol Taxi is Batangas City’s dedicated local sedan fleet. Perfect for metered transfers from Batangas Grand Terminal and Port passenger terminals.'}
                </p>
              </div>
            </div>

            <Button
              type="button"
              className="w-full justify-center"
              onClick={() => setSelectedProvider(null)}
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

