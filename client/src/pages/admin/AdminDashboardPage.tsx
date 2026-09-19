import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Tag,
  Users,
  Shield,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/States';
import { adminService } from '@/services/adminService';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { transitAdminService } from '@/services/transitAdminService';
import type { Promotion, TouristSpot, UserProfile } from '@/types';

interface DashboardData {
  stats: Awaited<ReturnType<typeof adminService.getStats>>;
  users: UserProfile[];
  places: TouristSpot[];
  promotions: Promotion[];
  routeCount: number;
}

function MetricCard({
  label,
  value,
  sublabel,
  icon: Icon,
  iconClass,
  to,
  trend,
  placeholder,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: typeof Users;
  iconClass: string;
  to?: string;
  trend?: string;
  placeholder?: boolean;
}) {
  const inner = (
    <Card
      className={cn(
        'h-full transition',
        to && 'hover:-translate-y-0.5 hover:shadow-lg',
        placeholder && 'border border-dashed border-gray-200 bg-white/70',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', iconClass)}>
          <Icon className="h-5 w-5" />
        </span>
        {placeholder ? (
          <Badge variant="gray">Coming soon</Badge>
        ) : trend ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-lacvay-lime/10 px-2 py-0.5 text-[11px] font-bold text-lacvay-lime">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </span>
        ) : to ? (
          <ArrowUpRight className="h-4 w-4 text-gray-300" />
        ) : null}
      </div>
      <p className="mt-4 text-[30px] font-extrabold leading-none tracking-tight text-lacvay-green-dark">{value}</p>
      <p className="mt-2 text-[13px] font-bold text-gray-800">{label}</p>
      {sublabel && <p className="mt-0.5 text-[11.5px] text-gray-400">{sublabel}</p>}
    </Card>
  );

  if (to) return <Link to={to}>{inner}</Link>;
  return inner;
}

function PlaceholderChart({ title, subtitle }: { title: string; subtitle: string }) {
  const bars = [42, 68, 55, 80, 48, 72, 60];
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
          <p className="mt-1 text-[12.5px] text-gray-500">{subtitle}</p>
        </div>
        <Badge variant="gray">Placeholder</Badge>
      </div>
      <div className="flex h-36 items-end gap-2 rounded-2xl bg-lacvay-cream/70 px-4 pb-4 pt-6">
        {bars.map((h, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-lacvay-green/35 to-lacvay-green/10"
              style={{ height: `${h}%` }}
            />
            <span className="text-[10px] font-medium text-gray-400">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  const load = async () => {
    const [stats, users, places, promotions, transitRoutes] = await Promise.all([
      adminService.getStats(),
      adminService.listUsers().catch(() => [] as UserProfile[]),
      adminService.listPlaces(),
      adminService.listPromotions(),
      transitAdminService.listRoutes().catch(() => []),
    ]);
    setData({ stats, users, places, promotions, routeCount: transitRoutes.length });
  };

  useEffect(() => {
    void load();
  }, []);

  const metrics = useMemo(() => {
    if (!data) return null;

    const { stats, users, places, promotions } = data;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const adminCount = users.filter((u) => adminService.isUserAdmin(u)).length;
    const newUsersThisMonth = users.filter((u) => u.created_at && new Date(u.created_at) >= monthStart).length;
    const activePromos = promotions.filter((p) => !p.validUntil || new Date(p.validUntil) >= now).length;
    const expiringSoon = promotions.filter((p) => {
      if (!p.validUntil) return false;
      const until = new Date(p.validUntil);
      const diff = (until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 14;
    }).length;

    const categoryCounts = places.reduce<Record<string, number>>((acc, spot) => {
      acc[spot.category] = (acc[spot.category] ?? 0) + 1;
      return acc;
    }, {});
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const recentUsers = users.slice(0, 5);
    const recentSpots = places.slice(0, 4);

    return {
      stats,
      adminCount,
      newUsersThisMonth,
      activePromos,
      expiringSoon,
      topCategories,
      recentUsers,
      recentSpots,
      totalUsers: users.length,
    };
  }, [data]);

  if (!data || !metrics) return <LoadingState />;

  const { stats } = metrics;
  const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-lacvay-green-dark sm:text-[26px]">
          Welcome back, {displayName}
        </h1>
        <p className="mt-1.5 text-[13px] text-gray-500">
          Overview of users, spots, eateries, and promotions ·{' '}
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="User accounts"
          value={metrics.totalUsers}
          sublabel={`${metrics.newUsersThisMonth} new this month`}
          icon={Users}
          iconClass="bg-lacvay-blush text-lacvay-green"
          to="/admin/users"
          trend={metrics.newUsersThisMonth > 0 ? `+${metrics.newUsersThisMonth}` : undefined}
        />
        <MetricCard
          label="Tourist spots"
          value={stats.places}
          sublabel={`${metrics.topCategories[0]?.[0] ?? 'No'} most listed`}
          icon={MapPin}
          iconClass="bg-lacvay-lime/10 text-lacvay-lime"
          to="/admin/places"
        />
        <MetricCard
          label="Promotions"
          value={stats.promotions}
          sublabel={`${metrics.activePromos} active · ${metrics.expiringSoon} expiring soon`}
          icon={Tag}
          iconClass="bg-lacvay-yellow/15 text-lacvay-yellow"
          to="/admin/promotions"
        />
        <MetricCard
          label="Eateries"
          value={stats.restaurants}
          sublabel="Restaurants & dining listings"
          icon={UtensilsCrossed}
          iconClass="bg-lacvay-green/10 text-lacvay-green"
          to="/admin/restaurants"
        />
        <MetricCard
          label="Admin accounts"
          value={metrics.adminCount}
          sublabel="Users with admin access"
          icon={Shield}
          iconClass="bg-lacvay-lime/10 text-lacvay-lime"
          to="/admin/users"
        />
        <MetricCard
          label="Transit Routes"
          value={data.routeCount}
          sublabel="Active jeepney & transit lines"
          icon={Activity}
          iconClass="bg-lacvay-green/10 text-lacvay-green"
          to="/admin/transit"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <PlaceholderChart
            title="Weekly app activity"
            subtitle="Sessions, page views, and engagement — analytics integration pending"
          />

          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Recent sign-ups</h2>
                <p className="mt-1 text-[12.5px] text-gray-500">Latest registered users</p>
              </div>
              <Link to="/admin/users" className="text-[12.5px] font-semibold text-lacvay-green hover:underline">
                View all
              </Link>
            </div>
            {metrics.recentUsers.length === 0 ? (
              <p className="rounded-2xl bg-lacvay-cream/70 px-4 py-8 text-center text-sm text-gray-500">No users yet</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {metrics.recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <img
                      src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`}
                      alt=""
                      className="h-10 w-10 rounded-full bg-gray-100 ring-2 ring-white"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold text-gray-900">{u.full_name || 'Unnamed user'}</p>
                      <p className="truncate text-[11.5px] text-gray-500">{u.email}</p>
                    </div>
                    <div className="text-right">
                      {adminService.isUserAdmin(u) && <Badge variant="lime">Admin</Badge>}
                      <p className="mt-1 text-[11px] text-gray-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-[15px] font-bold text-gray-900">Spots by category</h2>
              <p className="mt-1 text-[12.5px] text-gray-500">Distribution of tourist spot content</p>
            </div>
            {metrics.topCategories.length === 0 ? (
              <p className="text-sm text-gray-500">No tourist spots yet</p>
            ) : (
              <div className="space-y-3.5">
                {metrics.topCategories.map(([category, count]) => {
                  const pct = stats.places > 0 ? Math.round((count / stats.places) * 100) : 0;
                  return (
                    <div key={category}>
                      <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                        <span className="font-semibold text-gray-700">{category}</span>
                        <span className="text-gray-400">{count} · {pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-lacvay-cream">
                        <div
                          className="h-full rounded-full bg-lacvay-green transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Sparkles className="h-[18px] w-[18px] text-lacvay-green" />
              <h2 className="text-[15px] font-bold text-gray-900">Quick actions</h2>
            </div>
            <div className="grid gap-2">
              <Link to="/admin/places">
                <Button className="w-full justify-start" variant="secondary">
                  <MapPin className="h-4 w-4" />
                  Add tourist spot
                </Button>
              </Link>
              <Link to="/admin/restaurants">
                <Button className="w-full justify-start" variant="secondary">
                  <UtensilsCrossed className="h-4 w-4" />
                  Add eatery
                </Button>
              </Link>
              <Link to="/admin/promotions">
                <Button className="w-full justify-start" variant="secondary">
                  <Tag className="h-4 w-4" />
                  Create promotion
                </Button>
              </Link>
              <Link to="/admin/users">
                <Button className="w-full justify-start" variant="secondary">
                  <Users className="h-4 w-4" />
                  Manage users
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-[18px] w-[18px] text-gray-400" />
                <h2 className="text-[15px] font-bold text-gray-900">Activity feed</h2>
              </div>
              <Badge variant="gray">Placeholder</Badge>
            </div>
            <ul className="space-y-2">
              {[
                'New user registered',
                'Tourist spot updated',
                'Promotion published',
                'Admin signed in',
              ].map((item, i) => (
                <li key={item} className="flex items-start gap-3 rounded-2xl bg-lacvay-cream/70 px-3.5 py-2.5">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lacvay-green/30" />
                  <div>
                    <p className="text-[12.5px] font-semibold text-gray-600">{item}</p>
                    <p className="text-[11px] text-gray-400">{i + 1}h ago · sample event</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {metrics.recentSpots.length > 0 && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Recently managed spots</h2>
              <p className="mt-1 text-[12.5px] text-gray-500">Quick access to tourist spot content</p>
            </div>
            <Link to="/admin/places" className="text-[12.5px] font-semibold text-lacvay-green hover:underline">
              Manage all
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.recentSpots.map((spot) => (
              <Link
                key={spot.id}
                to="/admin/places"
                className="group overflow-hidden rounded-2xl border border-gray-100 transition hover:-translate-y-0.5 hover:border-lacvay-green/30 hover:shadow-card"
              >
                <div className="h-24 overflow-hidden bg-gray-100">
                  <img src={spot.imageUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <div className="p-3">
                  <p className="truncate text-[13px] font-bold text-gray-900">{spot.name}</p>
                  <p className="truncate text-[11.5px] text-gray-500">{spot.location}</p>
                  <Badge variant="lime" className="mt-2">{spot.category}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
