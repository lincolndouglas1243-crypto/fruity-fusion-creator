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

export const Route = createFileRoute("/api/orders/mine")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = getBearerToken(request);
        if (!token) return Response.json({ error: "Não autorizado" }, { status: 401 });

        const supabase = getServerClient(token);
        const { data: userData } = await supabase.auth.getUser(token);
        if (!userData.user) return Response.json({ error: "Sessão inválida" }, { status: 401 });

        const { data } = await supabase
          .from("orders")
          .select("id, status, total, created_at, courier_lat, courier_lng, courier_heading, courier_updated_at, estimated_minutes")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        return Response.json({ orders: data ?? [] });
      },
    },
  },
});
