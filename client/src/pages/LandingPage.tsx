import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import {
  LandingFeatures,
  LandingHowItWorks,
  LandingDestinations,
  LandingBenefits,
  LandingCTA,
} from '@/components/landing/LandingSections';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingDestinations />
        <LandingBenefits />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
