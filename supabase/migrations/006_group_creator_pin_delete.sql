-- Allow group creators to remove any pin within their own group,
-- in addition to the existing "authors can delete their own pins" policy.
create policy "Group creators can delete any pin in their group"
  on pins for delete using (
    exists (
      select 1 from public.groups
      where groups.id = pins.group_id and groups.created_by = auth.uid()
    )
  );
