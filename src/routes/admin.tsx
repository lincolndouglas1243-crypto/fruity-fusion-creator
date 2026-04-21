import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { authFetch } from "@/lib/api-client";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  is_featured: boolean;
  is_offer_day: boolean;
  offer_price: number | null;
  is_active: boolean;
  display_order: number;
};

type PromotionRow = {
  id: string;
  title: string;
  description: string | null;
  banner_image_url: string | null;
  discount_type: "percent" | "fixed" | "combo";
  discount_value: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

type OrderRow = {
  id: string;
  tracking_code: string | null;
  courier_code: string | null;
  customer_name: string;
  status: "pending" | "accepted" | "preparing" | "on_the_way" | "delivered" | "cancelled";
  total: number;
  created_at: string;
  courier_lat: number | null;
  courier_lng: number | null;
  courier_heading: number | null;
  courier_updated_at: string | null;
  estimated_minutes: number | null;
};

type CheckoutErrorLogRow = {
  id: string;
  route: string;
  error_message: string;
  error_context: string | null;
  created_at: string;
};

const orderStatuses: Array<OrderRow["status"]> = ["pending", "accepted", "preparing", "on_the_way", "delivered", "cancelled"];

const statusPt: Record<OrderRow["status"], string> = {
  pending: "Pendente",
  accepted: "Aceito",
  preparing: "Preparando",
  on_the_way: "A caminho",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin | Açaí Prime" },
      { name: "description", content: "Painel administrativo para gerenciar pedidos, produtos e promoções." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [checkoutErrorLogs, setCheckoutErrorLogs] = useState<CheckoutErrorLogRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderRow["status"]>("all");
  const [customerSearch, setCustomerSearch] = useState("");

  const playAdminAlert = () => {
    try {
      const audioCtx = new window.AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.24);
    } catch {
      // silêncio se o navegador bloquear áudio sem interação
    }
  };

  const notifyAdmin = (title: string, body: string) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body });
      return;
    }
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, { body });
        }
      });
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((item) => {
      const byStatus = statusFilter === "all" || item.status === statusFilter;
      const byName = item.customer_name.toLowerCase().includes(customerSearch.toLowerCase());
      return byStatus && byName;
    });
  }, [orders, statusFilter, customerSearch]);

  const activeOrders = useMemo(
    () => filteredOrders.filter((item) => item.status !== "delivered"),
    [filteredOrders],
  );

  const orderHistory = useMemo(
    () => filteredOrders.filter((item) => item.status === "delivered"),
    [filteredOrders],
  );

  const totals = useMemo(() => {
    const revenue = orders.reduce((sum, item) => sum + Number(item.total || 0), 0);
    return {
      pending: orders.filter((item) => item.status === "pending").length,
      onTheWay: orders.filter((item) => item.status === "on_the_way").length,
      totalOrders: orders.length,
      revenue,
    };
  }, [orders]);

  const loadDashboard = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await authFetch("/api/admin/dashboard");
      setProducts(response.products ?? []);
      setPromotions(response.promotions ?? []);
      setOrders(response.orders ?? []);
      setCheckoutErrorLogs(response.checkoutErrorLogs ?? []);
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      setMessage(error instanceof Error ? error.message : "Falha ao carregar painel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        loadDashboard();
      }
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const poll = window.setInterval(() => {
      loadDashboard();
    }, 5000);

    return () => window.clearInterval(poll);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const channel = supabase
      .channel("admin-orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const inserted = payload.new as Partial<OrderRow>;
          const shortId = inserted.id?.slice(0, 8) ?? "novo";
          playAdminAlert();
          notifyAdmin("Novo pedido chegou", `Pedido #${shortId} aguardando confirmação.`);
        }

        if (payload.eventType === "UPDATE") {
          const previous = payload.old as Partial<OrderRow>;
          const next = payload.new as Partial<OrderRow>;
          if (previous.status && next.status && previous.status !== next.status) {
            const shortId = next.id?.slice(0, 8) ?? "pedido";
            playAdminAlert();
            notifyAdmin("Pedido mudou de status", `#${shortId}: ${previous.status} → ${next.status}`);
          }
        }

        loadDashboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  const copyCourierLink = async (order: OrderRow) => {
    if (!order.courier_code) {
      setMessage("Este pedido ainda não possui código de entrega.");
      return;
    }

    const url = `${window.location.origin}/entrega/${order.courier_code}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage(`Link do motoboy copiado para o pedido #${order.id.slice(0, 8)}.`);
    } catch {
      setMessage("Não foi possível copiar automaticamente o link do motoboy.");
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }
    await loadDashboard();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setProducts([]);
    setPromotions([]);
    setOrders([]);
    setCheckoutErrorLogs([]);
  };

  const saveProduct = async (row: ProductRow) => {
    setMessage(null);
    try {
      await authFetch("/api/admin/products", {
        method: "PUT",
        body: JSON.stringify({
          id: row.id,
          name: row.name,
          description: row.description ?? "",
          imageUrl: row.image_url ?? undefined,
          price: Number(row.price),
          isFeatured: row.is_featured,
          isOfferDay: row.is_offer_day,
          offerPrice: row.offer_price,
          isActive: row.is_active,
          displayOrder: Number(row.display_order),
        }),
      });
      setMessage(`Produto "${row.name}" atualizado.`);
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar produto.");
    }
  };

  const savePromotion = async (row: PromotionRow) => {
    setMessage(null);
    try {
      await authFetch("/api/admin/promotions", {
        method: "PUT",
        body: JSON.stringify({
          id: row.id,
          title: row.title,
          description: row.description ?? "",
          bannerImageUrl: row.banner_image_url ?? undefined,
          discountType: row.discount_type,
          discountValue: Number(row.discount_value),
          isActive: row.is_active,
          startsAt: row.starts_at,
          endsAt: row.ends_at,
        }),
      });
      setMessage(`Promoção "${row.title}" atualizada.`);
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar promoção.");
    }
  };

  const updateOrderStatus = async (order: OrderRow, status: OrderRow["status"]) => {
    setMessage(null);
    try {
      await authFetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          courierLat: order.courier_lat,
          courierLng: order.courier_lng,
          courierHeading: order.courier_heading,
          estimatedMinutes: order.estimated_minutes,
        }),
      });
      setMessage(`Pedido #${order.id.slice(0, 8)} atualizado para ${statusPt[status]}.`);
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao atualizar pedido.");
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="brand-shell py-28">
        <section className="glass-card mx-auto max-w-lg p-8">
          <h1 className="text-3xl font-extrabold text-foreground">Painel Administrativo</h1>
          <p className="mt-2 text-sm text-muted-foreground">Entre com uma conta admin para gerenciar pedidos, cardápio e promoções.</p>

          <form onSubmit={handleLogin} className="mt-6 grid gap-3">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Senha"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
              required
            />
            <button type="submit" className="btn-hero mt-2 w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar no painel"}
            </button>
          </form>

          {message && <p className="mt-3 text-sm font-medium text-destructive">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="brand-shell py-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground">Painel em tempo real para operação de pedidos e entregas.</p>
        </div>
        <button onClick={handleLogout} className="btn-soft">Sair</button>
      </div>

      <section className="mb-6 grid gap-3 md:grid-cols-4">
        <article className="glass-card p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Pedidos</p>
          <p className="text-2xl font-extrabold text-foreground">{totals.totalOrders}</p>
        </article>
        <article className="glass-card p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-extrabold text-foreground">{totals.pending}</p>
        </article>
        <article className="glass-card p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">A caminho</p>
          <p className="text-2xl font-extrabold text-foreground">{totals.onTheWay}</p>
        </article>
        <article className="glass-card p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Faturamento</p>
          <p className="text-2xl font-extrabold text-foreground">R$ {totals.revenue.toFixed(2)}</p>
        </article>
      </section>

      {message && <p className="mb-4 rounded-xl border border-border bg-card p-3 text-sm text-foreground">{message}</p>}

      <section className="glass-card mb-6 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-foreground">Pedidos em andamento</h2>
          <div className="flex flex-wrap gap-2">
            <input
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
              placeholder="Buscar por cliente"
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | OrderRow["status"])}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="all">Todos os status</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-3">
          {filteredOrders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <p className="font-bold text-foreground">#{order.id.slice(0, 8)} • {order.customer_name}</p>
                  <p className="text-xs font-medium text-muted-foreground">Código rastreio: {order.tracking_code ?? "—"}</p>
                  <p className="text-xs font-medium text-muted-foreground">Código motoboy: {order.courier_code ?? "—"}</p>
                    <p className="text-sm text-muted-foreground">R$ {Number(order.total).toFixed(2)} • {new Date(order.created_at).toLocaleString("pt-BR")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Última posição: {order.courier_updated_at ? new Date(order.courier_updated_at).toLocaleTimeString("pt-BR") : "sem atualização"}
                  </p>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <input
                      type="number"
                      min={0}
                      max={360}
                      placeholder="Direção (0-360)"
                      value={order.courier_heading ?? ""}
                      onChange={(event) =>
                        setOrders((current) =>
                          current.map((item) =>
                            item.id === order.id ? { ...item, courier_heading: event.target.value === "" ? null : Number(event.target.value) } : item,
                          ),
                        )
                      }
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                    <input
                      type="number"
                      min={0}
                      max={240}
                      placeholder="Previsão (min)"
                      value={order.estimated_minutes ?? ""}
                      onChange={(event) =>
                        setOrders((current) =>
                          current.map((item) =>
                            item.id === order.id ? { ...item, estimated_minutes: event.target.value === "" ? null : Number(event.target.value) } : item,
                          ),
                        )
                      }
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <select
                    value={order.status}
                    onChange={(event) => {
                      const next = event.target.value as OrderRow["status"];
                      setOrders((current) => current.map((item) => (item.id === order.id ? { ...item, status: next } : item)));
                      updateOrderStatus({ ...order, status: next }, next);
                    }}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>{statusPt[status]}</option>
                    ))}
                  </select>
                  <button onClick={() => updateOrderStatus(order, order.status)} className="btn-soft px-4 py-2 text-xs">
                    Atualizar localização
                  </button>
                  <button onClick={() => copyCourierLink(order)} className="btn-soft px-4 py-2 text-xs">
                    Copiar link do motoboy
                  </button>
                  <p className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                    O motoboy atualiza a localização pelo link de entrega deste pedido.
                  </p>
                </div>
              </div>
            </article>
          ))}
          {!activeOrders.length && <p className="text-sm text-muted-foreground">Nenhum pedido em andamento com os filtros atuais.</p>}
        </div>
      </section>

      <section className="glass-card mb-6 p-5">
        <h2 className="mb-3 text-xl font-bold text-foreground">Falhas recentes do checkout</h2>
        <div className="grid gap-3">
          {checkoutErrorLogs.map((log) => (
            <article key={log.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString("pt-BR")} • {log.route}</p>
              <p className="mt-1 font-semibold text-foreground">{log.error_message}</p>
              {log.error_context && <p className="mt-1 text-xs text-muted-foreground">{log.error_context}</p>}
            </article>
          ))}
          {!checkoutErrorLogs.length && <p className="text-sm text-muted-foreground">Sem falhas registradas no checkout.</p>}
        </div>
      </section>

      <section className="glass-card mb-6 p-5">
        <h2 className="mb-3 text-xl font-bold text-foreground">Produtos</h2>
        <div className="grid gap-3">
          {products.map((product) => (
            <article key={product.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  value={product.name}
                  onChange={(event) =>
                    setProducts((current) =>
                      current.map((item) => (item.id === product.id ? { ...item, name: event.target.value } : item)),
                    )
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
                <input
                  type="number"
                  value={product.price}
                  onChange={(event) =>
                    setProducts((current) =>
                      current.map((item) => (item.id === product.id ? { ...item, price: Number(event.target.value) } : item)),
                    )
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
                <input
                  value={product.image_url ?? ""}
                  placeholder="URL da imagem"
                  onChange={(event) =>
                    setProducts((current) =>
                      current.map((item) => (item.id === product.id ? { ...item, image_url: event.target.value } : item)),
                    )
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
                <input
                  type="number"
                  value={product.offer_price ?? 0}
                  onChange={(event) =>
                    setProducts((current) =>
                      current.map((item) =>
                        item.id === product.id ? { ...item, offer_price: Number(event.target.value) || null } : item,
                      ),
                    )
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-foreground">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={product.is_featured}
                    onChange={(event) =>
                      setProducts((current) =>
                        current.map((item) =>
                          item.id === product.id ? { ...item, is_featured: event.target.checked } : item,
                        ),
                      )
                    }
                  />
                  Mais vendido
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={product.is_offer_day}
                    onChange={(event) =>
                      setProducts((current) =>
                        current.map((item) =>
                          item.id === product.id ? { ...item, is_offer_day: event.target.checked } : item,
                        ),
                      )
                    }
                  />
                  Oferta do dia
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={product.is_active}
                    onChange={(event) =>
                      setProducts((current) =>
                        current.map((item) => (item.id === product.id ? { ...item, is_active: event.target.checked } : item)),
                      )
                    }
                  />
                  Ativo
                </label>
              </div>

              <button onClick={() => saveProduct(product)} className="btn-hero mt-3">Salvar produto</button>
            </article>
          ))}
          {!products.length && <p className="text-sm text-muted-foreground">Nenhum produto encontrado.</p>}
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="mb-3 text-xl font-bold text-foreground">Promoções</h2>
        <div className="grid gap-3">
          {promotions.map((promotion) => (
            <article key={promotion.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  value={promotion.title}
                  onChange={(event) =>
                    setPromotions((current) =>
                      current.map((item) => (item.id === promotion.id ? { ...item, title: event.target.value } : item)),
                    )
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
                <input
                  type="number"
                  value={promotion.discount_value}
                  onChange={(event) =>
                    setPromotions((current) =>
                      current.map((item) =>
                        item.id === promotion.id ? { ...item, discount_value: Number(event.target.value) } : item,
                      ),
                    )
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-foreground">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={promotion.is_active}
                    onChange={(event) =>
                      setPromotions((current) =>
                        current.map((item) =>
                          item.id === promotion.id ? { ...item, is_active: event.target.checked } : item,
                        ),
                      )
                    }
                  />
                  Promoção ativa
                </label>
              </div>

              <button onClick={() => savePromotion(promotion)} className="btn-hero mt-3">Salvar promoção</button>
            </article>
          ))}
          {!promotions.length && <p className="text-sm text-muted-foreground">Nenhuma promoção encontrada.</p>}
        </div>
      </section>
    </main>
  );
}
