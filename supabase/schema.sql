-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- User profiles (linked to auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  color text not null default '#2196F3',
  created_at timestamptz default now()
);

-- Groups
create table if not exists groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  password_hash text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Group membership
create table if not exists group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- Pins
create table if not exists pins (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('food', 'music', 'activity', 'show', 'exhibit')),
  title text not null,
  notes text,
  x double precision not null check (x >= 0 and x <= 1),
  y double precision not null check (y >= 0 and y <= 1),
  start_time timestamptz,
  end_time timestamptz,
  completed boolean not null default false,
  created_at timestamptz default now()
);

-- Pin likes (any group member may like a pin; one like per user per pin)
create table if not exists pin_likes (
  pin_id uuid not null references pins(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (pin_id, user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table pins enable row level security;
alter table pin_likes enable row level security;

-- Profiles
create policy "Users can view any profile"
  on profiles for select using (auth.role() = 'authenticated');

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- Membership helper: security definer bypasses RLS to avoid infinite recursion
-- when policies on groups/pins query group_members (which itself has an RLS policy).
create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_user_id
  );
$$;

-- Groups (members can see their groups; creation handled via RPC)
create policy "Group members can view their groups"
  on groups for select using (
    public.is_group_member(id, auth.uid())
  );

-- Group members
create policy "Members can view membership of their groups"
  on group_members for select using (
    public.is_group_member(group_id, auth.uid())
  );

-- Pins
create policy "Group members can view pins"
  on pins for select using (
    public.is_group_member(group_id, auth.uid())
  );

create policy "Group members can insert pins"
  on pins for insert with check (
    auth.uid() = user_id
    and public.is_group_member(group_id, auth.uid())
  );

create policy "Pin authors can update their own pins"
  on pins for update using (auth.uid() = user_id);

create policy "Pin authors can delete their own pins"
  on pins for delete using (auth.uid() = user_id);

create policy "Group creators can delete any pin in their group"
  on pins for delete using (
    exists (
      select 1 from public.groups
      where groups.id = pins.group_id and groups.created_by = auth.uid()
    )
  );

-- Pin likes
create policy "Group members can view likes"
  on pin_likes for select using (
    exists (
      select 1 from public.pins
      where pins.id = pin_likes.pin_id
        and public.is_group_member(pins.group_id, auth.uid())
    )
  );

create policy "Group members can like pins"
  on pin_likes for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.pins
      where pins.id = pin_likes.pin_id
        and public.is_group_member(pins.group_id, auth.uid())
    )
  );

create policy "Users can remove their own like"
  on pin_likes for delete using (auth.uid() = user_id);

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

-- Create a group (hashes password server-side, auto-joins creator)
create or replace function create_group(group_name text, group_password text)
returns uuid
language plpgsql
security definer
as $$
declare
  new_id uuid;
begin
  insert into groups (name, password_hash, created_by)
  values (group_name, crypt(group_password, gen_salt('bf')), auth.uid())
  returning id into new_id;

  insert into group_members (group_id, user_id)
  values (new_id, auth.uid());

  return new_id;
end;
$$;

-- Join an existing group after verifying password
create or replace function join_group(p_group_id uuid, group_password text)
returns boolean
language plpgsql
security definer
as $$
declare
  valid boolean;
begin
  select exists(
    select 1 from groups
    where id = p_group_id
      and password_hash = crypt(group_password, password_hash)
  ) into valid;

  if valid then
    insert into group_members (group_id, user_id)
    values (p_group_id, auth.uid())
    on conflict do nothing;
  end if;

  return valid;
end;
$$;

-- Search groups by name (returns safe fields only, no password_hash)
create or replace function search_groups_by_name(search_term text)
returns table(id uuid, name text, member_count bigint)
language sql
security definer
as $$
  select
    g.id,
    g.name,
    count(gm.user_id) as member_count
  from groups g
  left join group_members gm on gm.group_id = g.id
  where lower(g.name) like lower('%' || search_term || '%')
  group by g.id, g.name
  order by g.name
  limit 20;
$$;

-- Create user profile on signup (called from auth trigger or client)
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, color)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    '#2196F3'
  )
  on conflict do nothing;
  return new;
end;
$$;

-- Toggle a pin's completed flag. Any group member may call this (not just
-- the pin's author) — it only ever touches the `completed` column, so it
-- can't be used to bypass the author-only edit/delete restrictions above.
create or replace function public.set_pin_completed(p_pin_id uuid, p_completed boolean)
returns public.pins
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_pin public.pins;
begin
  if not exists (
    select 1 from public.pins
    where pins.id = p_pin_id
      and public.is_group_member(pins.group_id, auth.uid())
  ) then
    raise exception 'Not a member of this pin''s group';
  end if;

  update public.pins
  set completed = p_completed
  where id = p_pin_id
  returning * into updated_pin;

  return updated_pin;
end;
$$;

-- Trigger: auto-create profile on new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- GRANTS
-- ============================================================
-- RLS controls which rows are visible, but Postgres still requires
-- table-level privileges before RLS is evaluated.

grant select, insert, update, delete on public.profiles      to authenticated;
grant select, insert, update, delete on public.groups         to authenticated;
grant select, insert, update, delete on public.group_members  to authenticated;
grant select, insert, update, delete on public.pins           to authenticated;
grant select, insert, delete on public.pin_likes               to authenticated;

grant execute on function public.search_groups_by_name(text)  to authenticated;
grant execute on function public.create_group(text, text)      to authenticated;
grant execute on function public.join_group(uuid, text)        to authenticated;
grant execute on function public.is_group_member(uuid, uuid)   to authenticated;
grant execute on function public.set_pin_completed(uuid, boolean) to authenticated;

-- ============================================================
-- REALTIME
-- ============================================================
-- Enable realtime for pins table so group members see live updates
alter publication supabase_realtime add table pins;
alter publication supabase_realtime add table pin_likes;
