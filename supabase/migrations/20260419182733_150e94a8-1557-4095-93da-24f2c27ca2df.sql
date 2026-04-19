DROP POLICY IF EXISTS "Public can create guest order items" ON public.order_items;

CREATE POLICY "Public can create guest order items"
ON public.order_items
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.tracking_code = (current_setting('request.headers', true)::json ->> 'x-tracking-code')
  )
);