-- Телефон покупателя для оперативной связи (покупка и бесплатная регистрация).
-- Выполнить один раз в Supabase SQL Editor.
alter table public.orders
  add column if not exists buyer_phone text null;
