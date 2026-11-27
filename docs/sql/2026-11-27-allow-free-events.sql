-- Разрешить цену 0 для бесплатных показов / добровольного доната.
-- Выполнить один раз в Supabase SQL Editor.
alter table public.schedule_events
  drop constraint if exists schedule_events_price_ils_check;

alter table public.schedule_events
  add constraint schedule_events_price_ils_check
  check (price_ils is null or price_ils >= 0);
