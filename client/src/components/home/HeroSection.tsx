import { useNavigate } from 'react-router-dom';
import { Sparkles, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MapPinSolid } from '@/components/ui/Logo';

const heroBackground = {
  backgroundImage: [
    'radial-gradient(60% 80% at 72% 8%, rgba(255,196,0,0.55) 0%, rgba(255,196,0,0) 62%)',
    'radial-gradient(55% 75% at 56% 102%, rgba(200,232,42,0.6) 0%, rgba(200,232,42,0) 68%)',
    'radial-gradient(70% 95% at 102% 70%, rgba(21,148,71,0.22) 0%, rgba(21,148,71,0) 72%)',
    'linear-gradient(95deg, #FFFFFF 0%, #FCFEF6 36%, #F1FADD 100%)',
  ].join(', '),
};

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden rounded-[26px] shadow-card">
      <div className="absolute inset-0" style={heroBackground} />

      <div className="relative flex flex-col gap-4 p-6 sm:p-7 lg:flex-row lg:items-center lg:gap-2 lg:py-8 lg:pl-9 lg:pr-6">
        <div className="lg:w-[54%]">
          <h2 className="text-[26px] font-extrabold leading-[1.14] tracking-tight text-lacvay-green-dark sm:text-[30px] lg:text-[34px]">
            Your Batangas City
            <span className="block text-lacvay-yellow">Travel Companion</span>
          </h2>
          <p className="mt-3 max-w-[22rem] text-[13px] leading-relaxed text-gray-600">
            Find routes, check fares, book rides, explore attractions, and get AI-powered travel assistance — all in one place.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={() => navigate('/map')} className="rounded-full px-5 py-2.5">
              <MapPin className="h-4 w-4" />
              Plan Your Trip
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/ai-assistant')}
              className="rounded-full px-5 py-2.5"
            >
              <Sparkles className="h-4 w-4 text-lacvay-green" />
              Ask AI Assistant
            </Button>
          </div>
        </div>

        <div className="relative flex flex-1 items-end justify-center lg:justify-end">
          <svg
            className="pointer-events-none absolute left-0 top-6 hidden h-20 w-40 lg:block"
            viewBox="0 0 160 80"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 74C34 66 56 46 72 26 86 8 118 2 158 8"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="1 9"
            />
          </svg>

          <img
            src="/images/hero-batangas.png"
            alt="Batangas City landmarks with a traditional jeepney"
            className="w-full max-w-[300px] mix-blend-multiply sm:max-w-[340px] lg:max-w-[370px]"
          />

          <MapPinSolid className="absolute right-[14%] top-[4%] h-8 w-6 drop-shadow-md" />
        </div>
      </div>
    </section>
  );
}
