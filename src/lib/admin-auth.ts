import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function getAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Server configuration error: admin client is not configured");
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.replace("Bearer ", "").trim();
}

export async function requireAdmin(request: Request) {
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