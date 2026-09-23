-- LACVAY admin content: roles, promotions, storage, RLS
-- Run in Supabase SQL Editor or via `supabase db push`

-- 1. Admin role on profiles
alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'admin'));

create index if not exists profiles_role_idx on public.profiles (role);

-- 2. Promotions table
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  promo_code text,
  discount text,
  image_url text,
  valid_until date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Admin helper (for RLS)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 4. RLS: profiles
alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 5. RLS: places
alter table public.places enable row level security;

drop policy if exists "Places are publicly readable" on public.places;
create policy "Places are publicly readable"
  on public.places for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins manage places" on public.places;
create policy "Admins manage places"
  on public.places for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 6. RLS: promotions
alter table public.promotions enable row level security;

drop policy if exists "Active promotions are public" on public.promotions;
create policy "Active promotions are public"
  on public.promotions for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Admins read all promotions" on public.promotions;
create policy "Admins read all promotions"
  on public.promotions for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins manage promotions" on public.promotions;
create policy "Admins manage promotions"
  on public.promotions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 7. Storage bucket for admin uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lacvay-media',
  'lacvay-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read lacvay-media" on storage.objects;
create policy "Public read lacvay-media"
  on storage.objects for select
  to public
  using (bucket_id = 'lacvay-media');

drop policy if exists "Admins upload lacvay-media" on storage.objects;
create policy "Admins upload lacvay-media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'lacvay-media' and public.is_admin());

drop policy if exists "Admins update lacvay-media" on storage.objects;
create policy "Admins update lacvay-media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'lacvay-media' and public.is_admin());

drop policy if exists "Admins delete lacvay-media" on storage.objects;
create policy "Admins delete lacvay-media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'lacvay-media' and public.is_admin());

-- 8. Bootstrap your first admin (replace email)
-- update public.profiles set role = 'admin' where email = 'you@example.com';
