import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, KeyRound, Search, Shield, ShieldOff, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { adminService } from '@/services/adminService';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { isEnvAdmin } from '@/lib/adminAccess';
import type { UserProfile } from '@/types';

type RoleFilter = 'all' | 'traveler' | 'admin';

const roleFilters: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'traveler', label: 'Travelers' },
  { value: 'admin', label: 'Admins' },
];

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="break-all text-[13px] font-medium text-gray-800">{value}</span>
    </div>
  );
}

export default function AdminUsersPage() {
  const { showToast } = useApp();
  const { user: currentUser, refreshProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await adminService.listUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const saveName = async (user: UserProfile) => {
    setSavingName(true);
    try {
      await adminService.updateUserProfile(user.id, { full_name: editName.trim() || undefined });
      showToast('User updated');
      setEditingId(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSavingName(false);
    }
  };

  const toggleAdmin = async (user: UserProfile) => {
    try {
      const next = !adminService.isUserAdmin(user);
      await adminService.setUserAdmin(user.id, user.email, next);
      showToast(next ? 'Admin role granted' : 'Admin role removed');
      await load();
      await refreshProfile();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update role');
    }
  };

  const resetPassword = async (user: UserProfile) => {
    if (!window.confirm(`Reset password for ${user.email}? They will need the new default password to sign in.`)) {
      return;
    }
    setResettingId(user.id);
    try {
      const defaultPassword = await adminService.resetUserPassword(user.id);
      showToast(`Password reset. New password: ${defaultPassword}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setResettingId(null);
    }
  };

  const removeUser = async (user: UserProfile) => {
    if (
      !window.confirm(
        `Permanently remove ${user.full_name || user.email}? This deletes their account, profile, and saved data. This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeletingId(user.id);
    try {
      await adminService.deleteUser(user.id);
      showToast('User removed');
      setExpandedId(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not remove user');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpanded = (userId: string) => {
    setExpandedId((current) => (current === userId ? null : userId));
    setEditingId(null);
  };

  const adminCount = useMemo(
    () => users.filter((u) => adminService.isUserAdmin(u)).length,
    [users],
  );
  const travelerCount = users.length - adminCount;

  const filteredUsers = useMemo(() => {
    let result = users;
    if (roleFilter === 'admin') result = result.filter((u) => adminService.isUserAdmin(u));
    if (roleFilter === 'traveler') result = result.filter((u) => !adminService.isUserAdmin(u));

    const q = searchQuery.trim().toLowerCase();
    if (!q) return result;

    return result.filter((u) => {
      const name = (u.full_name ?? '').toLowerCase();
      const email = u.email.toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, roleFilter, searchQuery]);

  if (loading) return <LoadingState />;
  if (error) {
    return (
      <Card className="space-y-3">
        <EmptyState title="Could not load users" description={error} />
        <Button onClick={() => void load()}>Retry</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        description="Manage registered accounts and grant or revoke admin access."
        actions={
          <Button variant="secondary" onClick={() => void load()}>Refresh</Button>
        }
      />

      <Card className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            aria-label="Search users by name or email"
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-11 pr-4 text-[12.5px] outline-none transition placeholder:text-gray-400 focus:border-lacvay-green focus:bg-white focus:ring-2 focus:ring-lacvay-green/15"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {roleFilters.map(({ value, label }) => {
            const count = value === 'all' ? users.length : value === 'admin' ? adminCount : travelerCount;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRoleFilter(value)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition',
                  roleFilter === value
                    ? 'bg-lacvay-green text-white shadow-soft'
                    : 'border border-gray-100 bg-white text-gray-600 shadow-soft hover:bg-gray-50',
                )}
              >
                {label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    roleFilter === value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {users.length === 0 ? (
          <EmptyState title="No users yet" description="Users appear here after they sign up via Supabase auth." />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title={searchQuery.trim() ? 'No matching users' : roleFilter === 'admin' ? 'No admin accounts' : 'No traveler accounts'}
            description={searchQuery.trim() ? 'Try a different name or email.' : 'Try another filter or refresh the list.'}
          />
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => {
              const isAdmin = adminService.isUserAdmin(user);
              const locked = isEnvAdmin(user.email);
              const isSelf = currentUser?.id === user.id;
              const canRemove = !isSelf && !locked;
              const isExpanded = expandedId === user.id;

              return (
                <div
                  key={user.id}
                  className={cn(
                    'overflow-hidden rounded-2xl border transition',
                    isExpanded
                      ? 'border-lacvay-green/30 bg-lacvay-blush/20 shadow-soft'
                      : 'border-gray-100 hover:border-lacvay-green/20 hover:bg-lacvay-cream/50',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpanded(user.id)}
                    className="flex w-full items-center gap-3 p-4 text-left"
                    aria-expanded={isExpanded}
                  >
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full bg-gray-100 ring-2 ring-white"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold text-gray-900">{user.full_name || 'Unnamed user'}</p>
                      <p className="truncate text-[12.5px] text-gray-500">{user.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {isAdmin ? <Badge>Admin</Badge> : <Badge variant="gray">Traveler</Badge>}
                        {user.created_at && (
                          <Badge variant="gray">Joined {new Date(user.created_at).toLocaleDateString()}</Badge>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-5 w-5 shrink-0 text-gray-400 transition-transform',
                        isExpanded && 'rotate-180 text-lacvay-green',
                      )}
                    />
                  </button>

                  {isExpanded && (
                    <div className="space-y-4 border-t border-gray-100/80 px-4 pb-4 pt-3">
                      <div className="grid gap-3 rounded-2xl bg-white/80 p-4">
                        <DetailRow label="Email" value={user.email} />
                        <DetailRow label="User ID" value={user.id} />
                        <DetailRow
                          label="Account type"
                          value={isAdmin ? 'Admin' : 'Traveler'}
                        />
                        {user.created_at && (
                          <DetailRow
                            label="Joined"
                            value={new Date(user.created_at).toLocaleString()}
                          />
                        )}
                        {user.updated_at && (
                          <DetailRow
                            label="Last updated"
                            value={new Date(user.updated_at).toLocaleString()}
                          />
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {user.role === 'admin' && <Badge variant="lime">DB admin</Badge>}
                          {locked && <Badge variant="yellow">Env admin</Badge>}
                        </div>
                      </div>

                      <div className="space-y-3 rounded-2xl bg-white/80 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Manage account</p>

                        {editingId === user.id ? (
                          <div className="flex flex-wrap items-end gap-2">
                            <Input
                              label="Full name"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="min-w-[200px] flex-1"
                            />
                            <Button size="sm" variant="primary" onClick={() => void saveName(user)} disabled={savingName}>
                              {savingName ? 'Saving…' : 'Save'}
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(user.id);
                                setEditName(user.full_name ?? '');
                              }}
                            >
                              Edit name
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={locked}
                              title={locked ? 'Env-configured admins cannot be changed here' : undefined}
                              onClick={() => void toggleAdmin(user)}
                            >
                              {isAdmin ? (
                                <>
                                  <ShieldOff className="h-4 w-4" />
                                  Remove admin
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4" />
                                  Make admin
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={resettingId === user.id}
                              onClick={() => void resetPassword(user)}
                            >
                              <KeyRound className="h-4 w-4" />
                              {resettingId === user.id ? 'Resetting…' : 'Reset password'}
                            </Button>
                          </div>
                        )}

                        <p className="text-[11.5px] leading-relaxed text-gray-500">
                          Reset password sets a default temporary password the user can use to sign in and change later.
                        </p>

                        <div className="space-y-2 border-t border-gray-100 pt-3">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Remove account</p>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={!canRemove || deletingId === user.id}
                            title={
                              isSelf
                                ? 'You cannot delete your own account while signed in'
                                : locked
                                  ? 'Env-configured admin accounts cannot be deleted here'
                                  : undefined
                            }
                            onClick={() => void removeUser(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingId === user.id ? 'Removing…' : 'Remove user'}
                          </Button>
                          <p className="text-[11.5px] leading-relaxed text-gray-500">
                            Permanently deletes this account and related data. Optional — use only when an account should be fully removed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
