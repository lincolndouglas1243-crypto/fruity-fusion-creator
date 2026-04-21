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

        const nowIso = new Date().toISOString();
        const courierCode = params.courierCode.trim().toUpperCase();

        const { data: currentOrder, error: lookupError } = await supabaseAdmin
          .from("orders")
          .select("id, tracking_code, status")
          .eq("courier_code", courierCode)
          .maybeSingle();

        if (lookupError) {
          return Response.json({ error: "Não foi possível validar o pedido do motoboy." }, { status: 500 });
        }

        if (!currentOrder) {
          return Response.json({ error: "Código do motoboy inválido." }, { status: 404 });
        }

        if (currentOrder.status === "cancelled" || currentOrder.status === "delivered") {
          return Response.json({ error: "Esse pedido já foi finalizado e não aceita mais localização." }, { status: 400 });
        }

        const nextStatus = currentOrder.status === "accepted" || currentOrder.status === "preparing" ? "on_the_way" : currentOrder.status;
        const updatePayload: Database["public"]["Tables"]["orders"]["Update"] = {
          courier_lat: parsed.data.lat,
          courier_lng: parsed.data.lng,
          courier_heading: parsed.data.heading ?? null,
          courier_updated_at: nowIso,
          updated_at: nowIso,
          status: nextStatus,
        };

        if (nextStatus === "on_the_way") {
          updatePayload.on_the_way_at = nowIso;
        }

        const { data: updated, error: updateError } = await supabaseAdmin
          .from("orders")
          .update(updatePayload)
          .eq("id", currentOrder.id)
          .select("id, tracking_code, courier_lat, courier_lng, courier_heading, courier_updated_at, status")
          .single();

        if (updateError || !updated) {
          return Response.json({ error: "Não foi possível atualizar a localização" }, { status: 400 });
        }

        return Response.json({ order: updated });
      },
    },
  },
});
