export type TransportType = 'jeepney' | 'tricycle' | 'taxi' | 'private' | 'walking';

export type TouristCategory =
  | 'Nature'
  | 'Historical'
  | 'Beach'
  | 'Food'
  | 'Adventure'
  | 'Family'
  | 'Cultural';

export type RestaurantCuisine =
  | 'Filipino'
  | 'Fast Food'
  | 'Cafe'
  | 'Seafood'
  | 'Budget'
  | 'Family'
  | 'Fine Dining';

export type SavedItemType = 'tourist-spot' | 'restaurant' | 'route' | 'commute-guide';

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
  location: string;
  coordinates: Coordinates;
  rating: number;
  openingHours: string;
  estimatedTravelTime: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: RestaurantCuisine[];
  imageUrl: string;
  location: string;
  coordinates: Coordinates;
  rating: number;
  distanceKm: number;
  priceRange: string;
  isOpen: boolean;
  openingHours: string;
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
}

export interface Ride {
  id: string;
  driverName: string;
  vehicleType: 'tricycle' | 'taxi' | 'private';
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
  promoCode?: string;
  discount?: string;
  imageUrl?: string;
  validUntil?: string;
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

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
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
