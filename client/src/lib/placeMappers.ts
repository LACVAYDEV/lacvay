import type { Database, Json } from '@/types/database.types';
import type { Promotion, Restaurant, RestaurantCuisine, TouristCategory, TouristSpot } from '@/types';

type PlaceRow = Database['public']['Tables']['places']['Row'];
type PlaceInsert = Database['public']['Tables']['places']['Insert'];
type PromotionRow = Database['public']['Tables']['promotions']['Row'];

export const PLACE_TYPE_TOURIST = 'tourist-spot';
export const PLACE_TYPE_RESTAURANT = 'restaurant';

function asRecord(value: Json | null | undefined): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function placeToTouristSpot(row: PlaceRow): TouristSpot {
  const meta = asRecord(row.metadata);
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    shortDescription: String(meta.shortDescription ?? ''),
    category: row.category as TouristCategory,
    categoryLabel: meta.categoryLabel ? String(meta.categoryLabel) : undefined,
    imageUrl: row.image_url ?? '',
    location: String(meta.location ?? 'Batangas City'),
    coordinates: { lat: row.latitude, lng: row.longitude },
    rating: Number(meta.rating ?? 4.5),
    openingHours: String(meta.openingHours ?? ''),
    estimatedTravelTime: String(meta.estimatedTravelTime ?? ''),
  };
}

export function placeToRestaurant(row: PlaceRow): Restaurant {
  const meta = asRecord(row.metadata);
  const cuisine = Array.isArray(meta.cuisine)
    ? (meta.cuisine as string[]).map((c) => c as RestaurantCuisine)
    : (['Filipino'] as RestaurantCuisine[]);

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    cuisine,
    imageUrl: row.image_url ?? '',
    location: String(meta.location ?? 'Batangas City'),
    coordinates: { lat: row.latitude, lng: row.longitude },
    rating: Number(meta.rating ?? 4.5),
    distanceKm: Number(meta.distanceKm ?? 2),
    priceRange: String(meta.priceRange ?? '₱₱'),
    isOpen: meta.isOpen !== false,
    openingHours: String(meta.openingHours ?? ''),
  };
}

function isUuid(value?: string): boolean {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function touristSpotToPlaceRow(
  spot: Omit<TouristSpot, 'id'> & { id?: string },
): PlaceInsert {
  return {
    ...(isUuid(spot.id) ? { id: spot.id } : {}),
    name: spot.name,
    description: spot.description,
    category: spot.category,
    image_url: spot.imageUrl,
    latitude: spot.coordinates.lat,
    longitude: spot.coordinates.lng,
    is_featured: true,
    metadata: {
      place_type: PLACE_TYPE_TOURIST,
      shortDescription: spot.shortDescription,
      categoryLabel: spot.categoryLabel,
      location: spot.location,
      rating: spot.rating,
      openingHours: spot.openingHours,
      estimatedTravelTime: spot.estimatedTravelTime,
    },
  };
}

export function restaurantToPlaceRow(
  restaurant: Omit<Restaurant, 'id'> & { id?: string },
): PlaceInsert {
  return {
    ...(isUuid(restaurant.id) ? { id: restaurant.id } : {}),
    name: restaurant.name,
    description: restaurant.description,
    category: 'restaurant',
    image_url: restaurant.imageUrl,
    latitude: restaurant.coordinates.lat,
    longitude: restaurant.coordinates.lng,
    is_featured: true,
    metadata: {
      place_type: PLACE_TYPE_RESTAURANT,
      cuisine: restaurant.cuisine,
      location: restaurant.location,
      rating: restaurant.rating,
      distanceKm: restaurant.distanceKm,
      priceRange: restaurant.priceRange,
      isOpen: restaurant.isOpen,
      openingHours: restaurant.openingHours,
    },
  };
}

export function promotionRowToPromotion(row: PromotionRow): Promotion {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    promoCode: row.promo_code ?? undefined,
    discount: row.discount ?? undefined,
    imageUrl: row.image_url ?? undefined,
    validUntil: row.valid_until ?? undefined,
    isActive: row.is_active,
  };
}

export function promotionToRow(
  promo: Omit<Promotion, 'id'> & { id?: string; isActive?: boolean },
): Database['public']['Tables']['promotions']['Insert'] {
  return {
    ...(isUuid(promo.id) ? { id: promo.id } : {}),
    title: promo.title,
    description: promo.description,
    promo_code: promo.promoCode ?? null,
    discount: promo.discount ?? null,
    image_url: promo.imageUrl ?? null,
    valid_until: promo.validUntil ?? null,
    is_active: promo.isActive ?? true,
  };
}
