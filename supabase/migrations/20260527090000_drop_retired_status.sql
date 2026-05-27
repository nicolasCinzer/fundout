-- Migration: 0003_drop_retired_status
-- Remove the 'retired' value from funded_account_status enum.
-- Reason: in practice, retired and breached behave identically from a tracking
-- standpoint — both mean the account is closed.
--
-- IMPORTANT: the check constraint `funded_accounts_closed_consistency`
-- references a status literal. That literal is bound to the enum type at
-- constraint creation time. If we rename the enum, the constraint still points
-- to the renamed (old) type. Then ALTER COLUMN TYPE to the new enum compares
-- new_enum = old_enum and fails with operator-does-not-exist.
--
-- Solution: drop the constraint, do the enum swap, then re-create the
-- constraint so its literals bind to the new type.

-- 1. Drop the check constraint that pins a literal to the enum type
alter table public.funded_accounts
  drop constraint funded_accounts_closed_consistency;

-- 2. Drop the column default temporarily (it also references the enum)
alter table public.funded_accounts alter column status drop default;

-- 3. Rename the old enum out of the way
alter type public.funded_account_status rename to funded_account_status_old;

-- 4. Create the new enum without 'retired'
create type public.funded_account_status as enum ('active', 'breached');

-- 5. Convert the column to the new type. The CASE handles any existing
--    'retired' rows by mapping them to 'breached' inline.
alter table public.funded_accounts
  alter column status type public.funded_account_status
  using (
    case status::text
      when 'retired' then 'breached'
      else status::text
    end
  )::public.funded_account_status;

-- 6. Restore the column default
alter table public.funded_accounts alter column status set default 'active';

-- 7. Re-create the check constraint (literals now bind to the new enum)
alter table public.funded_accounts add constraint funded_accounts_closed_consistency check (
  (status = 'active' and closed_at is null)
  or (status <> 'active' and closed_at is not null)
);

-- 8. Drop the now-orphan old enum
drop type public.funded_account_status_old;
