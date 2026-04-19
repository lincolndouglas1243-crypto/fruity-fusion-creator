import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/lib/admin-auth";

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
