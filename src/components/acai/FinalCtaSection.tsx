import { motion } from "framer-motion";
import { useCart } from "./cart-context";

export function FinalCtaSection() {
  const { itemCount } = useCart();

  return (
    <section id="pedido" className="brand-shell mt-20">
      <div className="glass-card p-8 text-center sm:p-12">
        <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
          Seu próximo pedido de açaí começa agora.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Finalize seu pedido com pagamento e status acompanhados em tempo real, sem sair do site.
        </p>
        <motion.a
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          href="#carrinho"
          aria-label="Ir para resumo do pedido"
          className="btn-hero mt-6"
        >
          {itemCount > 0 ? `Finalizar ${itemCount} item(ns) agora` : "Começar pedido"}
        </motion.a>
      </div>
    </section>
  );
}
