CREATE OR REPLACE FUNCTION public.update_courier_location(
  _courier_code text,
  _lat double precision,
  _lng double precision,
  _heading double precision DEFAULT NULL::double precision
)
RETURNS TABLE(
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
SET search_path TO 'public'
AS $function$
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

  RETURN QUERY
  UPDATE public.orders AS o
  SET
    courier_lat = _lat,
    courier_lng = _lng,
    courier_heading = COALESCE(_heading, o.courier_heading),
    courier_updated_at = now(),
    status = CASE WHEN o.status IN ('accepted', 'preparing') THEN 'on_the_way'::public.order_status ELSE o.status END,
    on_the_way_at = CASE WHEN o.on_the_way_at IS NULL THEN now() ELSE o.on_the_way_at END,
    updated_at = now()
  WHERE o.courier_code = trim(_courier_code)
    AND o.status NOT IN ('cancelled', 'delivered')
  RETURNING
    o.id,
    o.tracking_code,
    o.courier_lat,
    o.courier_lng,
    o.courier_heading,
    o.courier_updated_at,
    o.status;

  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM public.orders x WHERE x.courier_code = trim(_courier_code)) THEN
      RAISE EXCEPTION 'order_closed';
    END IF;
    RAISE EXCEPTION 'order_not_found';
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.update_courier_location(text, double precision, double precision, double precision) TO anon, authenticated;