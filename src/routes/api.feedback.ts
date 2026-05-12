import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const feedbackSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  comment: z.string().trim().min(3).max(400),
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
          const issue = parsed.error.issues[0];
          const humanMessage =
            issue?.path?.[0] === "customerName"
              ? "Informe seu nome com pelo menos 2 caracteres."
              : issue?.path?.[0] === "comment"
                ? "Seu feedback precisa ter pelo menos 3 caracteres."
                : issue?.path?.[0] === "rating"
                  ? "Escolha uma nota de 1 a 5 estrelas."
                  : "Dados de feedback inválidos.";

          return Response.json({ error: humanMessage }, { status: 400 });
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