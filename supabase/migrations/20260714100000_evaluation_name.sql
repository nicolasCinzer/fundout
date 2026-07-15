-- Migration: evaluation name / account label
-- Adds an optional free-text name to evaluations. Users are encouraged to
-- store the propfirm's account ID here so they can trace what happens to each
-- specific account. Nullable and additive — safe to apply on a live table.

alter table public.evaluations
  add column name text;

-- Bound the length to match the app's input cap (100 chars).
alter table public.evaluations
  add constraint evaluations_name_length
  check (name is null or char_length(name) <= 100);
