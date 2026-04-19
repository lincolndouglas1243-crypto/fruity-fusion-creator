import { createFileRoute } from "@tanstack/react-router";
import { createOrderSchema } from "@/lib/order-schemas";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
          let userId = crypto.randomUUID();

          if (token) {
            const { data: userData } = await supabaseAdmin.auth.getUser(token);
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

          const { data: order, error: orderError } = await supabaseAdmin
            .from("orders")
            .insert({
              user_id: userId,
              status: "pending",
              customer_name: input.customerName,
              customer_phone: input.customerPhone,
              delivery_address: input.deliveryAddress,
              notes: input.notes ?? null,
              subtotal,
              delivery_fee: input.deliveryFee,
              total,
            })
            .select("id, status, total")
            .single();

          if (orderError || !order) {
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
            return Response.json({ error: "Pedido criado, mas itens não foram salvos" }, { status: 500 });
          }

          return Response.json({
            orderId: order.id,
            status: order.status,
            total: order.total,
            summary: {
              subtotal: formatCurrency(subtotal),
              deliveryFee: formatCurrency(input.deliveryFee),
              total: formatCurrency(total),
            },
          });
        } catch {
          return Response.json({ error: "Erro interno ao criar pedido" }, { status: 500 });
        }
      },
    },
  },
});
