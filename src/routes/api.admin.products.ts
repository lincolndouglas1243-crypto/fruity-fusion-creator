import { createFileRoute } from "@tanstack/react-router";
import { productSchema } from "@/lib/order-schemas";
import { requireAdmin } from "@/lib/admin-auth";

export const Route = createFileRoute("/api/admin/products")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdmin(request);
        if ("error" in auth) return Response.json({ error: auth.error }, { status: auth.status });

        const { data } = await auth.supabaseAdmin.from("products").select("*").order("display_order", { ascending: true });
        return Response.json({ products: data ?? [] });
      },
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if ("error" in auth) return Response.json({ error: auth.error }, { status: auth.status });

        const body = await request.json();
        const parsed = productSchema.omit({ id: true }).safeParse(body);
        if (!parsed.success) return Response.json({ error: "Produto inválido" }, { status: 400 });

        const { data, error } = await auth.supabaseAdmin
          .from("products")
          .insert({
            name: parsed.data.name,
            description: parsed.data.description ?? null,
            image_url: parsed.data.imageUrl ?? null,
            price: parsed.data.price,
            is_featured: parsed.data.isFeatured,
            is_offer_day: parsed.data.isOfferDay,
            offer_price: parsed.data.offerPrice ?? null,
            is_active: parsed.data.isActive,
            display_order: parsed.data.displayOrder,
          })
          .select("*")
          .single();

        if (error || !data) return Response.json({ error: "Falha ao criar produto" }, { status: 500 });
        return Response.json({ product: data });
      },
      PUT: async ({ request }) => {
        const auth = await requireAdmin(request);
        if ("error" in auth) return Response.json({ error: auth.error }, { status: auth.status });

        const body = await request.json();
        const parsed = productSchema.safeParse(body);
        if (!parsed.success || !parsed.data.id) return Response.json({ error: "Produto inválido" }, { status: 400 });

        const { data, error } = await auth.supabaseAdmin
          .from("products")
          .update({
            name: parsed.data.name,
            description: parsed.data.description ?? null,
            image_url: parsed.data.imageUrl ?? null,
            price: parsed.data.price,
            is_featured: parsed.data.isFeatured,
            is_offer_day: parsed.data.isOfferDay,
            offer_price: parsed.data.offerPrice ?? null,
            is_active: parsed.data.isActive,
            display_order: parsed.data.displayOrder,
          })
          .eq("id", parsed.data.id)
          .select("*")
          .single();

        if (error || !data) return Response.json({ error: "Falha ao atualizar produto" }, { status: 500 });
        return Response.json({ product: data });
      },
    },
  },
});
