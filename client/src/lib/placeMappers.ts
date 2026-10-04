import type { Database, Json } from '@/types/database.types';
import type { Promotion, Restaurant, TouristCategory, TouristSpot } from '@/types';
import { formatOpeningHours, isCurrentlyOpenNow } from '@/lib/timeUtils';

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
  const openTime = meta.openTime ? String(meta.openTime) : undefined;
  const closeTime = meta.closeTime ? String(meta.closeTime) : undefined;
  const openingHours = formatOpeningHours(openTime, closeTime) || String(meta.openingHours ?? '');

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    shortDescription: String(meta.shortDescription ?? ''),
    category: row.category as TouristCategory,
    categoryLabel: meta.categoryLabel ? String(meta.categoryLabel) : undefined,
    imageUrl: row.image_url ?? '',
    location: 'Batangas City',
    coordinates: { lat: row.latitude, lng: row.longitude },
    rating: meta.rating !== undefined && meta.rating !== null ? Number(meta.rating) : undefined,
    openTime,
    closeTime,
    openingHours,
    estimatedTravelTime: meta.estimatedTravelTime ? String(meta.estimatedTravelTime) : undefined,
    isFeatured: Boolean(row.is_featured ?? meta.is_promoted ?? false),
  };
}

export function placeToRestaurant(row: PlaceRow): Restaurant {
  const meta = asRecord(row.metadata);
  const openTime = meta.openTime ? String(meta.openTime) : undefined;
  const closeTime = meta.closeTime ? String(meta.closeTime) : undefined;
  const openingHours = formatOpeningHours(openTime, closeTime) || String(meta.openingHours ?? '');
  const isOpen = isCurrentlyOpenNow(openTime, closeTime);

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    imageUrl: row.image_url ?? '',
    location: 'Batangas City',
    coordinates: { lat: row.latitude, lng: row.longitude },
    priceRange: String(meta.priceRange ?? '₱₱'),
    cuisine: Array.isArray(meta.cuisine)
      ? meta.cuisine
      : (Array.isArray(meta.cuisines)
        ? meta.cuisines
        : (row.category && row.category !== 'restaurant' ? [row.category as any] : undefined)),
    openTime,
    closeTime,
    openingHours,
    isOpen,
    isFeatured: Boolean(row.is_featured ?? meta.is_promoted ?? false),
  };
}

function isUuid(value?: string): boolean {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function touristSpotToPlaceRow(
  spot: Omit<TouristSpot, 'id'> & { id?: string },
): PlaceInsert {
  const formattedHours = formatOpeningHours(spot.openTime, spot.closeTime) || spot.openingHours || '';
  return {
    ...(isUuid(spot.id) ? { id: spot.id } : {}),
    name: spot.name,
    description: spot.description,
    category: spot.category,
    image_url: spot.imageUrl,
    latitude: spot.coordinates.lat,
    longitude: spot.coordinates.lng,
    is_featured: Boolean(spot.isFeatured),
    metadata: {
      place_type: PLACE_TYPE_TOURIST,
      shortDescription: spot.shortDescription,
      categoryLabel: spot.categoryLabel,
      location: 'Batangas City',
      openTime: spot.openTime,
      closeTime: spot.closeTime,
      openingHours: formattedHours,
      is_promoted: Boolean(spot.isFeatured),
    },
  };
}

export function restaurantToPlaceRow(
  restaurant: Omit<Restaurant, 'id'> & { id?: string },
): PlaceInsert {
  const formattedHours = formatOpeningHours(restaurant.openTime, restaurant.closeTime) || restaurant.openingHours || '';
  return {
    ...(isUuid(restaurant.id) ? { id: restaurant.id } : {}),
    name: restaurant.name,
    description: restaurant.description,
    category: 'restaurant',
    image_url: restaurant.imageUrl,
    latitude: restaurant.coordinates.lat,
    longitude: restaurant.coordinates.lng,
    is_featured: Boolean(restaurant.isFeatured),
    metadata: {
      place_type: PLACE_TYPE_RESTAURANT,
      location: 'Batangas City',
      openTime: restaurant.openTime,
      closeTime: restaurant.closeTime,
      openingHours: formattedHours,
      priceRange: restaurant.priceRange,
      is_promoted: Boolean(restaurant.isFeatured),
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
    promo_code: promo.promoCode && promo.promoCode.trim() ? promo.promoCode.trim() : null,
    discount: promo.discount && promo.discount.trim() ? promo.discount.trim() : null,
    image_url: promo.imageUrl && promo.imageUrl.trim() ? promo.imageUrl.trim() : null,
    valid_until: promo.validUntil && promo.validUntil.trim() ? promo.validUntil.trim() : null,
    is_active: promo.isActive ?? true,
  };
}
