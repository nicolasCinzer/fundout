-- Migration: 0004_evaluation_resets
-- Two related changes:
-- (1) Drop 'refunded' from evaluation_status enum. The original wording was
--     a misnomer — what users actually meant was "reset", which is an event
--     that costs money but doesn't end the evaluation.
-- (2) Introduce evaluation_resets to track those events. Resets accumulate
--     into the total fee for that evaluation but do NOT change its status.
--     After one or more resets, the evaluation can still be marked funded
--     or failed.

-- ============================================================================
-- Part 1: drop 'refunded' from evaluation_status
-- ============================================================================

-- Drop the check constraint that pins literals to the enum type
alter table public.evaluations drop constraint evaluations_closed_consistency;

-- Drop the column default temporarily
alter table public.evaluations alter column status drop default;

-- Rename the old enum out of the way
alter type public.evaluation_status rename to evaluation_status_old;

-- Create the new enum without 'refunded'
create type public.evaluation_status as enum ('in_progress', 'passed', 'failed');

-- Convert the column. Any 'refunded' rows get mapped to 'failed' (most
-- conservative — preserves the fact that the evaluation didn't pass).
alter table public.evaluations
  alter column status type public.evaluation_status
  using (
    case status::text
      when 'refunded' then 'failed'
      else status::text
    end
  )::public.evaluation_status;

-- Restore the column default
alter table public.evaluations alter column status set default 'in_progress';

-- Re-create the check constraint (literals now bind to the new enum)
alter table public.evaluations add constraint evaluations_closed_consistency check (
  (status = 'in_progress' and closed_at is null)
  or (status <> 'in_progress' and closed_at is not null)
);

-- Drop the orphan old enum
drop type public.evaluation_status_old;

-- ============================================================================
-- Part 2: evaluation_resets table
-- ============================================================================

create table public.evaluation_resets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  fee           numeric(12,2) not null check (fee > 0),
  reset_at      date not null,
  notes         text,
  created_at    timestamptz not null default now()
);

create index evaluation_resets_user_id_idx
  on public.evaluation_resets (user_id);
create index evaluation_resets_evaluation_id_idx
  on public.evaluation_resets (evaluation_id);
create index evaluation_resets_user_reset_at_idx
  on public.evaluation_resets (user_id, reset_at desc);

alter table public.evaluation_resets enable row level security;

create policy "Read own evaluation resets"
  on public.evaluation_resets for select
  using (user_id = (select auth.uid()));

create policy "Insert own evaluation resets"
  on public.evaluation_resets for insert
  with check (user_id = (select auth.uid()));

create policy "Update own evaluation resets"
  on public.evaluation_resets for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Delete own evaluation resets"
  on public.evaluation_resets for delete
  using (user_id = (select auth.uid()));
