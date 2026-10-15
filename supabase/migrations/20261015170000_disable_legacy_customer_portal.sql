-- Customer access now uses Supabase Auth. Keep the implementation for
-- migration history, but remove direct browser access to the legacy RPC.
revoke execute on function public.get_customer_orders(text, text) from anon, authenticated;
