CREATE OR REPLACE FUNCTION public.get_public_order_tracking(_tracking_code text)
RETURNS TABLE (
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
SET search_path TO 'public'
AS $$
DECLARE
  _code text;
BEGIN
  _code := upper(trim(coalesce(_tracking_code, '')));

  IF _code = '' OR _code !~ '^AP-[A-Z0-9]{10}$' THEN
    RETURN;
  END IF;

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
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_order_tracking(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_order_tracking(text) TO anon, authenticated;

DROP POLICY IF EXISTS "Authenticated users can create own orders" ON public.orders;
CREATE POLICY "Authenticated users can create own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);