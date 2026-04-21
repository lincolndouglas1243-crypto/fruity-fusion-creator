import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const courierLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).nullable().optional(),
});

export const Route = createFileRoute("/api/courier/$courierCode/location")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = await request.json().catch(() => null);
        const parsed = courierLocationSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Localização inválida" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin.rpc("update_courier_location", {
          _courier_code: params.courierCode,
          _lat: parsed.data.lat,
          _lng: parsed.data.lng,
          _heading: parsed.data.heading ?? undefined,
        });

        if (error || !data?.length) {
          const reason = error?.message ?? "unknown";
          if (reason.includes("order_closed")) {
            return Response.json({ error: "Esse pedido já foi finalizado e não aceita mais localização." }, { status: 400 });
          }
          if (reason.includes("order_not_found")) {
            return Response.json({ error: "Código do motoboy inválido." }, { status: 404 });
          }
          if (reason.includes("invalid_latitude") || reason.includes("invalid_longitude")) {
            return Response.json({ error: "Coordenadas inválidas. Ative o GPS de alta precisão." }, { status: 400 });
          }
          return Response.json({ error: "Não foi possível atualizar a localização" }, { status: 400 });
        }

        return Response.json({ order: data[0] });
      },
    },
  },
});
