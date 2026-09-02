import { Link } from 'react-router-dom';
import { Sparkles, Check, Star } from 'lucide-react';
import { landingFeatures, landingSteps, landingBenefits, aiSampleChat } from '@/data/landingContent';
import { touristSpots } from '@/data/mockData';

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
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to move around the city"
          subtitle="Four core tools that answer the questions every commuter and visitor asks in Batangas City."
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {landingFeatures.map((f) => (
            <article key={f.title} className="rounded-[22px] bg-lacvay-cream p-5 transition hover:shadow-card">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-lacvay-lime/30 to-lacvay-green/5">
                <img src={f.image} alt="" className="h-10 w-10 object-contain mix-blend-multiply" />
              </div>
              <h3 className="mt-4 text-[15px] font-bold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-gray-600">{f.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid items-center gap-8 rounded-[26px] bg-gradient-to-br from-lacvay-green to-lacvay-green-dark p-6 sm:p-9 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11.5px] font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5 text-lacvay-lime" />
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
                    : 'mr-4 rounded-2xl rounded-tl-md bg-gradient-to-br from-lacvay-lime/25 to-lacvay-green/5 px-3.5 py-2.5 text-[12px] leading-relaxed text-gray-700'
                }
              >
                {m.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-lacvay-cream py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="How it works" title="Three steps to a confident trip" />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {landingSteps.map((step) => (
            <article key={step.order} className="relative rounded-[22px] bg-white p-6 shadow-soft">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-lacvay-green to-lacvay-lime text-[15px] font-extrabold text-white">
                {step.order}
              </span>
              <h3 className="mt-4 text-[15px] font-bold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-gray-600">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingDestinations() {
  const spots = touristSpots.slice(0, 4);

  return (
    <section id="destinations" className="scroll-mt-20 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Destinations"
          title="Places worth the trip"
          subtitle="From the crater lake of Taal to the reefs of Anilao and the white sand of Laiya."
        />

        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {spots.map((spot) => (
            <article key={spot.id} className="group overflow-hidden rounded-[22px] bg-lacvay-cream">
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
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingBenefits() {
  return (
    <section id="why-lacvay" className="scroll-mt-20 bg-lacvay-cream py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Why LACVAY" title="Made for this city, not copied from another" />

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {landingBenefits.map((b) => (
            <article key={b.title} className="flex gap-4 rounded-[22px] bg-white p-5 shadow-soft">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lacvay-green/10">
                <Check className="h-4 w-4 text-lacvay-green" strokeWidth={2.5} />
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-gray-900">{b.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-gray-600">{b.description}</p>
              </div>
            </article>
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
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-lacvay-green via-lacvay-green to-lacvay-lime px-6 py-12 text-center sm:px-10">
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
        </div>
      </div>
    </section>
  );
}
