import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { createClient } from "@supabase/supabase-js";

const courierLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).nullable().optional(),
});

function getPublicServerClient() {
  const url = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Server configuration error: courier location client is not configured");

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const Route = createFileRoute("/api/courier/$courierCode/location")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = await request.json().catch(() => null);
        const parsed = courierLocationSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Localização inválida" }, { status: 400 });
        }

        const supabase = getPublicServerClient();
        const { data, error } = await supabase.rpc("update_courier_location", {
          _courier_code: params.courierCode,
          _lat: parsed.data.lat,
          _lng: parsed.data.lng,
          _heading: parsed.data.heading ?? undefined,
        });

        if (error || !data?.length) {
          return Response.json({ error: "Não foi possível atualizar a localização" }, { status: 400 });
        }

        return Response.json({ order: data[0] });
      },
    },
  },
});
