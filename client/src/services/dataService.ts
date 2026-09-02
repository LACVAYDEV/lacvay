import { touristSpots, restaurants, commuteGuides, rides, promotions, searchIndex, mockUser } from '@/data/mockData';
import type { TouristSpot, Restaurant, CommuteGuide, Ride, Promotion, SearchResult, TouristCategory, RestaurantCuisine, User } from '@/types';

export const dataService = {
  getUser(): Promise<User> {
    return Promise.resolve(mockUser);
  },

  getTouristSpots(category?: TouristCategory): Promise<TouristSpot[]> {
    const spots = category ? touristSpots.filter((s) => s.category === category) : touristSpots;
    return Promise.resolve(spots);
  },

  getTouristSpot(id: string): Promise<TouristSpot | undefined> {
    return Promise.resolve(touristSpots.find((s) => s.id === id));
  },

  getRestaurants(cuisine?: RestaurantCuisine): Promise<Restaurant[]> {
    const list = cuisine ? restaurants.filter((r) => r.cuisine.includes(cuisine)) : restaurants;
    return Promise.resolve(list);
  },

  getRestaurant(id: string): Promise<Restaurant | undefined> {
    return Promise.resolve(restaurants.find((r) => r.id === id));
  },

  getCommuteGuides(): Promise<CommuteGuide[]> {
    return Promise.resolve(commuteGuides);
  },

  getCommuteGuide(id: string): Promise<CommuteGuide | undefined> {
    return Promise.resolve(commuteGuides.find((g) => g.id === id));
  },

  getRides(): Promise<Ride[]> {
    return Promise.resolve(rides);
  },

  getPromotions(): Promise<Promotion[]> {
    return Promise.resolve(promotions);
  },

  search(query: string): Promise<SearchResult[]> {
    const q = query.toLowerCase().trim();
    if (!q) return Promise.resolve([]);
    return Promise.resolve(
      searchIndex.filter(
        (item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q),
      ),
    );
  },
};
