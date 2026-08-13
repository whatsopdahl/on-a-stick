-- Group management actions: leave, rename, change password, delete.
-- All run as security definer so they can bypass RLS to enforce
-- membership/ownership checks inside the function body.

-- Any member can leave
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
  delete from public.group_members
  where group_id = p_group_id and user_id = auth.uid();
end;
$$;

-- Any member can rename
create or replace function public.rename_group(p_group_id uuid, new_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_group_member(p_group_id, auth.uid()) then
    raise exception 'Not a member of this group';
  end if;
  update public.groups set name = new_name where id = p_group_id;
end;
$$;

-- Creator only: change password
create or replace function public.change_group_password(p_group_id uuid, new_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists(
    select 1 from public.groups where id = p_group_id and created_by = auth.uid()
  ) then
    raise exception 'Only the group creator can change the password';
  end if;
  update public.groups
  set password_hash = crypt(new_password, gen_salt('bf'))
  where id = p_group_id;
end;
$$;

-- Creator only: delete group (cascades to group_members and pins)
create or replace function public.delete_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists(
    select 1 from public.groups where id = p_group_id and created_by = auth.uid()
  ) then
    raise exception 'Only the group creator can delete the group';
  end if;
  delete from public.groups where id = p_group_id;
end;
$$;

grant execute on function public.leave_group(uuid)                  to authenticated;
grant execute on function public.rename_group(uuid, text)           to authenticated;
grant execute on function public.change_group_password(uuid, text)  to authenticated;
grant execute on function public.delete_group(uuid)                 to authenticated;
