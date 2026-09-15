import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock3, MapPin, Sparkles, Check, Star, X } from 'lucide-react';
import { landingFeatures, landingSteps, landingBenefits, aiSampleChat } from '@/data/landingContent';
import { touristSpots } from '@/data/mockData';
import { Reveal } from '@/components/ui/Reveal';

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[11.5px] font-bold uppercase tracking-wider text-lacvay-green">{eyebrow}</p>
      <h2 className="mt-2 text-[26px] font-extrabold tracking-tight text-gray-900 sm:text-[32px]">{title}</h2>
      {subtitle && <p className="mt-3 text-[14px] leading-relaxed text-gray-600">{subtitle}</p>}
    </div>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-20 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Features"
            title="Everything you need to move around the city"
            subtitle="Four core tools that answer the questions every commuter and visitor asks in Batangas City."
          />
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {landingFeatures.map((f) => (
            <article key={f.title} className="rounded-[22px] bg-lacvay-cream p-5 transition hover:shadow-card">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lacvay-blush">
                <img src={f.image} alt="" className="h-10 w-10 object-contain mix-blend-multiply" />
              </div>
              <h3 className="mt-4 text-[15px] font-bold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-gray-600">{f.description}</p>
            </Reveal>
          ))}
        </div>

        <div className="mt-6 grid items-center gap-8 rounded-[26px] bg-lacvay-green p-6 sm:p-9 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11.5px] font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5 text-lacvay-yellow" />
              AI Travel Assistant
            </span>
            <h3 className="mt-4 text-[24px] font-extrabold leading-tight text-white sm:text-[28px]">
              Ask anything about Batangas City
            </h3>
            <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-white/80">
              Directions, fares, where to eat, what to visit — ask in plain language and get a
              practical answer, like messaging a friend who grew up here.
            </p>
          </div>

          <div className="space-y-3 rounded-[22px] bg-white/95 p-4 shadow-card">
            {aiSampleChat.map((m) => (
              <div
                key={m.text}
                className={
                  m.role === 'user'
                    ? 'ml-8 rounded-2xl rounded-tr-md bg-lacvay-green px-3.5 py-2.5 text-[12px] leading-relaxed text-white'
                    : 'mr-4 rounded-2xl rounded-tl-md bg-lacvay-blush px-3.5 py-2.5 text-[12px] leading-relaxed text-gray-700'
                }
              >
                {m.text}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-lacvay-cream py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading eyebrow="How it works" title="Three steps to a confident trip" />
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {landingSteps.map((step) => (
            <article key={step.order} className="relative rounded-[22px] bg-white p-6 shadow-soft">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lacvay-green text-[15px] font-extrabold text-white">
                {step.order}
              </span>
              <h3 className="mt-4 text-[15px] font-bold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-gray-600">{step.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingDestinations() {
  const spots = touristSpots.slice(0, 4);
  const [selectedSpotIndex, setSelectedSpotIndex] = useState<number | null>(null);
  const selectedSpot = selectedSpotIndex === null ? null : spots[selectedSpotIndex];

  useEffect(() => {
    if (selectedSpotIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedSpotIndex(null);
      }
      if (event.key === 'ArrowLeft') {
        setSelectedSpotIndex((index) => (index === null || index === 0 ? index : index - 1));
      }
      if (event.key === 'ArrowRight') {
        setSelectedSpotIndex((index) =>
          index === null || index === spots.length - 1 ? index : index + 1,
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSpotIndex, spots.length]);

  return (
    <section id="destinations" className="scroll-mt-20 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Destinations"
            title="Places worth the trip"
            subtitle="From the crater lake of Taal to the reefs of Anilao and the white sand of Laiya."
          />
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {spots.map((spot, index) => (
            <Reveal key={spot.id} delayMs={index * 80} as="div">
            <button
              type="button"
              onClick={() => setSelectedSpotIndex(index)}
              className="group w-full overflow-hidden rounded-[22px] bg-lacvay-cream text-left transition duration-300 hover:-translate-y-1 hover:shadow-card focus:outline-none focus-visible:ring-4 focus-visible:ring-lacvay-lime/60"
              aria-label={`View overview of ${spot.name}`}
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={spot.imageUrl}
                  alt={spot.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 backdrop-blur">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  {spot.rating}
                </span>
              </div>
              <div className="p-3.5">
                <h3 className="text-[13px] font-bold leading-snug text-gray-900">{spot.name}</h3>
                <p className="mt-1 text-[11px] text-gray-500">{spot.location}</p>
              </div>
            </button>
            </Reveal>
          ))}
        </div>
      </div>

      {selectedSpot && selectedSpotIndex !== null && (
        <div
          className="destination-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-gray-950/65 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedSpotIndex(null);
            }
          }}
        >
          <section
            className="destination-dialog relative w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="destination-dialog-title"
          >
            <button
              type="button"
              onClick={() => setSelectedSpotIndex(null)}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg transition hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-lacvay-lime/60"
              aria-label="Close destination overview"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid md:grid-cols-[1.05fr_0.95fr]">
              <div className="relative min-h-72 overflow-hidden md:min-h-[430px]">
                <img
                  key={selectedSpot.id}
                  src={selectedSpot.imageUrl}
                  alt={selectedSpot.name}
                  className="destination-dialog-image crossfade-image absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 via-transparent to-gray-950/5" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="inline-flex rounded-full bg-lacvay-lime px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-lacvay-green-dark">
                    {selectedSpot.categoryLabel ?? selectedSpot.category}
                  </span>
                  <div className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold">
                    <Star className="h-4 w-4 fill-lacvay-yellow text-lacvay-yellow" />
                    {selectedSpot.rating} rating
                  </div>
                </div>
              </div>

              <div key={selectedSpot.id} className="destination-dialog-content flex min-h-72 flex-col p-6 sm:p-8">
                <p className="text-[11px] font-bold uppercase tracking-wider text-lacvay-green">
                  Destination overview
                </p>
                <h3 id="destination-dialog-title" className="mt-2 pr-10 text-[27px] font-extrabold leading-tight tracking-tight text-gray-900">
                  {selectedSpot.name}
                </h3>
                <p className="mt-4 text-[14px] leading-relaxed text-gray-600">{selectedSpot.description}</p>

                <dl className="mt-6 space-y-3 border-t border-gray-100 pt-5 text-[12.5px] text-gray-600">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 shrink-0 text-lacvay-green" />
                    <div><dt className="sr-only">Location</dt><dd>{selectedSpot.location}</dd></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock3 className="h-4 w-4 shrink-0 text-lacvay-green" />
                    <div><dt className="sr-only">Hours and travel time</dt><dd>{selectedSpot.openingHours} · {selectedSpot.estimatedTravelTime}</dd></div>
                  </div>
                </dl>

                <div className="mt-auto flex items-center justify-between gap-4 pt-7">
                  <button
                    type="button"
                    onClick={() => setSelectedSpotIndex((index) => (index === null ? index : index - 1))}
                    disabled={selectedSpotIndex === 0}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2.5 text-[12px] font-bold text-gray-700 transition hover:border-lacvay-green hover:text-lacvay-green disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-[11px] font-bold text-gray-400">
                    {selectedSpotIndex + 1} / {spots.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSpotIndex((index) => (index === null ? index : index + 1))}
                    disabled={selectedSpotIndex === spots.length - 1}
                    className="inline-flex items-center gap-1.5 rounded-full bg-lacvay-green px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-lacvay-green-dark disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export function LandingBenefits() {
  return (
    <section id="why-lacvay" className="scroll-mt-20 bg-lacvay-cream py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading eyebrow="Why LACVAY" title="Made for this city, not copied from another" />
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {landingBenefits.map((b, index) => (
            <Reveal key={b.title} delayMs={index * 80} as="article" className="flex gap-4 rounded-[22px] bg-white p-5 shadow-soft">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lacvay-green/10">
                <Check className="h-4 w-4 text-lacvay-green" strokeWidth={2.5} />
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-gray-900">{b.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-gray-600">{b.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingCTA() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[26px] bg-lacvay-green px-6 py-12 text-center sm:px-10">
          <h2 className="text-[26px] font-extrabold tracking-tight text-white sm:text-[32px]">
            Ready to explore Batangas City?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-white/85">
            Create a free account to save places, keep your travel history, and get personalised
            recommendations from the AI assistant.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="rounded-full bg-white px-6 py-3 text-[14px] font-bold text-lacvay-green-dark shadow-soft transition hover:bg-white/90"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="rounded-full border-2 border-white/70 px-6 py-3 text-[14px] font-bold text-white transition hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
