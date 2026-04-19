DROP POLICY IF EXISTS "Public can create guest orders" ON public.orders;

CREATE POLICY "Public can create guest orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (
  user_id IS NOT NULL
  AND length(trim(customer_name)) >= 2
  AND length(trim(customer_phone)) >= 8
  AND length(trim(delivery_address)) >= 8
  AND subtotal >= 0
  AND delivery_fee >= 0
  AND total >= 0
);