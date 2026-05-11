import { createFileRoute } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function getPublicServerClient() {
  const url = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Server configuration error: orders client is not configured");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getServerClient(token: string) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Server configuration error: orders client is not configured");
  return createClient<Database>(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.replace("Bearer ", "").trim();
}

export const Route = createFileRoute("/api/orders/$orderId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const token = getBearerToken(request);
        const trackingToken = request.headers.get("x-tracking-token")?.trim() ?? "";
        const lookup = params.orderId.trim();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lookup);
        let supabase = getPublicServerClient();
        let userId: string | null = null;
        let isAdmin = false;

        if (!token && isUuid) {
          return Response.json({ error: "Use o código de rastreio para acompanhar como visitante" }, { status: 400 });
        }

        if (token) {
          const authedClient = getServerClient(token);
          const { data: userData } = await authedClient.auth.getUser(token);
          if (!userData.user) return Response.json({ error: "Sessão inválida" }, { status: 401 });

          userId = userData.user.id;
          const { data: roleData } = await authedClient
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .eq("role", "admin")
            .maybeSingle();

          isAdmin = Boolean(roleData?.role === "admin");
          supabase = authedClient;
        }

        if (!token) {
          if (!trackingToken || trackingToken.length < 16) {
            return Response.json({ error: "Link de rastreio inválido ou expirado." }, { status: 401 });
          }

          const { data: trackedRows, error: trackingError } = await supabaseAdmin.rpc("get_public_order_tracking_secure", {
            _tracking_code: lookup,
            _tracking_token: trackingToken,
          });

          if (trackingError) {
            return Response.json({ error: "Não foi possível carregar rastreio" }, { status: 400 });
          }

          const trackedOrder = trackedRows?.[0];
          if (!trackedOrder) return Response.json({ error: "Pedido não encontrado" }, { status: 404 });

          return Response.json({
            order: {
              id: trackedOrder.id,
              tracking_code: trackedOrder.tracking_code,
              status: trackedOrder.status,
              total: trackedOrder.total,
              created_at: trackedOrder.created_at,
              courier_lat: trackedOrder.courier_lat,
              courier_lng: trackedOrder.courier_lng,
              courier_heading: trackedOrder.courier_heading,
              courier_updated_at: trackedOrder.courier_updated_at,
              estimated_minutes: trackedOrder.estimated_minutes,
            },
            items: Array.isArray(trackedOrder.items) ? trackedOrder.items : [],
          });
        }

        const { data: order } = await supabase
          .from("orders")
          .select("id, tracking_code, user_id, status, total, created_at, courier_lat, courier_lng, courier_heading, courier_updated_at, estimated_minutes")
          .eq(isUuid ? "id" : "tracking_code", lookup)
          .maybeSingle();

        if (!order) return Response.json({ error: "Pedido não encontrado" }, { status: 404 });
        if (!isAdmin && order.user_id !== userId) return Response.json({ error: "Sem permissão" }, { status: 403 });

        const { data: items } = await supabase
          .from("order_items")
          .select("id, product_name, quantity, selected_size, selected_toppings, line_total")
          .eq("order_id", order.id)
          .order("created_at", { ascending: true });

        return Response.json({
          order: {
            id: order.id,
            tracking_code: order.tracking_code,
            status: order.status,
            total: order.total,
            created_at: order.created_at,
            courier_lat: order.courier_lat,
            courier_lng: order.courier_lng,
            courier_heading: order.courier_heading,
            courier_updated_at: order.courier_updated_at,
            estimated_minutes: order.estimated_minutes,
          },
          items: items ?? [],
        });
      },
    },
  },
});
