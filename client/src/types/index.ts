export type TransportType =
  | 'jeepney'
  | 'tricycle'
  | 'motorcycle'
  | 'taxi'
  | 'private'
  | 'walking';

/** Transport modes a driver can be booked for. */
export type BookableVehicle = Exclude<TransportType, 'jeepney' | 'walking'>;

/** Taxi and habal-habal — bookable through the dedicated booking page. */
export type OnDemandVehicle = Extract<BookableVehicle, 'motorcycle' | 'taxi'>;

export interface TodaTerritory {
  id: string;
  name: string;
  barangays: string[];
  terminalLocation: string;
  operatingHours: string;
  fareNote: string;
}

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

export type UserRole = 'traveler' | 'transpo_partner';

export interface PartnerProfile {
  vehicleType: OnDemandVehicle;
  vehicleLabel: string;
  plateNumber?: string;
  baseFare: number;
  perKmFee: number;
  coordinates: Coordinates;
  isOnline: boolean;
  rating: number;
  tripsCompleted: number;
  acceptanceRate: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role?: UserRole;
  partnerProfile?: PartnerProfile;
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
  vehicleType: BookableVehicle;
  rating: number;
  distanceKm: number;
  baseFare: number;
  perKmFee: number;
  coordinates: Coordinates;
  isOnline: boolean;
  estimatedFare: number;
  etaMin: number;
  plateNumber?: string;
  tripsCompleted?: number;
  vehicleLabel?: string;
}

export interface RideBooking {
  id: string;
  rideId: string;
  driverName: string;
  vehicleType: OnDemandVehicle;
  pickup: string;
  destination: string;
  estimatedFare: number;
  etaMin: number;
  plateNumber?: string;
  status: 'searching' | 'confirmed' | 'arriving' | 'completed';
  bookedAt: string;
}

export interface PartnerRideRequest {
  id: string;
  passengerName: string;
  pickup: string;
  destination: string;
  distanceKm: number;
  estimatedFare: number;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
}

export interface PartnerDayStats {
  tripsToday: number;
  earningsToday: number;
  hoursOnline: number;
  pendingRequests: number;
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
