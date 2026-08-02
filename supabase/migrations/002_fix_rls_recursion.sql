-- Fixes "infinite recursion detected in policy for relation group_members".
--
-- Root cause: the group_members SELECT policy queries group_members to check
-- membership, which re-triggers the same policy → infinite loop. The groups
-- and pins policies share this problem since they also query group_members.
--
-- Fix: a security definer function bypasses RLS when checking membership,
-- so the policies can call it without recursing.

-- 1. Membership helper (runs without RLS)
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

-- 2. Fix groups policy
drop policy if exists "Group members can view their groups" on public.groups;
create policy "Group members can view their groups"
  on public.groups for select using (
    public.is_group_member(id, auth.uid())
  );

-- 3. Fix group_members policy (was self-referential)
drop policy if exists "Members can view membership of their groups" on public.group_members;
create policy "Members can view membership of their groups"
  on public.group_members for select using (
    public.is_group_member(group_id, auth.uid())
  );

-- 4. Fix pins policies
drop policy if exists "Group members can view pins" on public.pins;
create policy "Group members can view pins"
  on public.pins for select using (
    public.is_group_member(group_id, auth.uid())
  );

drop policy if exists "Group members can insert pins" on public.pins;
create policy "Group members can insert pins"
  on public.pins for insert with check (
    auth.uid() = user_id
    and public.is_group_member(group_id, auth.uid())
  );
