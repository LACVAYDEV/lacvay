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
import {
  buildAdminActivityFeed,
  buildWeeklySignupBuckets,
  formatActivityTime,
  type AdminActivityEvent,
  type AdminActivityKind,
} from '@/lib/adminActivityFeed';
import type { Promotion, TouristSpot, UserProfile } from '@/types';

interface DashboardData {
  stats: Awaited<ReturnType<typeof adminService.getStats>>;
  users: UserProfile[];
  places: TouristSpot[];
  promotions: Promotion[];
  routeCount: number;
  activity: AdminActivityEvent[];
}

const ACTIVITY_ICON: Record<
  AdminActivityKind,
  { icon: typeof Users; className: string }
> = {
  user_joined: { icon: Users, className: 'bg-lacvay-blush text-lacvay-green' },
  spot_added: { icon: MapPin, className: 'bg-lacvay-lime/10 text-lacvay-lime' },
  eatery_added: { icon: UtensilsCrossed, className: 'bg-lacvay-green/10 text-lacvay-green' },
  promotion_published: { icon: Tag, className: 'bg-lacvay-yellow/15 text-lacvay-yellow' },
  promotion_updated: { icon: Tag, className: 'bg-gray-100 text-gray-600' },
  transit_route: { icon: Activity, className: 'bg-lacvay-green/10 text-lacvay-green' },
};

function ActivityFeedList({ events }: { events: AdminActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="rounded-2xl bg-lacvay-cream/70 px-4 py-8 text-center text-sm text-gray-500">
        No recent activity yet. Changes to users, content, and routes will show up here.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {events.map((event) => {
        const meta = ACTIVITY_ICON[event.kind];
        const Icon = meta.icon;
        const inner = (
          <>
            <span
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                meta.className,
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-gray-800">{event.title}</p>
              <p className="truncate text-[11px] text-gray-500">{event.detail}</p>
              <p className="mt-0.5 text-[10px] font-medium text-gray-400">{formatActivityTime(event.at)}</p>
            </div>
            {event.href && (
              <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden />
            )}
          </>
        );

        return (
          <li key={event.id}>
            {event.href ? (
              <Link
                to={event.href}
                className="flex items-start gap-3 rounded-2xl bg-lacvay-cream/60 px-3 py-2.5 transition hover:bg-lacvay-blush/40"
              >
                {inner}
              </Link>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl bg-lacvay-cream/60 px-3 py-2.5">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
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
      padding="sm"
      className={cn(
        'group h-full border-gray-100/80 transition duration-200 sm:!p-4',
        to && 'hover:-translate-y-0.5 hover:border-lacvay-green/20 hover:shadow-md',
        placeholder && 'border-dashed bg-white/70',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm sm:h-10 sm:w-10 sm:rounded-2xl',
            iconClass,
          )}
        >
          <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.25} />
        </span>
        {placeholder ? (
          <Badge variant="gray">Soon</Badge>
        ) : trend ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-lacvay-green/10 px-1.5 py-0.5 text-[10px] font-bold text-lacvay-green sm:px-2 sm:text-[11px]">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </span>
        ) : to ? (
          <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 transition group-hover:text-lacvay-green sm:h-4 sm:w-4" />
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-extrabold leading-none tracking-tight text-lacvay-green-dark sm:mt-4 sm:text-[28px]">
        {value}
      </p>
      <p className="mt-1.5 text-[12px] font-bold leading-snug text-gray-900 sm:mt-2 sm:text-[13px]">{label}</p>
      {sublabel && (
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-gray-500 sm:text-[11px]">{sublabel}</p>
      )}
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lacvay-green">
        {inner}
      </Link>
    );
  }
  return inner;
}

function WeeklySignupsChart({ users }: { users: UserProfile[] }) {
  const buckets = buildWeeklySignupBuckets(users);
  const weekTotal = buckets.reduce((sum, b) => sum + b.count, 0);
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  const vbW = 280;
  const vbBarH = 64;
  const vbLabelH = 16;
  const slotW = vbW / buckets.length;
  const barW = slotW * 0.52;

  return (
    <Card
      padding="sm"
      className="box-border w-full max-w-full space-y-3 overflow-hidden rounded-2xl border-gray-100/80 shadow-sm sm:space-y-4"
    >
      <div className="flex min-w-0 items-start justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold text-gray-900">New sign-ups this week</h2>
          <p className="mt-1 text-[12px] leading-snug text-gray-500 sm:text-[12.5px]">
            {weekTotal === 0
              ? 'No new accounts in the last 7 days'
              : `${weekTotal} new account${weekTotal === 1 ? '' : 's'} in the last 7 days`}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-lacvay-green/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-lacvay-green">
          {weekTotal}
        </span>
      </div>
      <div className="w-full max-w-full overflow-hidden rounded-xl bg-gradient-to-b from-lacvay-cream/40 to-lacvay-cream/80 px-2 py-2 sm:rounded-2xl sm:px-3 sm:py-3">
        <svg
          viewBox={`0 0 ${vbW} ${vbBarH + vbLabelH}`}
          className="block h-auto w-full max-w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Daily sign-ups this week, ${weekTotal} total`}
        >
          {buckets.map((bucket, i) => {
            const barH =
              bucket.count === 0 ? 2 : Math.max(4, (bucket.count / maxCount) * vbBarH);
            const x = i * slotW + (slotW - barW) / 2;
            const y = vbBarH - barH;
            const cx = x + barW / 2;
            return (
              <g key={`${bucket.label}-${i}`}>
                {bucket.count > 0 && (
                  <text
                    x={cx}
                    y={Math.max(8, y - 3)}
                    textAnchor="middle"
                    fill="#4a1520"
                    fontSize="9"
                    fontWeight="700"
                  >
                    {bucket.count}
                  </text>
                )}
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={2}
                  fill={bucket.count > 0 ? '#6b1b2e' : '#e5e7eb'}
                />
                <text
                  x={cx}
                  y={vbBarH + 12}
                  textAnchor="middle"
                  fill="#6b7280"
                  fontSize="9"
                  fontWeight="600"
                >
                  {bucket.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  const load = async () => {
    const [stats, users, places, promotions, transitRoutes, activitySource] = await Promise.all([
      adminService.getStats(),
      adminService.listUsers().catch(() => [] as UserProfile[]),
      adminService.listPlaces(),
      adminService.listPromotions(),
      transitAdminService.listRoutes().catch(() => []),
      adminService.fetchActivitySourceRows().catch(() => ({
        places: [],
        promotions: [],
        transitRoutes: [],
      })),
    ]);
    const activity = buildAdminActivityFeed({
      users,
      places: activitySource.places,
      promotions: activitySource.promotions,
      transitRoutes: activitySource.transitRoutes,
      limit: 10,
    });
    setData({ stats, users, places, promotions, routeCount: transitRoutes.length, activity });
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
  const firstName = displayName.split(/\s+/)[0] ?? displayName;
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="admin-dashboard w-full max-w-full space-y-5 overflow-x-clip pb-2 sm:space-y-7">
      <section className="relative max-w-full overflow-hidden rounded-2xl border border-lacvay-green/10 bg-gradient-to-br from-white via-white to-lacvay-blush/50 px-4 py-5 shadow-sm sm:px-6 sm:py-6">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-lacvay-green/5 blur-2xl"
          aria-hidden
        />
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-lacvay-green/80 sm:text-[11px]">
          Dashboard
        </p>
        <h1 className="mt-1 text-xl font-extrabold leading-tight tracking-tight text-lacvay-green-dark sm:text-[26px]">
          Welcome back,{' '}
          <span className="text-lacvay-green">
            <span className="sm:hidden">{firstName}</span>
            <span className="hidden sm:inline">{displayName}</span>
          </span>
        </h1>
        <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-gray-600 sm:text-[13px]">
          Users, spots, eateries, and promotions at a glance.
        </p>
        <p className="mt-2 text-[11px] font-medium text-gray-400 sm:mt-3">{todayLabel}</p>
      </section>

      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
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
          sublabel={
            metrics.topCategories[0]
              ? `${metrics.topCategories[0][0]} leads listings`
              : 'No spots yet'
          }
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

      <div className="grid min-w-0 gap-4 sm:gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <WeeklySignupsChart users={data.users} />

          <Card className="min-w-0 space-y-4 overflow-hidden rounded-2xl border-gray-100/80 shadow-sm">
            <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-bold text-gray-900">Recent sign-ups</h2>
                <p className="mt-1 text-[12px] text-gray-500 sm:text-[12.5px]">Latest registered users</p>
              </div>
              <Link
                to="/admin/users"
                className="shrink-0 whitespace-nowrap py-0.5 text-[12px] font-semibold text-lacvay-green hover:underline sm:text-[12.5px]"
              >
                View all
              </Link>
            </div>
            {metrics.recentUsers.length === 0 ? (
              <p className="rounded-2xl bg-lacvay-cream/70 px-4 py-8 text-center text-sm text-gray-500">No users yet</p>
            ) : (
              <div className="divide-y divide-gray-100 overflow-hidden">
                {metrics.recentUsers.map((u) => {
                  const joined = u.created_at
                    ? new Date(u.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';
                  return (
                  <div
                    key={u.id}
                    className="flex w-full max-w-full min-w-0 items-start gap-2.5 py-3 first:pt-0 last:pb-0 sm:items-center sm:gap-3"
                  >
                    <img
                      src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full bg-gray-100 ring-2 ring-white sm:h-10 sm:w-10"
                    />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="min-w-0 flex-1 truncate text-[13px] font-bold text-gray-900 sm:text-[13.5px]">
                          {u.full_name || 'Unnamed user'}
                        </p>
                        {adminService.isUserAdmin(u) && (
                          <Badge variant="lime" className="shrink-0 text-[10px]">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 max-w-full truncate text-[11px] text-gray-500 sm:text-[11.5px]">
                        {u.email}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-400 sm:hidden">{joined}</p>
                    </div>
                    <p className="hidden shrink-0 text-[11px] tabular-nums text-gray-400 sm:block">{joined}</p>
                  </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <Card className="space-y-4 rounded-2xl border-gray-100/80 shadow-sm">
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
                      <div className="h-2 w-full min-w-0 overflow-hidden rounded-full bg-lacvay-cream">
                        <div
                          className="h-full max-w-full rounded-full bg-lacvay-green transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="space-y-4 rounded-2xl border-gray-100/80 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Sparkles className="h-[18px] w-[18px] text-lacvay-green" />
              <h2 className="text-[15px] font-bold text-gray-900">Quick actions</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
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

          <Card className="space-y-3 rounded-2xl border-gray-100/80 shadow-sm">
            <div className="border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-[18px] w-[18px] text-lacvay-green" />
                <h2 className="text-[15px] font-bold text-gray-900">Activity feed</h2>
              </div>
              <p className="mt-1 text-[12px] text-gray-500">Recent sign-ups and content updates across LACVAY</p>
            </div>
            <ActivityFeedList events={data.activity} />
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
