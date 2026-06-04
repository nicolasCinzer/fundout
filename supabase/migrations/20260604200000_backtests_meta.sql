-- Add optional metadata columns to `backtests`:
-- - asset    : free-text instrument(s) tested, e.g. "NQ", "ES", "EUR/USD"
-- - period   : free-text date range / timeframe label, e.g. "Q1 2024", "Jan–Mar 2025"
-- - strategy : short description of the strategy under test
--
-- All three are nullable and mutable post-creation (unlike bankroll_initial /
-- eval_cost which are immutable because they affect computed stats).

alter table public.backtests
  add column if not exists asset    text check (asset is null or char_length(asset) between 1 and 20),
  add column if not exists period   text check (period is null or char_length(period) between 1 and 60),
  add column if not exists strategy text check (strategy is null or char_length(strategy) between 1 and 500);
