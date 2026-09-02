export interface LandingFeature {
  title: string;
  description: string;
  image: string;
}

export interface LandingStep {
  order: number;
  title: string;
  description: string;
}

export interface LandingBenefit {
  title: string;
  description: string;
}

export const landingFeatures: LandingFeature[] = [
  {
    title: 'Map & Routes',
    description: 'See jeepney routes, tricycle coverage, stops, and landmarks across Batangas City.',
    image: '/images/icon-map.png',
  },
  {
    title: 'Fare Checker',
    description: 'Know what a trip should cost before you ride, for jeepneys, tricycles, and taxis.',
    image: '/images/icon-fare.png',
  },
  {
    title: 'Book a Ride',
    description: 'Find tricycles, taxis, and private rides available near your location.',
    image: '/images/icon-ride.png',
  },
  {
    title: 'Commute Guide',
    description: 'Step-by-step instructions for getting to malls, terminals, and landmarks.',
    image: '/images/icon-commute.png',
  },
];

export const landingSteps: LandingStep[] = [
  {
    order: 1,
    title: 'Tell us where you are going',
    description: 'Enter your destination — a barangay, mall, terminal, beach, or landmark in Batangas City.',
  },
  {
    order: 2,
    title: 'Compare routes and fares',
    description: 'See jeepney, tricycle, and taxi options side by side with travel time and estimated fare.',
  },
  {
    order: 3,
    title: 'Ride with confidence',
    description: 'Follow the commute guide step by step, or book a ride from a driver near you.',
  },
];

export const landingBenefits: LandingBenefit[] = [
  {
    title: 'Built for Batangas City',
    description: 'Local routes, local fares, and local landmarks — not a generic map dropped on top of the city.',
  },
  {
    title: 'No more guessing fares',
    description: 'Fare estimates are transparent, so you always know roughly what to hand the driver.',
  },
  {
    title: 'Helpful for first-timers',
    description: 'New to the city? The commute guide explains exactly where to ride and where to get off.',
  },
  {
    title: 'Discover more places',
    description: 'Tourist spots, beaches, and local restaurants worth the trip, all in one place.',
  },
];

export const aiSampleChat = [
  { role: 'user' as const, text: 'How do I get to SM Batangas from the port?' },
  {
    role: 'assistant' as const,
    text: 'Ride a jeepney from the port heading to Diversion Road and get off at SM City Batangas. It takes about 20 minutes and costs around ₱13–₱15.',
  },
];
