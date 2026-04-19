import { createFileRoute } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";
import { createClient } from "@supabase/supabase-js";

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
        if (!token) return Response.json({ error: "Não autorizado" }, { status: 401 });

        const supabase = getServerClient(token);
        const { data: userData } = await supabase.auth.getUser(token);
        if (!userData.user) return Response.json({ error: "Sessão inválida" }, { status: 401 });

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .eq("role", "admin")
          .maybeSingle();

        const { data: order } = await supabase.from("orders").select("*").eq("id", params.orderId).maybeSingle();
        if (!order) return Response.json({ error: "Pedido não encontrado" }, { status: 404 });

        const isAdmin = Boolean(roleData?.role === "admin");
        if (!isAdmin && order.user_id !== userData.user.id) {
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
