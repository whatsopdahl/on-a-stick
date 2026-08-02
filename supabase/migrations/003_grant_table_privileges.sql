-- Grants table-level privileges to the authenticated role.
-- RLS policies control which rows are visible, but Postgres requires
-- a GRANT before RLS is even evaluated. Without this, all queries
-- return 403 even when the RLS policy would allow access.

grant select, insert, update, delete on public.profiles      to authenticated;
grant select, insert, update, delete on public.groups         to authenticated;
grant select, insert, update, delete on public.group_members  to authenticated;
grant select, insert, update, delete on public.pins           to authenticated;

-- Allow the anon role to call the public search function (used before login)
grant execute on function public.search_groups_by_name(text)            to authenticated;
grant execute on function public.create_group(text, text)               to authenticated;
grant execute on function public.join_group(uuid, text)                 to authenticated;
grant execute on function public.is_group_member(uuid, uuid)            to authenticated;
