-- Город показа: для разметки событий Google (addressLocality) и афиши на сайте.
-- Колонки необязательные: сайт и админка работают и без них, город просто не сохраняется.
alter table public.schedule_events
  add column if not exists city_ru text,
  add column if not exists city_en text,
  add column if not exists city_he text;
