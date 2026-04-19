import { motion } from "framer-motion";
import { SectionReveal } from "./SectionReveal";
import { formatCurrency, useCart } from "./cart-context";

export function CartSummarySection() {
  const { items, total, checkoutUrl, increaseQuantity, decreaseQuantity, removeItem, clearCart } = useCart();

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
            Seu carrinho está vazio. Adicione produtos para gerar o pedido automático no WhatsApp.
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
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href={checkoutUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Finalizar pedido no WhatsApp"
            className="btn-hero mt-4 w-full"
          >
            Finalizar pedido rápido no WhatsApp
          </motion.a>
        </div>
      </div>
    </SectionReveal>
  );
}
