DROP POLICY IF EXISTS "Public can view tracked orders" ON public.orders;

CREATE POLICY "Public can view tracked orders by tracking header"
ON public.orders
FOR SELECT
TO public
USING (
  tracking_code = (
    current_setting('request.headers', true)::json ->> 'x-tracking-code'
  )
);

DROP POLICY IF EXISTS "Public can view tracked order items" ON public.order_items;

CREATE POLICY "Public can view tracked order items by tracking header"
ON public.order_items
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.tracking_code = (current_setting('request.headers', true)::json ->> 'x-tracking-code')
  )
);

DROP POLICY IF EXISTS "Public can create checkout error logs" ON public.checkout_error_logs;

CREATE POLICY "Admins can create checkout error logs"
ON public.checkout_error_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
  END IF;
END
$$;