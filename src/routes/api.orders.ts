import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { createOrderSchema } from "@/lib/order-schemas";
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const token = getBearerToken(request);
          if (!token) return Response.json({ error: "Não autorizado" }, { status: 401 });

          const supabaseAdmin = getAdminClient();
          const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
          if (userError || !userData.user) return Response.json({ error: "Sessão inválida" }, { status: 401 });

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
              user_id: userData.user.id,
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

          const lines = input.items.map(
            (item, i) =>
              `${i + 1}. ${item.quantity}x ${item.name}${item.size ? ` | ${item.size}` : ""}\n   Adicionais: ${item.toppings.length ? item.toppings.join(", ") : "Sem"}\n   Valor: ${formatCurrency(item.unitPrice * item.quantity)}`,
          );

          const message = [
            `Olá! Pedido #${order.id.slice(0, 8)} criado no site.`,
            "",
            ...lines,
            "",
            `Subtotal: ${formatCurrency(subtotal)}`,
            `Entrega: ${formatCurrency(input.deliveryFee)}`,
            `Total: ${formatCurrency(total)}`,
            "",
            `Endereço: ${input.deliveryAddress}`,
          ].join("\n");

          await supabaseAdmin.from("orders").update({ whatsapp_message: message }).eq("id", order.id);

          return Response.json({
            orderId: order.id,
            status: order.status,
            total: order.total,
            whatsappUrl: `https://wa.me/5500000000000?text=${encodeURIComponent(message)}`,
          });
        } catch {
          return Response.json({ error: "Erro interno ao criar pedido" }, { status: 500 });
        }
      },
    },
  },
});
