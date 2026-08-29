-- =============================================================================
-- BallSystem — Supabase schema
-- Run this whole file once in: Supabase Dashboard -> SQL Editor -> New query.
-- It is idempotent: running it a second time will not break anything.
-- =============================================================================

-- gen_random_uuid() lives in pgcrypto. Supabase enables it by default, but be
-- explicit so the file also works on a bare Postgres.
create extension if not exists "pgcrypto";


-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- One row per teacher. Created automatically by the trigger in section 4.
-- `settings` holds the teacher's preferences (quick point buttons, star
-- rewards, streak goal, ...) as JSON so the app can add a field without a
-- migration.
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  settings     jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- A class. `teacher_id` is repeated on every table below so the security
-- rules in section 3 can be a single, index-backed comparison.
create table if not exists public.groups (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid        not null references auth.users (id) on delete cascade,
  name       text        not null,
  subject    text        not null default '',
  emoji      text        not null default '',
  color      text        not null default '#5B5BF0',
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid        not null references auth.users (id) on delete cascade,
  group_id   uuid        not null references public.groups (id) on delete cascade,
  name       text        not null,
  accent     text,
  created_at timestamptz not null default now()
);

-- One row per point award. `date` is a plain calendar date, never a timestamp,
-- so a school day cannot drift across a timezone boundary.
create table if not exists public.entries (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid        not null references auth.users (id) on delete cascade,
  group_id   uuid        not null references public.groups (id) on delete cascade,
  student_id uuid        not null references public.students (id) on delete cascade,
  value      integer     not null,
  reason     text        not null default '',
  date       date        not null,
  created_at timestamptz not null default now()
);

-- Stars. `period` is 'week' or 'month' for an automatically settled podium,
-- or 'manual' for a bonus the teacher handed out.
-- A row with student_id = null is a marker meaning "this period was closed and
-- nobody had scored", which stops the app from re-checking it forever.
create table if not exists public.awards (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid        not null references auth.users (id) on delete cascade,
  group_id   uuid        references public.groups (id)   on delete cascade,
  student_id uuid        references public.students (id) on delete cascade,
  period     text        not null check (period in ('week', 'month', 'manual')),
  period_key text        not null,
  rank       integer     not null default 0,
  stars      integer     not null default 0,
  points     integer     not null default 0,
  note       text        not null default '',
  created_at timestamptz not null default now()
);


-- =============================================================================
-- 2. INDEXES
-- =============================================================================

-- The leaderboard always slices entries by date, and a profile page slices
-- them by student. These two cover almost every query the app makes.
create index if not exists entries_teacher_date_idx on public.entries (teacher_id, date);
create index if not exists entries_student_idx      on public.entries (student_id);
create index if not exists entries_group_date_idx   on public.entries (group_id, date);
create index if not exists students_group_idx       on public.students (group_id);
create index if not exists students_teacher_idx     on public.students (teacher_id);
create index if not exists groups_teacher_idx       on public.groups (teacher_id);
create index if not exists awards_teacher_idx       on public.awards (teacher_id);
create index if not exists awards_student_idx       on public.awards (student_id);

-- Safety net against a period being settled twice (for example from a phone
-- and a laptop at the same moment), which would hand out double stars.
-- Two partial indexes because NULL student_id needs its own rule.
create unique index if not exists awards_period_student_uniq
  on public.awards (teacher_id, group_id, period, period_key, student_id)
  where student_id is not null and period <> 'manual';

create unique index if not exists awards_period_marker_uniq
  on public.awards (teacher_id, group_id, period, period_key)
  where student_id is null;


-- =============================================================================
-- 3. ROW LEVEL SECURITY
--
-- Read  : everyone, including signed-out visitors. This is what makes the
--         public leaderboard work without a login.
-- Write : only the teacher who owns the row.
--
-- If you would rather keep the board private, replace `using (true)` in every
-- "readable by everyone" policy with `using (auth.role() = 'authenticated')`.
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.groups   enable row level security;
alter table public.students enable row level security;
alter table public.entries  enable row level security;
alter table public.awards   enable row level security;

-- profiles ---------------------------------------------------------------
drop policy if exists "profiles read"   on public.profiles;
drop policy if exists "profiles write"  on public.profiles;

create policy "profiles read"
  on public.profiles for select
  using (true);

create policy "profiles write"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- groups -----------------------------------------------------------------
drop policy if exists "groups read"  on public.groups;
drop policy if exists "groups write" on public.groups;

create policy "groups read"
  on public.groups for select
  using (true);

create policy "groups write"
  on public.groups for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- students ---------------------------------------------------------------
drop policy if exists "students read"  on public.students;
drop policy if exists "students write" on public.students;

create policy "students read"
  on public.students for select
  using (true);

create policy "students write"
  on public.students for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- entries ----------------------------------------------------------------
drop policy if exists "entries read"  on public.entries;
drop policy if exists "entries write" on public.entries;

create policy "entries read"
  on public.entries for select
  using (true);

create policy "entries write"
  on public.entries for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- awards -----------------------------------------------------------------
drop policy if exists "awards read"  on public.awards;
drop policy if exists "awards write" on public.awards;

create policy "awards read"
  on public.awards for select
  using (true);

create policy "awards write"
  on public.awards for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);


-- =============================================================================
-- 4. NEW USER -> PROFILE
-- Signing up through Supabase Auth writes to auth.users, which the app cannot
-- touch directly. This trigger mirrors every new account into public.profiles.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(coalesce(new.email, 'teacher'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =============================================================================
-- 5. REALTIME (optional but recommended)
-- Lets a board open on the classroom projector update itself the moment the
-- teacher taps a point on their phone.
-- =============================================================================

do $$
declare
  t text;
begin
  foreach t in array array['groups', 'students', 'entries', 'awards']
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end
$$;


-- =============================================================================
-- 6. ONE TEACHER, AND ONLY ONE
--
-- The seat below is what makes this a single-teacher app. Nothing can be
-- written unless the request comes from the account holding it. A second
-- account, however it came to exist, could read the public board and nothing
-- more.
--
-- `id` is a boolean primary key checked to be true, so the table can hold at
-- most one row. It has no write policy, so no API caller can claim or move the
-- seat — only the trigger below and you, from this editor.
-- =============================================================================

create table if not exists public.app_owner (
  id         boolean primary key default true,
  user_id    uuid not null references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  constraint app_owner_single_row check (id)
);

alter table public.app_owner enable row level security;

drop policy if exists "app_owner read" on public.app_owner;

-- Readable so the app can say "you are not the teacher" in plain words rather
-- than failing on every save.
create policy "app_owner read"
  on public.app_owner for select
  using (true);

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $
  select exists (
    select 1 from public.app_owner where user_id = auth.uid()
  );
$;

grant execute on function public.is_owner() to anon, authenticated;

-- Writing now needs two things at once: you hold the seat, and the row carries
-- your own id. Reading stays open — that is what the public board runs on.
drop policy if exists "groups write"   on public.groups;
drop policy if exists "students write" on public.students;
drop policy if exists "entries write"  on public.entries;
drop policy if exists "awards write"   on public.awards;

create policy "groups write"
  on public.groups for all
  using (public.is_owner() and auth.uid() = teacher_id)
  with check (public.is_owner() and auth.uid() = teacher_id);

create policy "students write"
  on public.students for all
  using (public.is_owner() and auth.uid() = teacher_id)
  with check (public.is_owner() and auth.uid() = teacher_id);

create policy "entries write"
  on public.entries for all
  using (public.is_owner() and auth.uid() = teacher_id)
  with check (public.is_owner() and auth.uid() = teacher_id);

create policy "awards write"
  on public.awards for all
  using (public.is_owner() and auth.uid() = teacher_id)
  with check (public.is_owner() and auth.uid() = teacher_id);

-- The first account ever created takes the seat; `on conflict do nothing` is
-- what makes it first-come-only.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(coalesce(new.email, 'teacher'), '@', 1)
    )
  )
  on conflict (id) do nothing;

  insert into public.app_owner (id, user_id)
  values (true, new.id)
  on conflict (id) do nothing;

  return new;
end;
$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- To name the teacher by hand, or move the seat to a new account, uncomment
-- and edit the login below:
--
-- insert into public.app_owner (id, user_id)
-- values (true, (select id from auth.users where email = 'nilufar.k@bahosystem.uz'))
-- on conflict (id) do update
--   set user_id = excluded.user_id, claimed_at = now();


-- =============================================================================
-- Done. Next: copy the Project URL and the anon key from Settings -> API into
-- .env.local, then create the one teacher account in
-- Authentication -> Users -> Add user (see SUPABASE.md, step 4).
-- =============================================================================
