import { createFileRoute } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";
import { createClient } from "@supabase/supabase-js";

function getPublicServerClient(trackingCode?: string) {
  const url = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Server configuration error: orders client is not configured");
  return createClient<Database>(url, key, {
    global: trackingCode
      ? {
          headers: {
            "x-tracking-code": trackingCode,
          },
        }
      : undefined,
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
        const lookup = params.orderId.trim();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lookup);
        let supabase = getPublicServerClient(token ? undefined : lookup);
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

        const { data: order } = await supabase
          .from("orders")
          .select("id, tracking_code, user_id, status, total, created_at, courier_lat, courier_lng, courier_heading, courier_updated_at, estimated_minutes")
          .eq(isUuid ? "id" : "tracking_code", lookup)
          .maybeSingle();
        if (!order) return Response.json({ error: "Pedido não encontrado" }, { status: 404 });

        if (token && !isAdmin && order.user_id && order.user_id !== userId) {
          return Response.json({ error: "Sem permissão" }, { status: 403 });
        }

        const { data: items } = await supabase
          .from("order_items")
          .select("id, product_name, quantity, selected_size, selected_toppings, line_total")
          .eq("order_id", order.id)
          .order("created_at", { ascending: true });

        return Response.json({ order, items: items ?? [] });
      },
    },
  },
});
