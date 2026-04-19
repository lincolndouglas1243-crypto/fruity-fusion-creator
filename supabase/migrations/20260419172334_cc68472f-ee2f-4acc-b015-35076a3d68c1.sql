CREATE POLICY "Public can create guest orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can create guest order items"
ON public.order_items
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
  )
);