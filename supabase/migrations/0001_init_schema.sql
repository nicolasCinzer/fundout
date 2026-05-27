-- Migration: 0001_init_schema
-- Tables: propfirms, evaluations, funded_accounts, payouts
-- All tables RLS-enabled and scoped to auth.uid().

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists "pgcrypto";

-- ============================================================================
-- Enums
-- ============================================================================
create type public.evaluation_status as enum (
  'in_progress',
  'passed',
  'failed',
  'refunded'
);

create type public.funded_account_status as enum (
  'active',
  'breached',
  'retired'
);

-- ============================================================================
-- Helper: updated_at trigger
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- Table: propfirms
-- ----------------------------------------------------------------------------
-- Catalog of propfirms. Global rows have created_by = NULL (seeded).
-- Users can create their own custom propfirms scoped to themselves.
-- ============================================================================
create table public.propfirms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(name) between 1 and 80),
  slug        text not null check (slug ~ '^[a-z0-9-]+$'),
  website     text,
  created_by  uuid references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Slug uniqueness: globals share a namespace, each user has their own namespace.
create unique index propfirms_global_slug_uq
  on public.propfirms (slug)
  where created_by is null;

create unique index propfirms_user_slug_uq
  on public.propfirms (created_by, slug)
  where created_by is not null;

create index propfirms_created_by_idx on public.propfirms (created_by);

create trigger propfirms_set_updated_at
  before update on public.propfirms
  for each row execute function public.set_updated_at();

alter table public.propfirms enable row level security;

create policy "Read global or own propfirms"
  on public.propfirms for select
  using (created_by is null or created_by = (select auth.uid()));

create policy "Insert own propfirms"
  on public.propfirms for insert
  with check (created_by = (select auth.uid()));

create policy "Update own propfirms"
  on public.propfirms for update
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

create policy "Delete own propfirms"
  on public.propfirms for delete
  using (created_by = (select auth.uid()));

-- ============================================================================
-- Table: evaluations
-- ----------------------------------------------------------------------------
-- A purchased evaluation/challenge. closed_at must accompany a closed status.
-- ============================================================================
create table public.evaluations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  propfirm_id   uuid not null references public.propfirms(id) on delete restrict,
  account_size  numeric(12,2) not null check (account_size > 0),
  fee_paid      numeric(12,2) not null check (fee_paid >= 0),
  purchase_date date not null,
  status        public.evaluation_status not null default 'in_progress',
  closed_at     date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint evaluations_closed_consistency check (
    (status = 'in_progress' and closed_at is null)
    or (status <> 'in_progress' and closed_at is not null)
  ),
  constraint evaluations_closed_after_purchase check (
    closed_at is null or closed_at >= purchase_date
  )
);

create index evaluations_user_id_idx          on public.evaluations (user_id);
create index evaluations_user_status_idx      on public.evaluations (user_id, status);
create index evaluations_user_purchase_at_idx on public.evaluations (user_id, purchase_date desc);
create index evaluations_propfirm_idx         on public.evaluations (propfirm_id);

create trigger evaluations_set_updated_at
  before update on public.evaluations
  for each row execute function public.set_updated_at();

alter table public.evaluations enable row level security;

create policy "Read own evaluations"
  on public.evaluations for select
  using (user_id = (select auth.uid()));

create policy "Insert own evaluations"
  on public.evaluations for insert
  with check (user_id = (select auth.uid()));

create policy "Update own evaluations"
  on public.evaluations for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Delete own evaluations"
  on public.evaluations for delete
  using (user_id = (select auth.uid()));

-- ============================================================================
-- Table: funded_accounts
-- ----------------------------------------------------------------------------
-- Created when an evaluation passes. 1:1 with evaluation (enforced by UNIQUE).
-- ============================================================================
create table public.funded_accounts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  evaluation_id  uuid not null unique references public.evaluations(id) on delete cascade,
  start_date     date not null,
  status         public.funded_account_status not null default 'active',
  closed_at      date,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint funded_accounts_closed_consistency check (
    (status = 'active' and closed_at is null)
    or (status <> 'active' and closed_at is not null)
  ),
  constraint funded_accounts_closed_after_start check (
    closed_at is null or closed_at >= start_date
  )
);

create index funded_accounts_user_id_idx     on public.funded_accounts (user_id);
create index funded_accounts_user_status_idx on public.funded_accounts (user_id, status);

create trigger funded_accounts_set_updated_at
  before update on public.funded_accounts
  for each row execute function public.set_updated_at();

alter table public.funded_accounts enable row level security;

create policy "Read own funded accounts"
  on public.funded_accounts for select
  using (user_id = (select auth.uid()));

create policy "Insert own funded accounts"
  on public.funded_accounts for insert
  with check (user_id = (select auth.uid()));

create policy "Update own funded accounts"
  on public.funded_accounts for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Delete own funded accounts"
  on public.funded_accounts for delete
  using (user_id = (select auth.uid()));

-- ============================================================================
-- Table: payouts
-- ----------------------------------------------------------------------------
-- Withdrawals from a funded account. amount = gross. fee_taken = optional fee.
-- Net per payout = amount - fee_taken.
-- ============================================================================
create table public.payouts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  funded_account_id  uuid not null references public.funded_accounts(id) on delete cascade,
  amount             numeric(12,2) not null check (amount >= 0),
  fee_taken          numeric(12,2) not null default 0 check (fee_taken >= 0),
  paid_at            date not null,
  notes              text,
  created_at         timestamptz not null default now(),

  constraint payouts_fee_not_exceed_amount check (fee_taken <= amount)
);

create index payouts_user_id_idx           on public.payouts (user_id);
create index payouts_user_paid_at_idx      on public.payouts (user_id, paid_at desc);
create index payouts_funded_account_idx    on public.payouts (funded_account_id);

alter table public.payouts enable row level security;

create policy "Read own payouts"
  on public.payouts for select
  using (user_id = (select auth.uid()));

create policy "Insert own payouts"
  on public.payouts for insert
  with check (user_id = (select auth.uid()));

create policy "Update own payouts"
  on public.payouts for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Delete own payouts"
  on public.payouts for delete
  using (user_id = (select auth.uid()));
