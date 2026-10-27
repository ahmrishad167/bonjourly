-- Bonjourly database setup. Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.
--
-- What it stores, and nothing else:
--   profiles: first name, learning goal, pace, target date, province
--   progress: the learner's app progress (lessons, scores, review queue) as one JSON document
-- Row Level Security makes every row readable and writable only by its owner.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  first_name  text not null check (char_length(first_name) between 1 and 40),
  goal        text check (goal in ('tef', 'citizenship', 'work', 'family', 'moving', 'curiosity', 'other')),
  pace        text check (pace in ('intensive', 'steady', 'relaxed')),
  target_date date,
  province    text check (province in ('AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT', 'outside')),
  consent_at  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own progress" on public.progress;
create policy "own progress" on public.progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Lets a signed-in learner delete their own account (and, through the cascades, all their data).
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
