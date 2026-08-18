-- Let any group member "like" a pin. Likes are tracked per-user so we can
-- show a count and who liked it; a user can like a pin at most once.
create table if not exists public.pin_likes (
  pin_id uuid not null references public.pins(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (pin_id, user_id)
);

alter table public.pin_likes enable row level security;

create policy "Group members can view likes"
  on public.pin_likes for select using (
    exists (
      select 1 from public.pins
      where pins.id = pin_likes.pin_id
        and public.is_group_member(pins.group_id, auth.uid())
    )
  );

create policy "Group members can like pins"
  on public.pin_likes for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.pins
      where pins.id = pin_likes.pin_id
        and public.is_group_member(pins.group_id, auth.uid())
    )
  );

create policy "Users can remove their own like"
  on public.pin_likes for delete using (auth.uid() = user_id);

grant select, insert, delete on public.pin_likes to authenticated;

-- Enable realtime so likes show up live for all group members
alter publication supabase_realtime add table public.pin_likes;
