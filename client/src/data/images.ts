/**
 * Central image catalogue.
 *
 * These are stock placeholders standing in for real Batangas City photography.
 * Swapping in licensed local photos only requires editing this file.
 */

const unsplash = (id: string, width: number) =>
  `https://images.unsplash.com/${id}?w=${width}&q=80&auto=format&fit=crop`;

export const heroImages = {
  background: unsplash('photo-1502920917128-1aa500764cbd', 1600),
  showcase: unsplash('photo-1518509562904-e7ef99cdcc86', 800),
};

export const featureImages = {
  map: unsplash('photo-1524661135-423995f22d0b', 600),
  fares: unsplash('photo-1554672408-730436b60dde', 600),
  rides: unsplash('photo-1552832230-c0197dd311b5', 600),
  commute: unsplash('photo-1596422846543-75c6fc197f07', 600),
};

export const promoImages = {
  summer: unsplash('photo-1533106418989-88406c7cc8ca', 800),
  business: unsplash('photo-1441986300917-64674bd600d8', 800),
};

export const aiPanelImage = unsplash('photo-1519501025264-65ba15a82390', 800);

export const pageBanners = {
  map: unsplash('photo-1524661135-423995f22d0b', 1200),
  restaurants: unsplash('photo-1556740738-b6a63e27c4df', 1200),
  touristSpots: unsplash('photo-1502920917128-1aa500764cbd', 1200),
};
