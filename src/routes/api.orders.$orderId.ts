import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server env not configured");
  return createClient<Database>(url, key, {
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
        if (!token) return Response.json({ error: "Não autorizado" }, { status: 401 });

        const supabaseAdmin = getAdminClient();
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        if (!userData.user) return Response.json({ error: "Sessão inválida" }, { status: 401 });

        const { data: roleData } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .eq("role", "admin")
          .maybeSingle();

        const { data: order } = await supabaseAdmin.from("orders").select("*").eq("id", params.orderId).maybeSingle();
        if (!order) return Response.json({ error: "Pedido não encontrado" }, { status: 404 });

        const isAdmin = Boolean(roleData?.role === "admin");
        if (!isAdmin && order.user_id !== userData.user.id) {
          return Response.json({ error: "Sem permissão" }, { status: 403 });
        }

        const { data: items } = await supabaseAdmin
          .from("order_items")
          .select("id, product_name, quantity, selected_size, selected_toppings, line_total")
          .eq("order_id", order.id)
          .order("created_at", { ascending: true });

        return Response.json({ order, items: items ?? [] });
      },
    },
  },
});
