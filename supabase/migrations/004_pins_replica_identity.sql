-- Without REPLICA IDENTITY FULL, Postgres only includes the primary key in
-- DELETE change events. The Realtime subscription filter (group_id=eq.X)
-- requires all columns to be present, so DELETE events are never delivered.
-- This enables full row logging so deletes propagate to all group members.

ALTER TABLE public.pins REPLICA IDENTITY FULL;
