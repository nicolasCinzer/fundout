-- Migration: backtests + backtest_events
-- Append-only event log. user_id denormalized on events for fast RLS (no join).

create table public.backtests (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null check (char_length(name) between 1 and 80),
  bankroll_initial  numeric(12,2) not null check (bankroll_initial >= 0),
  eval_cost         numeric(12,2) not null check (eval_cost > 0),
  created_at        timestamptz not null default now()
);

create index backtests_user_id_idx
  on public.backtests (user_id);
create index backtests_user_created_at_idx
  on public.backtests (user_id, created_at desc);

create table public.backtest_events (
  id           uuid primary key default gen_random_uuid(),
  backtest_id  uuid not null references public.backtests(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  position     integer not null check (position > 0),
  type         text not null check (type in ('E','F','P')),
  amount       numeric(12,2) check (
                  (type = 'P' and amount is not null and amount > 0)
                  or (type in ('E','F') and amount is null)
                ),
  notes        text,
  created_at   timestamptz not null default now(),
  constraint backtest_events_position_unique unique (backtest_id, position)
);

create index backtest_events_backtest_position_idx
  on public.backtest_events (backtest_id, position);
create index backtest_events_user_id_idx
  on public.backtest_events (user_id);

-- RLS: backtests
alter table public.backtests enable row level security;

create policy "Read own backtests"
  on public.backtests for select
  using (user_id = (select auth.uid()));

create policy "Insert own backtests"
  on public.backtests for insert
  with check (user_id = (select auth.uid()));

create policy "Update own backtests"
  on public.backtests for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Delete own backtests"
  on public.backtests for delete
  using (user_id = (select auth.uid()));

-- RLS: backtest_events (uses denormalized user_id, no join)
alter table public.backtest_events enable row level security;

create policy "Read own backtest events"
  on public.backtest_events for select
  using (user_id = (select auth.uid()));

create policy "Insert own backtest events"
  on public.backtest_events for insert
  with check (user_id = (select auth.uid()));

create policy "Update own backtest events"
  on public.backtest_events for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Delete own backtest events"
  on public.backtest_events for delete
  using (user_id = (select auth.uid()));
