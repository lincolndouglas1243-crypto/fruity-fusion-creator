import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionReveal } from "./SectionReveal";
import { formatCurrency, useCart } from "./cart-context";

type OrderStatus = "pending" | "accepted" | "preparing" | "on_the_way" | "delivered" | "cancelled";

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  selected_size: string | null;
  selected_toppings: string[];
  line_total: number;
};

type OrderDetails = {
  id: string;
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

function extractTrackingData(raw: string) {
  const value = raw.trim();
  if (!value) return { code: "", token: "" };

  if (value.includes("/pedido/") && value.includes("http")) {
    try {
      const parsed = new URL(value);
      const codeFromPath = parsed.pathname.split("/").filter(Boolean).pop() ?? "";
      const tokenFromQuery = parsed.searchParams.get("t") ?? "";
      return { code: codeFromPath.trim(), token: tokenFromQuery.trim() };
    } catch {
      return { code: value, token: "" };
    }
  }

  return { code: value, token: "" };
}

export function OrderTrackingSection() {
  const { lastOrderId, lastTrackingCode } = useCart();
  const [orderId, setOrderId] = useState("");
  const [activeOrder, setActiveOrder] = useState<OrderDetails | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentStep = useMemo(() => {
    if (!activeOrder) return 0;
    const idx = statusFlow.indexOf(activeOrder.status);
    return idx < 0 ? 0 : idx;
  }, [activeOrder]);

  const loadOrder = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { code: trackingLookup, token: tokenFromInput } = extractTrackingData(id);
      if (!trackingLookup) throw new Error("Informe um código de rastreio válido.");

      if (typeof window !== "undefined" && tokenFromInput) {
        localStorage.setItem(`tracking-token:${trackingLookup}`, tokenFromInput);
      }

      const trackingToken = typeof window !== "undefined" ? localStorage.getItem(`tracking-token:${trackingLookup}`) ?? "" : "";
      const response = await fetch(`/api/orders/${trackingLookup}?rt=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "x-tracking-code": trackingLookup,
          "x-tracking-token": trackingToken,
          "cache-control": "no-cache",
          pragma: "no-cache",
        },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "Não foi possível carregar o pedido.");
      setActiveOrder(result.order as OrderDetails);
      setItems((result.items as OrderItem[]) ?? []);
      setOrderId(trackingLookup);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o pedido.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const preferredCode = lastTrackingCode ?? lastOrderId;
    if (preferredCode) {
      setOrderId(preferredCode);
      loadOrder(preferredCode);
    }
  }, [lastOrderId, lastTrackingCode]);

  useEffect(() => {
    if (!activeOrder?.id) return;
    const channel = supabase
      .channel(`order-track-${activeOrder.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${activeOrder.id}`,
        },
        (payload) => {
          const next = payload.new as Partial<OrderDetails>;
          setActiveOrder((current) =>
            current
              ? {
                  ...current,
                  ...next,
                }
              : current,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrder?.id]);

  useEffect(() => {
    if (!orderId.trim()) return;

    const timer = window.setInterval(() => {
      loadOrder(orderId);
    }, 2500);

    return () => window.clearInterval(timer);
  }, [orderId]);

  return (
    <SectionReveal className="brand-shell mt-20">
      <div id="acompanhar" className="glass-card p-7">
        <h2 className="text-3xl font-extrabold text-foreground">Acompanhe seu pedido em tempo real</h2>
        <p className="mt-2 text-muted-foreground">Veja status ao vivo e a rota do motoboy quando estiver a caminho.</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <input
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="Digite o ID ou código de rastreio"
            className="min-w-[260px] flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
          />
          <button onClick={() => loadOrder(orderId)} disabled={loading} className="btn-hero">
            {loading ? "Buscando..." : "Acompanhar"}
          </button>
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}

        {activeOrder && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="font-bold text-foreground">Pedido #{activeOrder.id.slice(0, 8)}</p>
                <p className="text-sm font-semibold text-primary">{statusLabel[activeOrder.status]}</p>
              </div>

              <div className="relative mb-5 grid grid-cols-5 gap-2">
                {statusFlow.map((status, index) => {
                  const active = index <= currentStep;
                  return (
                    <div key={status} className="text-center">
                      <motion.div
                        initial={false}
                        animate={{ scale: active ? 1 : 0.92, opacity: active ? 1 : 0.5 }}
                        className={`mx-auto h-3 w-3 rounded-full ${active ? "bg-primary" : "bg-muted"}`}
                      />
                      <p className="mt-2 text-[11px] font-semibold text-muted-foreground">{statusLabel[status]}</p>
                    </div>
                  );
                })}
                <div className="absolute left-0 right-0 top-1.5 -z-10 h-0.5 bg-muted" />
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">Total: <span className="font-bold text-foreground">{formatCurrency(activeOrder.total)}</span></p>
                {activeOrder.estimated_minutes !== null && (
                  <p className="text-muted-foreground">Previsão de chegada: <span className="font-bold text-foreground">{activeOrder.estimated_minutes} min</span></p>
                )}
                {activeOrder.courier_updated_at && (
                  <p className="text-muted-foreground">Localização atualizada às {new Date(activeOrder.courier_updated_at).toLocaleTimeString("pt-BR")}</p>
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
            </div>

            <div className="rounded-2xl border border-border bg-card p-3">
              {activeOrder.courier_lat !== null && activeOrder.courier_lng !== null ? (
                <div className="relative h-[180px] overflow-hidden rounded-xl border border-border sm:h-[280px] lg:h-[360px]">
                  <iframe
                    title="Mapa do motoboy"
                    src={mapUrl(activeOrder.courier_lat, activeOrder.courier_lng)}
                    className="h-full w-full"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute right-3 top-3 rounded-lg border border-border bg-background/90 px-3 py-1 text-xs font-semibold text-foreground">
                    🏍️ Motoboy ao vivo
                  </div>
                </div>
              ) : (
                <div className="flex h-[180px] items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground sm:h-[280px] lg:h-[360px]">
                  O motoboy ainda não compartilhou localização ao vivo.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SectionReveal>
  );
}