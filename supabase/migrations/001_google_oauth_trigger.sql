-- Run this in the Supabase SQL Editor.
-- Fixes "relation 'profiles' does not exist" by using a fully-qualified table name
-- and an explicit search_path. security definer functions on auth.users run with a
-- restricted search_path that excludes public, so unqualified names fail.

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
