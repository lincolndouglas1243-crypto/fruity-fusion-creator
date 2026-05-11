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
          return Response.json({ error: "Localização inválida. Envie latitude entre -90 e 90, longitude entre -180 e 180 e direção entre 0 e 360." }, { status: 400 });
        }

        const nowIso = new Date().toISOString();
        const courierCode = params.courierCode.trim().toUpperCase();

        const { data: updatedRows, error: rpcError } = await supabaseAdmin.rpc("update_courier_location", {
          _courier_code: courierCode,
          _lat: parsed.data.lat,
          _lng: parsed.data.lng,
          _heading: parsed.data.heading ?? undefined,
        });

        if (rpcError) {
          if (rpcError.message.includes("invalid_latitude") || rpcError.message.includes("invalid_longitude") || rpcError.message.includes("invalid_heading")) {
            return Response.json({ error: "Coordenadas inválidas. Verifique o GPS e tente novamente." }, { status: 400 });
          }
          if (rpcError.message.includes("order_not_found") || rpcError.message.includes("invalid_courier_code")) {
            return Response.json({ error: "Código do motoboy inválido." }, { status: 404 });
          }
          if (rpcError.message.includes("order_closed")) {
            return Response.json({ error: "Esse pedido já foi finalizado e não aceita mais localização." }, { status: 400 });
          }
          return Response.json({ error: "Não foi possível atualizar a localização" }, { status: 400 });
        }

        const updated = updatedRows?.[0];
        if (!updated) return Response.json({ error: "Não foi possível atualizar a localização" }, { status: 400 });

        return Response.json({
          order: {
            ...updated,
            courier_updated_at: updated.courier_updated_at ?? nowIso,
          },
        });
      },
    },
  },
});
