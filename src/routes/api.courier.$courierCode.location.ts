import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { createClient } from "@supabase/supabase-js";

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

        const nowIso = new Date().toISOString();
        const courierCode = params.courierCode.trim().toUpperCase();

        const url = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !serviceKey) {
          return Response.json({ error: "Configuração de backend incompleta para rastreio." }, { status: 500 });
        }

        const adminClient = createClient<Database>(url, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: updatedRows, error: rpcError } = await adminClient.rpc("update_courier_location", {
          _courier_code: courierCode,
          _lat: parsed.data.lat,
          _lng: parsed.data.lng,
          _heading: parsed.data.heading ?? undefined,
        });

        if (rpcError) {
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
