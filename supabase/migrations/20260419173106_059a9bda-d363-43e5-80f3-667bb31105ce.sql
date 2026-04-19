-- Orders: allow guest checkout and tracking code
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS tracking_code text;

UPDATE public.orders
SET tracking_code = CONCAT('AP-', UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 10)))
WHERE tracking_code IS NULL;

ALTER TABLE public.orders
ALTER COLUMN tracking_code SET NOT NULL;

ALTER TABLE public.orders
ADD CONSTRAINT orders_tracking_code_unique UNIQUE (tracking_code);

CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON public.orders(tracking_code);

-- Checkout error logs table
CREATE TABLE IF NOT EXISTS public.checkout_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route text NOT NULL DEFAULT '/api/orders',
  error_message text NOT NULL,
  error_context text,
  request_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checkout_error_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
CREATE POLICY "Users can create their own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = user_id) OR user_id IS NULL);

DROP POLICY IF EXISTS "Public can create guest orders" ON public.orders;
CREATE POLICY "Public can create guest orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (
  tracking_code IS NOT NULL
  AND length(trim(customer_name)) >= 2
  AND length(trim(customer_phone)) >= 8
  AND length(trim(delivery_address)) >= 8
  AND subtotal >= 0
  AND delivery_fee >= 0
  AND total >= 0
  AND (user_id IS NULL OR user_id = auth.uid())
);

DROP POLICY IF EXISTS "Public can view tracked orders" ON public.orders;
CREATE POLICY "Public can view tracked orders"
ON public.orders
FOR SELECT
TO public
USING (tracking_code IS NOT NULL);

DROP POLICY IF EXISTS "Public can view tracked order items" ON public.order_items;
CREATE POLICY "Public can view tracked order items"
ON public.order_items
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.tracking_code IS NOT NULL
  )
);

DROP POLICY IF EXISTS "Public can create checkout error logs" ON public.checkout_error_logs;
CREATE POLICY "Public can create checkout error logs"
ON public.checkout_error_logs
FOR INSERT
TO public
WITH CHECK (
  length(trim(error_message)) >= 3
  AND length(route) >= 1
);

DROP POLICY IF EXISTS "Admins can view checkout error logs" ON public.checkout_error_logs;
CREATE POLICY "Admins can view checkout error logs"
ON public.checkout_error_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete checkout error logs" ON public.checkout_error_logs;
CREATE POLICY "Admins can delete checkout error logs"
ON public.checkout_error_logs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));