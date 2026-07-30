-- Migration: add lifecycle_id column to backtest_events
-- Change: backtest-multi-account
-- Satisfies: REQ-MA-DB-01..07, ADR-1

-- 1. Add the column (nullable — legacy rows will be backfilled below)
ALTER TABLE public.backtest_events
  ADD COLUMN IF NOT EXISTS lifecycle_id uuid;

-- 2. Index for per-lifecycle event fetching / grouping
CREATE INDEX IF NOT EXISTS backtest_events_lifecycle_idx
  ON public.backtest_events (backtest_id, lifecycle_id);

-- 3. Backfill: assign a stable lifecycle_id to every existing row using
--    the current positional grouping logic (mirrors group-lifecycles.ts).
--
--    Algorithm (set-based, idempotent):
--      CTE `numbered`: for each event, compute a running count of E events
--        seen so far within the same backtest_id (ordered by position).
--        This gives group ordinal grp = 0 for stray leading F/P,
--        and grp = 1, 2, 3... for each lifecycle started by an E.
--      CTE `ids`: one fresh uuid per (backtest_id, grp) pair where grp > 0.
--      UPDATE: join events back to get the assigned uuid.
--
--    Idempotent: WHERE lifecycle_id IS NULL guard throughout.
--    Stray leading F/P (grp=0) → lifecycle_id stays NULL (ignored by app).

WITH
  numbered AS (
    SELECT
      id,
      SUM(CASE WHEN type = 'E' THEN 1 ELSE 0 END)
        OVER (PARTITION BY backtest_id ORDER BY position
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS grp,
      backtest_id
    FROM public.backtest_events
    WHERE lifecycle_id IS NULL
  ),
  ids AS (
    SELECT DISTINCT
      backtest_id,
      grp,
      gen_random_uuid() AS lid
    FROM numbered
    WHERE grp > 0
  )
UPDATE public.backtest_events e
SET lifecycle_id = ids.lid
FROM numbered n
JOIN ids USING (backtest_id, grp)
WHERE e.id = n.id
  AND n.grp > 0
  AND e.lifecycle_id IS NULL;
