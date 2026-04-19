import { createFileRoute } from "@tanstack/react-router";
import { updateOrderStatusSchema } from "@/lib/order-schemas";
import type { Database } from "@/integrations/supabase/types";
import { requireAdmin } from "@/lib/admin-auth";

export const Route = createFileRoute("/api/admin/orders/$orderId/status")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const auth = await requireAdmin(request);
        if ("error" in auth) return Response.json({ error: auth.error }, { status: auth.status });

        const body = await request.json();
        const parsed = updateOrderStatusSchema.safeParse(body);
        if (!parsed.success) return Response.json({ error: "Status inválido" }, { status: 400 });

        const updates: Database["public"]["Tables"]["orders"]["Update"] = {
          status: parsed.data.status,
        };

        if (parsed.data.courierLat !== undefined) updates.courier_lat = parsed.data.courierLat;
        if (parsed.data.courierLng !== undefined) updates.courier_lng = parsed.data.courierLng;
        if (parsed.data.courierHeading !== undefined) updates.courier_heading = parsed.data.courierHeading;
        if (parsed.data.estimatedMinutes !== undefined) updates.estimated_minutes = parsed.data.estimatedMinutes;
        if (
          parsed.data.courierLat !== undefined ||
          parsed.data.courierLng !== undefined ||
          parsed.data.courierHeading !== undefined ||
          parsed.data.estimatedMinutes !== undefined
        ) {
          updates.courier_updated_at = new Date().toISOString();
        }

        if (parsed.data.status === "accepted") updates.accepted_at = new Date().toISOString();
        if (parsed.data.status === "on_the_way") updates.on_the_way_at = new Date().toISOString();
        if (parsed.data.status === "delivered") updates.delivered_at = new Date().toISOString();

        const { data, error } = await auth.supabaseAdmin
          .from("orders")
          .update(updates)
          .eq("id", params.orderId)
          .select("*")
          .single();

        if (error || !data) return Response.json({ error: "Falha ao atualizar pedido" }, { status: 500 });

        return Response.json({ order: data });
      },
    },
  },
});
