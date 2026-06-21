-- Store the per-event Google Sheet reference created on event creation.
-- Each schedule event (показ) gets its own spreadsheet so purchases are not
-- accumulated across past performances.

alter table public.schedule_events
  add column if not exists sheet_id text null;

alter table public.schedule_events
  add column if not exists sheet_url text null;
