create table if not exists public.schedule_events (
  id uuid primary key default gen_random_uuid(),
  show_slug text not null,
  event_id text not null,
  date_iso date not null,
  time text not null,
  place_ru text not null,
  place_en text not null,
  place_he text not null,
  waze_url text null,
  format_ru text not null,
  format_en text not null,
  format_he text not null,
  language_ru text not null,
  language_en text not null,
  language_he text not null,
  price_ils numeric(10,2) not null check (price_ils > 0),
  capacity integer null check (capacity is null or capacity > 0),
  ticket_mode text not null default 'self' check (ticket_mode in ('self', 'venue')),
  ticket_url text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (show_slug, event_id)
);

alter table public.schedule_events
  add column if not exists waze_url text null;

create index if not exists idx_schedule_events_show_active_date
  on public.schedule_events (show_slug, is_active, date_iso, time);

create or replace function public.set_schedule_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_schedule_events_updated_at on public.schedule_events;
create trigger trg_schedule_events_updated_at
before update on public.schedule_events
for each row
execute function public.set_schedule_events_updated_at();
