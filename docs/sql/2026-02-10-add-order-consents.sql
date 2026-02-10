alter table public.orders
  add column if not exists consent_terms_accepted boolean not null default false,
  add column if not exists consent_marketing_accepted boolean not null default false;

