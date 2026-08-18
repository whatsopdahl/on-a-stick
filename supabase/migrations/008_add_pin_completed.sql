-- Let any group member mark a pin as completed (shown grey on the map,
-- with a checkmark in the list view). Editing/deleting other pin fields
-- stays author-only via the existing RLS policies.
alter table public.pins
  add column if not exists completed boolean not null default false;

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

grant execute on function public.set_pin_completed(uuid, boolean) to authenticated;
