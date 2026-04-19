ALTER TABLE public.orders
ALTER COLUMN courier_code SET DEFAULT CONCAT('CR-', UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 12)));