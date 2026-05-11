ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_token_hash text;

UPDATE public.orders
SET tracking_token_hash = encode(digest(gen_random_uuid()::text, 'sha256'), 'hex')
WHERE tracking_token_hash IS NULL;

ALTER TABLE public.orders
  ALTER COLUMN tracking_token_hash SET NOT NULL;

REVOKE EXECUTE ON FUNCTION public.get_public_order_tracking(text) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_order_tracking_secure(_tracking_code text, _tracking_token text)
RETURNS TABLE(
  id uuid,
  tracking_code text,
  status public.order_status,
  total numeric,
  created_at timestamp with time zone,
  courier_lat double precision,
  courier_lng double precision,
  courier_heading double precision,
  courier_updated_at timestamp with time zone,
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

  _token_hash := encode(digest(_token, 'sha256'), 'hex');

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

GRANT EXECUTE ON FUNCTION public.get_public_order_tracking_secure(text, text) TO anon, authenticated;

REVOKE ALL ON TABLE public.orders FROM anon;
REVOKE ALL ON TABLE public.order_items FROM anon;

CREATE TABLE IF NOT EXISTS public.feedback_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  rating integer NOT NULL,
  comment text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'feedback_entries'
      AND policyname = 'Public can send feedback entries'
  ) THEN
    CREATE POLICY "Public can send feedback entries"
      ON public.feedback_entries
      FOR INSERT
      TO public
      WITH CHECK (
        char_length(customer_name) BETWEEN 2 AND 80
        AND rating BETWEEN 1 AND 5
        AND char_length(comment) BETWEEN 5 AND 400
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'feedback_entries'
      AND policyname = 'Public can view approved feedback entries'
  ) THEN
    CREATE POLICY "Public can view approved feedback entries"
      ON public.feedback_entries
      FOR SELECT
      TO public
      USING (approved = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'feedback_entries'
      AND policyname = 'Admins can manage feedback entries'
  ) THEN
    CREATE POLICY "Admins can manage feedback entries"
      ON public.feedback_entries
      FOR ALL
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;