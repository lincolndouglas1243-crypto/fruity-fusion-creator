CREATE OR REPLACE FUNCTION public.get_public_order_tracking_secure(_tracking_code text, _tracking_token text)
RETURNS TABLE(
  id uuid,
  tracking_code text,
  status public.order_status,
  total numeric,
  created_at timestamptz,
  courier_lat double precision,
  courier_lng double precision,
  courier_heading double precision,
  courier_updated_at timestamptz,
  estimated_minutes integer,
  items jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code text;
  _token text;
  _token_hash text;
BEGIN
  _code := upper(trim(coalesce(_tracking_code, '')));
  _token := trim(coalesce(_tracking_token, ''));

  IF _code = '' OR _code !~ '^AP-[A-Z0-9]{10}$' THEN
    RETURN;
  END IF;

  IF _token = '' OR length(_token) < 16 THEN
    RETURN;
  END IF;

  _token_hash := encode(digest(convert_to(_token, 'UTF8'), 'sha256'), 'hex');

  RETURN QUERY
  SELECT
    o.id,
    o.tracking_code,
    o.status,
    o.total,
    o.created_at,
    o.courier_lat,
    o.courier_lng,
    o.courier_heading,
    o.courier_updated_at,
    o.estimated_minutes,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'selected_size', oi.selected_size,
            'selected_toppings', oi.selected_toppings,
            'line_total', oi.line_total
          )
          ORDER BY oi.created_at ASC
        )
        FROM public.order_items oi
        WHERE oi.order_id = o.id
      ),
      '[]'::jsonb
    ) AS items
  FROM public.orders o
  WHERE o.tracking_code = _code
    AND o.tracking_token_hash = _token_hash
  LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_order_tracking_secure(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_public_order_tracking_secure(text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_order_tracking_secure(text, text) TO service_role;