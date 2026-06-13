-- MannMitra schema. Run once in the Supabase SQL editor.
-- Every table is isolated per user via Row-Level Security (auth.uid()).

create table if not exists profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  exam       text not null,
  exam_date  date,
  created_at timestamptz default now()
);

create table if not exists entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  mood       int not null check (mood between 1 and 5),
  text       text not null,
  sentiment  text,
  created_at timestamptz default now()
);

create table if not exists triggers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  entry_id   uuid not null references entries(id) on delete cascade,
  label      text not null,
  category   text,
  intensity  int check (intensity between 1 and 5),
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table entries  enable row level security;
alter table triggers enable row level security;

create policy "own_profile"  on profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_entries"  on entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_triggers" on triggers for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
