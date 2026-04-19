import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { updateOrderStatusSchema } from "@/lib/order-schemas";
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

async function requireAdmin(request: Request) {
  const token = getBearerToken(request);
  if (!token) return { error: "Não autorizado", status: 401 } as const;

  const supabaseAdmin = getAdminClient();
  const { data: userData } = await supabaseAdmin.auth.getUser(token);
  const userId = userData.user?.id;
  if (!userId) return { error: "Sessão inválida", status: 401 } as const;

  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) return { error: "Acesso restrito ao admin", status: 403 } as const;
  return { supabaseAdmin } as const;
}

export const Route = createFileRoute("/api/admin/orders/status")({
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
