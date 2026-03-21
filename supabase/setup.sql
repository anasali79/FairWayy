-- Fairway Impact: Supabase schema + seed data
-- Run this in Supabase SQL Editor (single script).

create extension if not exists pgcrypto;

-- =========================
-- Core tables
-- =========================

create table if not exists public.golf_charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  image_url text,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.golf_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'subscriber' check (role in ('subscriber', 'admin')),
  charity_id uuid references public.golf_charities(id) on delete set null,
  charity_pct integer not null default 10 check (charity_pct >= 10),
  donation_pct_extra integer not null default 0 check (donation_pct_extra >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.golf_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null check (plan in ('monthly', 'yearly')),
  status text not null check (status in ('active', 'inactive', 'past_due', 'cancelled')),
  renewal_date date not null,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'INR',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.golf_scores (
  user_id uuid not null references auth.users(id) on delete cascade,
  score_date date not null,
  stableford integer not null check (stableford between 1 and 45),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, score_date)
);

create table if not exists public.golf_draws (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  draw_type integer not null check (draw_type in (3, 4, 5)),
  mode text not null check (mode in ('random', 'algorithmic')),
  status text not null check (status in ('simulation', 'published', 'completed')),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  jackpot_rollover_cents integer,
  unique (month, draw_type, mode, status)
);

create table if not exists public.golf_draw_winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.golf_draws(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  match_numbers integer[] not null,
  match_size integer not null check (match_size in (3, 4, 5)),
  tier text not null check (tier in ('5-match', '4-match', '3-match')),
  created_at timestamptz not null default now(),
  unique (draw_id, user_id, tier)
);

create table if not exists public.golf_winner_submissions (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.golf_draws(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending', 'approved', 'rejected')),
  proof_storage_path text,
  admin_notes text,
  payout_cents integer,
  payment_status text check (payment_status in ('pending', 'paid')),
  created_at timestamptz not null default now(),
  unique (draw_id, user_id)
);

create index if not exists idx_golf_scores_user_date on public.golf_scores(user_id, score_date desc);
create index if not exists idx_golf_draws_month on public.golf_draws(month desc);
create index if not exists idx_golf_winner_submissions_user on public.golf_winner_submissions(user_id, created_at desc);

-- =========================
-- Auto profile creation
-- =========================

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.golf_profiles (user_id, role, charity_pct, donation_pct_extra)
  values (new.id, 'subscriber', 10, 0)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

-- =========================
-- Helpers for RLS
-- =========================

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.golf_profiles p
    where p.user_id = uid
      and p.role = 'admin'
  );
$$;

-- =========================
-- RLS policies (demo-friendly)
-- =========================

alter table public.golf_charities enable row level security;
alter table public.golf_profiles enable row level security;
alter table public.golf_subscriptions enable row level security;
alter table public.golf_scores enable row level security;
alter table public.golf_draws enable row level security;
alter table public.golf_draw_winners enable row level security;
alter table public.golf_winner_submissions enable row level security;

drop policy if exists "charities_read_all" on public.golf_charities;
create policy "charities_read_all"
on public.golf_charities for select
to authenticated, anon
using (true);

drop policy if exists "charities_admin_write" on public.golf_charities;
create policy "charities_admin_write"
on public.golf_charities for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "profiles_select_self_or_admin" on public.golf_profiles;
create policy "profiles_select_self_or_admin"
on public.golf_profiles for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "profiles_update_self_or_admin" on public.golf_profiles;
create policy "profiles_update_self_or_admin"
on public.golf_profiles for update
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "subscriptions_self_or_admin" on public.golf_subscriptions;
create policy "subscriptions_self_or_admin"
on public.golf_subscriptions for all
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "scores_self_or_admin" on public.golf_scores;
create policy "scores_self_or_admin"
on public.golf_scores for all
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "draws_read_authenticated" on public.golf_draws;
create policy "draws_read_authenticated"
on public.golf_draws for select
to authenticated
using (status = 'published' or public.is_admin(auth.uid()));

drop policy if exists "draws_admin_write" on public.golf_draws;
create policy "draws_admin_write"
on public.golf_draws for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "draw_winners_read_authenticated" on public.golf_draw_winners;
create policy "draw_winners_read_authenticated"
on public.golf_draw_winners for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.golf_draws d
    where d.id = draw_id
      and (d.status = 'published' or public.is_admin(auth.uid()))
  )
);

drop policy if exists "draw_winners_admin_write" on public.golf_draw_winners;
create policy "draw_winners_admin_write"
on public.golf_draw_winners for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "winner_submissions_self_or_admin_read" on public.golf_winner_submissions;
create policy "winner_submissions_self_or_admin_read"
on public.golf_winner_submissions for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "winner_submissions_self_insert_update" on public.golf_winner_submissions;
create policy "winner_submissions_self_insert_update"
on public.golf_winner_submissions for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "winner_submissions_self_update_or_admin" on public.golf_winner_submissions;
create policy "winner_submissions_self_update_or_admin"
on public.golf_winner_submissions for update
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

-- =========================
-- Seed data
-- =========================

insert into public.golf_charities (name, description, featured)
values
  ('Green Fairways Foundation', 'Supporting environmental projects through golf community initiatives.', true),
  ('Hope on the Course Trust', 'Fundraising for education and youth programs in local communities.', true),
  ('Community Swing Relief', 'Helping families with emergency relief and long-term support plans.', false),
  ('Junior Golf Scholars', 'Providing equipment and mentorship for young players from underserved communities.', true),
  ('Clean Water Protocol', 'Building water access and filtration support in drought-impacted regions.', false)
on conflict do nothing;

-- Optional: make one existing user admin.
-- Replace the email and run separately if required:
-- update public.golf_profiles
-- set role = 'admin'
-- where user_id = (select id from auth.users where email = 'your-admin@email.com');

