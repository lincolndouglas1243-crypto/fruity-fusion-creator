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

const orderStatuses: Array<OrderRow["status"]> = ["pending", "accepted", "preparing", "on_the_way", "delivered", "cancelled"];

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

  const totals = useMemo(
    () => ({ pending: orders.filter((item) => item.status === "pending").length, totalOrders: orders.length }),
    [orders],
  );

  const loadDashboard = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await authFetch("/api/admin/dashboard");
      setProducts(response.products ?? []);
      setPromotions(response.promotions ?? []);
      setOrders(response.orders ?? []);
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
      setMessage(`Pedido #${order.id.slice(0, 8)} atualizado para ${status}.`);
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
          <p className="text-sm text-muted-foreground">Pedidos pendentes: {totals.pending} • Total de pedidos: {totals.totalOrders}</p>
        </div>
        <button onClick={handleLogout} className="btn-soft">Sair</button>
      </div>

      {message && <p className="mb-4 rounded-xl border border-border bg-card p-3 text-sm text-foreground">{message}</p>}

      <section className="glass-card mb-6 p-5">
        <h2 className="mb-3 text-xl font-bold text-foreground">Pedidos</h2>
        <div className="grid gap-3">
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <p className="font-bold text-foreground">#{order.id.slice(0, 8)} • {order.customer_name}</p>
                  <p className="text-sm text-muted-foreground">R$ {Number(order.total).toFixed(2)} • {new Date(order.created_at).toLocaleString("pt-BR")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Última posição: {order.courier_updated_at ? new Date(order.courier_updated_at).toLocaleTimeString("pt-BR") : "sem atualização"}
                  </p>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Latitude do motoboy"
                      value={order.courier_lat ?? ""}
                      onChange={(event) =>
                        setOrders((current) =>
                          current.map((item) =>
                            item.id === order.id ? { ...item, courier_lat: event.target.value === "" ? null : Number(event.target.value) } : item,
                          ),
                        )
                      }
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Longitude do motoboy"
                      value={order.courier_lng ?? ""}
                      onChange={(event) =>
                        setOrders((current) =>
                          current.map((item) =>
                            item.id === order.id ? { ...item, courier_lng: event.target.value === "" ? null : Number(event.target.value) } : item,
                          ),
                        )
                      }
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                    <input
                      type="number"
                      min={0}
                      max={360}
                      placeholder="Heading (0-360)"
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
                    onChange={(event) => updateOrderStatus(order, event.target.value as OrderRow["status"])}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <button onClick={() => updateOrderStatus(order, order.status)} className="btn-soft px-4 py-2 text-xs">
                    Atualizar localização
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!orders.length && <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>}
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
