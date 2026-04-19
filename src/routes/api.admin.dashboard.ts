import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

export const Route = createFileRoute("/api/admin/dashboard")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdmin(request);
        if ("error" in auth) return Response.json({ error: auth.error }, { status: auth.status });

        const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
        const logClient = createClient<any>(
          process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL,
          process.env.SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          {
            global: token
              ? {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              : undefined,
            auth: { persistSession: false, autoRefreshToken: false },
          },
        );

        const [{ data: products }, { data: promotions }, { data: orders }, { data: checkoutErrorLogs }] = await Promise.all([
          auth.supabaseAdmin.from("products").select("*").order("display_order", { ascending: true }),
          auth.supabaseAdmin.from("promotions").select("*").order("created_at", { ascending: false }),
          auth.supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false }).limit(50),
          logClient
            .from("checkout_error_logs")
            .select("id, route, error_message, error_context, created_at")
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

        return Response.json({
          products: products ?? [],
          promotions: promotions ?? [],
          orders: orders ?? [],
          checkoutErrorLogs: checkoutErrorLogs ?? [],
        });
      },
    },
  },
});
