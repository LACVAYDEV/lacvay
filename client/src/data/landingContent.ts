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
    description: 'See jeepney routes, tricycle and motorcycle coverage, stops, and landmarks across Batangas City.',
    image: '/images/icon-map.png',
  },
  {
    title: 'Transport Checker',
    description: 'Explore available jeepney and transport routes, check fixed fares, and view paths on the map.',
    image: '/images/icon-fare.png',
  },
  {
    title: 'Ride Guide',
    description: 'Learn how to book Angkas motorcycle taxis and metered taxis through provider apps.',
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
    description: 'See jeepney, tricycle TODA zones, habal-habal, and taxi options with travel time and estimated fare.',
  },
  {
    order: 3,
    title: 'Ride with confidence',
    description: 'Follow the commute guide step by step, or use the ride guide to book Angkas and taxis.',
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

/** Scrolled through the hero ticker to hint at coverage. */
export const landingTicker = [
  'Taal Volcano',
  'Basilica of the Immaculate Conception',
  'Anilao, Mabini',
  'Laiya Beach',
  'SM City Batangas',
  'Batangas Grand Terminal',
  'Batangas International Port',
  'Caleruega Church',
];

export const aiSampleChat = [
  { role: 'user' as const, text: 'How do I get to SM Batangas from the port?' },
  {
    role: 'assistant' as const,
    text: 'Ride a jeepney from the port heading to Diversion Road and get off at SM City Batangas. It takes about 20 minutes and the regular fare is ₱14.',
  },
];
