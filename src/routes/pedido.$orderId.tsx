import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const search = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const tokenFromUrl = search.get("t") ?? "";
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const lastVersionRef = useRef<string>("");

  const step = useMemo(() => {
    if (!order) return 0;
    const idx = statusFlow.indexOf(order.status);
    return idx < 0 ? 0 : idx;
  }, [order]);

  useEffect(() => {
    const load = async () => {
      try {
        if (tokenFromUrl && typeof window !== "undefined") {
          localStorage.setItem(`tracking-token:${orderId}`, tokenFromUrl);
        }
        const trackingToken = localStorage.getItem(`tracking-token:${orderId}`) ?? tokenFromUrl;
        const response = await fetch(`/api/orders/${orderId}`, {
          cache: "no-store",
          headers: {
            "x-tracking-code": orderId,
            "x-tracking-token": trackingToken,
            "cache-control": "no-cache",
            pragma: "no-cache",
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
    const applyLatestPayload = (body: { order?: OrderDetails; items?: OrderItem[] }) => {
      if (!body.order) return;
      const version = [
        body.order.status,
        body.order.courier_lat ?? "",
        body.order.courier_lng ?? "",
        body.order.courier_heading ?? "",
        body.order.courier_updated_at ?? "",
      ].join("|");

      if (version === lastVersionRef.current) return;
      lastVersionRef.current = version;
      setOrder(body.order);
      setItems((body.items as OrderItem[]) ?? []);
    };

    const timer = window.setInterval(async () => {
      try {
        const trackingToken = localStorage.getItem(`tracking-token:${orderId}`) ?? tokenFromUrl;
        const response = await fetch(`/api/orders/${orderId}`, {
          cache: "no-store",
          headers: {
            "x-tracking-code": orderId,
            "x-tracking-token": trackingToken,
            "cache-control": "no-cache",
            pragma: "no-cache",
          },
        });
        if (!response.ok) return;
        const body = await response.json();
        applyLatestPayload(body as { order?: OrderDetails; items?: OrderItem[] });
      } catch {
        // mantém última versão em tela
      }
    }, 2500);

    return () => window.clearInterval(timer);
  }, [orderId, tokenFromUrl]);

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
                <div className="relative h-[240px] overflow-hidden rounded-xl border border-border sm:h-[300px] lg:h-[390px]">
                  <iframe
                    title="Mapa do motoboy"
                    src={mapUrl(order.courier_lat, order.courier_lng)}
                    className="h-full w-full"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute right-3 top-3 rounded-lg border border-border bg-background/90 px-3 py-1 text-xs font-semibold text-foreground">
                    🏍️ Motoboy ao vivo
                  </div>
                </div>
              ) : (
                <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground sm:h-[300px] lg:h-[390px]">
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