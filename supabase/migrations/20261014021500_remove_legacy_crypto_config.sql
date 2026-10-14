-- NOWPayments credentials live in the server-only table. Remove the legacy
-- browser-readable wallet settings so stale demo data cannot be reused.
update public.integration_settings
set data = data
  - 'cryptoUsdtWallet'
  - 'cryptoNetwork'
  - 'cryptoEnabled'
where id = 1;
