-- LACVAY Subscription and Prompt Usage Tracking
-- Adds subscription tiers and weekly prompt usage tracking

-- 1. Add subscription_tier to profiles
alter table public.profiles
  add column if not exists subscription_tier text not null default 'free'
  check (subscription_tier in ('free', 'premium'));

create index if not exists profiles_subscription_tier_idx on public.profiles (subscription_tier);

-- 2. Create usage_stats table for tracking prompt usage
create table if not exists public.usage_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  prompt_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, week_start)
);

create index if not exists usage_stats_user_id_idx on public.usage_stats (user_id);
create index if not exists usage_stats_week_start_idx on public.usage_stats (week_start);

-- 3. Function to get week start date (Monday of current week)
create or replace function public.get_week_start(date_input date default current_date)
returns date
language sql
immutable
as $$
  select date_input - ((extract(dow from date_input) + 6)::integer % 7);
$$;

-- 4. Function to get or create usage stat for current week
create or replace function public.get_or_create_weekly_usage(user_id uuid)
returns table (prompt_count integer, week_start date)
language plpgsql
security definer
set search_path = public
as $$
declare
  week_start_date date;
begin
  week_start_date := public.get_week_start();
  
  insert into public.usage_stats (user_id, week_start, prompt_count)
  values (user_id, week_start_date, 0)
  on conflict (user_id, week_start) do nothing;
  
  return query
  select us.prompt_count, us.week_start
  from public.usage_stats us
  where us.user_id = $1 and us.week_start = week_start_date;
end;
$$;

-- 5. Function to increment prompt count
create or replace function public.increment_prompt_count(user_id uuid)
returns table (new_count integer, limit_reached boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  week_start_date date;
  current_count integer;
  is_premium boolean;
  new_count_val integer;
begin
  week_start_date := public.get_week_start();
  
  -- Check if premium
  select subscription_tier = 'premium' into is_premium
  from public.profiles
  where id = $1;
  
  if is_premium then
    return query select 999, false;
    return;
  end if;
  
  -- Get or create usage stat
  insert into public.usage_stats (user_id, week_start, prompt_count)
  values ($1, week_start_date, 0)
  on conflict (user_id, week_start) do nothing;
  
  -- Increment count
  update public.usage_stats
  set prompt_count = prompt_count + 1,
      updated_at = now()
  where user_id = $1 and week_start = week_start_date
  returning prompt_count into new_count_val;
  
  return query select new_count_val, (new_count_val > 3);
end;
$$;

-- 6. RLS: usage_stats
alter table public.usage_stats enable row level security;

drop policy if exists "Users can read own usage stats" on public.usage_stats;
create policy "Users can read own usage stats"
  on public.usage_stats for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "System can insert/update usage stats" on public.usage_stats;
create policy "System can insert/update usage stats"
  on public.usage_stats for insert, update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Admins can read all usage stats" on public.usage_stats;
create policy "Admins can read all usage stats"
  on public.usage_stats for select
  to authenticated
  using (public.is_admin());
