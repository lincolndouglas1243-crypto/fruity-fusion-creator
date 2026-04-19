import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type OrderStatus = "pending" | "accepted" | "preparing" | "on_the_way" | "delivered" | "cancelled";

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  selected_size: string | null;
  selected_toppings: string[];
};

type OrderDetails = {
  id: string;
  tracking_code?: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  courier_lat: number | null;
  courier_lng: number | null;
  courier_heading: number | null;
  courier_updated_at: string | null;
  estimated_minutes: number | null;
};

const statusFlow: OrderStatus[] = ["pending", "accepted", "preparing", "on_the_way", "delivered"];
const statusLabel: Record<OrderStatus, string> = {
  pending: "Aguardando",
  accepted: "Aceito",
  preparing: "Preparando",
  on_the_way: "A caminho",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

function mapUrl(lat: number, lng: number) {
  const delta = 0.02;
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export const Route = createFileRoute("/pedido/$orderId")({
  head: () => ({
    meta: [
      { title: "Rastreio do Pedido | Açaí Prime" },
      { name: "description", content: "Acompanhe seu pedido em tempo real com status e localização do motoboy." },
    ],
  }),
  component: OrderTrackingPage,
});

function OrderTrackingPage() {
  const { orderId } = Route.useParams();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const step = useMemo(() => {
    if (!order) return 0;
    const idx = statusFlow.indexOf(order.status);
    return idx < 0 ? 0 : idx;
  }, [order]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            "x-tracking-code": orderId,
          },
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.error || "Não foi possível carregar o rastreio.");
        setOrder(body.order as OrderDetails);
        setItems((body.items as OrderItem[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível carregar o rastreio.");
      }
    };

    load();
  }, [orderId]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            "x-tracking-code": orderId,
          },
        });
        if (!response.ok) return;
        const body = await response.json();
        setOrder(body.order as OrderDetails);
        setItems((body.items as OrderItem[]) ?? []);
      } catch {
        // mantém última versão em tela
      }
    }, 15000);

    return () => window.clearInterval(timer);
  }, [orderId]);

  useEffect(() => {
    if (!order?.id) return;

    const channel = supabase
      .channel(`public-track-${order.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${order.id}` },
        (payload) => {
          setOrder((current) => (current ? { ...current, ...(payload.new as Partial<OrderDetails>) } : current));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id]);

  return (
    <main className="brand-shell py-24">
      <section className="glass-card p-7">
        <h1 className="text-4xl font-extrabold text-foreground">Rastreio Premium do Pedido</h1>
        <p className="mt-2 text-muted-foreground">
          {order?.tracking_code ? `Código ${order.tracking_code}` : `Pedido #${orderId.slice(0, 8)}`} • atualização ao vivo
        </p>

        {error && <p className="mt-4 text-sm font-semibold text-destructive">{error}</p>}

        {order && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-bold text-foreground">Status atual</p>
                <p className="text-sm font-semibold text-primary">{statusLabel[order.status]}</p>
              </div>

              <div className="relative mb-5 grid grid-cols-5 gap-2">
                {statusFlow.map((status, index) => {
                  const active = index <= step;
                  return (
                    <div key={status} className="text-center">
                      <motion.div
                        initial={false}
                        animate={{ scale: active ? 1 : 0.92, opacity: active ? 1 : 0.45 }}
                        className={`mx-auto h-3 w-3 rounded-full ${active ? "bg-primary" : "bg-muted"}`}
                      />
                      <p className="mt-2 text-[11px] font-semibold text-muted-foreground">{statusLabel[status]}</p>
                    </div>
                  );
                })}
                <div className="absolute left-0 right-0 top-1.5 -z-10 h-0.5 bg-muted" />
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Total: <span className="font-bold text-foreground">R$ {Number(order.total).toFixed(2)}</span></p>
                {order.estimated_minutes !== null && (
                  <p>Chegada estimada: <span className="font-bold text-foreground">{order.estimated_minutes} min</span></p>
                )}
                {order.courier_updated_at && (
                  <p>Localização atualizada às {new Date(order.courier_updated_at).toLocaleTimeString("pt-BR")}</p>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
                    <p className="font-semibold text-foreground">{item.quantity}x {item.product_name}</p>
                    <p className="text-muted-foreground">
                      {item.selected_size ? `${item.selected_size} • ` : ""}
                      {item.selected_toppings.length ? item.selected_toppings.join(", ") : "Sem adicionais"}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-card p-3">
              {order.courier_lat !== null && order.courier_lng !== null ? (
                <iframe
                  title="Mapa do motoboy"
                  src={mapUrl(order.courier_lat, order.courier_lng)}
                  className="h-[390px] w-full rounded-xl border border-border"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-[390px] items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
                  O motoboy ainda não iniciou o rastreio ao vivo.
                </div>
              )}
            </article>
          </div>
        )}
      </section>
    </main>
  );
}