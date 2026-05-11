REVOKE EXECUTE ON FUNCTION public.update_courier_location(text, double precision, double precision, double precision) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_public_order_tracking_secure(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_public_order_tracking(text) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.update_courier_location(text, double precision, double precision, double precision) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_public_order_tracking_secure(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_public_order_tracking(text) TO service_role;