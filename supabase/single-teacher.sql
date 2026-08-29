-- =============================================================================
-- BahoSystem — one teacher, and only one
--
-- Run this whole file once in: Supabase Dashboard -> SQL Editor -> New query.
-- It is idempotent: running it again will not break anything.
--
-- What it does: nothing in the database may be written unless the request
-- comes from the single account named in `public.app_owner`. Even if someone
-- managed to create a second account, that account would be able to read the
-- public board and nothing else — it could not add a group, grade a student,
-- or touch a single row.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. The seat
--
-- `id` is a boolean primary key with a check that it is true, so the table can
-- physically hold at most one row. There is no write policy at all, which
-- means no API caller can claim, move or clear the seat — only the trigger
-- below (which runs as the definer) and you, from the SQL editor.
-- -----------------------------------------------------------------------------

create table if not exists public.app_owner (
  id         boolean primary key default true,
  user_id    uuid not null references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  constraint app_owner_single_row check (id)
);

alter table public.app_owner enable row level security;

drop policy if exists "app_owner read" on public.app_owner;

-- Readable so the app can tell a signed-in visitor "you are not the teacher"
-- in plain words instead of failing on every save.
create policy "app_owner read"
  on public.app_owner for select
  using (true);


-- -----------------------------------------------------------------------------
-- 2. The test every write now has to pass
-- -----------------------------------------------------------------------------

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_owner where user_id = auth.uid()
  );
$$;

grant execute on function public.is_owner() to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 3. Re-state the write policies on top of it
--
-- Reading stays open to everyone — that is what makes the public leaderboard
-- work without a login. Writing now needs two things at once: you hold the
-- seat, and the row is stamped with your own id.
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- 4. The first account ever created takes the seat
--
-- Extends the trigger from schema.sql. `on conflict do nothing` is what makes
-- it first-come-only: every later account mirrors into profiles as before, but
-- the seat is already gone.
-- -----------------------------------------------------------------------------

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

  insert into public.app_owner (id, user_id)
  values (true, new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =============================================================================
-- 5. Naming the teacher by hand
--
-- Use this when accounts already existed before you ran this file, or when you
-- need to move the seat to a new account (a forgotten password, a new phone).
-- Replace the login, keep the @bahosystem.uz part, and run just this block.
-- =============================================================================

-- insert into public.app_owner (id, user_id)
-- values (true, (select id from auth.users where email = 'nilufar.k@bahosystem.uz'))
-- on conflict (id) do update
--   set user_id = excluded.user_id, claimed_at = now();


-- Who holds the seat right now:
select u.email as login_address, o.claimed_at
from public.app_owner o
join auth.users u on u.id = o.user_id;
