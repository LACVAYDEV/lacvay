import { useNavigate } from 'react-router-dom';
import { Sparkles, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const heroBackground = {
  backgroundImage: [
    'linear-gradient(90deg, rgba(247, 243, 234, 0.96) 0%, rgba(248, 231, 215, 0.78) 34%, rgba(248, 231, 215, 0) 64%)',
    "url('/images/logo1.jpg')",
  ].join(', '),
};

export function HeroSection({ className = '' }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <section
      className={cn(
        'home-hero relative h-[360px] overflow-hidden rounded-[22px] bg-lacvay-cream shadow-card sm:h-[320px] sm:rounded-[26px] lg:h-[267px]',
        className,
      )}
      style={heroBackground}
    >
      <div className="home-hero-landmark" aria-hidden="true" />

      <div className="relative z-10 flex h-full items-center px-5 py-7 min-[375px]:px-6 sm:px-8 sm:py-8 lg:px-10">
        <div className="max-w-[19rem] sm:max-w-[23rem]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-lacvay-green shadow-soft backdrop-blur">
            <MapPin className="h-3 w-3" strokeWidth={3} />
            Batangas City
          </span>
          <h2 className="mt-3 text-[23px] font-extrabold leading-[1.08] tracking-tight text-lacvay-green-dark min-[375px]:text-[25px] sm:text-[30px]">
            Your Batangas City
            <span className="block text-lacvay-yellow">Travel Companion</span>
          </h2>
          <p className="mt-2.5 max-w-[17rem] text-[11px] font-semibold leading-[1.55] text-lacvay-green-dark/80 min-[375px]:text-[12px] sm:max-w-[19rem] sm:font-medium">
            Routes, fares, ride-booking tips, attractions, and AI travel help — all in one place.
          </p>
          <div className="mt-5 flex flex-col items-start gap-2.5 min-[430px]:flex-row min-[430px]:flex-wrap min-[430px]:items-center sm:gap-3">
            <Button
              onClick={() => navigate('/map')}
              className="min-h-11 rounded-full px-5 py-2.5 shadow-md transition hover:-translate-y-0.5"
            >
              <MapPin className="h-4 w-4" strokeWidth={2.5} />
              Plan Your Trip
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/ai-assistant')}
              className="min-h-11 rounded-full border-0 px-5 py-2.5 shadow-md transition hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4 text-lacvay-green" strokeWidth={2.5} />
              Ask LACVAY AI
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
