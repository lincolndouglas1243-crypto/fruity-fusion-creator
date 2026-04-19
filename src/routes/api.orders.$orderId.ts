import { createFileRoute } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";
import { createClient } from "@supabase/supabase-js";

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
        const supabase = getPublicServerClient();
        const lookup = params.orderId.trim();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lookup);

        const { data: order } = await supabase
          .from("orders")
          .select("id, tracking_code, user_id, status, total, created_at, courier_lat, courier_lng, courier_updated_at, estimated_minutes")
          .eq(isUuid ? "id" : "tracking_code", lookup)
          .maybeSingle();
        if (!order) return Response.json({ error: "Pedido não encontrado" }, { status: 404 });

        if (token) {
          const authedClient = getServerClient(token);
          const { data: userData } = await authedClient.auth.getUser(token);

          if (userData.user) {
            const { data: roleData } = await authedClient
              .from("user_roles")
              .select("role")
              .eq("user_id", userData.user.id)
              .eq("role", "admin")
              .maybeSingle();

            const isAdmin = Boolean(roleData?.role === "admin");
            if (!isAdmin && order.user_id && order.user_id !== userData.user.id) {
              return Response.json({ error: "Sem permissão" }, { status: 403 });
            }
          }
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
