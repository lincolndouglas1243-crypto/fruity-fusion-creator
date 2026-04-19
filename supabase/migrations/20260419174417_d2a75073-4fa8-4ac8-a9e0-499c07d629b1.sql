ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS courier_code text;

UPDATE public.orders
SET courier_code = CONCAT('CR-', UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 12)))
WHERE courier_code IS NULL;

ALTER TABLE public.orders
ALTER COLUMN courier_code SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_courier_code_unique'
  ) THEN
    ALTER TABLE public.orders
    ADD CONSTRAINT orders_courier_code_unique UNIQUE (courier_code);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_courier_code ON public.orders(courier_code);

CREATE OR REPLACE FUNCTION public.update_courier_location(
  _courier_code text,
  _lat double precision,
  _lng double precision,
  _heading double precision DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  tracking_code text,
  courier_lat double precision,
  courier_lng double precision,
  courier_heading double precision,
  courier_updated_at timestamptz,
  status public.order_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order public.orders%ROWTYPE;
BEGIN
  IF _courier_code IS NULL OR length(trim(_courier_code)) < 6 THEN
    RAISE EXCEPTION 'invalid_courier_code';
  END IF;

  IF _lat IS NULL OR _lat < -90 OR _lat > 90 THEN
    RAISE EXCEPTION 'invalid_latitude';
  END IF;

  IF _lng IS NULL OR _lng < -180 OR _lng > 180 THEN
    RAISE EXCEPTION 'invalid_longitude';
  END IF;

  IF _heading IS NOT NULL AND (_heading < 0 OR _heading > 360) THEN
    RAISE EXCEPTION 'invalid_heading';
  END IF;

  SELECT * INTO _order
  FROM public.orders
  WHERE courier_code = trim(_courier_code)
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF _order.status IN ('cancelled', 'delivered') THEN
    RAISE EXCEPTION 'order_closed';
  END IF;

  UPDATE public.orders
  SET
    courier_lat = _lat,
    courier_lng = _lng,
    courier_heading = COALESCE(_heading, courier_heading),
    courier_updated_at = now(),
    status = CASE WHEN status = 'accepted' OR status = 'preparing' THEN 'on_the_way'::public.order_status ELSE status END,
    on_the_way_at = CASE WHEN on_the_way_at IS NULL THEN now() ELSE on_the_way_at END,
    updated_at = now()
  WHERE courier_code = trim(_courier_code)
  RETURNING
    orders.id,
    orders.tracking_code,
    orders.courier_lat,
    orders.courier_lng,
    orders.courier_heading,
    orders.courier_updated_at,
    orders.status
  INTO id, tracking_code, courier_lat, courier_lng, courier_heading, courier_updated_at, status;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.update_courier_location(text, double precision, double precision, double precision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_courier_location(text, double precision, double precision, double precision) TO anon, authenticated;