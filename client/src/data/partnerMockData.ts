import type { PartnerDayStats, PartnerRideRequest, User } from '@/types';

export const mockPartnerUser: User = {
  id: 'partner-1',
  name: 'Ramon Rider',
  email: 'partner@lacvay.demo',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RamonRider',
  role: 'transpo_partner',
  partnerProfile: {
    vehicleType: 'motorcycle',
    vehicleLabel: '125cc · helmet provided',
    plateNumber: 'MC 8821',
    baseFare: 25,
    perKmFee: 8,
    coordinates: { lat: 13.7558, lng: 121.0565 },
    isOnline: true,
    rating: 4.8,
    tripsCompleted: 530,
    acceptanceRate: 94,
  },
};

export const partnerDayStats: PartnerDayStats = {
  tripsToday: 7,
  earningsToday: 485,
  hoursOnline: 4.5,
  pendingRequests: 2,
};

export const partnerRideRequests: PartnerRideRequest[] = [
  {
    id: 'pr1',
    passengerName: 'Maria S.',
    pickup: 'Batangas City Grand Terminal',
    destination: 'SM City Batangas',
    distanceKm: 3.2,
    estimatedFare: 65,
    requestedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 'pr2',
    passengerName: 'Juan D.',
    pickup: 'Poblacion, Batangas City',
    destination: 'Basilica of the Immaculate Conception',
    distanceKm: 1.8,
    estimatedFare: 45,
    requestedAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 'pr3',
    passengerName: 'Ana L.',
    pickup: 'Port Area',
    destination: 'Lian, Batangas',
    distanceKm: 12.4,
    estimatedFare: 180,
    requestedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    status: 'completed',
  },
];
