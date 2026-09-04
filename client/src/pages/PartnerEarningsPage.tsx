import { partnerDayStats } from '@/data/partnerMockData';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

const weeklyEarnings = [
  { day: 'Mon', amount: 420 },
  { day: 'Tue', amount: 510 },
  { day: 'Wed', amount: 385 },
  { day: 'Thu', amount: 485 },
  { day: 'Fri', amount: 0 },
  { day: 'Sat', amount: 0 },
  { day: 'Sun', amount: 0 },
];

export default function PartnerEarningsPage() {
  const max = Math.max(...weeklyEarnings.map((d) => d.amount), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Earnings</h2>
        <p className="text-sm text-gray-500">Track your daily and weekly income</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500">Today</p>
          <p className="mt-1 text-2xl font-extrabold text-lacvay-green">{formatCurrency(partnerDayStats.earningsToday)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">This week</p>
          <p className="mt-1 text-2xl font-extrabold text-gray-900">{formatCurrency(1800)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Trips today</p>
          <p className="mt-1 text-2xl font-extrabold text-gray-900">{partnerDayStats.tripsToday}</p>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold text-gray-900">Weekly overview</h3>
        <div className="mt-6 flex items-end justify-between gap-2">
          {weeklyEarnings.map(({ day, amount }) => (
            <div key={day} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-lacvay-green to-lacvay-lime"
                style={{ height: `${Math.max(8, (amount / max) * 120)}px` }}
              />
              <span className="text-[11px] font-medium text-gray-500">{day}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
