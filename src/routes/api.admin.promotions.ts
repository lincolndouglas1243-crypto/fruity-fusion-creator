import { createFileRoute } from "@tanstack/react-router";
import { promotionSchema } from "@/lib/order-schemas";
import { requireAdmin } from "@/lib/admin-auth";

export const Route = createFileRoute("/api/admin/promotions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdmin(request);
        if ("error" in auth) return Response.json({ error: auth.error }, { status: auth.status });

        const { data } = await auth.supabaseAdmin.from("promotions").select("*").order("created_at", { ascending: false });
        return Response.json({ promotions: data ?? [] });
      },
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if ("error" in auth) return Response.json({ error: auth.error }, { status: auth.status });

        const body = await request.json();
        const parsed = promotionSchema.omit({ id: true }).safeParse(body);
        if (!parsed.success) return Response.json({ error: "Promoção inválida" }, { status: 400 });

        const { data, error } = await auth.supabaseAdmin
          .from("promotions")
          .insert({
            title: parsed.data.title,
            description: parsed.data.description ?? null,
            banner_image_url: parsed.data.bannerImageUrl ?? null,
            discount_type: parsed.data.discountType,
            discount_value: parsed.data.discountValue,
            is_active: parsed.data.isActive,
            starts_at: parsed.data.startsAt ?? null,
            ends_at: parsed.data.endsAt ?? null,
          })
          .select("*")
          .single();

        if (error || !data) return Response.json({ error: "Falha ao criar promoção" }, { status: 500 });
        return Response.json({ promotion: data });
      },
      PUT: async ({ request }) => {
        const auth = await requireAdmin(request);
        if ("error" in auth) return Response.json({ error: auth.error }, { status: auth.status });

        const body = await request.json();
        const parsed = promotionSchema.safeParse(body);
        if (!parsed.success || !parsed.data.id) return Response.json({ error: "Promoção inválida" }, { status: 400 });

        const { data, error } = await auth.supabaseAdmin
          .from("promotions")
          .update({
            title: parsed.data.title,
            description: parsed.data.description ?? null,
            banner_image_url: parsed.data.bannerImageUrl ?? null,
            discount_type: parsed.data.discountType,
            discount_value: parsed.data.discountValue,
            is_active: parsed.data.isActive,
            starts_at: parsed.data.startsAt ?? null,
            ends_at: parsed.data.endsAt ?? null,
          })
          .eq("id", parsed.data.id)
          .select("*")
          .single();

        if (error || !data) return Response.json({ error: "Falha ao atualizar promoção" }, { status: 500 });
        return Response.json({ promotion: data });
      },
    },
  },
});
