ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS courier_lat double precision,
ADD COLUMN IF NOT EXISTS courier_lng double precision,
ADD COLUMN IF NOT EXISTS courier_heading double precision,
ADD COLUMN IF NOT EXISTS courier_updated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS estimated_minutes integer;