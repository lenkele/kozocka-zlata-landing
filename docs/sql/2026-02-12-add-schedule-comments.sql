alter table public.schedule_events
  add column if not exists comment_ru text,
  add column if not exists comment_en text,
  add column if not exists comment_he text;
