import { supabase } from '@/lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || '/api';
import { getAdminEmails, isEnvAdmin } from '@/lib/adminAccess';
import { contentRepository } from '@/services/contentRepository';
import type { Promotion, Restaurant, TouristSpot, UserProfile, UserRole } from '@/types';

export const adminService = {
  listPlaces: () => contentRepository.getTouristSpots(),
  getPlace: (id: string) => contentRepository.getTouristSpot(id),
  createPlace: (data: Omit<TouristSpot, 'id'>) => contentRepository.createTouristSpot(data),
  updatePlace: (data: TouristSpot) => contentRepository.saveTouristSpot(data),
  deletePlace: (id: string) => contentRepository.deleteTouristSpot(id),

  listRestaurants: () => contentRepository.getRestaurants(),
  getRestaurant: (id: string) => contentRepository.getRestaurant(id),
  createRestaurant: (data: Omit<Restaurant, 'id'>) => contentRepository.createRestaurant(data),
  updateRestaurant: (data: Restaurant) => contentRepository.saveRestaurant(data),
  deleteRestaurant: (id: string) => contentRepository.deleteRestaurant(id),

  listPromotions: () => contentRepository.getPromotionsForAdmin(),
  getPromotion: (id: string) => contentRepository.getPromotion(id),
  createPromotion: (data: Omit<Promotion, 'id'>) => contentRepository.createPromotion(data),
  updatePromotion: (data: Promotion) => contentRepository.savePromotion(data),
  deletePromotion: (id: string) => contentRepository.deletePromotion(id),

  resetContent: () => contentRepository.resetToDefaults(),
  clearAllPlaces: () => contentRepository.clearAllPlaces(),
  clearAllPromotions: () => contentRepository.clearAllPromotions(),
  getStats: () => contentRepository.getStats(),
  isUsingSupabase: () => contentRepository.isUsingSupabase(),

  async listUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as UserProfile[];
  },

  async updateUserProfile(
    id: string,
    patch: { full_name?: string; avatar_url?: string; role?: UserRole },
  ): Promise<UserProfile> {
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', id).select('*').single();
    if (error) throw error;
    return data as UserProfile;
  },

  isUserAdmin(user: UserProfile): boolean {
    if (user.role === 'admin') return true;
    return getAdminEmails().includes(user.email.toLowerCase());
  },

  async setUserAdmin(userId: string, email: string, isAdmin: boolean): Promise<void> {
    if (isEnvAdmin(email) && !isAdmin) {
      throw new Error('Cannot remove admin role from env-configured admin accounts.');
    }
    await this.updateUserProfile(userId, { role: isAdmin ? 'admin' : 'user' });
  },

  async resetUserPassword(userId: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('You must be signed in to reset passwords.');

    const res = await fetch(`${API_URL}/admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    const body = (await res.json()) as { error?: string; defaultPassword?: string };
    if (!res.ok) throw new Error(body.error ?? 'Password reset failed');
    if (!body.defaultPassword) throw new Error('Password reset failed');
    return body.defaultPassword;
  },

  async deleteUser(userId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('You must be signed in to delete users.');

    const res = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    const body = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(body.error ?? 'Could not delete user');
  },
};
