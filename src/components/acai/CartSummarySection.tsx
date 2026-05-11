import { motion } from "framer-motion";
import { useState } from "react";
import { SectionReveal } from "./SectionReveal";
import { formatCurrency, useCart } from "./cart-context";

export function CartSummarySection() {
  const { items, total, increaseQuantity, decreaseQuantity, removeItem, clearCart, submitOrder, isSubmitting, lastOrderId, lastTrackingCode } =
    useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmitOrder = async () => {
    setFeedback(null);
    try {
      const result = await submitOrder({
        customerName,
        customerPhone,
        deliveryAddress,
        notes,
        deliveryFee,
      });
      setFeedback(`Pedido #${result.orderId.slice(0, 8)} enviado com sucesso!`);
      setCustomerName("");
      setCustomerPhone("");
      setDeliveryAddress("");
      setNotes("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível finalizar o pedido.");
    }
  };

  const handleShareTracking = async () => {
    const code = lastTrackingCode ?? lastOrderId;
    if (!code) return;
    const token = localStorage.getItem(`tracking-token:${code}`) ?? "";
    const trackingUrl = `${window.location.origin}/pedido/${code}${token ? `?t=${encodeURIComponent(token)}` : ""}`;
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setFeedback("Link de rastreio copiado! Envie ao cliente no WhatsApp.");
    } catch {
      setFeedback("Não foi possível copiar automaticamente. Copie o link abaixo.");
    }
  };

  return (
    <SectionReveal className="brand-shell mt-20">
      <div className="glass-card p-7" id="carrinho">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-3xl font-extrabold text-foreground">Resumo do Pedido</h2>
          {items.length > 0 && (
            <button onClick={clearCart} className="btn-soft px-4 py-2 text-xs">
              Limpar carrinho
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-border bg-card p-4 text-muted-foreground">
            Seu carrinho está vazio. Adicione produtos para finalizar o pedido direto no site.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground">{item.name}</p>
                    {item.size && <p className="text-sm text-muted-foreground">Tamanho: {item.size}</p>}
                    <p className="text-sm text-muted-foreground">
                      {item.toppings.length ? `Adicionais: ${item.toppings.join(", ")}` : "Sem adicionais"}
                    </p>
                  </div>
                  <p className="font-bold text-foreground">{formatCurrency(item.unitPrice * item.quantity)}</p>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => decreaseQuantity(item.id)} className="btn-soft h-9 w-9 px-0 py-0 text-base">
                    -
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                  <button onClick={() => increaseQuantity(item.id)} className="btn-soft h-9 w-9 px-0 py-0 text-base">
                    +
                  </button>
                  <button onClick={() => removeItem(item.id)} className="btn-soft ml-auto px-3 py-2 text-xs">
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">Total</p>
            <p className="text-2xl font-extrabold text-foreground">{formatCurrency(total)}</p>
          </div>

          <div className="mt-4 grid gap-3">
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Nome completo"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
            />
            <input
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              placeholder="Telefone"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
            />
            <input
              value={deliveryAddress}
              onChange={(event) => setDeliveryAddress(event.target.value)}
              placeholder="Endereço de entrega"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
            />
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Observações (opcional)"
              className="min-h-20 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={deliveryFee}
              onChange={(event) => setDeliveryFee(Number(event.target.value || 0))}
              placeholder="Taxa de entrega"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
            />
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmitOrder}
            disabled={isSubmitting || items.length === 0}
            className="btn-hero mt-4 w-full"
          >
            {isSubmitting ? "Enviando pedido..." : "Finalizar pedido no site"}
          </motion.button>

          {(feedback || lastOrderId) && (
            <div className="mt-3 space-y-2 text-sm font-medium text-foreground">
              <p>{feedback ?? `Último pedido: #${lastOrderId?.slice(0, 8)}`}</p>
              {(lastTrackingCode || lastOrderId) && (
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={`/pedido/${lastTrackingCode ?? lastOrderId}${(() => {
                      const code = lastTrackingCode ?? lastOrderId;
                      const token = code ? localStorage.getItem(`tracking-token:${code}`) : null;
                      return token ? `?t=${encodeURIComponent(token)}` : "";
                    })()}`}
                    className="story-link text-primary"
                  >
                    Abrir link de rastreio premium
                  </a>
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                    Código: {lastTrackingCode ?? "---"}
                  </span>
                  <button type="button" onClick={handleShareTracking} className="btn-soft px-3 py-2 text-xs">
                    Compartilhar rastreio
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SectionReveal>
  );
}
