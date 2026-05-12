REVOKE EXECUTE ON FUNCTION public.get_public_order_tracking_secure(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_order_tracking_secure(text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_profile() TO service_role;