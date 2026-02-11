alter table public.orders
  add column if not exists ticket_redeemed_at timestamptz null,
  add column if not exists ticket_redeemed_by text null;

create index if not exists idx_orders_ticket_redeemed_at
  on public.orders (ticket_redeemed_at);
