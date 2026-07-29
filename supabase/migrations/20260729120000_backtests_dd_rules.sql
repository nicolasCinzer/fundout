-- Add trailing-drawdown rule columns to `backtests`.
-- All columns are nullable (NULL = no live tracking for this backtest).
-- RLS unchanged — columns inherit existing backtests table policies.
-- Immutability is enforced at the application layer (mirrors bankroll_initial /
-- eval_cost guard) — no DB-level trigger or generated column is added.
--
-- CORE set (all-or-nothing at the app layer):
--   dd_starting_balance, dd_amount, dd_type, eval_profit_target
-- Optional add-ons (independently nullable even when CORE is set):
--   eval_consistency_pct, funded_consistency_pct
--   eval_min_profit_days + eval_min_profit_amount   (paired, eval phase)
--   funded_min_profit_days + funded_min_profit_amount (paired, funded phase)
--
-- Pairing rule (enforced at app layer):
--   min_profit_days set ⇔ min_profit_amount set (per phase)
--
-- Satisfies: REQ-DB-01, REQ-DB-02, REQ-DB-03, REQ-RLS-01

alter table public.backtests
  -- CORE (all-or-nothing enforced at app layer)
  add column if not exists dd_starting_balance   numeric(12,2)
    check (dd_starting_balance   is null or dd_starting_balance   > 0),
  add column if not exists dd_amount             numeric(12,2)
    check (dd_amount             is null or dd_amount             > 0),
  add column if not exists dd_type               text
    check (dd_type in ('EOD', 'Intraday')),
  add column if not exists eval_profit_target    numeric(12,2)
    check (eval_profit_target    is null or eval_profit_target    > 0),
  -- Optional add-ons
  add column if not exists eval_consistency_pct  numeric(5,4)
    check (eval_consistency_pct  is null or (eval_consistency_pct  > 0 and eval_consistency_pct  <= 1)),
  add column if not exists eval_min_profit_days    integer
    check (eval_min_profit_days    is null or eval_min_profit_days    > 0),
  add column if not exists eval_min_profit_amount  numeric(12,2)
    check (eval_min_profit_amount  is null or eval_min_profit_amount  > 0),
  add column if not exists funded_consistency_pct numeric(5,4)
    check (funded_consistency_pct is null or (funded_consistency_pct > 0 and funded_consistency_pct <= 1)),
  add column if not exists funded_min_profit_days   integer
    check (funded_min_profit_days   is null or funded_min_profit_days   > 0),
  add column if not exists funded_min_profit_amount numeric(12,2)
    check (funded_min_profit_amount is null or funded_min_profit_amount > 0);
