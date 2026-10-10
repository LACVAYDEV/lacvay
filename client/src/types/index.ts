export type TransportType =
  | 'jeepney'
  | 'tricycle'
  | 'motorcycle'
  | 'taxi'
  | 'private'
  | 'walking';

/** Transport modes available for rides. */
export type BookableVehicle = Exclude<TransportType, 'jeepney' | 'walking'>;

export type TouristCategory =
  | 'Nature'
  | 'Historical'
  | 'Beach'
  | 'Food'
  | 'Adventure'
  | 'Family'
  | 'Cultural'
  | 'Establishment'
  | 'Others';

export type RestaurantCuisine =
  | 'Filipino'
  | 'Fast Food'
  | 'Cafe'
  | 'Seafood'
  | 'Budget'
  | 'Family'
  | 'Fine Dining';

export type SavedItemType = 'tourist-spot' | 'restaurant' | 'route' | 'commute-guide';

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: UserRole | null;
  created_at?: string;
  updated_at?: string;
}

export interface ExternalProvider {
  id: string;
  provider_name: string;
  service_type: string;
  description?: string | null;
  logo_url?: string | null;
  android_link?: string | null;
  ios_link?: string | null;
  web_link?: string | null;
  is_active: boolean;
  tag?: string;
  features?: string[];
  coverageArea?: string;
  highlight?: string;
  ctaText?: string;
}

export interface Place {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  image_url?: string | null;
  latitude: number;
  longitude: number;
  is_featured?: boolean | null;
  metadata?: Record<string, any> | null;
  created_at?: string | null;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  place_id: string;
  created_at?: string;
  places?: Place;
  place?: Place;
}

export interface SavedGuideStep {
  order?: number;
  title: string;
  description?: string;
  location?: string;
  coordinates?: Coordinates;
}

export interface SavedGuide {
  id: string;
  user_id: string;
  title: string;
  summary?: string | null;
  steps: SavedGuideStep[] | any;
  plan?: CommuteGuidePlan | null;
  created_at?: string | null;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

/** @deprecated Use Supabase auth user directly */
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TouristSpot {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: TouristCategory;
  /** Display label shown on cards, e.g. "Beach & Diving". Falls back to `category`. */
  categoryLabel?: string;
  imageUrl: string;
  location?: string;
  coordinates: Coordinates;
  rating?: number;
  openTime?: string;
  closeTime?: string;
  openingHours?: string;
  estimatedTravelTime?: string;
  isFeatured?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine?: RestaurantCuisine[];
  imageUrl: string;
  location?: string;
  coordinates: Coordinates;
  rating?: number;
  distanceKm?: number;
  priceRange: string;
  openTime?: string;
  closeTime?: string;
  isOpen?: boolean;
  openingHours?: string;
  isFeatured?: boolean;
}

export interface RouteStep {
  type: TransportType | 'walk';
  instruction: string;
  durationMin: number;
  distanceKm?: number;
  fare?: number;
}

export interface TransportationRoute {
  id: string;
  origin: string;
  destination: string;
  transportType: TransportType;
  steps: RouteStep[];
  totalDurationMin: number;
  totalDistanceKm: number;
  estimatedFareMin: number;
  estimatedFareMax: number;
  transfers: number;
}

export interface FareEstimate {
  origin: string;
  destination: string;
  transportType: TransportType;
  distanceKm: number;
  estimatedFareMin: number;
  estimatedFareMax: number;
  estimatedTravelTimeMin: number;
  isExactFare: boolean;
}

export interface Ride {
  id: string;
  driverName: string;
  vehicleType: BookableVehicle;
  rating: number;
  distanceKm: number;
  estimatedFare: number;
  etaMin: number;
  plateNumber?: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  promoCode?: string | null;
  discount?: string | null;
  /** Ad creative — image or video URL shown to travelers. */
  imageUrl?: string | null;
  validUntil?: string | null;
  /** When false, hidden from traveler-facing pages. */
  isActive?: boolean;
}

export interface SavedPlace {
  id: string;
  itemId: string;
  type: SavedItemType;
  savedAt: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  type: 'search' | 'route' | 'fare' | 'attraction' | 'ride';
  timestamp: string;
  meta?: string;
}

export interface CommuteStep {
  order: number;
  title: string;
  description: string;
}

export interface CommuteGuide {
  id: string;
  title: string;
  destination: string;
  transportTypes: TransportType[];
  steps: CommuteStep[];
  estimatedFareMin: number;
  estimatedFareMax: number;
  estimatedTravelTimeMin: number;
  difficulty: 'Easy' | 'Moderate';
}

export interface TransportSegment {
  type: string;
  routeId?: string;
  routeName?: string;
  fare?: number | null;
  fareType?: string;
  color?: string;
}

export interface CommuteGuideStep {
  order: number;
  title: string;
  description: string;
  tip?: string;
}

export interface GlobalCommuteGuide {
  id: string;
  title: string;
  summary?: string | null;
  destination?: string | null;
  steps: CommuteGuideStep[];
  transport_segments: TransportSegment[];
  difficulty?: string;
  estimated_travel_time_min?: number | null;
  estimated_fare_min?: number | null;
  estimated_fare_max?: number | null;
  created_by?: string | null;
  is_global: boolean;
  created_at?: string | null;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  /** Structured commute plan for map/guide view (when AI resolved an OD). */
  plan?: CommuteGuidePlan | null;
}

export type GuideLegMode = 'walk' | 'jeepney' | 'tnvs';

export interface CommuteGuideLeg {
  order: number;
  mode: GuideLegMode;
  title: string;
  description: string;
  minutes?: number;
  fareRegular?: number;
  fareDiscounted?: number;
  routeName?: string;
  color?: string;
  /** [lat, lng] polyline for this leg */
  path: [number, number][];
}

export interface CommuteGuidePlan {
  title: string;
  origin: { label: string; lat: number; lng: number; outOfBounds?: boolean };
  destination: { label: string; lat: number; lng: number; outOfBounds?: boolean };
  planType: string;
  legs: CommuteGuideLeg[];
  totalMinutes: number | null;
  totalFareRegular: number | null;
  totalFareDiscounted: number | null;
  sourceReply?: string;
}

export interface AIConversation {
  id: string;
  messages: AIMessage[];
}

export interface SearchResult {
  id: string;
  type: 'tourist-spot' | 'restaurant' | 'barangay' | 'route' | 'landmark';
  title: string;
  subtitle: string;
  path?: string;
}

export interface TripPlanState {
  from: string;
  to: string;
  transportType: TransportType;
}
