import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const feedbackSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  comment: z.string().trim().min(5).max(400),
  rating: z.number().int().min(1).max(5),
});

export const Route = createFileRoute("/api/feedback")({
  server: {
    handlers: {
      GET: async () => {
        const { data, error } = await supabaseAdmin
          .from("feedback_entries")
          .select("id, customer_name, comment, rating, created_at")
          .eq("approved", true)
          .order("created_at", { ascending: false })
          .limit(12);

        if (error) return Response.json({ error: "Não foi possível carregar os feedbacks." }, { status: 500 });
        return Response.json({ feedbacks: data ?? [] });
      },
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const parsed = feedbackSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Dados de feedback inválidos." }, { status: 400 });
        }

        const { error } = await supabaseAdmin.from("feedback_entries").insert({
          customer_name: parsed.data.customerName,
          comment: parsed.data.comment,
          rating: parsed.data.rating,
          approved: false,
        });

        if (error) return Response.json({ error: "Não foi possível enviar seu feedback." }, { status: 500 });
        return Response.json({ success: true, message: "Feedback enviado para moderação." });
      },
    },
  },
});