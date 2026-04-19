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
  return { supabaseAdmin, userId } as const;
}

export const Route = createFileRoute("/api/admin/dashboard")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdmin(request);
        if ("error" in auth) return Response.json({ error: auth.error }, { status: auth.status });

        const [{ data: products }, { data: promotions }, { data: orders }] = await Promise.all([
          auth.supabaseAdmin.from("products").select("*").order("display_order", { ascending: true }),
          auth.supabaseAdmin.from("promotions").select("*").order("created_at", { ascending: false }),
          auth.supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false }).limit(50),
        ]);

        return Response.json({ products: products ?? [], promotions: promotions ?? [], orders: orders ?? [] });
      },
    },
  },
});
