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

export const Route = createFileRoute("/api/orders/mine")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = getBearerToken(request);
        if (!token) return Response.json({ error: "Não autorizado" }, { status: 401 });

        const supabaseAdmin = getAdminClient();
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        if (!userData.user) return Response.json({ error: "Sessão inválida" }, { status: 401 });

        const { data } = await supabaseAdmin
          .from("orders")
          .select("id, status, total, created_at")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        return Response.json({ orders: data ?? [] });
      },
    },
  },
});
