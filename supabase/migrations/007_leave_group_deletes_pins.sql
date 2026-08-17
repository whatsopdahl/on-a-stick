-- When a user leaves a group, also remove the pins they placed in it.
-- Otherwise their pins would stick around, orphaned from any current member.
create or replace function public.leave_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_group_member(p_group_id, auth.uid()) then
    raise exception 'Not a member of this group';
  end if;
  delete from public.pins
  where group_id = p_group_id and user_id = auth.uid();
  delete from public.group_members
  where group_id = p_group_id and user_id = auth.uid();
end;
$$;

grant execute on function public.leave_group(uuid) to authenticated;
