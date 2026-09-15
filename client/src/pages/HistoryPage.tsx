import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/States';
import type { SearchHistoryItem } from '@/types';
import { dataService } from '@/services/dataService';

const typeLabels: Record<string, string> = {
  search: 'Search',
  route: 'Route',
  fare: 'Fare Check',
  attraction: 'Attraction',
  ride: 'Ride Guide',
};

export default function HistoryPage() {
  const {
    history,
    removeHistory,
    clearHistory,
    historySyncEnabled,
    setHistorySyncEnabled,
    showToast,
  } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | SearchHistoryItem['type']>('all');
  const [syncing, setSyncing] = useState(false);

  const filteredHistory = useMemo(
    () => filter === 'all' ? history : history.filter((item) => item.type === filter),
    [filter, history],
  );

  const runAgain = async (item: SearchHistoryItem) => {
    const [from, to] = item.query.split('→').map((part) => part.trim());
    if (item.type === 'route') {
      navigate(`/map?from=${encodeURIComponent(from || 'Current Location')}&to=${encodeURIComponent(to || item.query)}`);
    } else if (item.type === 'fare') {
      const params = new URLSearchParams({
        from: from || 'Current Location',
        to: to || item.query,
        ...(item.meta ? { transport: item.meta } : {}),
      });
      navigate(`/fares?${params.toString()}`);
    } else if (item.type === 'attraction') {
      const match = (await dataService.search(item.query)).find((result) => result.path);
      navigate(match?.path ?? '/tourist-spots');
    } else if (item.type === 'ride') {
      navigate('/rides');
    } else if (item.meta === 'AI Assistant') {
      navigate('/ai-assistant');
    } else {
      const match = (await dataService.search(item.query)).find((result) => result.path);
      navigate(match?.path ?? '/');
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear all history? This cannot be undone.')) {
      clearHistory();
      showToast('History cleared');
    }
  };

  const toggleSync = async () => {
    setSyncing(true);
    try {
      await setHistorySyncEnabled(!historySyncEnabled);
      showToast(historySyncEnabled ? 'Account history sync turned off' : 'History synced to your account');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update history sync');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <p className="text-sm text-gray-500">Previous searches, routes, and activity</p>
      </div>
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-gray-900">Account history sync</p>
          <p className="text-xs text-gray-500">
            {user ? 'Optional. Store up to 50 recent activities with your account.' : 'Sign in to enable cross-device history sync.'}
          </p>
        </div>
        <button
          type="button"
          disabled={!user || syncing}
          onClick={() => void toggleSync()}
          aria-pressed={historySyncEnabled}
          className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
            historySyncEnabled ? 'bg-lacvay-green text-white' : 'border border-gray-200 bg-white text-gray-700'
          }`}
        >
          {syncing ? 'Updating...' : historySyncEnabled ? 'Sync on' : 'Sync off'}
        </button>
      </Card>
      {history.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter history">
            {(['all', 'search', 'route', 'fare', 'attraction', 'ride'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  filter === value ? 'bg-lacvay-green text-white' : 'bg-white text-gray-600 shadow-soft'
                }`}
              >
                {value === 'all' ? 'All' : typeLabels[value]}
              </button>
            ))}
          </div>
          <button type="button" onClick={handleClear} className="self-start text-sm font-semibold text-red-600 hover:underline">
            Clear all
          </button>
        </div>
      )}
      <div className="space-y-3">
        {history.length === 0 ? (
          <EmptyState title="No history yet" description="Your searches, routes, and activity will appear here." />
        ) : filteredHistory.length === 0 ? (
          <EmptyState title="No matching history" description="Try another activity filter." />
        ) : null}

        {filteredHistory.map((item) => (
          <Card key={item.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-gray-900">{item.query}</p>
              <p className="text-sm text-gray-500">{item.meta}</p>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="text-right">
                <Badge variant="gray">{typeLabels[item.type] ?? item.type}</Badge>
                <p className="mt-1 text-xs text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
              </div>
              <button type="button" onClick={() => void runAgain(item)} className="rounded-xl p-2 text-lacvay-green hover:bg-lacvay-green/10" aria-label={`Run again: ${item.query}`}>
                <Play className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => removeHistory(item.id)} className="rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove from history: ${item.query}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
