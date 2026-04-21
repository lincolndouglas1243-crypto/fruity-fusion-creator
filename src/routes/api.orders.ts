import { createFileRoute } from "@tanstack/react-router";
import { createOrderSchema } from "@/lib/order-schemas";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { createClient } from "@supabase/supabase-js";

const customSizePrices: Record<string, number> = {
  "300ml": 19.9,
  "500ml": 26.9,
  "700ml": 34.9,
};

const customToppingPrice = 3;

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
          const normalizedItemNames = [...new Set(input.items.map((item) => item.name.trim()))];
          const { data: productsData } = await supabaseAdmin
            .from("products")
            .select("name, price, offer_price, is_offer_day")
            .in("name", normalizedItemNames)
            .eq("is_active", true);

          const productPriceMap = new Map<string, number>();
          for (const product of productsData ?? []) {
            const trustedPrice = product.is_offer_day && product.offer_price !== null ? Number(product.offer_price) : Number(product.price);
            productPriceMap.set(product.name.trim(), trustedPrice);
          }

          const pricedItems = input.items.map((item) => {
            const trimmedName = item.name.trim();

            if (trimmedName === "Açaí Personalizado") {
              if (!item.size || !(item.size in customSizePrices)) {
                throw new Error("Tamanho inválido para açaí personalizado.");
              }

              const serverPrice = Number((customSizePrices[item.size] + item.toppings.length * customToppingPrice).toFixed(2));
              return {
                ...item,
                trustedUnitPrice: serverPrice,
              };
            }

            const trustedPrice = productPriceMap.get(trimmedName);
            if (typeof trustedPrice !== "number") {
              throw new Error(`Produto inválido ou inativo: ${trimmedName}`);
            }

            return {
              ...item,
              trustedUnitPrice: Number(trustedPrice.toFixed(2)),
            };
          });

          const subtotal = pricedItems.reduce((sum, item) => sum + item.trustedUnitPrice * item.quantity, 0);
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

          const orderItems = pricedItems.map((item) => ({
            order_id: order.id,
            product_name: item.name,
            unit_price: item.trustedUnitPrice,
            quantity: item.quantity,
            selected_size: item.size ?? null,
            selected_toppings: item.toppings,
            line_total: item.trustedUnitPrice * item.quantity,
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
