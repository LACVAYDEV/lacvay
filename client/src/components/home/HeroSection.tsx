import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const heroBackground = {
  backgroundImage: [
    'linear-gradient(90deg, rgba(8, 35, 60, 0.96) 0%, rgba(15, 85, 120, 0.78) 34%, rgba(15, 85, 120, 0) 64%)',
    "url('/images/logo1.jpg')",
  ].join(', '),
};

export function HeroSection({ className = '' }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <section
      className={cn(
        'home-hero relative h-[420px] overflow-hidden rounded-lg bg-lacvay-cream shadow-sm sm:h-[380px] sm:rounded-lg lg:h-[380px]',
        className,
      )}
      style={heroBackground}
    >
      <div className="home-hero-landmark" aria-hidden="true" />

      <div className="relative z-10 flex h-full items-center px-5 py-7 min-[375px]:px-6 sm:px-8 sm:py-8 lg:px-10">
        <div className="max-w-[19rem] sm:max-w-[23rem]">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-white/80 px-2.5 py-1 font-montserrat text-[10px] font-semibold uppercase tracking-wide text-lacvay-green shadow-sm backdrop-blur">
            <MapPin className="h-3 w-3" strokeWidth={3} />
            BATANGAS CITY
          </span>
          <h2 className="mt-3 leading-[1.08] text-white drop-shadow-md">
            <span className="block font-display text-[23px] font-bold tracking-tight min-[375px]:text-[25px] sm:text-[30px]">
              Explore Batangas City
            </span>
            <span className="mt-1 block font-signature text-[29px] font-normal text-white min-[375px]:text-[32px] sm:text-[38px]">
              with LACVAY
            </span>
          </h2>
          <p className="mt-2.5 max-w-[17rem] font-montserrat text-[11px] font-medium leading-[1.55] text-white/95 drop-shadow-sm min-[375px]:text-[12px] sm:max-w-[19rem]">
            Find the best routes, check fares, book rides, and discover local spots — all in one
            place.
          </p>
          <div className="mt-5 flex flex-col items-start gap-2.5 min-[430px]:flex-row min-[430px]:flex-wrap min-[430px]:items-center sm:gap-3">
            <Button
              onClick={() => navigate('/map')}
              className="min-h-10 rounded-lg px-4 py-2 font-montserrat font-bold shadow-sm transition hover:-translate-y-0.5"
            >
              <MapPin className="h-4 w-4" strokeWidth={2.5} />
              Plan My Route
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/tourist-spots')}
              className="min-h-10 rounded-lg border-0 px-4 py-2 font-signature text-lg font-normal shadow-sm transition hover:-translate-y-0.5"
            >
              See more of Batangas
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
