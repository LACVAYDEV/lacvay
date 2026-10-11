import type { Json } from '@/types/database.types';
import type { Promotion, UserProfile } from '@/types';

export type AdminActivityKind =
  | 'user_joined'
  | 'spot_added'
  | 'eatery_added'
  | 'promotion_published'
  | 'promotion_updated'
  | 'transit_route';

export interface AdminActivityEvent {
  id: string;
  kind: AdminActivityKind;
  title: string;
  detail: string;
  at: string;
  href?: string;
}

interface PlaceActivityRow {
  id: string;
  name: string;
  created_at: string | null;
  metadata: Json | null;
}

interface PromotionActivityRow {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface TransitRouteActivityRow {
  id: string;
  route_name: string;
  created_at: string | null;
}

function placeType(metadata: Json | null): string | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined;
  const t = (metadata as Record<string, unknown>).place_type;
  return typeof t === 'string' ? t : undefined;
}

export interface WeeklySignupBucket {
  label: string;
  count: number;
  heightPct: number;
}

export function buildWeeklySignupBuckets(users: { created_at?: string | null }[]): WeeklySignupBucket[] {
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - i));
    return {
      date,
      label: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
      count: 0,
    };
  });

  for (const user of users) {
    if (!user.created_at) continue;
    const t = new Date(user.created_at).getTime();
    if (!Number.isFinite(t)) continue;
    for (const bucket of buckets) {
      const start = bucket.date.getTime();
      const end = start + 86_400_000;
      if (t >= start && t < end) {
        bucket.count += 1;
        break;
      }
    }
  }

  const max = Math.max(1, ...buckets.map((b) => b.count));
  return buckets.map(({ label, count }) => ({
    label,
    count,
    heightPct: count === 0 ? 0 : Math.max(12, (count / max) * 100),
  }));
}

export function formatActivityTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diffMs = Date.now() - then;
  if (diffMs < 60_000) return 'Just now';
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function buildAdminActivityFeed(input: {
  users: UserProfile[];
  places: PlaceActivityRow[];
  promotions: PromotionActivityRow[] | Promotion[];
  transitRoutes: TransitRouteActivityRow[];
  limit?: number;
}): AdminActivityEvent[] {
  const events: AdminActivityEvent[] = [];
  const { limit = 12 } = input;

  for (const u of input.users) {
    if (!u.created_at) continue;
    events.push({
      id: `user-${u.id}`,
      kind: 'user_joined',
      title: 'New user registered',
      detail: u.full_name?.trim() || u.email || 'New account',
      at: u.created_at,
      href: '/admin/users',
    });
  }

  for (const row of input.places) {
    if (!row.created_at) continue;
    const type = placeType(row.metadata);
    if (type === 'restaurant') {
      events.push({
        id: `place-${row.id}`,
        kind: 'eatery_added',
        title: 'Eatery listing added',
        detail: row.name,
        at: row.created_at,
        href: '/admin/restaurants',
      });
    } else {
      events.push({
        id: `place-${row.id}`,
        kind: 'spot_added',
        title: 'Tourist spot added',
        detail: row.name,
        at: row.created_at,
        href: '/admin/places',
      });
    }
  }

  for (const raw of input.promotions) {
    const p = raw as PromotionActivityRow;
    if (!p.created_at) continue;
    const created = new Date(p.created_at).getTime();
    const updated = new Date(p.updated_at ?? p.created_at).getTime();
    const recentlyCreated = Number.isFinite(created) && Number.isFinite(updated) && updated - created < 120_000;
    const title =
      recentlyCreated && p.is_active !== false
        ? 'Promotion published'
        : recentlyCreated
          ? 'Promotion saved'
          : 'Promotion updated';
    events.push({
      id: `promo-${p.id}-${updated}`,
      kind: recentlyCreated ? 'promotion_published' : 'promotion_updated',
      title,
      detail: p.title,
      at: p.updated_at ?? p.created_at,
      href: '/admin/promotions',
    });
  }

  for (const route of input.transitRoutes) {
    if (!route.created_at) continue;
    events.push({
      id: `route-${route.id}`,
      kind: 'transit_route',
      title: 'Transit route added',
      detail: route.route_name,
      at: route.created_at,
      href: '/admin/transit',
    });
  }

  return events
    .filter((e) => Number.isFinite(new Date(e.at).getTime()))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}
