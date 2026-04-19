import { createFileRoute } from "@tanstack/react-router";
import { createOrderSchema } from "@/lib/order-schemas";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { createClient } from "@supabase/supabase-js";

function getPublicServerClient() {
  const url = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Server configuration error: orders client is not configured");
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const token = getBearerToken(request);
          const supabase = getPublicServerClient();
          let userId: string | null = null;

          if (token) {
            const { data: userData } = await supabase.auth.getUser(token);
            if (userData.user?.id) {
              userId = userData.user.id;
            }
          }

          const raw = await request.json();
          const parsed = createOrderSchema.safeParse(raw);
          if (!parsed.success) {
            return Response.json({ error: "Dados do pedido inválidos", details: parsed.error.flatten() }, { status: 400 });
          }

          const input = parsed.data;
          const subtotal = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
          const total = subtotal + input.deliveryFee;
          const trackingCode = `AP-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;

          const { data: order, error: orderError } = await supabaseAdmin
            .from("orders")
            .insert({
              ...(userId ? { user_id: userId } : {}),
              tracking_code: trackingCode,
              status: "pending",
              customer_name: input.customerName,
              customer_phone: input.customerPhone,
              delivery_address: input.deliveryAddress,
              notes: input.notes ?? null,
              subtotal,
              delivery_fee: input.deliveryFee,
              total,
            } as Database["public"]["Tables"]["orders"]["Insert"])
            .select("id, tracking_code, status, total")
            .single();

          if (orderError || !order) {
            await supabaseAdmin.from("checkout_error_logs").insert({
              route: "/api/orders",
              error_message: orderError?.message ?? "Falha desconhecida ao inserir pedido",
              error_context: orderError?.details ?? orderError?.hint ?? null,
              request_payload: {
                hasToken: Boolean(token),
                itemsCount: Array.isArray(input.items) ? input.items.length : 0,
              },
            });
            return Response.json({ error: "Não foi possível criar o pedido" }, { status: 500 });
          }

          const orderItems = input.items.map((item) => ({
            order_id: order.id,
            product_name: item.name,
            unit_price: item.unitPrice,
            quantity: item.quantity,
            selected_size: item.size ?? null,
            selected_toppings: item.toppings,
            line_total: item.unitPrice * item.quantity,
          }));

          const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItems);
          if (itemsError) {
            await supabaseAdmin.from("checkout_error_logs").insert({
              route: "/api/orders",
              error_message: itemsError.message,
              error_context: itemsError.details ?? itemsError.hint ?? null,
              request_payload: { orderId: order.id, itemsCount: orderItems.length },
            });
            return Response.json({ error: "Pedido criado, mas itens não foram salvos" }, { status: 500 });
          }

          return Response.json({
            orderId: order.id,
            trackingCode: order.tracking_code,
            status: order.status,
            total: order.total,
            summary: {
              subtotal: formatCurrency(subtotal),
              deliveryFee: formatCurrency(input.deliveryFee),
              total: formatCurrency(total),
            },
          });
        } catch (error) {
          console.error("Erro ao criar pedido", error);
          try {
            const supabase = getPublicServerClient();
            await supabaseAdmin.from("checkout_error_logs").insert({
              route: "/api/orders",
              error_message: error instanceof Error ? error.message : "Erro interno inesperado",
              error_context: error instanceof Error ? error.stack?.slice(0, 800) : null,
              request_payload: null,
            });
          } catch {
            // ignore logging failure
          }
          return Response.json({ error: "Erro interno ao criar pedido" }, { status: 500 });
        }
      },
    },
  },
});
