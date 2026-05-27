-- Migration: 0002_seed_propfirms
-- Seed common propfirms as globals (created_by = NULL). Visible to all users.
-- Safe to re-run thanks to ON CONFLICT.

insert into public.propfirms (name, slug, website, created_by) values
  ('FTMO',                 'ftmo',                 'https://ftmo.com',                 null),
  ('MyForexFunds',         'myforexfunds',         'https://myforexfunds.com',         null),
  ('The5ers',              'the5ers',              'https://the5ers.com',              null),
  ('FundedNext',           'fundednext',           'https://fundednext.com',           null),
  ('E8 Markets',           'e8-markets',           'https://e8markets.com',            null),
  ('FTUK',                 'ftuk',                 'https://ftuk.com',                 null),
  ('Topstep',              'topstep',              'https://topstep.com',              null),
  ('Apex Trader Funding',  'apex-trader-funding',  'https://apextraderfunding.com',    null),
  ('My Funded Futures',    'my-funded-futures',    'https://myfundedfutures.com',      null),
  ('FundingPips',          'fundingpips',          'https://fundingpips.com',          null),
  ('Goat Funded Trader',   'goat-funded-trader',   'https://goatfundedtrader.com',     null),
  ('Alpha Capital Group',  'alpha-capital-group',  'https://alphacapitalgroup.uk',     null)
on conflict do nothing;
